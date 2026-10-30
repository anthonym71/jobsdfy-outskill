import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
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
import OnboardingGuard from "./components/OnboardingGuard";
import BooksPage from "./pages/BooksPage";
import MoviesPage from "./pages/MoviesPage";
import MemoryDumpPage from "./pages/MemoryDumpPage";
import SocialMediaPage from "./pages/SocialMediaPage";
import AssessmentsPage from "./pages/AssessmentsPage";
import AutobiographyPage from "./pages/AutobiographyPage";
import InterviewPage from "./pages/InterviewPage";
import TrainingPage from "./pages/TrainingPage";
import AffiliateTerms from "./pages/AffiliateTerms";
import SlugRedirect from "./pages/SlugRedirect";
import PhotoGalleryPage from "./pages/PhotoGalleryPage";
import EventsPage from "./pages/EventsPage";
import CompanyPage from "./pages/CompanyPage";
import EventRegistrationsPage from "./pages/EventRegistrationsPage";
import Terms from "./pages/Terms";
import TermsGate from "./components/TermsGate";

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
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/r/:slug" element={<SlugRedirect type="ref" />} />
            <Route path="/a/:slug" element={<SlugRedirect type="aff" />} />
            <Route path="/affiliate-terms" element={<AffiliateTerms />} />
            <Route path="/terms" element={<Terms />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<TermsGate />}>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route element={<OnboardingGuard />}>
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
                  <Route path="/app/books" element={<BooksPage />} />
                  <Route path="/app/movies" element={<MoviesPage />} />
                  <Route path="/app/memory-dump" element={<MemoryDumpPage />} />
                  <Route path="/app/social-media" element={<SocialMediaPage />} />
                  <Route path="/app/assessments" element={<AssessmentsPage />} />
                  <Route path="/app/autobiography" element={<AutobiographyPage />} />
                  <Route path="/app/photo-gallery" element={<PhotoGalleryPage />} />
                  <Route path="/app/interview" element={<InterviewPage />} />
                  <Route path="/app/training" element={<TrainingPage />} />
                  <Route path="/app/events" element={<EventsPage />} />
                  <Route path="/app/companies" element={<CompanyPage />} />
                  <Route path="/app/event-registrations" element={<EventRegistrationsPage />} />
                </Route>
              </Route>
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
