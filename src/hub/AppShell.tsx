import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  LayoutGrid,
  Globe2,
  Plane,
  CarFront,
  LogOut,
  Cctv,
  Tv,
  Search,
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
  { to: "/cameras", label: "Cameras", icon: Cctv },
  { to: "/tv", label: "TV", icon: Tv },
  { to: "/korauto", label: "KORAUTO", icon: CarFront },
  { to: "/korautoks", label: "korautoks.com", icon: Search },
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
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const tabIndex = TABS.findIndex((t) => (t.to === "/" ? path === "/" : path === t.to || path.startsWith(t.to + "/")));

  // Apple-style horizontal swipe between tabs: content follows the finger, then springs.
  useEffect(() => {
    const el = contentRef.current;
    if (!el || tabIndex < 0) return;
    let sx = 0, sy = 0, dx = 0, mode: "none" | "h" | "v" = "none", t0 = 0, active = false;
    const blocked = (t: EventTarget | null) => {
      let n = t as HTMLElement | null;
      while (n && n !== el) {
        if (n.matches?.("input,textarea,select,canvas,video,iframe,[data-no-swipe],[role=dialog],[role=slider]")) return true;
        const cs = getComputedStyle(n);
        if ((cs.overflowX === "auto" || cs.overflowX === "scroll") && n.scrollWidth > n.clientWidth + 2) return true;
        n = n.parentElement;
      }
      return false;
    };
    const set = (x: number, anim: boolean) => {
      el.style.transition = anim ? "transform .38s cubic-bezier(.22,1,.36,1), opacity .38s" : "none";
      el.style.transform = x ? `translate3d(${x}px,0,0)` : "";
      el.style.opacity = x ? String(1 - Math.min(Math.abs(x) / window.innerWidth, 1) * 0.35) : "";
    };
    const start = (e: TouchEvent) => {
      if (e.touches.length !== 1 || blocked(e.target)) { active = false; return; }
      active = true; mode = "none"; dx = 0; t0 = performance.now();
      sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    };
    const move = (e: TouchEvent) => {
      if (!active) return;
      const x = e.touches[0].clientX - sx, y = e.touches[0].clientY - sy;
      if (mode === "none") {
        if (Math.abs(x) < 10 && Math.abs(y) < 10) return;
        mode = Math.abs(x) > Math.abs(y) * 1.4 ? "h" : "v";
      }
      if (mode !== "h") return;
      e.preventDefault();
      const edge = (x > 0 && tabIndex === 0) || (x < 0 && tabIndex === TABS.length - 1);
      dx = edge ? x * 0.25 : x; // rubber-band at the ends
      set(dx, false);
    };
    const end = () => {
      if (!active || mode !== "h") { active = false; return; }
      active = false;
      const w = window.innerWidth;
      const fast = Math.abs(dx) / Math.max(performance.now() - t0, 1) > 0.5 && Math.abs(dx) > 40;
      const next = dx < 0 ? tabIndex + 1 : tabIndex - 1;
      if ((Math.abs(dx) > w * 0.28 || fast) && next >= 0 && next < TABS.length) {
        const dir = dx < 0 ? -1 : 1;
        set(dir * w * 0.6, true);
        window.setTimeout(() => {
          navigate(TABS[next].to);
          set(-dir * w * 0.35, false);
          requestAnimationFrame(() => requestAnimationFrame(() => set(0, true)));
        }, 160);
      } else set(0, true);
    };
    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", end);
    el.addEventListener("touchcancel", end);
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", end);
    };
  }, [tabIndex, navigate]);
  const [menu, setMenu] = useState(false);
  const initial = (user?.email || "R").charAt(0).toUpperCase();
  // On narrow screens the tab row scrolls; keep the active tab in view.
  useEffect(() => {
    document.querySelector('header nav a[aria-current="page"]')?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [path]);

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
            aria-label="HQ home"
          >
            <Logo size={30} />
            <span className="hidden font-display text-[15px] font-semibold tracking-tight text-white md:inline">
              HQ
            </span>
          </Link>
          <nav className="no-scrollbar -mx-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1 md:justify-center">
            {TABS.map((t) => {
              const active =
                t.to === "/" ? path === "/" : path === t.to || path.startsWith(t.to + "/");
              const Icon = t.icon;
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  aria-current={active ? "page" : undefined}
                  title={t.label}
                  onPointerEnter={() => {
                    if (t.to === "/cameras") void import("@/cameras/CamerasApp");
                    if (t.to === "/tv") void import("@/tv/TvApp");
                  }}
                  onFocus={() => {
                    if (t.to === "/cameras") void import("@/cameras/CamerasApp");
                    if (t.to === "/tv") void import("@/tv/TvApp");
                  }}
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
      <div className="overflow-x-clip"><div ref={contentRef} style={{ paddingTop: "var(--hub-h)", touchAction: "pan-y" }}>{children}</div></div>
    </div>
  );
}
