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
import { Button } from "@/components/ui/button";

export const KORAUTO_URL = "https://korautomanager.biz";

export const TITLES: Record<string, string> = { "/": "Dashboard", "/world": "World News", "/travel": "Travel", "/cameras": "Cameras", "/tv": "TV", "/korauto": "KORAUTO", "/korautoks": "korautoks.com" };

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
      className="glass-thin hidden items-center gap-2 rounded-full px-3 py-1 sm:flex"
      title="Kosovo time (Europe/Belgrade)"
    >
      <span className="text-[10px] font-semibold text-muted-foreground">
        PRN
      </span>
      <span className="hq-num text-[13px] text-foreground">{fmtTime(now)}</span>
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
  const tabsRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
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
      if (reducedMotion) { el.style.transform = ""; el.style.opacity = ""; return; }
      el.style.transition = anim ? "transform 420ms var(--ease-spring), opacity 280ms" : "none";
      el.style.transform = x ? `translate3d(${x}px,0,0)` : "";
      el.style.opacity = x ? String(1 - Math.min(Math.abs(x) / window.innerWidth, 1) * 0.35) : "";
    };
    let navigationTimer: number | undefined;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
        navigationTimer = window.setTimeout(() => {
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
      window.clearTimeout(navigationTimer);
      el.style.transform = ""; el.style.opacity = "";
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", end);
    };
  }, [tabIndex, navigate]);
  const [menu, setMenu] = useState(false);
  const initial = (user?.email || "R").charAt(0).toUpperCase();
  const title = TITLES[path] ?? "Travel";
  useEffect(() => {
    const track = tabsRef.current;
    const active = track?.querySelector<HTMLElement>('a[aria-current="page"]');
    const indicator = indicatorRef.current;
    if (!track || !active || !indicator) return;
    const position = () => {
      indicator.style.width = `${active.offsetWidth}px`;
      indicator.style.transform = `translateX(${active.offsetLeft}px)`;
    };
    position();
    active.scrollIntoView({ inline: "center", block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    const observer = new ResizeObserver(position);
    observer.observe(track);
    return () => observer.disconnect();
  }, [path]);
  useEffect(() => {
    const element = titleRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      shellRef.current?.style.setProperty("--collapsed", entry.isIntersecting ? "0" : "1");
    }, { rootMargin: "-44px 0px 0px 0px", threshold: .15 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [path]);
  useEffect(() => {
    if (!menu) return;
    const close = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) setMenu(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setMenu(false); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, [menu]);

  return (
    <div ref={shellRef} className={`hq-ambient min-h-[100dvh] ${flush ? "hq-flush" : ""}`}>
      <header className="hq-navigation glass-strong">
        <div className="hq-navigation-inner">
          <Link to="/" className="press shrink-0" aria-label="HQ home"><Logo size={28} /></Link>
          <span className="hq-compact-title t-headline">{title}</span>
          <div className="flex items-center gap-3">
            <TopClock />
            <div ref={menuRef} className="relative">
              <Button onClick={() => setMenu((m) => !m)} className="hq-avatar" aria-label="Account" aria-expanded={menu} aria-controls="hq-account-menu" variant="secondary">{initial}</Button>
              {menu && (
                <div id="hq-account-menu" className="hq-account-menu glass-strong fade-scale-in">
                  <div className="truncate px-3 py-3 text-xs text-muted-foreground">{user?.email}</div>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => { setMenu(false); void signOut(); }}><LogOut className="h-4 w-4" /> Sign out</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <div className="overflow-x-clip">
        <div ref={contentRef} className="hq-shell-content">
          <div ref={titleRef} className="hq-large-header"><h1 className="t-large-title transition-[transform,opacity] duration-300">{title}</h1></div>
          <div key={path} className="page-in">{children}</div>
        </div>
      </div>
      <nav className="hq-tabbar glass-strong" aria-label="Main navigation" data-no-swipe>
        <div className="hq-tab-scroll no-scrollbar">
          <div ref={tabsRef} className="hq-tab-track">
            <div ref={indicatorRef} className="hq-tab-indicator" aria-hidden="true" />
            {TABS.map((t) => {
              const active = t.to === "/" ? path === "/" : path === t.to || path.startsWith(t.to + "/");
              const Icon = t.icon;
              const prefetch = () => { if (t.to === "/cameras") void import("@/cameras/CamerasApp"); if (t.to === "/tv") void import("@/tv/TvApp"); };
              return <Link key={t.to} to={t.to} aria-label={t.label} aria-current={active ? "page" : undefined} title={t.label} onPointerEnter={prefetch} onFocus={prefetch} className="hq-tab-link"><Icon /><span className="hq-tab-label">{t.label}</span></Link>;
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
