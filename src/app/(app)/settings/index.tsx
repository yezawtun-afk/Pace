import type { ReactNode } from 'react';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MonitorIcon, MoonIcon, SunIcon } from '@/components/ui/icons';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { AppText } from '@/components/ui/text';
import { Space } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { UpgradeAccountSheet } from '@/features/auth/components/upgrade-account-sheet';
import { usePreferences, type ThemeMode } from '@/lib/preferences';
import { useTheme } from '@/lib/use-theme';

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

/**
 * Preferences. Appearance works today (and persists); account, reminders and
 * export arrive in later phases.
 */
export default function SettingsScreen() {
  const themeMode = usePreferences((state) => state.themeMode);
  const setThemeMode = usePreferences((state) => state.setThemeMode);
  const { session, isGuest } = useAuth();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  return (
    <Screen>
      <ScreenHeader eyebrow="You" title="Settings" subtitle="Make Pace feel like yours." />

      <SectionHeader title="Appearance" />
      <Card>
        <AppText variant="bodyStrong">Theme</AppText>
        <AppText variant="small" tone="secondary" style={{ marginTop: Space.xxs }}>
          Follows your device unless you pick one here.
        </AppText>
        <View style={{ marginTop: Space.lg }}>
          <SegmentedControl
            accessibilityLabel="Theme"
            options={THEME_OPTIONS}
            value={themeMode}
            onChange={setThemeMode}
          />
        </View>
      </Card>

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
        </Card>
      </View>

      <View style={{ marginTop: Space.xxl }}>
        <SectionHeader title="About" />
        <Card padded={false}>
          <InfoRow label="Version" value="1.0.0" first />
          <InfoRow label="Tagline" value="Find your daily pace." />
        </Card>
      </View>

      {upgradeOpen ? <UpgradeAccountSheet visible onClose={() => setUpgradeOpen(false)} /> : null}
    </Screen>
  );
}
