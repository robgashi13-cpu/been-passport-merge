import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContext";
import Index from "./pages/Index";
import Calendar from "./pages/Calendar";
import NotFound from "./pages/NotFound";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { useColdSync } from "@/hooks/useColdSync";
import { useDailyAIVerify } from "@/hooks/useDailyAIVerify";

const queryClient = new QueryClient();

// Silent background sync — no UI overlay anymore (the "updating China…" splash is gone).
const BackgroundSync = () => {
  useColdSync();
  useDailyAIVerify();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <UserProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BackgroundSync />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/calendar" element={<Calendar />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </UserProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
