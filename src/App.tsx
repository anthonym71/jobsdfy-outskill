import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, Outlet } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import NewJob from "./pages/NewJob";
import DealbreakersCheck from "./pages/DealbreakersCheck";
import FastDecision from "./pages/FastDecision";
import QuickApply from "./pages/QuickApply";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import Settings from "./pages/Settings";
import Pricing from "./pages/Pricing";
import Support from "./pages/Support";
import AdminHelpdesk from "./pages/AdminHelpdesk";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return <Outlet />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route element={<AppLayout />}>
                <Route path="/app" element={<Dashboard />} />
                <Route path="/app/new-job" element={<NewJob />} />
                <Route path="/app/dealbreakers/:id" element={<DealbreakersCheck />} />
                <Route path="/app/decision/:id" element={<FastDecision />} />
                <Route path="/app/apply/:id" element={<QuickApply />} />
                <Route path="/app/jobs" element={<Jobs />} />
                <Route path="/app/jobs/:id" element={<JobDetail />} />
                <Route path="/app/settings" element={<Settings />} />
                <Route path="/app/pricing" element={<Pricing />} />
                <Route path="/app/support" element={<Support />} />
                <Route path="/app/admin" element={<AdminHelpdesk />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
