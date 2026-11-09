/**
 * Turns Supabase's raw error objects into sentences a person can act on.
 * Supabase already speaks English, but messages like "Invalid login credentials"
 * or "Email not confirmed" need a next step attached.
 */

type ErrorLike = { message?: string; code?: string; status?: number };

function readError(error: unknown): { message: string; code: string; status?: number } {
  if (typeof error === 'string') {
    return { message: error, code: '' };
  }
  const value = (error ?? {}) as ErrorLike;
  return {
    message: value.message ?? '',
    code: value.code ?? '',
    status: value.status,
  };
}

export function friendlyAuthError(error: unknown): string {
  const { message, code, status } = readError(error);
  const text = `${code} ${message}`.toLowerCase();

  if (text.includes('invalid login credentials')) {
    return 'That email and password do not match. Try again, or reset your password.';
  }
  if (text.includes('email not confirmed')) {
    return 'Please confirm your email first — we sent you a link when you signed up.';
  }
  if (text.includes('already registered') || text.includes('user_already_exists')) {
    return 'An account with that email already exists. Sign in instead.';
  }
  if (text.includes('weak_password') || text.includes('password should be at least')) {
    return 'Choose a stronger password — at least 8 characters.';
  }
  if (text.includes('over_email_send_rate_limit') || text.includes('rate limit')) {
    return 'Too many emails in a short time. Wait a minute, then try again.';
  }
  if (text.includes('same_password')) {
    return 'That is already your password. Pick a different one.';
  }
  if (text.includes('session_not_found') || text.includes('invalid refresh token')) {
    return 'Your link has expired. Request a new one and try again.';
  }
  if (text.includes('failed to fetch') || text.includes('network')) {
    return 'Could not reach the server. Check your internet connection and try again.';
  }
  if (text.includes('password') && text.includes('least')) {
    return 'Choose a stronger password — at least 8 characters.';
  }
  if (status === 0 || message === '') {
    return 'Something went wrong. Please try again.';
  }

  // Unknown error: show Supabase's text, it is usually still informative.
  return message;
}

/** Errors from PostgREST/Postgres rather than auth. */
export function friendlyDataError(error: unknown): string {
  const { message, code } = readError(error);
  if (code === '23505') return 'That item already exists.';
  if (code === '23503') return 'That item is linked to something else.';
  if (code === '42501' || /row-level security/i.test(message)) {
    return 'You do not have access to that. Try signing in again.';
  }
  if (/failed to fetch|network/i.test(message)) {
    return 'Could not reach the server. Check your internet connection and try again.';
  }
  return message || 'Something went wrong. Please try again.';
}
