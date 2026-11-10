import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import { Radius, Space } from '@/constants/theme';
import { useTheme } from '@/lib/use-theme';

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry: () => void;
  icon?: ReactNode;
};

/**
 * "This did not load" card. Always offers a retry, because almost every failure
 * in the app is a dropped connection or a paused Supabase project.
 */
export function ErrorState({
  title = 'Could not load this',
  message,
  onRetry,
  icon,
}: ErrorStateProps) {
  const { colors } = useTheme();

  return (
    <Card>
      <View style={{ alignItems: 'center', gap: Space.sm, paddingVertical: Space.sm }}>
        {icon ? (
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: Radius.pill,
              backgroundColor: colors.dangerSoft,
              alignItems: 'center',
              justifyContent: 'center',
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

        <View style={{ marginTop: Space.md }}>
          <Button label="Try again" variant="secondary" onPress={onRetry} fullWidth={false} />
        </View>
      </View>
    </Card>
  );
}
