import { Component, lazy, Suspense, useEffect, type ReactNode } from "react";
import { BrowserRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hub/auth";
import { AppShell, Protected, TITLES } from "@/hub/AppShell";
import { Dashboard } from "@/hub/Dashboard";
import { ResetPassword } from "@/hub/Login";
import { Splash } from "@/hub/Splash";
import { Button } from "@/components/ui/button";
import { Logo } from "@/hub/Logo";
import { Toaster } from "@/components/ui/sonner";

const WorldApp = lazy(() => import("@/wi/App"));
const TravelApp = lazy(() => import("@/travel/TravelApp"));
const CamerasApp = lazy(() => import("@/cameras/CamerasApp"));
const TvApp = lazy(() => import("@/tv/TvApp"));
const KorautoPage = lazy(() => import("@/korauto/KorautoPage"));
const KorautoksApp = lazy(() => import("@/korautoks/KorautoksApp"));
const queryClient = new QueryClient();

function TitleSync() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = `${TITLES[pathname] ?? "HQ"} · HQ`;
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
      <div className="hq-ambient flex min-h-dvh items-center justify-center px-4">
        <div className="glass hq-card fade-scale-in max-w-md p-8 text-center">
          <Logo size={48} className="mx-auto mb-6" /><h1 className="t-title2 text-foreground">This page didn't load</h1>
          <p className="mt-2 text-sm text-muted-foreground">Something went wrong. Try again or head back to the dashboard.</p>
          <div className="mt-6 flex justify-center gap-2">
            <Button onClick={() => location.reload()}>Try again</Button>
            <Button variant="secondary" asChild><a href="/">Dashboard</a></Button>
          </div>
        </div>
      </div>
    );
  }
}

function NotFound() {
  return (
    <div className="hq-ambient flex min-h-dvh items-center justify-center px-4">
      <div className="glass hq-card fade-scale-in max-w-md p-8 text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">This page doesn't exist.</p>
        <Button className="mt-6" asChild><Link to="/">Back to dashboard</Link></Button>
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
              <Route path="/korauto" element={<Protected><AppShell><Suspense fallback={<Splash label="Loading KORAUTO" />}><KorautoPage /></Suspense></AppShell></Protected>} />
              <Route path="/korautoks" element={<Protected><AppShell><Suspense fallback={<Splash label="Loading korautoks.com" />}><KorautoksApp /></Suspense></AppShell></Protected>} />
              {/* old HQ route */}
              <Route path="/calendar" element={<Protected><AppShell><Suspense fallback={<Splash label="Loading Travel" />}><TravelApp /></Suspense></AppShell></Protected>} />
              <Route path="/reset" element={<ResetPassword />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
      <Toaster theme="system" position="top-center" />
    </QueryClientProvider>
  );
}
