import { router } from 'expo-router';
import { useState } from 'react';

import { Button, TextLink } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { TextField } from '@/components/ui/text-field';
import { sendPasswordReset } from '@/features/auth/api';
import { AuthScreen } from '@/features/auth/components/auth-screen';
import { friendlyAuthError } from '@/features/auth/errors';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (submitting) return;
    setError(null);

    if (!email.trim()) {
      setError('Enter the email address you signed up with.');
      return;
    }

    setSubmitting(true);
    try {
      await sendPasswordReset(email);
      // Supabase deliberately does not reveal whether an account exists, so we
      // show the same confirmation either way.
      setSent(true);
    } catch (caught) {
      setError(friendlyAuthError(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title={sent ? 'Check your inbox' : 'Reset your password'}
      subtitle={
        sent
          ? `If an account exists for ${email.trim()}, a reset link is on its way.`
          : 'We will email you a link to choose a new password.'
      }
      footer={
        <TextLink
          label="Back to sign in"
          align="center"
          onPress={() => router.replace('/sign-in')}
        />
      }>
      {sent ? (
        <FormMessage
          tone="info"
          message="The link works once and expires after a while. Check spam if it does not arrive within a few minutes."
        />
      ) : (
        <>
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
            returnKeyType="go"
            onSubmitEditing={handleSubmit}
            editable={!submitting}
          />
          {error ? <FormMessage tone="error" message={error} /> : null}
          <Button label="Send reset link" onPress={handleSubmit} loading={submitting} />
        </>
      )}
    </AuthScreen>
  );
}
