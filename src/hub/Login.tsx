import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Logo } from "./Logo";
import { Loader2, Lock } from "lucide-react";

export function LoginScreen() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "err" | "ok"; text: string } | null>(
    null,
  );

  async function apple() {
    setBusy(true);
    setMsg(null);
    try {
      const r: any = await lovable.auth.signInWithOAuth("apple", { redirect_uri: window.location.origin });
      if (r?.error) throw r.error;
      if (r?.redirected) return; // keep spinner while the browser leaves
      setBusy(false);
    } catch (err: any) {
      setMsg({ kind: "err", text: err?.message || "Apple sign-in failed" });
      setBusy(false);
    }
  }

  async function forgot() {
    const em = email.trim().toLowerCase();
    if (!em) return setMsg({ kind: "err", text: "Enter your email first." });
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.resetPasswordForEmail(em, { redirectTo: `${window.location.origin}/reset` });
    setBusy(false);
    setMsg(error ? { kind: "err", text: error.message } : { kind: "ok", text: "If that account exists, a reset link is on its way." });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const em = email.trim().toLowerCase();
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({
          email: em,
          password,
        });
        if (error) throw error;
      } else {
        const { data: ok } = await (supabase.rpc as any)("email_is_allowed", {
          p_email: em,
        });
        if (ok !== true)
          throw new Error(
            "This hub is private. That email is not on the allowlist.",
          );
        const { data, error } = await supabase.auth.signUp({
          email: em,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session)
          setMsg({
            kind: "ok",
            text: "Account created. Check your inbox to confirm, then sign in.",
          });
      }
    } catch (err: any) {
      setMsg({ kind: "err", text: err?.message || "Something went wrong" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="hq-ambient fixed inset-0 flex items-center justify-center overflow-y-auto px-5 py-10">
      <div className="hq-rise w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={56} />
          <h1 className="mt-5 text-3xl font-semibold text-white">HQ</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Private hub · Dashboard · World News · Travel
          </p>
        </div>
        <form onSubmit={submit} className="hq-card space-y-4 p-6">
          <div className="space-y-1.5">
            <label className="hq-label" htmlFor="em">
              Email
            </label>
            <input
              id="em"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition focus:border-sky/60 focus:bg-white/[0.06]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="hq-label" htmlFor="pw">
              Password
            </label>
            <input
              id="pw"
              type="password"
              autoComplete={mode === "in" ? "current-password" : "new-password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition focus:border-sky/60 focus:bg-white/[0.06]"
            />
          </div>
          {msg && (
            <p
              className={`rounded-lg px-3 py-2 text-sm ${msg.kind === "err" ? "bg-destructive/10 text-red-300" : "bg-emerald-500/10 text-emerald-300"}`}
            >
              {msg.text}
            </p>
          )}
          <button
            disabled={busy}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white font-medium text-black transition hover:bg-white/90 disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            {mode === "in" ? "Sign in" : "Create account"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "in" ? "up" : "in");
              setMsg(null);
            }}
            className="w-full text-center text-xs text-muted-foreground transition hover:text-white"
          >
            {mode === "in"
              ? "First time here? Create your account"
              : "Already have an account? Sign in"}
          </button>
          {mode === "in" && (
            <button
              type="button"
              onClick={() => void forgot()}
              className="w-full text-center text-xs text-muted-foreground transition hover:text-white"
            >
              Forgot password?
            </button>
          )}
          <div className="flex items-center gap-3 py-1 text-[11px] uppercase tracking-[0.14em] text-white/30">
            <span className="h-px flex-1 bg-white/10" />or<span className="h-px flex-1 bg-white/10" />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void apple()}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-black font-medium text-white transition hover:bg-white/[0.06] disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M16.37 1.43c0 1.14-.42 2.2-1.25 3.03-.9.9-1.98 1.42-3.15 1.33-.15-1.1.4-2.24 1.2-3.05.88-.9 2.12-1.43 3.2-1.31ZM20.5 17.1c-.55 1.27-.82 1.84-1.53 2.96-.99 1.56-2.39 3.5-4.12 3.51-1.54.02-1.93-1-4.02-.99-2.09.01-2.52 1.01-4.06.99-1.73-.02-3.05-1.77-4.04-3.33C-.04 15.88-.33 10.8 1.42 8.1c1.24-1.92 3.2-3.05 5.04-3.05 1.88 0 3.06 1.03 4.61 1.03 1.51 0 2.43-1.03 4.6-1.03 1.64 0 3.38.9 4.62 2.44-4.06 2.22-3.4 8.02.21 9.61Z"/></svg>
            Continue with Apple
          </button>
        </form>
        <p className="mt-6 text-center text-[11px] text-muted-foreground/70">
          Only allowlisted accounts can open this hub.
        </p>
      </div>
    </div>
  );
}

export function AccessDenied({
  email,
  onSignOut,
}: {
  email?: string | null;
  onSignOut: () => void;
}) {
  return (
    <div className="hq-ambient fixed inset-0 flex items-center justify-center px-5">
      <div className="hq-card hq-rise max-w-sm p-8 text-center">
        <Logo size={44} className="mx-auto" />
        <h1 className="mt-5 text-xl font-semibold text-white">Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {email ? (
            <>
              <span className="text-white">{email}</span> is not allowed to open
              HQ.
            </>
          ) : (
            "This account is not allowed to open HQ."
          )}
        </p>
        <button
          onClick={onSignOut}
          className="mt-6 h-11 w-full rounded-xl bg-white font-medium text-black hover:bg-white/90"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

/** Password reset landing page (/reset): reads the recovery tokens from the link and sets a new password. */
export function ResetPassword() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "err" | "ok"; text: string } | null>(null);
  const [ready, setReady] = useState<boolean | null>(null);
  useEffect(() => {
    const h = new URLSearchParams(window.location.hash.slice(1));
    const access_token = h.get("access_token");
    const refresh_token = h.get("refresh_token");
    if (access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
        setReady(!error);
        history.replaceState(null, "", "/reset");
      });
    } else {
      supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    }
  }, []);
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setMsg({ kind: "err", text: error.message });
    window.location.replace("/");
  }
  return (
    <div className="hq-ambient fixed inset-0 flex items-center justify-center px-5">
      <form onSubmit={save} className="hq-card hq-rise w-full max-w-sm space-y-4 p-6">
        <Logo size={44} className="mx-auto" />
        <h1 className="text-center text-xl font-semibold text-white">Set a new password</h1>
        {ready === false ? (
          <p className="text-center text-sm text-muted-foreground">This reset link is invalid or expired. Request a new one from the login screen.</p>
        ) : (
          <>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password (min 8 characters)"
              className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-white outline-none focus:border-sky/60"
            />
            {msg && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-red-300">{msg.text}</p>}
            <button disabled={busy || !ready} className="flex h-12 w-full items-center justify-center rounded-xl bg-white font-medium text-black disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save password"}
            </button>
          </>
        )}
        <a href="/" className="block text-center text-xs text-muted-foreground hover:text-white">Back to sign in</a>
      </form>
    </div>
  );
}
