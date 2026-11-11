import { router, usePathname } from 'expo-router';
import type { ComponentType, ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  HabitsIcon,
  JournalIcon,
  LeafIcon,
  SettingsIcon,
  TasksIcon,
  TodayIcon,
  type IconProps,
} from '@/components/ui/icons';
import { AppText } from '@/components/ui/text';
import { Layout, Radius, Space } from '@/constants/theme';
import { OfflineBanner } from '@/components/offline-banner';
import { useIsWide } from '@/hooks/use-is-wide';
import { useTheme } from '@/lib/use-theme';

/** Every destination in the main app, in the order they appear in the nav. */
const NAV_ITEMS: { href: NavHref; label: string; Icon: ComponentType<IconProps> }[] = [
  { href: '/today', label: 'Today', Icon: TodayIcon },
  { href: '/habits', label: 'Habits', Icon: HabitsIcon },
  { href: '/journal', label: 'Journal', Icon: JournalIcon },
  { href: '/tasks', label: 'Tasks', Icon: TasksIcon },
  { href: '/settings', label: 'Settings', Icon: SettingsIcon },
];

export type NavHref = '/today' | '/habits' | '/journal' | '/tasks' | '/settings';

function useActiveHref(): NavHref | null {
  const pathname = usePathname();
  const match = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  return match?.href ?? null;
}

function goTo(href: NavHref) {
  // `navigate` reuses an existing screen instead of stacking duplicates, so the
  // Android back button always leaves the app from a tab root.
  router.navigate(href);
}

/**
 * Responsive navigation: a sidebar on wide screens (web, tablets) and bottom
 * tabs on phones. Same items, same URLs, one code path for both.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const isWide = useIsWide();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, flexDirection: isWide ? 'row' : 'column' }}>
        {isWide ? <Sidebar /> : null}
        <View style={{ flex: 1 }}>
          <OfflineBanner />
          {children}
        </View>
        {isWide ? null : <BottomTabs />}
      </View>
    </View>
  );
}

function Sidebar() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const activeHref = useActiveHref();

  return (
    <View
      style={{
        width: Layout.sidebarWidth,
        paddingTop: insets.top + Space.xxl,
        paddingBottom: Space.xxl,
        paddingHorizontal: Space.lg,
        backgroundColor: colors.surfaceMuted,
        borderRightWidth: 1,
        borderRightColor: colors.border,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.md }}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: Radius.md,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <LeafIcon size={19} color={colors.accentText} strokeWidth={1.8} />
        </View>
        <View>
          <AppText variant="heading">Pace</AppText>
          <AppText variant="caption" tone="tertiary">
            Find your daily pace.
          </AppText>
        </View>
      </View>

      <View accessibilityRole="tablist" style={{ marginTop: Space.xxl, gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const active = item.href === activeHref;
          return (
            <Pressable
              key={item.href}
              onPress={() => goTo(item.href)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              aria-selected={active}
              accessibilityLabel={item.label}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: Space.md,
                minHeight: Layout.minTapTarget,
                paddingHorizontal: Space.md,
                borderRadius: Radius.md,
                backgroundColor: active ? colors.accentSoft : 'transparent',
                opacity: pressed ? 0.65 : 1,
              })}>
              <item.Icon
                size={19}
                color={active ? colors.accent : colors.textTertiary}
                strokeWidth={active ? 2 : 1.7}
              />
              <AppText
                variant={active ? 'smallStrong' : 'small'}
                color={active ? colors.text : colors.textSecondary}>
                {item.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      <View style={{ paddingTop: Space.lg, borderTopWidth: 1, borderTopColor: colors.border }}>
        <AppText variant="caption" tone="tertiary">
          One day at a time.
        </AppText>
      </View>
    </View>
  );
}

function BottomTabs() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const activeHref = useActiveHref();

  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: Space.xs + 2,
        paddingBottom: insets.bottom + Space.xs + 2,
        paddingHorizontal: Space.sm,
      }}>
      {NAV_ITEMS.map((item) => {
        const active = item.href === activeHref;
        return (
          <Pressable
            key={item.href}
            onPress={() => goTo(item.href)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            aria-selected={active}
            accessibilityLabel={item.label}
            style={({ pressed }) => ({
              flex: 1,
              alignItems: 'center',
              gap: 3,
              paddingTop: 2,
              opacity: pressed ? 0.6 : 1,
            })}>
            <View
              style={{
                width: 40,
                height: 28,
                borderRadius: Radius.pill,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? colors.accentSoft : 'transparent',
              }}>
              <item.Icon
                size={20}
                color={active ? colors.accent : colors.textTertiary}
                strokeWidth={active ? 2 : 1.7}
              />
            </View>
            <AppText
              variant="caption"
              color={active ? colors.text : colors.textTertiary}
              style={active ? { fontWeight: '600' } : undefined}>
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
