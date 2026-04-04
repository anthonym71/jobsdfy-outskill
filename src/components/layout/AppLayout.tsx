import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, PlusCircle, Briefcase, Settings, LogOut, Menu, X, CreditCard, HelpCircle, ShieldCheck } from "lucide-react";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CreditBalance } from "@/components/gamification/CreditWidgets";

const navItems = [
  { to: "/app", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/app/new-job", icon: PlusCircle, label: "Check a Job" },
  { to: "/app/jobs", icon: Briefcase, label: "Jobs" },
  { to: "/app/pricing", icon: CreditCard, label: "Pricing" },
  { to: "/app/support", icon: HelpCircle, label: "Support" },
  { to: "/app/admin", icon: ShieldCheck, label: "Admin" },
  { to: "/app/settings", icon: Settings, label: "Settings" },
];

const AppLayout = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-6 py-5 border-b border-border">
        <span className="font-heading text-lg font-bold text-foreground tracking-tight">AI Job OS</span>
      </div>
      <div className="px-4 py-3">
        <CreditBalance />
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
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
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:border-r border-border bg-card">
        {sidebar}
      </aside>

      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          <span className="font-heading text-lg font-bold text-foreground">AI Job OS</span>
          <CreditBalance compact />
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-foreground/20" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-card border-r border-border pt-14">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 pt-14 md:pt-0 overflow-auto flex flex-col">
        <div className="flex-1">
          <Outlet />
        </div>
        <Footer />
      </main>
    </div>
  );
};

export default AppLayout;
