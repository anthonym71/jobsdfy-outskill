import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const totalSteps = 4;

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({
    fullName: "", location: "", headline: "", summary: "",
    salaryMin: "", salaryTarget: "", salaryCurrency: "USD",
    remotePreference: "", workAuth: "", sponsorshipRequired: "no",
    languages: "", relocationOpen: "no", yearsExp: "",
    topSkills: "", industries: "",
    nonNegSalaryMin: "", nonNegCountries: "", nonNegRemote: "",
    nonNegVisa: "no", nonNegLanguages: "", nonNegEmploymentType: "",
    nonNegMaxTravel: "", nonNegIndustryExclusions: "",
  });

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const next = () => { if (step < totalSteps) setStep(step + 1); };
  const back = () => { if (step > 1) setStep(step - 1); };
  const finish = () => {
    toast({ title: "Profile saved", description: "You're ready to check your first job." });
    navigate("/app");
  };

  const progress = (step / totalSteps) * 100;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-bold text-foreground">Set up your profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">Step {step} of {totalSteps}</p>
          <div className="mt-4 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-8 shadow-sm space-y-5">
          {step === 1 && (
            <>
              <h2 className="font-heading text-lg font-semibold text-foreground">Basic Info</h2>
              <div className="space-y-4">
                <div><Label>Full Name</Label><Input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Jane Doe" /></div>
                <div><Label>Location</Label><Input value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="Berlin, Germany" /></div>
                <div><Label>Headline</Label><Input value={form.headline} onChange={(e) => update("headline", e.target.value)} placeholder="Senior Product Designer" /></div>
                <div><Label>Summary</Label><Textarea value={form.summary} onChange={(e) => update("summary", e.target.value)} placeholder="Brief professional summary…" rows={3} /></div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-heading text-lg font-semibold text-foreground">Work Preferences</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Minimum Salary</Label><Input type="number" value={form.salaryMin} onChange={(e) => update("salaryMin", e.target.value)} placeholder="60000" /></div>
                  <div><Label>Target Salary</Label><Input type="number" value={form.salaryTarget} onChange={(e) => update("salaryTarget", e.target.value)} placeholder="80000" /></div>
                </div>
                <div>
                  <Label>Currency</Label>
                  <Select value={form.salaryCurrency} onValueChange={(v) => update("salaryCurrency", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem><SelectItem value="CAD">CAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Remote Preference</Label>
                  <Select value={form.remotePreference} onValueChange={(v) => update("remotePreference", v)}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote">Remote only</SelectItem><SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="onsite">Onsite</SelectItem><SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Work Authorization</Label><Input value={form.workAuth} onChange={(e) => update("workAuth", e.target.value)} placeholder="EU citizen, US H1-B…" /></div>
                <div>
                  <Label>Visa Sponsorship Required?</Label>
                  <Select value={form.sponsorshipRequired} onValueChange={(v) => update("sponsorshipRequired", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Languages Spoken</Label><Input value={form.languages} onChange={(e) => update("languages", e.target.value)} placeholder="English, German, Spanish" /></div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-heading text-lg font-semibold text-foreground">Skills & Experience</h2>
              <div className="space-y-4">
                <div><Label>Years of Experience</Label><Input type="number" value={form.yearsExp} onChange={(e) => update("yearsExp", e.target.value)} placeholder="5" /></div>
                <div><Label>Top Skills (comma-separated)</Label><Input value={form.topSkills} onChange={(e) => update("topSkills", e.target.value)} placeholder="React, TypeScript, Figma" /></div>
                <div><Label>Industries</Label><Input value={form.industries} onChange={(e) => update("industries", e.target.value)} placeholder="SaaS, Fintech, Health" /></div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="font-heading text-lg font-semibold text-foreground">Non-Negotiables</h2>
              <p className="text-sm text-muted-foreground">These are your hard limits. We'll flag any job that violates them.</p>
              <div className="space-y-4">
                <div><Label>Minimum Acceptable Salary</Label><Input type="number" value={form.nonNegSalaryMin} onChange={(e) => update("nonNegSalaryMin", e.target.value)} placeholder="55000" /></div>
                <div><Label>Allowed Countries / Regions</Label><Input value={form.nonNegCountries} onChange={(e) => update("nonNegCountries", e.target.value)} placeholder="Germany, Netherlands, Remote EU" /></div>
                <div>
                  <Label>Work Model Requirement</Label>
                  <Select value={form.nonNegRemote} onValueChange={(v) => update("nonNegRemote", v)}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote">Remote only</SelectItem><SelectItem value="hybrid">Hybrid OK</SelectItem>
                      <SelectItem value="any">Any</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Required Languages</Label><Input value={form.nonNegLanguages} onChange={(e) => update("nonNegLanguages", e.target.value)} placeholder="English" /></div>
                <div><Label>Employment Type</Label><Input value={form.nonNegEmploymentType} onChange={(e) => update("nonNegEmploymentType", e.target.value)} placeholder="Full-time, Contract" /></div>
                <div><Label>Max Travel (%)</Label><Input value={form.nonNegMaxTravel} onChange={(e) => update("nonNegMaxTravel", e.target.value)} placeholder="10" /></div>
                <div><Label>Industry Exclusions</Label><Input value={form.nonNegIndustryExclusions} onChange={(e) => update("nonNegIndustryExclusions", e.target.value)} placeholder="Gambling, Tobacco" /></div>
              </div>
            </>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={back} disabled={step === 1}>Back</Button>
            {step < totalSteps ? (
              <Button onClick={next}>Continue</Button>
            ) : (
              <Button onClick={finish}>Finish Setup</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
