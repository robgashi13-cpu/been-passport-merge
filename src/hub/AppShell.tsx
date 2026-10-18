import { Link, useLocation } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutGrid,
  Globe2,
  Plane,
  CarFront,
  ArrowUpRight,
  LogOut,
  Plus,
} from "lucide-react";
import { useAuth } from "./auth";
import { Logo } from "./Logo";
import { LoginScreen, AccessDenied } from "./Login";
import { Splash } from "./Splash";
import { fmtTime, useNow } from "./clock";

export const KORAUTO_URL = "https://korautomanager.biz";

const TABS = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/world", label: "World News", icon: Globe2 },
  { to: "/travel", label: "Travel", icon: Plane },
] as const;

/** Client-only gate: login → allowlist → content. Nothing private renders before both pass. */
export function Protected({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { ready, session, allowed, user, signOut } = useAuth();
  if (!mounted || !ready) return <Splash />;
  if (!session) return <LoginScreen />;
  if (allowed === null) return <Splash label="Checking access" />;
  if (!allowed)
    return (
      <AccessDenied
        email={user?.email ?? null}
        onSignOut={() => void signOut()}
      />
    );
  return <>{children}</>;
}

function TopClock() {
  const now = useNow(15000);
  return (
    <div
      className="hidden items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 sm:flex"
      title="Kosovo time (Europe/Belgrade)"
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        PRN
      </span>
      <span className="hq-num text-[13px] text-white">{fmtTime(now)}</span>
    </div>
  );
}

export function AppShell({
  children,
  flush = false,
}: {
  children: ReactNode;
  flush?: boolean;
}) {
  const path = useLocation().pathname;
  const { user, signOut } = useAuth();
  const [menu, setMenu] = useState(false);
  const initial = (user?.email || "R").charAt(0).toUpperCase();

  return (
    <div className={flush ? "" : "hq-ambient min-h-[100dvh]"}>
      <header
        className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#07080a]/85 backdrop-blur-xl"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-2 px-3 sm:gap-4 sm:px-5">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2.5"
            aria-label="WanderPass home"
          >
            <Logo size={30} />
            <span className="hidden font-display text-[15px] font-semibold tracking-tight text-white md:inline">
              WanderPass
            </span>
          </Link>
          <nav className="no-scrollbar -mx-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1 md:justify-center">
            {TABS.map((t) => {
              const active =
                t.to === "/" ? path === "/" : path.startsWith(t.to);
              const Icon = t.icon;
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    active
                      ? "bg-white text-black"
                      : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className={active ? "" : "hidden min-[420px]:inline"}>
                    {t.label}
                  </span>
                </Link>
              );
            })}
            <a
              href={KORAUTO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
              title="Open KORAUTO Manager"
            >
              <CarFront className="h-4 w-4" />
              <span className="hidden min-[420px]:inline">KORAUTO</span>
              <ArrowUpRight className="h-3 w-3 opacity-60" />
            </a>
            <span
              className="hidden shrink-0 items-center gap-1 rounded-full border border-dashed border-white/10 px-3 py-1.5 text-[12px] text-white/35 lg:flex"
              title="Slot for future projects"
            >
              <Plus className="h-3.5 w-3.5" /> More soon
            </span>
          </nav>
          <TopClock />
          <div className="relative shrink-0">
            <button
              onClick={() => setMenu((m) => !m)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky to-blue-600 text-[13px] font-semibold text-white ring-1 ring-white/20"
              aria-label="Account"
            >
              {initial}
            </button>
            {menu && (
              <>
                <button
                  className="fixed inset-0 z-40 cursor-default"
                  aria-hidden
                  onClick={() => setMenu(false)}
                />
                <div className="absolute right-0 top-10 z-50 w-60 rounded-2xl border border-white/10 bg-[#0e1116] p-2 shadow-2xl">
                  <div className="truncate px-3 py-2 text-xs text-muted-foreground">
                    {user?.email}
                  </div>
                  <button
                    onClick={() => {
                      setMenu(false);
                      signOut();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white hover:bg-white/[0.06]"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
      <div style={{ paddingTop: "var(--hub-h)" }}>{children}</div>
    </div>
  );
}
