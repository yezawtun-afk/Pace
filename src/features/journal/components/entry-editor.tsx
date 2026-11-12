import { format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { Button, TextLink } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { Sheet } from '@/components/ui/sheet';
import { TextField } from '@/components/ui/text-field';
import { AppText } from '@/components/ui/text';
import { JOURNAL_PROMPTS } from '@/constants/prompts';
import { FontSerif, Radius, Space } from '@/constants/theme';
import { friendlyDataError } from '@/features/auth/errors';
import { ProofStrip } from '@/features/proofs/components/proof-strip';
import { fromDateString } from '@/lib/dates';
import { useTheme } from '@/lib/use-theme';
import type { JournalEntry, Tag } from '@/types/database';

import { promptForDate, wordCount } from '../journal';
import type { EntryDraft } from '../api';
import { useCreateTag, useDeleteEntry, useSaveEntry, useSetEntryTags } from '../queries';
import { MoodPicker } from './mood-picker';
import { TagPicker } from './tag-picker';

type Draft = {
  title: string;
  body: string;
  mood: number | null;
  promptText: string;
};

function draftFrom(entry: JournalEntry | null, date: string): Draft {
  return {
    title: entry?.title ?? '',
    body: entry?.body ?? '',
    mood: entry?.mood ?? null,
    promptText: entry?.prompt_text ?? promptForDate(fromDateString(date)),
  };
}

/** An entry with no words and no mood is not worth a row. */
function hasContent(draft: Draft): boolean {
  return Boolean(draft.title.trim() || draft.body.trim() || draft.mood);
}

/** The database row wants the day attached; the form keeps it separate. */
function toEntryDraft(draft: Draft, date: string): EntryDraft {
  return {
    entryDate: date,
    title: draft.title,
    body: draft.body,
    mood: draft.mood,
    promptText: draft.promptText,
  };
}

type EntryEditorProps = {
  visible: boolean;
  /** "yyyy-MM-dd" - the day this entry belongs to. */
  date: string;
  entry: JournalEntry | null;
  initialTagIds: string[];
  allTags: Tag[];
  /** Proof photos for this day, oldest first. */
  proofPaths?: string[];
  onClose: () => void;
};

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Write or edit one day. The body autosaves a moment after you stop typing, and
 * once more when the sheet closes, so there is no way to lose a paragraph to a
 * missed button. Tags save immediately because choosing one is a single action.
 */
export function EntryEditor({
  visible,
  date,
  entry,
  initialTagIds,
  allTags,
  proofPaths,
  onClose,
}: EntryEditorProps) {
  const { colors } = useTheme();

  const save = useSaveEntry();
  const remove = useDeleteEntry();
  const createTag = useCreateTag();
  const saveTags = useSetEntryTags();

  const [draft, setDraft] = useState<Draft>(() => draftFrom(entry, date));
  const [tagIds, setTagIds] = useState<string[]>(initialTagIds);
  const [entryId, setEntryId] = useState<string | null>(entry?.id ?? null);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [tagError, setTagError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  /** What the database already has, as JSON, to skip no-op saves. */
  const savedRef = useRef(JSON.stringify(draftFrom(entry, date)));
  const wasVisible = useRef(false);

  /** The mutation object changes identity between renders; a ref keeps the effect calm. */
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });

  // Load the entry each time the sheet opens, never while it is being typed in.
  useEffect(() => {
    if (!visible) {
      wasVisible.current = false;
      return;
    }
    if (wasVisible.current) return;

    wasVisible.current = true;
    const next = draftFrom(entry, date);
    setDraft(next);
    setTagIds(initialTagIds);
    setEntryId(entry?.id ?? null);
    savedRef.current = JSON.stringify(next);
    setStatus('idle');
    setError(null);
    setTagError(null);
    setConfirmDelete(false);
  }, [visible, entry, date, initialTagIds]);

  // Autosave: wait until typing pauses, then write if anything changed.
  useEffect(() => {
    if (!visible) return;

    const snapshot = JSON.stringify(draft);
    if (snapshot === savedRef.current) return;
    if (!hasContent(draft) && !entryId) return;

    const timer = setTimeout(() => {
      setStatus('saving');

      saveRef.current
        .mutateAsync(toEntryDraft(draft, date))
        .then((row) => {
          setEntryId(row.id);
          savedRef.current = snapshot;
          setStatus('saved');
        })
        .catch(() => setStatus('error'));
    }, 900);

    return () => clearTimeout(timer);
  }, [draft, visible, entryId, date]);

  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));

  /** Saves now and returns the row id, creating the entry if needed. */
  async function ensureEntryId(): Promise<string> {
    if (entryId) return entryId;

    const row = await saveRef.current.mutateAsync(toEntryDraft(draft, date));
    setEntryId(row.id);
    savedRef.current = JSON.stringify(draft);
    setStatus('saved');
    return row.id;
  }

  async function toggleTag(tagId: string) {
    setTagError(null);
    const next = tagIds.includes(tagId)
      ? tagIds.filter((value) => value !== tagId)
      : [...tagIds, tagId];

    setTagIds(next);

    try {
      const id = await ensureEntryId();
      await saveTags.mutateAsync({ entryId: id, tagIds: next });
    } catch {
      setTagIds(tagIds);
      setTagError('That tag could not be saved. Try again.');
    }
  }

  async function addTag(name: string) {
    setTagError(null);

    try {
      const tag = await createTag.mutateAsync(name);
      if (!tagIds.includes(tag.id)) await toggleTag(tag.id);
    } catch {
      setTagError('That tag could not be created. Try again.');
    }
  }

  function anotherPrompt() {
    const index = JOURNAL_PROMPTS.indexOf(draft.promptText);
    const next = JOURNAL_PROMPTS[(index + 1 + JOURNAL_PROMPTS.length) % JOURNAL_PROMPTS.length];
    update({ promptText: next });
  }

  async function handleClose() {
    const snapshot = JSON.stringify(draft);

    if (snapshot !== savedRef.current && (hasContent(draft) || entryId)) {
      try {
        const row = await saveRef.current.mutateAsync(toEntryDraft(draft, date));
        setEntryId(row.id);
        savedRef.current = snapshot;
      } catch (cause) {
        setError(friendlyDataError(cause));
        return;
      }
    }

    onClose();
  }

  function handleDelete() {
    if (!entryId) {
      onClose();
      return;
    }

    remove.mutate(entryId, {
      onSuccess: onClose,
      onError: () => setError('That entry could not be deleted. Try again.'),
    });
  }

  const dayLabel = format(fromDateString(date), 'EEEE d MMMM yyyy');
  const words = wordCount(draft.body);

  return (
    <Sheet
      visible={visible}
      onClose={() => void handleClose()}
      title={entry ? 'Your entry' : 'Write today'}
      subtitle={dayLabel}
      footer={
        <>
          <Button label="Save and close" onPress={() => void handleClose()} />

          {confirmDelete ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.md }}>
              <AppText variant="small" tone="secondary" style={{ flex: 1 }}>
                Delete this entry for good?
              </AppText>
              <TextLink label="Cancel" onPress={() => setConfirmDelete(false)} />
              <TextLink label="Delete" tone="danger" onPress={handleDelete} align="right" />
            </View>
          ) : (
            <TextLink
              label={entryId ? 'Delete entry' : 'Discard'}
              tone={entryId ? 'danger' : 'accent'}
              onPress={() => (entryId ? setConfirmDelete(true) : onClose())}
            />
          )}
        </>
      }>
      <MoodPicker value={draft.mood} onChange={(mood) => update({ mood })} />

      {proofPaths && proofPaths.length > 0 ? (
        <ProofStrip paths={proofPaths} label="Photos from this day" />
      ) : null}

      <View
        style={{
          gap: Space.sm,
          padding: Space.md + 2,
          borderRadius: Radius.md,
          backgroundColor: colors.surfaceMuted,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AppText variant="overline" tone="tertiary" style={{ flex: 1 }}>
            Prompt
          </AppText>
          <TextLink label="Another" onPress={anotherPrompt} align="right" />
        </View>

        <AppText variant="body" style={{ fontFamily: FontSerif }}>
          {draft.promptText}
        </AppText>
      </View>

      <TextField
        label="Title"
        value={draft.title}
        onChangeText={(title) => update({ title })}
        placeholder="Optional — a few words"
        maxLength={120}
        returnKeyType="next"
      />

      <TextField
        label="How did today go?"
        value={draft.body}
        onChangeText={(body) => update({ body })}
        placeholder="A few honest lines are enough."
        multiline
        minHeight={150}
        maxLength={8000}
        fontFamily={FontSerif}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.sm }}>
        <AppText variant="caption" tone={status === 'error' ? 'danger' : 'tertiary'}>
          {status === 'saving'
            ? 'Saving…'
            : status === 'saved'
              ? 'Saved'
              : status === 'error'
                ? 'Not saved — check your connection.'
                : 'Drafts save automatically.'}
        </AppText>

        <View style={{ flex: 1 }} />

        {words > 0 ? (
          <AppText variant="caption" tone="tertiary">
            {words === 1 ? '1 word' : `${words} words`}
          </AppText>
        ) : null}
      </View>

      <View style={{ gap: Space.sm }}>
        <AppText variant="smallStrong">Tags</AppText>
        <TagPicker
          tags={allTags}
          selectedIds={tagIds}
          onToggle={(tagId) => void toggleTag(tagId)}
          onCreate={(name) => void addTag(name)}
          creating={createTag.isPending}
          error={tagError}
        />
      </View>

      {error ? <FormMessage tone="error" message={error} /> : null}
    </Sheet>
  );
}
