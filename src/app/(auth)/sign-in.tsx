import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, TextLink } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { TextField } from '@/components/ui/text-field';
import { AppText } from '@/components/ui/text';
import { Space } from '@/constants/theme';
import { signInWithPassword } from '@/features/auth/api';
import { AuthScreen } from '@/features/auth/components/auth-screen';
import { friendlyAuthError } from '@/features/auth/errors';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSignIn() {
    if (submitting) return;
    setError(null);

    if (!email.trim()) {
      setError('Enter your email address.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      await signInWithPassword({ email, password });
      // On success the auth guard in the root layout takes over and moves the
      // user to onboarding or Today. Nothing else to do here.
    } catch (caught) {
      setError(friendlyAuthError(caught));
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title="Welcome back"
      subtitle="Sign in to pick up where you left off."
      footer={
        <View style={{ alignItems: 'center', gap: Space.xxs }}>
          <AppText variant="small" tone="secondary">
            New to Pace?
          </AppText>
          <TextLink
            label="Create an account"
            align="center"
            onPress={() => router.push('/sign-up')}
          />
        </View>
      }>
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

      <View>
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
          secure
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleSignIn}
          editable={!submitting}
        />
        <TextLink
          label="Forgot your password?"
          align="right"
          onPress={() => router.push('/forgot-password')}
        />
      </View>

      {error ? <FormMessage tone="error" message={error} /> : null}

      <Button label="Sign in" onPress={handleSignIn} loading={submitting} />
    </AuthScreen>
  );
}
