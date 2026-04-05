import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, Outlet, useLocation } from "react-router-dom";
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
import Profile from "./pages/Profile";
import Calendar from "./pages/Calendar";
import Pricing from "./pages/Pricing";
import Support from "./pages/Support";
import AdminHelpdesk from "./pages/AdminHelpdesk";
import AdminUsers from "./pages/AdminUsers";
import PostJob from "./pages/PostJob";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import ExtensionDownload from "./pages/ExtensionDownload";
import RecruiterCandidates from "./pages/RecruiterCandidates";
import Tasks from "./pages/Tasks";
import AdminAuditLog from "./pages/AdminAuditLog";

const queryClient = new QueryClient();

const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }
  if (!user) {
    const returnTo = location.pathname + location.search;
    return <Navigate to={`/auth?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }
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
                <Route path="/app/profile" element={<Profile />} />
                <Route path="/app/calendar" element={<Calendar />} />
                <Route path="/app/pricing" element={<Pricing />} />
                <Route path="/app/support" element={<Support />} />
                <Route path="/app/post-job" element={<PostJob />} />
                <Route path="/app/recruiter/candidates" element={<RecruiterCandidates />} />
                <Route path="/app/admin" element={<AdminHelpdesk />} />
                <Route path="/app/admin/users" element={<AdminUsers />} />
                <Route path="/app/admin/logs" element={<AdminAuditLog />} />
                <Route path="/app/tasks" element={<Tasks />} />
                <Route path="/app/extension" element={<ExtensionDownload />} />
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
