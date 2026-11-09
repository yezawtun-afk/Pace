import { View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Radius, Space } from '@/constants/theme';
import { useTheme } from '@/lib/use-theme';

type FormMessageProps = {
  tone: 'error' | 'info' | 'success';
  title?: string;
  message: string;
};

const TONES = {
  error: { background: 'dangerSoft', text: 'danger' },
  success: { background: 'accentSoft', text: 'accent' },
  info: { background: 'surfaceMuted', text: 'secondary' },
} as const;

/** Inline banner for form errors and confirmations. */
export function FormMessage({ tone, title, message }: FormMessageProps) {
  const { colors } = useTheme();
  const theme = TONES[tone];

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        backgroundColor: colors[theme.background],
        borderRadius: Radius.md,
        paddingVertical: Space.md,
        paddingHorizontal: Space.md + 2,
        gap: Space.xxs,
      }}>
      {title ? (
        <AppText variant="smallStrong" tone={theme.text as 'danger' | 'accent' | 'secondary'}>
          {title}
        </AppText>
      ) : null}
      <AppText variant="small" tone={theme.text as 'danger' | 'accent' | 'secondary'}>
        {message}
      </AppText>
    </View>
  );
}
