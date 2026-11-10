import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { Sheet } from '@/components/ui/sheet';
import { TextField } from '@/components/ui/text-field';
import { AppText } from '@/components/ui/text';
import { Space } from '@/constants/theme';

import { upgradeGuestAccount } from '../api';
import { friendlyAuthError } from '../errors';
import { profileKeys } from '../keys';

type UpgradeAccountSheetProps = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Turns the current guest into a real account.
 *
 * The guest keeps their user id, so every task, habit and journal entry stays
 * exactly where it is. Nothing is copied and there is no "import" step.
 */
export function UpgradeAccountSheet({ visible, onClose }: UpgradeAccountSheetProps) {
  const queryClient = useQueryClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  /** Set when Supabase wants the email confirmed before the account is final. */
  const [awaitingEmail, setAwaitingEmail] = useState<string | null>(null);

  function reset() {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setError(null);
    setSubmitting(false);
    setAwaitingEmail(null);
  }

  async function handleSubmit() {
    if (submitting) return;
    setError(null);

    if (!email.trim()) {
      setError('Enter an email address.');
      return;
    }
    if (password.length < 8) {
      setError('Choose a password with at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const { user } = await upgradeGuestAccount({
        email,
        password,
        displayName: displayName.trim() || undefined,
      });

      // The display name may have changed, so refresh the profile row.
      await queryClient.invalidateQueries({ queryKey: profileKeys.all });

      // With "Confirm email" on (the default) the address is not verified yet:
      // explain that a link is on its way instead of pretending it is done.
      if (user?.email_confirmed_at) {
        reset();
        onClose();
      } else {
        setAwaitingEmail(email.trim());
        setSubmitting(false);
      }
    } catch (caught) {
      setError(friendlyAuthError(caught));
      setSubmitting(false);
    }
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Sheet
      visible={visible}
      onClose={handleClose}
      title={awaitingEmail ? 'Check your inbox' : 'Create your account'}
      subtitle={
        awaitingEmail
          ? 'One click and your progress belongs to a real account.'
          : 'Everything you have added so far comes with you.'
      }
      footer={
        awaitingEmail ? (
          <Button label="Done" onPress={handleClose} />
        ) : (
          <View style={{ gap: Space.sm }}>
            <Button
              label="Create account"
              onPress={() => void handleSubmit()}
              loading={submitting}
            />
            <Button
              label="Not now"
              variant="quiet"
              onPress={handleClose}
              fullWidth
              accessibilityHint="Keeps using Pace as a guest."
            />
          </View>
        )
      }>
      {awaitingEmail ? (
        <View style={{ gap: Space.sm }}>
          <AppText variant="body">
            We sent a confirmation link to <AppText variant="bodyStrong">{awaitingEmail}</AppText>.
            Open it on this device or any other, then sign in with the password you just chose.
          </AppText>
          <AppText variant="small" tone="secondary">
            Until you confirm, you are still signed in as a guest and nothing is lost. If the email
            does not arrive in a few minutes, check your spam folder.
          </AppText>
        </View>
      ) : (
        <View style={{ gap: Space.lg }}>
          <TextField
            label="Your name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Optional — replaces “Guest”"
            autoCapitalize="words"
            maxLength={80}
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
            onSubmitEditing={() => void handleSubmit()}
            hint="Used to sign in on your other devices."
            editable={!submitting}
          />

          {error ? <FormMessage tone="error" message={error} /> : null}
        </View>
      )}
    </Sheet>
  );
}
