import type { ReactNode } from 'react';
import { DevSettings, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { LeafIcon } from '@/components/ui/icons';
import { AppText } from '@/components/ui/text';
import { MonoFamily, Radius, Space } from '@/constants/theme';
import { useTheme } from '@/lib/use-theme';

/**
 * Shown when `.env` has no usable Supabase credentials. Without this screen the
 * app would crash with a network error, which is a confusing first experience
 * for someone who just cloned the project.
 */
export default function SetupRequiredScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const reload = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.reload();
      return;
    }
    DevSettings.reload();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Space.xl,
        paddingTop: insets.top + Space.xxxl,
        paddingBottom: insets.bottom + Space.xxxl,
      }}>
      <View style={{ width: '100%', maxWidth: 620 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.md }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: Radius.md,
              backgroundColor: colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <LeafIcon size={21} color={colors.accentText} />
          </View>
          <AppText variant="heading">Pace</AppText>
        </View>

        <AppText variant="title" style={{ marginTop: Space.xxl }}>
          Connect your database
        </AppText>
        <AppText variant="small" tone="secondary" style={{ marginTop: Space.sm }}>
          Pace keeps your habits, tasks and journal in Supabase. It needs two public settings from
          your project before it can start.
        </AppText>

        <Card style={{ marginTop: Space.xxl }}>
          <Step index={1} title="Create a free Supabase project">
            <AppText variant="small" tone="secondary">
              Sign in at supabase.com, create a project and pick a region close to you. The free
              plan is enough and does not ask for a card.
            </AppText>
          </Step>

          <Step index={2} title="Copy the Project URL and anon key">
            <AppText variant="small" tone="secondary">
              In your project open <AppText variant="smallStrong">Project Settings → API</AppText>{' '}
              and copy the Project URL plus the <AppText variant="smallStrong">anon public</AppText>{' '}
              key.
            </AppText>
          </Step>

          <Step index={3} title="Create your env file">
            <AppText variant="small" tone="secondary">
              In the project folder, run this in PowerShell:
            </AppText>
            <Code>Copy-Item .env.example .env</Code>
          </Step>

          <Step index={4} title="Paste both values into .env">
            <Code>
              {
                'EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\nEXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key'
              }
            </Code>
          </Step>

          <Step index={5} title="Restart the dev server" last>
            <AppText variant="small" tone="secondary">
              Expo reads environment variables at startup only, so stop the server with Ctrl+C and
              run <AppText variant="smallStrong">npm start</AppText> again.
            </AppText>
          </Step>
        </Card>

        <View
          style={{
            marginTop: Space.lg,
            padding: Space.lg,
            borderRadius: Radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.dangerSoft,
            gap: Space.xs,
          }}>
          <AppText variant="smallStrong" tone="danger">
            Only the anon key goes in the app
          </AppText>
          <AppText variant="small" tone="secondary">
            The service_role key bypasses every security rule. Never put it in .env or anywhere that
            ships to a device.
          </AppText>
        </View>

        <Pressable
          onPress={reload}
          accessibilityRole="button"
          style={({ pressed }) => ({
            marginTop: Space.xxl,
            minHeight: 48,
            borderRadius: Radius.md,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
          })}>
          <AppText variant="bodyStrong" color={colors.accentText}>
            Reload app
          </AppText>
        </Pressable>

        <AppText
          variant="caption"
          tone="tertiary"
          style={{ marginTop: Space.lg, textAlign: 'center' }}>
          The same steps, with more detail, are in README.md.
        </AppText>
      </View>
    </ScrollView>
  );
}

function Step({
  index,
  title,
  children,
  last,
}: {
  index: number;
  title: string;
  children: ReactNode;
  last?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: Space.md,
        paddingBottom: last ? 0 : Space.xl,
        marginBottom: last ? 0 : Space.xl,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}>
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: Radius.pill,
          backgroundColor: colors.surfaceMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <AppText variant="caption" tone="secondary">
          {index}
        </AppText>
      </View>
      <View style={{ flex: 1, gap: Space.xs }}>
        <AppText variant="smallStrong">{title}</AppText>
        {children}
      </View>
    </View>
  );
}

function Code({ children }: { children: string }) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        backgroundColor: colors.surfaceMuted,
        borderRadius: Radius.sm,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: Space.sm,
        paddingHorizontal: Space.md,
        marginTop: Space.sm,
      }}>
      <AppText style={{ fontFamily: MonoFamily, fontSize: 12.5, lineHeight: 19 }}>
        {children}
      </AppText>
    </View>
  );
}
