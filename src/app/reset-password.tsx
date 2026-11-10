import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';

import { Button, TextLink } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { TextField } from '@/components/ui/text-field';
import { AppText } from '@/components/ui/text';
import { Space } from '@/constants/theme';
import { acceptRecoveryLink, updatePassword } from '@/features/auth/api';
import { useAuth } from '@/features/auth/auth-provider';
import { AuthScreen } from '@/features/auth/components/auth-screen';
import { friendlyAuthError } from '@/features/auth/errors';
import { useTheme } from '@/lib/use-theme';

const MIN_PASSWORD_LENGTH = 8;

/**
 * Opened from the "reset your password" email.
 *
 * Two jobs in one screen:
 *  1. finish the sign-in that the emailed link started (native only — on the
 *     web supabase-js reads the URL itself),
 *  2. let the user choose a new password.
 *
 * If the link has expired or was already used there is no session, so instead
 * of a form the user sees a plain explanation and a way to request a new link.
 */
export default function ResetPasswordScreen() {
  const { colors } = useTheme();
  const { session, isLoading: isAuthLoading } = useAuth();

  // Native only: we are busy reading the incoming deep link.
  const [processingLink, setProcessingLink] = useState(Platform.OS !== 'web');
  const [linkError, setLinkError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [updated, setUpdated] = useState(false);

  // On a phone, the link arrives as a `pace://` URL. Convert it into a session
  // before deciding whether to show the form.
  useEffect(() => {
    if (Platform.OS === 'web') return;

    let isMounted = true;

    const finishLink = async (url: string | null) => {
      if (!url) return;
      try {
        await acceptRecoveryLink(url);
      } catch (caught) {
        if (isMounted) setLinkError(friendlyAuthError(caught));
      } finally {
        if (isMounted) setProcessingLink(false);
      }
    };

    void Linking.getInitialURL().then(finishLink);

    // Also handle a link opened while the app is already running.
    const subscription = Linking.addEventListener('url', ({ url }) => {
      setProcessingLink(true);
      void finishLink(url);
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  const checking = processingLink || isAuthLoading;
  const canChangePassword = !checking && Boolean(session);

  async function handleSubmit() {
    if (submitting) return;
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Choose a password with at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmation) {
      setError('The two passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await updatePassword(password);
      setUpdated(true);
    } catch (caught) {
      setError(friendlyAuthError(caught));
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return (
      <AuthScreen
        title="One moment"
        subtitle="Checking your reset link."
        footer={
          <TextLink
            label="Back to sign in"
            align="center"
            onPress={() => router.replace('/sign-in')}
          />
        }>
        <View style={{ alignItems: 'center', paddingVertical: Space.xl }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </AuthScreen>
    );
  }

  if (!canChangePassword) {
    return (
      <AuthScreen
        title="This link has expired"
        subtitle="Reset links only work once, and they do not last forever."
        footer={
          <TextLink
            label="Back to sign in"
            align="center"
            onPress={() => router.replace('/sign-in')}
          />
        }>
        <FormMessage
          tone="info"
          message="Request a new link and use the newest email you receive."
        />
        {linkError ? <FormMessage tone="error" message={linkError} /> : null}
        <Button
          label="Send a new link"
          onPress={() => router.replace('/forgot-password')}
          variant="secondary"
        />
      </AuthScreen>
    );
  }

  if (updated) {
    return (
      <AuthScreen
        title="Password updated"
        subtitle="You are signed in with your new password."
        footer={
          <TextLink
            label="Back to sign in"
            align="center"
            onPress={() => router.replace('/sign-in')}
          />
        }>
        <FormMessage
          tone="success"
          message="Use the new password next time you sign in. Nothing else about your account changed."
        />
        <Button label="Continue" onPress={() => router.replace('/today')} />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Choose a new password"
      subtitle="Pick something you have not used on Pace before."
      footer={
        <TextLink
          label="Back to sign in"
          align="center"
          onPress={() => router.replace('/sign-in')}
        />
      }>
      <TextField
        label="New password"
        value={password}
        onChangeText={setPassword}
        placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
        secure
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        editable={!submitting}
        hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
      />

      <TextField
        label="Confirm new password"
        value={confirmation}
        onChangeText={setConfirmation}
        placeholder="Type it again"
        secure
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
        editable={!submitting}
      />

      {error ? <FormMessage tone="error" message={error} /> : null}

      <Button label="Save new password" onPress={handleSubmit} loading={submitting} />

      <AppText variant="caption" tone="tertiary">
        Changing your password signs you out on other devices the next time they check in.
      </AppText>
    </AuthScreen>
  );
}
