import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";

const Settings = () => {
  const { signOut } = useAuth();

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">App Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your app preferences.</p>
      </div>

      {/* Privacy */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-3">
        <h2 className="font-heading text-base font-semibold text-foreground">Privacy</h2>
        <p className="text-sm text-muted-foreground">Your data is only visible to you. We never share it with employers or third parties.</p>
      </section>

      <Separator />

      {/* Billing */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-3">
        <h2 className="font-heading text-base font-semibold text-foreground">Billing</h2>
        <p className="text-sm text-muted-foreground">Manage your subscription and buy credit packs.</p>
        <Button size="sm" asChild><Link to="/app/pricing">View Plans & Pricing</Link></Button>
      </section>

      <Separator />

      {/* Danger Zone */}
      <section className="rounded-xl border border-destructive/20 bg-card p-6 space-y-3">
        <h2 className="font-heading text-base font-semibold text-destructive">Danger Zone</h2>
        <p className="text-sm text-muted-foreground">Sign out of your account.</p>
        <Button variant="destructive" size="sm" onClick={signOut}>Sign Out</Button>
      </section>
    </div>
  );
};

export default Settings;
