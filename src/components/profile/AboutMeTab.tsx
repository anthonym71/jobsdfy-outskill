import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface SocialAccount {
  id?: string;
  platform: string;
  url: string;
  followers: number;
  friends: number;
}

const PLATFORMS = ["LinkedIn", "Twitter/X", "GitHub", "Instagram", "TikTok", "Facebook", "YouTube", "Other"];

const AboutMeTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    fullName: "", location: "", headline: "", summary: "",
    yearsExp: "", topSkills: "", industries: "", languages: "",
    phoneNumber: "", hobbies: "", interests: "", sports: "",
  });
  const [socials, setSocials] = useState<SocialAccount[]>([]);

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
    const [profileRes, nonNegRes, socialsRes] = await Promise.all([
      supabase.from("user_profiles").select("*").eq("user_id", user!.id).single(),
      supabase.from("user_non_negotiables").select("*").eq("user_id", user!.id).single(),
      supabase.from("social_accounts").select("*").eq("user_id", user!.id),
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
        phoneNumber: p.phone_number || "",
        hobbies: ((p as any).hobbies || []).join(", "),
        interests: ((p as any).interests || []).join(", "),
        sports: ((p as any).sports || []).join(", "),
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

    if (socialsRes.data) {
      setSocials(socialsRes.data.map(s => ({
        id: s.id, platform: s.platform, url: s.url || "",
        followers: s.followers || 0, friends: s.friends || 0,
      })));
    }

    setLoading(false);
  };

  const splitArray = (s: string) => s.split(",").map(x => x.trim()).filter(Boolean);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error: profileError } = await supabase.from("user_profiles").upsert({
        user_id: user!.id,
        full_name: profile.fullName,
        location: profile.location,
        headline: profile.headline,
        summary: profile.summary,
        years_of_experience: parseInt(profile.yearsExp) || 0,
        top_skills: splitArray(profile.topSkills),
        industries: splitArray(profile.industries),
        languages_spoken: splitArray(profile.languages),
        hobbies: splitArray(profile.hobbies),
        interests: splitArray(profile.interests),
        sports: splitArray(profile.sports),
      } as any, { onConflict: "user_id" });
      if (profileError) throw profileError;

      const { error: nonNegError } = await supabase.from("user_non_negotiables").upsert({
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
      if (nonNegError) throw nonNegError;

      // Save socials
      await supabase.from("social_accounts").delete().eq("user_id", user!.id);
      if (socials.length > 0) {
        const { error: socialError } = await supabase.from("social_accounts").insert(
          socials.map(s => ({
            user_id: user!.id,
            platform: s.platform,
            url: s.url,
            followers: s.followers,
            friends: s.friends,
          }))
        );
        if (socialError) throw socialError;
      }

      toast({ title: "Profile saved" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addSocial = () => setSocials(prev => [...prev, { platform: "LinkedIn", url: "", followers: 0, friends: 0 }]);
  const removeSocial = (i: number) => setSocials(prev => prev.filter((_, idx) => idx !== i));

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-heading text-base font-semibold text-foreground">Basic Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Full Name</Label><Input value={profile.fullName} onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))} className="mt-1" /></div>
          <div><Label>Email</Label><Input value={user?.email || ""} disabled className="mt-1" /></div>
          <div>
            <Label>Phone Number</Label>
            <Input value={profile.phoneNumber || "Not set"} disabled className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Phone changes require admin approval.</p>
          </div>
          <div><Label>Location</Label><Input value={profile.location} onChange={e => setProfile(p => ({ ...p, location: e.target.value }))} className="mt-1" /></div>
          <div><Label>Headline</Label><Input value={profile.headline} onChange={e => setProfile(p => ({ ...p, headline: e.target.value }))} className="mt-1" /></div>
          <div><Label>Years of Experience</Label><Input type="number" value={profile.yearsExp} onChange={e => setProfile(p => ({ ...p, yearsExp: e.target.value }))} className="mt-1" /></div>
          <div className="sm:col-span-2"><Label>Summary</Label><Textarea value={profile.summary} onChange={e => setProfile(p => ({ ...p, summary: e.target.value }))} className="mt-1" rows={3} /></div>
          <div><Label>Top Skills</Label><Input value={profile.topSkills} onChange={e => setProfile(p => ({ ...p, topSkills: e.target.value }))} className="mt-1" placeholder="React, TypeScript" /></div>
          <div><Label>Industries</Label><Input value={profile.industries} onChange={e => setProfile(p => ({ ...p, industries: e.target.value }))} className="mt-1" placeholder="SaaS, Fintech" /></div>
          <div><Label>Languages</Label><Input value={profile.languages} onChange={e => setProfile(p => ({ ...p, languages: e.target.value }))} className="mt-1" placeholder="English, German" /></div>
        </div>
      </section>

      {/* Hobbies & Interests */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-heading text-base font-semibold text-foreground">Hobbies & Interests</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><Label>Hobbies</Label><Input value={profile.hobbies} onChange={e => setProfile(p => ({ ...p, hobbies: e.target.value }))} className="mt-1" placeholder="Photography, Cooking" /></div>
          <div><Label>Interests</Label><Input value={profile.interests} onChange={e => setProfile(p => ({ ...p, interests: e.target.value }))} className="mt-1" placeholder="AI, Startups" /></div>
          <div><Label>Sports</Label><Input value={profile.sports} onChange={e => setProfile(p => ({ ...p, sports: e.target.value }))} className="mt-1" placeholder="Running, Tennis" /></div>
        </div>
      </section>

      {/* Social Accounts */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-base font-semibold text-foreground">Social Media Accounts</h2>
          <Button size="sm" variant="outline" onClick={addSocial}><Plus className="h-4 w-4 mr-1" />Add</Button>
        </div>
        {socials.map((s, i) => (
          <div key={i} className="grid gap-3 sm:grid-cols-5 items-end border-b border-border pb-3 last:border-0">
            <div>
              <Label>Platform</Label>
              <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={s.platform} onChange={e => setSocials(prev => prev.map((x, idx) => idx === i ? { ...x, platform: e.target.value } : x))}>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div><Label>URL</Label><Input value={s.url} onChange={e => setSocials(prev => prev.map((x, idx) => idx === i ? { ...x, url: e.target.value } : x))} className="mt-1" /></div>
            <div><Label>Followers</Label><Input type="number" value={s.followers} onChange={e => setSocials(prev => prev.map((x, idx) => idx === i ? { ...x, followers: Number(e.target.value) } : x))} className="mt-1" /></div>
            <div><Label>Friends</Label><Input type="number" value={s.friends} onChange={e => setSocials(prev => prev.map((x, idx) => idx === i ? { ...x, friends: Number(e.target.value) } : x))} className="mt-1" /></div>
            <Button size="icon" variant="ghost" onClick={() => removeSocial(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
        {socials.length === 0 && <p className="text-sm text-muted-foreground">No social accounts added yet.</p>}
      </section>

      <Separator />

      {/* Non-Negotiables */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-heading text-base font-semibold text-foreground">Non-Negotiables</h2>
        <p className="text-sm text-muted-foreground">Your hard limits that drive the dealbreaker check.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Minimum Salary</Label><Input type="number" value={nonNegs.minSalary} onChange={e => setNonNegs(n => ({ ...n, minSalary: e.target.value }))} className="mt-1" /></div>
          <div><Label>Currency</Label><Input value={nonNegs.salaryCurrency} onChange={e => setNonNegs(n => ({ ...n, salaryCurrency: e.target.value }))} className="mt-1" /></div>
          <div><Label>Allowed Countries</Label><Input value={nonNegs.allowedCountries} onChange={e => setNonNegs(n => ({ ...n, allowedCountries: e.target.value }))} className="mt-1" /></div>
          <div><Label>Work Model</Label><Input value={nonNegs.remotePreference} onChange={e => setNonNegs(n => ({ ...n, remotePreference: e.target.value }))} className="mt-1" placeholder="remote, hybrid, any" /></div>
          <div><Label>Employment Types</Label><Input value={nonNegs.employmentTypes} onChange={e => setNonNegs(n => ({ ...n, employmentTypes: e.target.value }))} className="mt-1" placeholder="Full-time, Contract" /></div>
          <div><Label>Max Travel (%)</Label><Input type="number" value={nonNegs.maxTravel} onChange={e => setNonNegs(n => ({ ...n, maxTravel: e.target.value }))} className="mt-1" /></div>
          <div><Label>Industry Exclusions</Label><Input value={nonNegs.industryExclusions} onChange={e => setNonNegs(n => ({ ...n, industryExclusions: e.target.value }))} className="mt-1" placeholder="Gambling, Tobacco" /></div>
        </div>
      </section>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : "Save Profile"}
      </Button>
    </div>
  );
};

export default AboutMeTab;
