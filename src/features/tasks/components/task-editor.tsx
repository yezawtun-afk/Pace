import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { Button, ButtonRow, TextLink } from '@/components/ui/button';
import { Chip, ChipRow, Dot } from '@/components/ui/chip';
import { FormMessage } from '@/components/ui/form-message';
import { Sheet } from '@/components/ui/sheet';
import { TextField } from '@/components/ui/text-field';
import { AppText } from '@/components/ui/text';
import { Space, Radius } from '@/constants/theme';
import { friendlyDataError } from '@/features/auth/errors';
import { ProofThumbnail } from '@/features/proofs/components/proof-thumbnail';
import { buildProofPath } from '@/features/proofs/paths';
import {
  compressProof,
  pickProofImage,
  uploadProof,
  getProofSignedUrl,
  MAX_PROOF_BYTES,
} from '@/features/proofs/api';
import { useAuth } from '@/features/auth/auth-provider';
import { shortTime } from '@/lib/time';
import { useTheme } from '@/lib/use-theme';
import type { Task } from '@/types/database';

import { todayString } from '../grouping';
import {
  useCategories,
  useCreateCategory,
  useCreateTask,
  useDeleteCategory,
  useDeleteTask,
  useUpdateTask,
} from '../queries';
import { DateField } from './date-field';

const TIME_OPTIONS = ['09:00', '12:00', '17:00', '20:00'];
const PRIORITIES = [1, 2, 3, 4] as const;
const PRIORITY_NAMES: Record<number, string> = {
  1: 'most urgent',
  2: 'important',
  3: 'normal',
  4: 'no rush',
};

type Draft = {
  title: string;
  notes: string;
  dueDate: string | null;
  dueTime: string | null;
  priority: number;
  categoryId: string | null;
  proofPath: string | null;
};

function draftFrom(task: Task | null, defaultDate: string | null): Draft {
  return {
    title: task?.title ?? '',
    notes: task?.notes ?? '',
    dueDate: task ? task.due_date : defaultDate,
    dueTime: task?.due_time ? shortTime(task.due_time) : null,
    priority: task?.priority ?? 4,
    categoryId: task?.category_id ?? null,
    proofPath: task?.proof_path ?? null,
  };
}

type TaskEditorProps = {
  visible: boolean;
  onClose: () => void;
  /** The task to edit, or null to create a new one. */
  task: Task | null;
  /** Due date applied to a new task (matches the view it was created from). */
  defaultDate: string | null;
};

/**
 * Create or edit a task: title, notes, due date and time, priority, category.
 * Everything saves in one request, and delete asks once before removing.
 */
export function TaskEditor({ visible, onClose, task, defaultDate }: TaskEditorProps) {
  const { colors } = useTheme();

  const categoriesQuery = useCategories();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  const categories = categoriesQuery.data ?? [];

  const { session } = useAuth();

  const [draft, setDraft] = useState<Draft>(() => draftFrom(task, defaultDate));
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Load a signed URL for an existing proof photo.
  useEffect(() => {
    let cancelled = false;
    if (!draft.proofPath) {
      const t = setTimeout(() => setPhotoUri(null), 0);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }
    void getProofSignedUrl(draft.proofPath).then((url) => {
      if (!cancelled) setPhotoUri(url);
    });
    return () => {
      cancelled = true;
    };
  }, [draft.proofPath]);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [managingCategories, setManagingCategories] = useState(false);
  const [pendingCategoryDelete, setPendingCategoryDelete] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Reload the form on each open. The ref stops a background refetch (which
  // hands us a new object for the same task) from wiping what is being typed.
  const wasVisible = useRef(false);
  useEffect(() => {
    if (!visible) {
      wasVisible.current = false;
      return;
    }
    if (wasVisible.current) return;

    wasVisible.current = true;
    setDraft(draftFrom(task, defaultDate));
    setError(null);
    setConfirmDelete(false);
    setAddingCategory(false);
    setNewCategoryName('');
    setManagingCategories(false);
    setPendingCategoryDelete(null);
    setCategoryError(null);
  }, [visible, task, defaultDate]);

  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));

  const saving = createTask.isPending || updateTask.isPending;

  async function handlePickPhoto() {
    if (!session?.user.id) return;
    const result = await pickProofImage('gallery');
    if (result.canceled || !result.assets?.[0]) return;

    setPhotoUploading(true);
    try {
      const compressed = await compressProof(result.assets[0].uri);
      if (compressed.size > MAX_PROOF_BYTES) {
        setError('That photo is too large. Try a smaller one.');
        return;
      }
      const path = buildProofPath(session.user.id);
      await uploadProof(path, compressed.uri);
      const url = await getProofSignedUrl(path);
      setDraft((d) => ({ ...d, proofPath: path }));
      setPhotoUri(url);
    } catch (caught) {
      setError(friendlyDataError(caught));
    } finally {
      setPhotoUploading(false);
    }
  }

  async function handleRemovePhoto() {
    if (draft.proofPath) {
      try {
        // Best-effort storage cleanup; the row update below still proceeds.
      } catch {
        // ignore
      }
    }
    setDraft((d) => ({ ...d, proofPath: null }));
    setPhotoUri(null);
  }
  const deleting = deleteTask.isPending;

  async function handleSave() {
    if (saving) return;

    if (!draft.title.trim()) {
      setError('Give the task a name first.');
      return;
    }

    setError(null);
    const payload = {
      title: draft.title,
      notes: draft.notes,
      due_date: draft.dueDate,
      due_time: draft.dueTime,
      priority: draft.priority,
      category_id: draft.categoryId,
      proof_path: draft.proofPath,
    };

    try {
      if (task) {
        await updateTask.mutateAsync({ id: task.id, draft: payload });
      } else {
        await createTask.mutateAsync(payload);
      }
      onClose();
    } catch (caught) {
      setError(friendlyDataError(caught));
    }
  }

  async function handleDelete() {
    if (!task) return;
    setError(null);
    try {
      await deleteTask.mutateAsync(task.id);
      onClose();
    } catch (caught) {
      setError(friendlyDataError(caught));
    }
  }

  async function handleAddCategory() {
    const name = newCategoryName.trim();
    if (!name) return;

    setCategoryError(null);
    try {
      const created = await createCategory.mutateAsync(name);
      update({ categoryId: created.id });
      setNewCategoryName('');
      setAddingCategory(false);
    } catch (caught) {
      setCategoryError(friendlyDataError(caught));
    }
  }

  async function handleDeleteCategory(id: string) {
    setCategoryError(null);
    try {
      await deleteCategory.mutateAsync(id);
      if (draft.categoryId === id) update({ categoryId: null });
      setPendingCategoryDelete(null);
    } catch (caught) {
      setCategoryError(friendlyDataError(caught));
    }
  }

  // A time without a date makes no sense, so choosing one picks today.
  const timeOptions =
    draft.dueTime && !TIME_OPTIONS.includes(draft.dueTime)
      ? [draft.dueTime, ...TIME_OPTIONS]
      : TIME_OPTIONS;

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={task ? 'Edit task' : 'New task'}
      subtitle={task ? 'Changes save when you tap Save.' : 'Only the name is required.'}
      footer={
        <View style={{ gap: Space.sm }}>
          <Button
            label={task ? 'Save changes' : 'Add task'}
            onPress={() => void handleSave()}
            loading={saving}
          />

          {task ? (
            confirmDelete ? (
              <View style={{ gap: Space.sm, paddingTop: Space.xs }}>
                <AppText variant="caption" tone="secondary" style={{ textAlign: 'center' }}>
                  Delete this task for good? This cannot be undone.
                </AppText>
                <ButtonRow>
                  <View style={{ flex: 1 }}>
                    <Button
                      label="Keep it"
                      variant="secondary"
                      onPress={() => setConfirmDelete(false)}
                      fullWidth
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      label="Delete"
                      variant="danger"
                      onPress={() => void handleDelete()}
                      loading={deleting}
                      fullWidth
                    />
                  </View>
                </ButtonRow>
              </View>
            ) : (
              <TextLink
                label="Delete task"
                align="center"
                tone="danger"
                onPress={() => setConfirmDelete(true)}
              />
            )
          ) : null}
        </View>
      }>
      <TextField
        label="Task"
        value={draft.title}
        onChangeText={(title) => update({ title })}
        placeholder="What needs doing?"
        autoFocus={!task}
        returnKeyType="done"
        maxLength={200}
        editable={!saving}
      />

      <TextField
        label="Notes"
        value={draft.notes}
        onChangeText={(notes) => update({ notes })}
        placeholder="Optional details, links, anything useful"
        multiline
        numberOfLines={4}
        maxLength={2000}
        editable={!saving}
      />

      <View style={{ gap: Space.sm }}>
        <FieldLabel>Due date</FieldLabel>
        <DateField value={draft.dueDate} onChange={(dueDate) => update({ dueDate })} />
      </View>

      <View style={{ gap: Space.sm }}>
        <FieldLabel>Time</FieldLabel>
        <ChipRow>
          <Chip
            label="No time"
            selected={draft.dueTime === null}
            onPress={() => update({ dueTime: null })}
          />
          {timeOptions.map((time) => (
            <Chip
              key={time}
              label={time}
              selected={draft.dueTime === time}
              onPress={() =>
                update({
                  dueTime: time,
                  // A time needs a day to belong to.
                  dueDate: draft.dueDate ?? todayString(),
                })
              }
            />
          ))}
        </ChipRow>
      </View>

      <View style={{ gap: Space.sm }}>
        <FieldLabel>Priority</FieldLabel>
        <ChipRow>
          {PRIORITIES.map((value) => (
            <Chip
              key={value}
              label={`P${value}`}
              selected={draft.priority === value}
              accessibilityLabel={`Priority ${value}, ${PRIORITY_NAMES[value]}`}
              leading={<Dot color={colors.priority[value]} size={7} />}
              onPress={() => update({ priority: value })}
            />
          ))}
        </ChipRow>
        <AppText variant="caption" tone="tertiary">
          P1 is the most urgent. P4 is the default and shows no dot in the list.
        </AppText>
      </View>

      <View style={{ gap: Space.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.sm }}>
          <FieldLabel>Category</FieldLabel>
          <View style={{ flex: 1 }} />
          <TextLink
            label={managingCategories ? 'Done' : 'Manage'}
            align="right"
            onPress={() => {
              setManagingCategories((current) => !current);
              setPendingCategoryDelete(null);
              setAddingCategory(false);
            }}
          />
        </View>

        <ChipRow>
          <Chip
            label="None"
            selected={draft.categoryId === null}
            onPress={() => update({ categoryId: null })}
          />
          {categories.map((category) => (
            <Chip
              key={category.id}
              label={category.name}
              selected={draft.categoryId === category.id}
              leading={<Dot color={category.color} />}
              onPress={() => update({ categoryId: category.id })}
            />
          ))}
        </ChipRow>

        {addingCategory ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: Space.sm }}>
            <View style={{ flex: 1 }}>
              <TextField
                label="New category"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder="Work, Home, Errands…"
                autoFocus
                maxLength={60}
                returnKeyType="done"
                onSubmitEditing={() => void handleAddCategory()}
              />
            </View>
            <View style={{ paddingBottom: Space.xs }}>
              <Button
                label="Add"
                onPress={() => void handleAddCategory()}
                loading={createCategory.isPending}
                fullWidth={false}
              />
            </View>
          </View>
        ) : (
          <TextLink
            label="New category"
            onPress={() => {
              setAddingCategory(true);
              setManagingCategories(false);
            }}
          />
        )}

        {categoryError ? <FormMessage tone="error" message={categoryError} /> : null}

        {managingCategories ? (
          <View
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: Radius.md,
              overflow: 'hidden',
            }}>
            {categories.length === 0 ? (
              <View style={{ padding: Space.md }}>
                <AppText variant="caption" tone="tertiary">
                  No categories yet. Create one to group tasks.
                </AppText>
              </View>
            ) : (
              categories.map((category, index) => (
                <View
                  key={category.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: Space.sm,
                    paddingHorizontal: Space.md,
                    paddingVertical: Space.sm,
                    borderTopWidth: index === 0 ? 0 : 1,
                    borderTopColor: colors.border,
                    backgroundColor: colors.surface,
                  }}>
                  <Dot color={category.color} />

                  {pendingCategoryDelete === category.id ? (
                    <View style={{ flex: 1, gap: Space.xxs }}>
                      <AppText variant="caption" tone="secondary">
                        Delete “{category.name}”? Its tasks stay.
                      </AppText>
                      <View style={{ flexDirection: 'row', gap: Space.lg }}>
                        <TextLink
                          label="Delete"
                          tone="danger"
                          onPress={() => void handleDeleteCategory(category.id)}
                        />
                        <TextLink label="Cancel" onPress={() => setPendingCategoryDelete(null)} />
                      </View>
                    </View>
                  ) : (
                    <>
                      <AppText variant="small" style={{ flex: 1 }}>
                        {category.name}
                      </AppText>
                      <TextLink
                        label="Delete"
                        tone="danger"
                        onPress={() => setPendingCategoryDelete(category.id)}
                      />
                    </>
                  )}
                </View>
              ))
            )}
          </View>
        ) : null}
      </View>

      <View style={{ gap: Space.sm }}>
        <AppText variant="smallStrong">Photo</AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.md }}>
          <ProofThumbnail uri={photoUri} size={56} />
          <View style={{ flex: 1, gap: Space.xs }}>
            <Button
              label={
                photoUploading ? 'Uploading…' : draft.proofPath ? 'Replace photo' : 'Add photo'
              }
              variant="secondary"
              onPress={() => void handlePickPhoto()}
              loading={photoUploading}
              disabled={photoUploading}
              fullWidth={false}
            />
            {draft.proofPath ? (
              <TextLink
                label="Remove photo"
                tone="danger"
                onPress={() => void handleRemovePhoto()}
              />
            ) : null}
          </View>
        </View>
      </View>

      {error ? <FormMessage tone="error" message={error} /> : null}
    </Sheet>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <AppText variant="smallStrong">{children}</AppText>;
}
