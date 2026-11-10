import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';

type AuthContextValue = {
  session: Session | null;
  /** True when the session belongs to an anonymous (guest) account. */
  isGuest: boolean;
  /** True until the stored session has been read once. */
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Holds the Supabase session for the whole app.
 *
 * - reads the persisted session on launch (AsyncStorage),
 * - keeps it in sync with sign-in / sign-out / token refresh,
 * - clears the TanStack Query cache when the account changes, so one user's
 *   cached rows can never be shown to another user.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const currentUserId = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted) return;
        currentUserId.current = data.session?.user.id ?? null;
        setSession(data.session);
        setIsLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const nextUserId = nextSession?.user.id ?? null;

      if (currentUserId.current !== null && currentUserId.current !== nextUserId) {
        // Different person (or signed out): drop every cached query.
        queryClient.clear();
      }

      currentUserId.current = nextUserId;
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  // Supabase marks anonymous (guest) accounts with `is_anonymous`. It is part
  // of the user object, so an upgrade to a real account flips this to false
  // without any extra bookkeeping on our side.
  const isGuest = session?.user.is_anonymous === true;

  const value = useMemo<AuthContextValue>(
    () => ({ session, isGuest, isLoading }),
    [session, isGuest, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth() must be used inside <AuthProvider>.');
  }
  return context;
}
