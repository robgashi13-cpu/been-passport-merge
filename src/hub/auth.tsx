import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { setWiToken } from "@/wi/api";

type AuthState = {
  ready: boolean;
  session: Session | null;
  user: User | null;
  /** null = still checking, true/false = allowlist result */
  allowed: boolean | null;
  signOut: () => Promise<void>;
  token: string | null;
};

const Ctx = createContext<AuthState>({
  ready: false,
  session: null,
  user: null,
  allowed: null,
  token: null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    // Listener first, then hydrate the stored session.
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      if (!alive) return;
      setSession(s);
      setWiToken(s?.access_token ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setWiToken(data.session?.access_token ?? null);
      setReady(true);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const uid = session?.user?.id;
  useEffect(() => {
    let alive = true;
    if (!uid) {
      setAllowed(null);
      return;
    }
    setAllowed(null);
    // Server-side allowlist check (security definer function on public.allowed_emails).
    (supabase.rpc as any)("is_allowed").then(
      ({ data, error }: { data: boolean | null; error: unknown }) => {
        if (alive) setAllowed(!error && data === true);
      },
    );
    return () => {
      alive = false;
    };
  }, [uid]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setWiToken(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      ready,
      session,
      user: session?.user ?? null,
      allowed,
      signOut,
      token: session?.access_token ?? null,
    }),
    [ready, session, allowed, signOut],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
