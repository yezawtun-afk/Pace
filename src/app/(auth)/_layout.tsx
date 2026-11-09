import { Stack } from 'expo-router';

/**
 * Signed-out area: sign in, sign up, forgot password. A stack (rather than
 * tabs) so "Create an account" slides over the sign-in screen.
 */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}
