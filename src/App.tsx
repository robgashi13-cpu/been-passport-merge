import { Component, lazy, Suspense, useEffect, type ReactNode } from "react";
import { BrowserRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hub/auth";
import { AppShell, Protected } from "@/hub/AppShell";
import { Dashboard } from "@/hub/Dashboard";
import { ResetPassword } from "@/hub/Login";
import { Splash } from "@/hub/Splash";
import { Toaster } from "@/components/ui/sonner";

const WorldApp = lazy(() => import("@/wi/App"));
const TravelApp = lazy(() => import("@/travel/TravelApp"));
const CamerasApp = lazy(() => import("@/cameras/CamerasApp"));
const TvApp = lazy(() => import("@/tv/TvApp"));
const queryClient = new QueryClient();

const TITLES: Record<string, string> = { "/": "Dashboard", "/world": "World News", "/travel": "Travel", "/cameras": "Cameras", "/tv": "TV" };
function TitleSync() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = `${TITLES[pathname] ?? "WanderPass"} · WanderPass`;
  }, [pathname]);
  return null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  override state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  override componentDidCatch(error: Error) {
    console.error(error);
  }
  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="hq-ambient flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-foreground">This page didn't load</h1>
          <p className="mt-2 text-sm text-muted-foreground">Something went wrong. Try again or head back to the dashboard.</p>
          <div className="mt-6 flex justify-center gap-2">
            <button onClick={() => location.reload()} className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black">Try again</button>
            <a href="/" className="rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-foreground">Dashboard</a>
          </div>
        </div>
      </div>
    );
  }
}

function NotFound() {
  return (
    <div className="hq-ambient flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">This page doesn't exist.</p>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-white px-5 py-2 text-sm font-medium text-black">Back to dashboard</Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <TitleSync />
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Protected><AppShell><Dashboard /></AppShell></Protected>} />
              <Route
                path="/world"
                element={
                  <Protected>
                    <AppShell flush>
                      <Suspense fallback={<Splash label="Loading World News" />}>
                        <WorldApp />
                      </Suspense>
                    </AppShell>
                  </Protected>
                }
              />
              <Route
                path="/travel"
                element={
                  <Protected>
                    <AppShell>
                      <Suspense fallback={<Splash label="Loading Travel" />}>
                        <TravelApp />
                      </Suspense>
                    </AppShell>
                  </Protected>
                }
              />
              <Route
                path="/cameras"
                element={
                  <Protected>
                    <AppShell>
                      <Suspense fallback={<Splash label="Loading Cameras" />}>
                        <CamerasApp />
                      </Suspense>
                    </AppShell>
                  </Protected>
                }
              />
              <Route
                path="/tv"
                element={
                  <Protected>
                    <AppShell>
                      <Suspense fallback={<Splash label="Loading TV" />}>
                        <TvApp />
                      </Suspense>
                    </AppShell>
                  </Protected>
                }
              />
              {/* old WanderPass route */}
              <Route path="/calendar" element={<Protected><AppShell><Suspense fallback={<Splash label="Loading Travel" />}><TravelApp /></Suspense></AppShell></Protected>} />
              <Route path="/reset" element={<ResetPassword />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
      <Toaster theme="dark" position="top-center" />
    </QueryClientProvider>
  );
}
