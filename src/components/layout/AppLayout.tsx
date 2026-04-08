import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, PlusCircle, Briefcase, Settings, LogOut, Menu, X, CreditCard, HelpCircle, ShieldCheck, Users, UserCircle, CalendarDays, Coins, ListTodo, ClipboardList, Bookmark, Film, Lightbulb, Share2, Brain, Crown, MessageSquare, GraduationCap, Camera, Building2, Ticket } from "lucide-react";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CreditBalance } from "@/components/gamification/CreditWidgets";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";

const baseNavItems: { to: string; icon: any; label: string; end?: boolean }[] = [
  { to: "/app", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/app/new-job", icon: PlusCircle, label: "Check a Job" },
  { to: "/app/jobs", icon: Briefcase, label: "Jobs" },
  { to: "/app/profile", icon: UserCircle, label: "Profile" },
  { to: "/app/events", icon: CalendarDays, label: "Calendar / Events" },
  { to: "/app/tasks", icon: ListTodo, label: "Tasks" },
  { to: "/app/books", icon: Bookmark, label: "Books" },
  { to: "/app/movies", icon: Film, label: "Movies" },
  { to: "/app/memory-dump", icon: Lightbulb, label: "Memory Dump" },
  { to: "/app/social-media", icon: Share2, label: "Social Media Posts" },
  { to: "/app/assessments", icon: Brain, label: "Assessments" },
  { to: "/app/photo-gallery", icon: Camera, label: "Photo Gallery" },
  { to: "/app/autobiography", icon: Crown, label: "Autobiography / Bio" },
  { to: "/app/interview", icon: MessageSquare, label: "Interview Practice" },
  { to: "/app/training", icon: GraduationCap, label: "Training" },
  { to: "/app/companies", icon: Building2, label: "Companies" },
  { to: "/app/event-registrations", icon: Ticket, label: "Event Registrations" },
  { to: "/app/pricing", icon: CreditCard, label: "Pricing" },
  { to: "/app/support", icon: HelpCircle, label: "Support" },
  { to: "/app/settings", icon: Settings, label: "Settings" },
];

const adminNavItems: { to: string; icon: any; label: string; end?: boolean }[] = [
  { to: "/app/admin", icon: ShieldCheck, label: "Admin" },
  { to: "/app/admin/users", icon: Users, label: "Users" },
  { to: "/app/admin/logs", icon: ClipboardList, label: "Events Log" },
];

const AppLayout = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileName, setProfileName] = useState("");
  const { credits } = useCredits();

  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
    supabase.from("user_profiles").select("full_name").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setProfileName(data?.full_name || ""));
  }, [user]);

  const navItems = isAdmin ? [...baseNavItems, ...adminNavItems] : baseNavItems;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const displayName = profileName || user?.email?.split("@")[0] || "User";
  const displayEmail = user?.email || "";

  const userInfoBlock = (
    <div className="text-right text-xs space-y-0.5 min-w-0">
      <p className="font-medium text-foreground truncate">{displayName}</p>
      <p className="text-muted-foreground truncate">{displayEmail}</p>
      <div className="flex items-center justify-end gap-1 text-primary font-medium">
        <Coins className="h-3 w-3" />
        <span>{credits?.balance ?? 0} credits</span>
      </div>
    </div>
  );

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-6 py-5 border-b border-border">
        <span className="font-heading text-lg font-bold text-foreground tracking-tight">JobsDFY</span>
      </div>
      <div className="px-4 py-3">
        <CreditBalance />
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex md:w-60 md:flex-col md:border-r border-border bg-card">
        {sidebar}
      </aside>

      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          <span className="font-heading text-lg font-bold text-foreground">JobsDFY</span>
          <CreditBalance compact />
        </div>
        <div className="flex items-center gap-3">
          {userInfoBlock}
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div className="hidden md:flex fixed top-0 left-60 right-0 z-40 items-center justify-between border-b border-border bg-card px-6 py-2">
        <div />
        <div className="flex items-center gap-3">
          {userInfoBlock}
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4 mr-1" />Logout
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-foreground/20" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-card border-r border-border pt-14">
            {sidebar}
          </aside>
        </div>
      )}

      <main className="flex-1 pt-14 md:pt-12 overflow-auto flex flex-col">
        <div className="flex-1">
          <Outlet />
        </div>
        <Footer />
      </main>
    </div>
  );
};

export default AppLayout;
