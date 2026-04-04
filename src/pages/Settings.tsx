import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingNonNegs, setSavingNonNegs] = useState(false);

  const [profile, setProfile] = useState({
    fullName: "", location: "", headline: "", summary: "",
    yearsExp: "", topSkills: "", industries: "", languages: "",
    phoneNumber: "",
  });

  const [nonNegs, setNonNegs] = useState({
    minSalary: "", salaryCurrency: "USD", allowedCountries: "",
    remotePreference: "any", visaSponsorship: "no",
    employmentTypes: "", maxTravel: "", industryExclusions: "",
  });

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    const [profileRes, nonNegRes] = await Promise.all([
      supabase.from("user_profiles").select("*").eq("user_id", user!.id).single(),
      supabase.from("user_non_negotiables").select("*").eq("user_id", user!.id).single(),
    ]);

    if (profileRes.data) {
      const p = profileRes.data;
      setProfile({
        fullName: p.full_name || "",
        location: p.location || "",
        headline: p.headline || "",
        summary: p.summary || "",
        yearsExp: String(p.years_of_experience || ""),
        topSkills: (p.top_skills || []).join(", "),
        industries: (p.industries || []).join(", "),
        languages: (p.languages_spoken || []).join(", "),
      });
    }

    if (nonNegRes.data) {
      const n = nonNegRes.data;
      setNonNegs({
        minSalary: String(n.min_salary || ""),
        salaryCurrency: n.salary_currency || "USD",
        allowedCountries: (n.allowed_countries || []).join(", "),
        remotePreference: n.remote_preference || "any",
        visaSponsorship: n.requires_visa_sponsorship ? "yes" : "no",
        employmentTypes: (n.employment_type_preferences || []).join(", "),
        maxTravel: String(n.max_travel_percent || ""),
        industryExclusions: (n.industry_exclusions || []).join(", "),
      });
    }

    setLoading(false);
  };

  const splitArray = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const { error } = await supabase.from("user_profiles").upsert({
        user_id: user!.id,
        full_name: profile.fullName,
        location: profile.location,
        headline: profile.headline,
        summary: profile.summary,
        years_of_experience: parseInt(profile.yearsExp) || 0,
        top_skills: splitArray(profile.topSkills),
        industries: splitArray(profile.industries),
        languages_spoken: splitArray(profile.languages),
      }, { onConflict: "user_id" });
      if (error) throw error;
      toast({ title: "Profile updated" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const saveNonNegs = async () => {
    setSavingNonNegs(true);
    try {
      const { error } = await supabase.from("user_non_negotiables").upsert({
        user_id: user!.id,
        min_salary: parseInt(nonNegs.minSalary) || 0,
        salary_currency: nonNegs.salaryCurrency,
        allowed_countries: splitArray(nonNegs.allowedCountries),
        remote_preference: nonNegs.remotePreference,
        requires_visa_sponsorship: nonNegs.visaSponsorship === "yes",
        employment_type_preferences: splitArray(nonNegs.employmentTypes),
        max_travel_percent: parseInt(nonNegs.maxTravel) || 100,
        industry_exclusions: splitArray(nonNegs.industryExclusions),
      }, { onConflict: "user_id" });
      if (error) throw error;
      toast({ title: "Non-negotiables updated" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingNonNegs(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
    );
  }

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
          <div><Label>Full Name</Label><Input value={profile.fullName} onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))} className="mt-1" /></div>
          <div><Label>Email</Label><Input value={user?.email || ""} disabled className="mt-1" /></div>
          <div>
            <Label>Phone Number</Label>
            <Input value={profile.phoneNumber || "Not set"} disabled className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Phone changes require admin approval. <a href="/app/support" className="text-primary underline">Submit a ticket</a> to request a change.</p>
          </div>
          <div><Label>Location</Label><Input value={profile.location} onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))} className="mt-1" /></div>
          <div><Label>Headline</Label><Input value={profile.headline} onChange={(e) => setProfile((p) => ({ ...p, headline: e.target.value }))} className="mt-1" /></div>
          <div className="sm:col-span-2"><Label>Summary</Label><Textarea value={profile.summary} onChange={(e) => setProfile((p) => ({ ...p, summary: e.target.value }))} className="mt-1" rows={3} /></div>
          <div><Label>Years of Experience</Label><Input type="number" value={profile.yearsExp} onChange={(e) => setProfile((p) => ({ ...p, yearsExp: e.target.value }))} className="mt-1" /></div>
          <div><Label>Languages</Label><Input value={profile.languages} onChange={(e) => setProfile((p) => ({ ...p, languages: e.target.value }))} className="mt-1" placeholder="English, German" /></div>
          <div><Label>Top Skills</Label><Input value={profile.topSkills} onChange={(e) => setProfile((p) => ({ ...p, topSkills: e.target.value }))} className="mt-1" placeholder="React, TypeScript" /></div>
          <div><Label>Industries</Label><Input value={profile.industries} onChange={(e) => setProfile((p) => ({ ...p, industries: e.target.value }))} className="mt-1" placeholder="SaaS, Fintech" /></div>
        </div>
        <Button size="sm" onClick={saveProfile} disabled={savingProfile}>
          {savingProfile ? "Saving…" : "Save Changes"}
        </Button>
      </section>

      <Separator />

      {/* Non-Negotiables */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-heading text-base font-semibold text-foreground">Non-Negotiables</h2>
        <p className="text-sm text-muted-foreground">Update your hard limits. These drive the dealbreaker check.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Minimum Salary</Label><Input type="number" value={nonNegs.minSalary} onChange={(e) => setNonNegs((n) => ({ ...n, minSalary: e.target.value }))} className="mt-1" /></div>
          <div>
            <Label>Currency</Label>
            <Select value={nonNegs.salaryCurrency} onValueChange={(v) => setNonNegs((n) => ({ ...n, salaryCurrency: v }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem><SelectItem value="CAD">CAD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Allowed Countries</Label><Input value={nonNegs.allowedCountries} onChange={(e) => setNonNegs((n) => ({ ...n, allowedCountries: e.target.value }))} className="mt-1" /></div>
          <div>
            <Label>Work Model</Label>
            <Select value={nonNegs.remotePreference} onValueChange={(v) => setNonNegs((n) => ({ ...n, remotePreference: v }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="remote">Remote only</SelectItem>
                <SelectItem value="hybrid">Hybrid OK</SelectItem>
                <SelectItem value="any">Any</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Visa Sponsorship Required</Label>
            <Select value={nonNegs.visaSponsorship} onValueChange={(v) => setNonNegs((n) => ({ ...n, visaSponsorship: v }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Employment Types</Label><Input value={nonNegs.employmentTypes} onChange={(e) => setNonNegs((n) => ({ ...n, employmentTypes: e.target.value }))} className="mt-1" placeholder="Full-time, Contract" /></div>
          <div><Label>Max Travel (%)</Label><Input type="number" value={nonNegs.maxTravel} onChange={(e) => setNonNegs((n) => ({ ...n, maxTravel: e.target.value }))} className="mt-1" /></div>
          <div><Label>Industry Exclusions</Label><Input value={nonNegs.industryExclusions} onChange={(e) => setNonNegs((n) => ({ ...n, industryExclusions: e.target.value }))} className="mt-1" placeholder="Gambling, Tobacco" /></div>
        </div>
        <Button size="sm" onClick={saveNonNegs} disabled={savingNonNegs}>
          {savingNonNegs ? "Saving…" : "Update Non-Negotiables"}
        </Button>
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
