import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, TextLink } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { TextField } from '@/components/ui/text-field';
import { AppText } from '@/components/ui/text';
import { Space } from '@/constants/theme';
import { resendConfirmation, signUpWithPassword } from '@/features/auth/api';
import { AuthScreen } from '@/features/auth/components/auth-screen';
import { friendlyAuthError } from '@/features/auth/errors';

const MIN_PASSWORD_LENGTH = 8;

export default function SignUpScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleSignUp() {
    if (submitting) return;
    setError(null);

    if (!email.trim()) {
      setError('Enter your email address.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Choose a password with at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setSubmitting(true);
    try {
      const data = await signUpWithPassword({ email, password, displayName });

      // With email confirmation switched off, Supabase signs the user in right
      // away and the auth guard sends them to onboarding. Otherwise they have to
      // click the link in their inbox first.
      if (!data.session) {
        setAwaitingConfirmation(true);
      }
    } catch (caught) {
      setError(friendlyAuthError(caught));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setResent(false);
    setError(null);
    try {
      await resendConfirmation(email);
      setResent(true);
    } catch (caught) {
      setError(friendlyAuthError(caught));
    } finally {
      setResending(false);
    }
  }

  if (awaitingConfirmation) {
    return (
      <AuthScreen
        title="Check your inbox"
        subtitle={`We sent a confirmation link to ${email.trim()}.`}
        footer={
          <TextLink
            label="Back to sign in"
            align="center"
            onPress={() => router.replace('/sign-in')}
          />
        }>
        <FormMessage
          tone="success"
          title="One more step"
          message="Open the link in the email, then come back and sign in. It can take a minute to arrive — check spam if it does not."
        />

        {resent ? (
          <FormMessage tone="info" message="Sent again. The newest email is the one to use." />
        ) : null}

        {error ? <FormMessage tone="error" message={error} /> : null}

        <Button
          label="Resend the email"
          variant="secondary"
          onPress={handleResend}
          loading={resending}
        />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Create your account"
      subtitle="Two minutes now, a calmer day tomorrow."
      footer={
        <View style={{ alignItems: 'center', gap: Space.xxs }}>
          <AppText variant="small" tone="secondary">
            Already have an account?
          </AppText>
          <TextLink label="Sign in" align="center" onPress={() => router.replace('/sign-in')} />
        </View>
      }>
      <TextField
        label="Your name"
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Alex"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        editable={!submitting}
      />

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        editable={!submitting}
      />

      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="At least 8 characters"
        secure
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={handleSignUp}
        editable={!submitting}
        hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
      />

      {error ? <FormMessage tone="error" message={error} /> : null}

      <Button label="Create account" onPress={handleSignUp} loading={submitting} />
    </AuthScreen>
  );
}
