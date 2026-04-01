import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const Settings = () => {
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your profile and preferences.</p>
      </div>

      {/* Profile */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-heading text-base font-semibold text-foreground">Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Full Name</Label><Input placeholder="Jane Doe" className="mt-1" /></div>
          <div><Label>Email</Label><Input placeholder="jane@example.com" disabled className="mt-1" /></div>
          <div><Label>Location</Label><Input placeholder="Berlin, Germany" className="mt-1" /></div>
          <div><Label>Headline</Label><Input placeholder="Senior Product Designer" className="mt-1" /></div>
        </div>
        <Button size="sm">Save Changes</Button>
      </section>

      <Separator />

      {/* Non-Negotiables */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-heading text-base font-semibold text-foreground">Non-Negotiables</h2>
        <p className="text-sm text-muted-foreground">Update your hard limits. These drive the dealbreaker check.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Minimum Salary</Label><Input placeholder="55000" type="number" className="mt-1" /></div>
          <div><Label>Allowed Countries</Label><Input placeholder="Germany, Netherlands" className="mt-1" /></div>
          <div><Label>Work Model</Label><Input placeholder="Remote only" className="mt-1" /></div>
          <div><Label>Required Languages</Label><Input placeholder="English" className="mt-1" /></div>
        </div>
        <Button size="sm">Update Non-Negotiables</Button>
      </section>

      <Separator />

      {/* Privacy */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-3">
        <h2 className="font-heading text-base font-semibold text-foreground">Privacy</h2>
        <p className="text-sm text-muted-foreground">Your data is only visible to you. We never share it with employers or third parties.</p>
      </section>

      <Separator />

      {/* Billing */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-3">
        <h2 className="font-heading text-base font-semibold text-foreground">Billing</h2>
        <p className="text-sm text-muted-foreground">Billing management coming soon.</p>
      </section>

      <Separator />

      {/* Danger Zone */}
      <section className="rounded-xl border border-destructive/20 bg-card p-6 space-y-3">
        <h2 className="font-heading text-base font-semibold text-destructive">Danger Zone</h2>
        <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p>
        <Button variant="destructive" size="sm">Delete Account</Button>
      </section>
    </div>
  );
};

export default Settings;
