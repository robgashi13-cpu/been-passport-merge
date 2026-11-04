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

/** Resolve to `fallback` if `p` hasn't settled within `ms` (never blocks first render on the network). */
export function withTimeout<T>(p: PromiseLike<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    Promise.resolve(p).catch(() => fallback),
    new Promise<T>((r) => setTimeout(() => r(fallback), ms)),
  ]);
}
const ALLOW_KEY = "hq-allowed:";
const NET_MS = 5000;

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
    // OAuth (Apple) redirects back with tokens in the URL hash; the client has
    // detectSessionInUrl disabled, so store them here before hydrating.
    const hydrate = async () => {
      const h = new URLSearchParams(window.location.hash.slice(1));
      const access_token = h.get("access_token");
      const refresh_token = h.get("refresh_token");
      if (access_token && refresh_token && window.location.pathname !== "/reset") {
        await withTimeout(supabase.auth.setSession({ access_token, refresh_token }), NET_MS, null);
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
      const { data } = await withTimeout(
        supabase.auth.getSession(),
        NET_MS,
        { data: { session: null }, error: null } as Awaited<ReturnType<typeof supabase.auth.getSession>>,
      );
      if (!alive) return;
      setSession(data.session);
      setWiToken(data.session?.access_token ?? null);
      setReady(true);
    };
    void hydrate();
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
    // Last known allowlist result renders instantly; the server check re-validates in
    // the background (RLS still guards all data). A hung check retries instead of
    // leaving the app on the splash forever.
    let cached: string | null = null;
    try { cached = localStorage.getItem(ALLOW_KEY + uid); } catch { /* private mode */ }
    setAllowed(cached === "1" ? true : null);
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Slow/unreachable backend: don't hold the shell hostage. Render provisionally
    // (data is still RLS-protected); an explicit "not allowed" answer flips to AccessDenied.
    const provisional = setTimeout(() => alive && setAllowed((a) => (a === null ? true : a)), 2500);
    const check = () => {
      void withTimeout(
        (supabase.rpc as any)("is_allowed") as PromiseLike<{ data: boolean | null; error: unknown }>,
        NET_MS,
        null,
      ).then((res) => {
        if (!alive) return;
        if (!res || res.error) {
          // Network/timeout: keep the cached answer, try again shortly.
          timer = setTimeout(check, NET_MS);
          return;
        }
        clearTimeout(provisional);
        const ok = res.data === true;
        try { localStorage.setItem(ALLOW_KEY + uid, ok ? "1" : "0"); } catch { /* ignore */ }
        setAllowed(ok);
      });
    };
    check();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      clearTimeout(provisional);
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
