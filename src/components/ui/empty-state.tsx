import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Radius, Space } from '@/constants/theme';
import { useTheme } from '@/lib/use-theme';

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  message: string;
  /** Only pass this once the action actually does something. */
  action?: ReactNode;
};

/**
 * Friendly empty state used on every screen instead of a blank list. Rendered
 * inside a card so it reads as "this space is ready for you" rather than
 * "something failed".
 */
export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <Card>
      <View style={{ alignItems: 'center', paddingVertical: Space.lg, gap: Space.sm }}>
        {icon ? (
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: Radius.pill,
              backgroundColor: colors.surfaceMuted,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: Space.xs,
            }}>
            {icon}
          </View>
        ) : null}
        <AppText variant="bodyStrong" style={{ textAlign: 'center' }}>
          {title}
        </AppText>
        <AppText variant="small" tone="secondary" style={{ textAlign: 'center', maxWidth: 340 }}>
          {message}
        </AppText>
        {action ? <View style={{ marginTop: Space.md }}>{action}</View> : null}
      </View>
    </Card>
  );
}
