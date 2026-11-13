import type { ReactNode } from 'react';
import Constants from 'expo-constants';
import { Alert, Platform, Pressable, View } from 'react-native';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MonitorIcon, MoonIcon, SunIcon } from '@/components/ui/icons';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TextField } from '@/components/ui/text-field';
import { AppText } from '@/components/ui/text';
import { Space } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { useProfile, useUpdateProfile } from '@/features/auth/use-profile';
import { UpgradeAccountSheet } from '@/features/auth/components/upgrade-account-sheet';
import { fetchExportData, toCsv } from '@/features/export/api';
import { createShareToken, revokeShare } from '@/features/sharing/api';
import { signOut, deleteAccount } from '@/features/auth/api';
import { usePreferences, type ThemeMode } from '@/lib/preferences';
import { useTheme } from '@/lib/use-theme';
import { scheduleEveningReminder } from '@/lib/reminders';
import { saveAndShareFile } from '@/lib/export-file';
import { friendlyDataError } from '@/features/auth/errors';

const THEME_OPTIONS: {
  value: ThemeMode;
  label: string;
  renderIcon: (color: string) => ReactNode;
}[] = [
  {
    value: 'system',
    label: 'System',
    renderIcon: (color) => <MonitorIcon size={16} color={color} />,
  },
  { value: 'light', label: 'Light', renderIcon: (color) => <SunIcon size={16} color={color} /> },
  { value: 'dark', label: 'Dark', renderIcon: (color) => <MoonIcon size={16} color={color} /> },
];

const REVIEW_TIMES = ['18:00', '19:00', '20:00', '21:00', '22:00'];

function InfoRow({ label, value, first }: { label: string; value: string; first?: boolean }) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Space.md + 2,
        paddingHorizontal: Space.xl,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: colors.border,
        gap: Space.lg,
      }}>
      <AppText variant="small" tone="secondary">
        {label}
      </AppText>
      <AppText variant="small" style={{ flexShrink: 1, textAlign: 'right' }}>
        {value}
      </AppText>
    </View>
  );
}

function ToggleRow({
  label,
  hint,
  value,
  onChange,
  first,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  first?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Space.md + 2,
        paddingHorizontal: Space.xl,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: colors.border,
        gap: Space.lg,
        opacity: pressed ? 0.7 : 1,
      })}>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="small">{label}</AppText>
        {hint ? (
          <AppText variant="caption" tone="tertiary">
            {hint}
          </AppText>
        ) : null}
      </View>
      <View
        style={{
          width: 40,
          height: 24,
          borderRadius: 12,
          backgroundColor: value ? colors.accent : colors.surfaceMuted,
          justifyContent: 'center',
          paddingHorizontal: 2,
        }}>
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: colors.surface,
            alignSelf: value ? 'flex-end' : 'flex-start',
          }}
        />
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { colors } = useTheme();
  const themeMode = usePreferences((state) => state.themeMode);
  const setThemeMode = usePreferences((state) => state.setThemeMode);
  const { session, isGuest } = useAuth();
  const profileQuery = useProfile();
  const updateProfile = useUpdateProfile();

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMessage, setNameMessage] = useState<string | null>(null);
  const [exporting, setExporting] = useState<'json' | 'csv' | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const profile = profileQuery.data;
  const eveningTime = (profile?.evening_review_time ?? '20:00').slice(0, 5);

  function handleThemeChange(mode: ThemeMode) {
    setThemeMode(mode);
    if (profile) {
      updateProfile.mutate({ theme: mode });
    }
  }

  async function saveName() {
    if (!profile) return;
    const trimmed = nameDraft.trim();
    setNameSaving(true);
    setNameMessage(null);

    try {
      await updateProfile.mutateAsync({ display_name: trimmed || null });
      setNameMessage(trimmed ? 'Saved.' : 'Cleared.');
    } catch (cause) {
      setNameMessage(friendlyDataError(cause));
    } finally {
      setNameSaving(false);
    }
  }

  async function handleToggle(
    field: 'habit_reminders_enabled' | 'task_reminders_enabled' | 'evening_reminder_enabled',
    value: boolean,
  ) {
    try {
      await updateProfile.mutateAsync({ [field]: value });
      if (field === 'evening_reminder_enabled') {
        const nextTime = profile?.evening_review_time ?? '20:00';
        await scheduleEveningReminder(nextTime, value);
      }
    } catch {
      // The mutation's own error handling covers the UI; nothing else to do.
    }
  }

  async function handleTimeChange(time: string) {
    try {
      await updateProfile.mutateAsync({ evening_review_time: time });
      await scheduleEveningReminder(time, profile?.evening_reminder_enabled ?? true);
    } catch {
      // Ignored: the profile query will refetch and revert the UI.
    }
  }

  async function handleExportJson() {
    if (!session?.user.id) return;
    setExporting('json');
    setExportMessage(null);

    try {
      const data = await fetchExportData(session.user.id);
      const content = JSON.stringify(data, null, 2);
      await saveAndShareFile('pace-export.json', content, 'application/json');
      setExportMessage('Exported as pace-export.json.');
    } catch (cause) {
      setExportMessage(friendlyDataError(cause));
    } finally {
      setExporting(null);
    }
  }

  async function handleExportCsv() {
    if (!session?.user.id) return;
    setExporting('csv');
    setExportMessage(null);

    try {
      const data = await fetchExportData(session.user.id);
      const content = toCsv(data.tasks as unknown as Record<string, unknown>[]);
      await saveAndShareFile('pace-tasks.csv', content, 'text/csv');
      setExportMessage('Exported tasks as pace-tasks.csv.');
    } catch (cause) {
      setExportMessage(friendlyDataError(cause));
    } finally {
      setExporting(null);
    }
  }

  async function handleShare() {
    setSharing(true);
    setShareMessage(null);
    try {
      const token = await createShareToken();
      setShareToken(token);
      setShareMessage('Link created. Copy it and send it to someone you trust.');
    } catch (cause) {
      setShareMessage(cause instanceof Error ? cause.message : 'Could not create the link.');
    } finally {
      setSharing(false);
    }
  }

  async function handleRevoke() {
    if (!shareToken) return;
    setSharing(true);
    try {
      await revokeShare(shareToken);
      setShareToken(null);
      setShareMessage('Link revoked.');
    } catch (cause) {
      setShareMessage(cause instanceof Error ? cause.message : 'Could not revoke the link.');
    } finally {
      setSharing(false);
    }
  }

  function confirmSignOut() {
    if (isGuest) {
      Alert.alert(
        'Sign out of this guest account?',
        'A guest account only exists on this device. Signing out means you will not be able to get back to these tasks, habits or journal entries unless you create an account first.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign out', style: 'destructive', onPress: () => void doSignOut() },
        ],
      );
      return;
    }

    Alert.alert('Sign out?', 'You can sign back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', onPress: () => void doSignOut() },
    ]);
  }

  async function doSignOut() {
    try {
      await signOut();
    } catch (cause) {
      Alert.alert('Could not sign out', friendlyDataError(cause));
    }
  }

  function confirmDeleteAccount() {
    Alert.alert(
      'Delete your account?',
      'This removes your profile, tasks, habits, habit history and journal entries. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void doDeleteAccount(),
        },
      ],
    );
  }

  async function doDeleteAccount() {
    setDeleting(true);
    try {
      await deleteAccount();
    } catch (cause) {
      setDeleting(false);
      Alert.alert('Could not delete', friendlyDataError(cause));
    }
  }

  // Keep the name field in sync with the loaded profile, but only until the
  // user starts typing. A simple "seed once" flag handles that.
  const [nameSeeded, setNameSeeded] = useState(false);
  if (profile && !nameSeeded) {
    setNameDraft(profile.display_name ?? '');
    setNameSeeded(true);
  }

  const displayName = profile?.display_name ?? null;

  return (
    <Screen>
      <ScreenHeader eyebrow="You" title="Settings" subtitle="Preferences and account." />

      <SectionHeader title="Appearance" />
      <Card>
        <AppText variant="bodyStrong">Theme</AppText>
        <AppText variant="small" tone="secondary" style={{ marginTop: Space.xxs }}>
          Follows your device unless you pick one here. Your choice syncs to your account.
        </AppText>
        <View style={{ marginTop: Space.lg }}>
          <SegmentedControl
            accessibilityLabel="Theme"
            options={THEME_OPTIONS}
            value={themeMode}
            onChange={handleThemeChange}
          />
        </View>
      </Card>

      <View style={{ marginTop: Space.xxl }}>
        <SectionHeader title="Reminders" />
        <Card padded={false}>
          <ToggleRow
            first
            label="Habit reminders"
            hint="A nudge to check off today's habits."
            value={profile?.habit_reminders_enabled ?? true}
            onChange={(value) => void handleToggle('habit_reminders_enabled', value)}
          />
          <ToggleRow
            label="Task reminders"
            hint="A nudge for tasks due today."
            value={profile?.task_reminders_enabled ?? true}
            onChange={(value) => void handleToggle('task_reminders_enabled', value)}
          />
          <ToggleRow
            label="Evening review"
            hint="A reminder to close the day."
            value={profile?.evening_reminder_enabled ?? true}
            onChange={(value) => void handleToggle('evening_reminder_enabled', value)}
          />
        </Card>

        <View style={{ marginTop: Space.md }}>
          <AppText variant="smallStrong" style={{ marginBottom: Space.xs }}>
            Evening review time
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm }}>
            {REVIEW_TIMES.map((time) => (
              <Pressable
                key={time}
                onPress={() => void handleTimeChange(time)}
                accessibilityRole="button"
                accessibilityLabel={`Set evening review time to ${time}`}
                style={({ pressed }) => ({
                  minHeight: 40,
                  paddingHorizontal: Space.md + 2,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: eveningTime === time ? colors.accentBorder : colors.border,
                  backgroundColor: eveningTime === time ? colors.accentSoft : colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}>
                <AppText variant="small" color={eveningTime === time ? colors.accent : colors.text}>
                  {time}
                </AppText>
              </Pressable>
            ))}
          </View>
          <AppText variant="caption" tone="tertiary" style={{ marginTop: Space.xs }}>
            On a phone this schedules a daily notification; on the web a banner appears here.
          </AppText>
        </View>
      </View>

      <View style={{ marginTop: Space.xxl }}>
        <SectionHeader title="Account" />
        <Card>
          {isGuest ? (
            <>
              <AppText variant="bodyStrong">You are using Pace as a guest</AppText>
              <AppText variant="small" tone="secondary" style={{ marginTop: Space.xxs }}>
                Everything works right now, but a guest account only exists on this device. Add an
                email and password and you can sign in anywhere — your tasks, habits and journal
                come with you.
              </AppText>
              <View style={{ marginTop: Space.lg }}>
                <Button label="Create an account" onPress={() => setUpgradeOpen(true)} />
              </View>
            </>
          ) : (
            <>
              <AppText variant="bodyStrong">Signed in</AppText>
              <AppText variant="small" tone="secondary" style={{ marginTop: Space.xxs }}>
                {session?.user.email ?? 'Your account is ready.'}
              </AppText>
            </>
          )}

          <View style={{ marginTop: Space.xl, gap: Space.sm }}>
            <TextField
              label="Display name"
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder={displayName ?? 'Your name'}
              maxLength={80}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.md }}>
              <Button
                label={nameSaving ? 'Saving…' : 'Save name'}
                onPress={() => void saveName()}
                loading={nameSaving}
                disabled={nameSaving}
                fullWidth={false}
              />
              {nameMessage ? (
                <AppText variant="caption" tone="secondary">
                  {nameMessage}
                </AppText>
              ) : null}
            </View>
          </View>

          <View style={{ marginTop: Space.xl, gap: Space.sm }}>
            <Button label="Sign out" variant="secondary" onPress={confirmSignOut} />
            <Button
              label={deleting ? 'Deleting…' : 'Delete account'}
              variant="danger"
              onPress={confirmDeleteAccount}
              loading={deleting}
              disabled={deleting}
            />
          </View>
        </Card>
      </View>

      <View style={{ marginTop: Space.xxl }}>
        <SectionHeader title="Your data" />
        <Card>
          <AppText variant="bodyStrong">Export</AppText>
          <AppText variant="small" tone="secondary" style={{ marginTop: Space.xxs }}>
            A full backup as JSON, or your tasks as CSV. Nothing is uploaded — the file is created
            on this device.
          </AppText>
          <View style={{ marginTop: Space.lg, gap: Space.sm }}>
            <Button
              label={exporting === 'json' ? 'Exporting…' : 'Export everything (JSON)'}
              onPress={() => void handleExportJson()}
              loading={exporting === 'json'}
              disabled={exporting !== null}
            />
            <Button
              label={exporting === 'csv' ? 'Exporting…' : 'Export tasks (CSV)'}
              variant="secondary"
              onPress={() => void handleExportCsv()}
              loading={exporting === 'csv'}
              disabled={exporting !== null}
            />
          </View>
          {exportMessage ? (
            <AppText variant="caption" tone="secondary" style={{ marginTop: Space.sm }}>
              {exportMessage}
            </AppText>
          ) : null}
        </Card>
      </View>

      <View style={{ marginTop: Space.xxl }}>
        <SectionHeader title="Sharing" />
        <Card>
          <AppText variant="bodyStrong">Share your pace</AppText>
          <AppText variant="small" tone="secondary" style={{ marginTop: Space.xxs }}>
            A read-only link a partner can open: just your pace ring and today&apos;s done counts,
            no details. Revoke it any time.
          </AppText>

          {shareToken ? (
            <View style={{ marginTop: Space.md, gap: Space.sm }}>
              <AppText variant="caption" tone="secondary" selectable>
                {shareToken}
              </AppText>
              <Button
                label={sharing ? 'Revoking…' : 'Revoke link'}
                variant="secondary"
                onPress={() => void handleRevoke()}
                loading={sharing}
                disabled={sharing}
              />
            </View>
          ) : (
            <View style={{ marginTop: Space.md }}>
              <Button
                label={sharing ? 'Creating…' : 'Create a share link'}
                onPress={() => void handleShare()}
                loading={sharing}
                disabled={sharing}
              />
            </View>
          )}

          {shareMessage ? (
            <AppText variant="caption" tone="secondary" style={{ marginTop: Space.sm }}>
              {shareMessage}
            </AppText>
          ) : null}
        </Card>
      </View>

      <View style={{ marginTop: Space.xxl }}>
        <SectionHeader title="About" />
        <Card padded={false}>
          <InfoRow label="Version" value={Constants.expoConfig?.version ?? '1.0.0'} first />
          <InfoRow label="Platform" value={Platform.OS} />
        </Card>
      </View>

      {upgradeOpen ? <UpgradeAccountSheet visible onClose={() => setUpgradeOpen(false)} /> : null}
    </Screen>
  );
}
