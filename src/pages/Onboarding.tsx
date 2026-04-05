import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCredits, CREDIT_REWARDS } from "@/hooks/useCredits";
import { Coins, Zap, Trophy, Phone, Loader2, CheckCircle } from "lucide-react";

const totalSteps = 5;

const STEP_REWARDS: Record<number, string> = {
  1: "profile_basic",
  2: "profile_preferences",
  3: "profile_skills",
  4: "profile_nonneg",
};

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { credits, earnCredits, unlockAchievement } = useCredits();

  // Phone verification state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

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

  const awardStepCredits = async (stepNum: number) => {
    if (completedSteps.has(stepNum)) return;
    const rewardKey = STEP_REWARDS[stepNum];
    if (!rewardKey) return;
    const reward = CREDIT_REWARDS[rewardKey];
    const earned = await earnCredits(rewardKey);
    if (earned && reward) {
      setCompletedSteps(prev => new Set(prev).add(stepNum));
      toast({
        title: `+${reward.credits} credits earned! 🎉`,
        description: `${reward.label} • +${reward.xp} XP`,
      });
    }
  };

  const sendOtp = async () => {
    if (!phoneNumber.trim()) {
      toast({ title: "Enter your phone number", variant: "destructive" });
      return;
    }
    setSendingOtp(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-phone", {
        body: { action: "send", phoneNumber: phoneNumber.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setOtpSent(true);
      toast({ title: "Code sent!", description: "Check your phone for the 6-digit code." });
    } catch (err: any) {
      toast({ title: "Failed to send code", description: err.message, variant: "destructive" });
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpCode.trim()) return;
    setVerifyingOtp(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-phone", {
        body: { action: "verify", code: otpCode.trim(), phoneNumber: phoneNumber.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPhoneVerified(true);
      toast({ title: "Phone verified! ✅" });
    } catch (err: any) {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    } finally {
      setVerifyingOtp(false);
    }
  };

  const next = async () => {
    if (step === 5 && !phoneVerified) {
      toast({ title: "Please verify your phone number first", variant: "destructive" });
      return;
    }
    await awardStepCredits(step);
    if (step < totalSteps) setStep(step + 1);
  };

  const back = () => { if (step > 1) setStep(step - 1); };

  const finish = async () => {
    if (!user) return;
    if (!phoneVerified) {
      toast({ title: "Please verify your phone number first", variant: "destructive" });
      return;
    }
    setSaving(true);

    try {
      const splitArray = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

      const { error: profileError } = await supabase.from("user_profiles").upsert({
        user_id: user.id,
        full_name: form.fullName,
        email: user.email || "",
        location: form.location,
        headline: form.headline,
        summary: form.summary,
        years_of_experience: parseInt(form.yearsExp) || 0,
        top_skills: splitArray(form.topSkills),
        industries: splitArray(form.industries),
        languages_spoken: splitArray(form.languages),
      } as any, { onConflict: "user_id" });

      if (profileError) throw profileError;

      const { error: nonNegError } = await supabase.from("user_non_negotiables").upsert({
        user_id: user.id,
        min_salary: parseInt(form.nonNegSalaryMin) || 0,
        salary_currency: form.salaryCurrency,
        allowed_countries: splitArray(form.nonNegCountries),
        remote_preference: form.nonNegRemote || "any",
        requires_visa_sponsorship: form.nonNegVisa === "yes",
        employment_type_preferences: splitArray(form.nonNegEmploymentType),
        max_travel_percent: parseInt(form.nonNegMaxTravel) || 100,
        industry_exclusions: splitArray(form.nonNegIndustryExclusions),
      }, { onConflict: "user_id" });

      if (nonNegError) throw nonNegError;

      await awardStepCredits(4);
      await unlockAchievement("first_steps");

      toast({ title: "🏆 Profile saved!", description: "Achievement unlocked: First Steps. You're ready to go!" });
      navigate("/app");
    } catch (err: any) {
      console.error("Save error:", err);
      toast({ title: "Error saving profile", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const progress = (step / totalSteps) * 100;
  const currentReward = CREDIT_REWARDS[STEP_REWARDS[step]];
  const totalEarnable = Object.values(STEP_REWARDS).reduce((sum, key) => sum + (CREDIT_REWARDS[key]?.credits || 0), 0);
  const earnedSoFar = Array.from(completedSteps).reduce((sum, s) => sum + (CREDIT_REWARDS[STEP_REWARDS[s]]?.credits || 0), 0);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-lg">
        {/* Reward banner */}
        <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Coins className="h-4 w-4 text-amber-500" />
            <span className="text-foreground font-medium">{earnedSoFar} / {totalEarnable} credits earned</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Trophy className="h-3 w-3" />
            Complete all steps for bonus XP
          </div>
        </div>

        <div className="mb-8">
          <h1 className="font-heading text-2xl font-bold text-foreground">Set up your profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">Step {step} of {totalSteps}</p>
          <div className="mt-4 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-8 shadow-sm space-y-5">
          {/* Step reward indicator */}
          {currentReward && !completedSteps.has(step) && (
            <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-xs text-primary">
              <Zap className="h-3 w-3" />
              <span>Complete this step to earn <strong>+{currentReward.credits} credits</strong> & <strong>+{currentReward.xp} XP</strong></span>
            </div>
          )}
          {completedSteps.has(step) && (
            <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-600">
              <span>✅ Credits earned for this step!</span>
            </div>
          )}

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

          {step === 5 && (
            <>
              <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
                <Phone className="h-5 w-5" /> Verify Your Phone
              </h2>
              <p className="text-sm text-muted-foreground">
                We need your mobile number to secure your account. This number cannot be changed without admin approval.
              </p>
              <div className="space-y-4">
                {!phoneVerified ? (
                  <>
                    <div>
                      <Label>Mobile Number (with country code)</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="+1 555 123 4567"
                          disabled={otpSent}
                        />
                        <Button onClick={sendOtp} disabled={sendingOtp || otpSent} variant="outline" size="sm" className="shrink-0">
                          {sendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : otpSent ? "Sent" : "Send Code"}
                        </Button>
                      </div>
                    </div>
                    {otpSent && (
                      <div>
                        <Label>Enter 6-digit code (or override password)</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            placeholder="123456"
                          />
                          <Button onClick={verifyOtp} disabled={verifyingOtp} size="sm" className="shrink-0">
                            {verifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                          </Button>
                        </div>
                        <button
                          onClick={() => { setOtpSent(false); setOtpCode(""); }}
                          className="text-xs text-muted-foreground underline mt-2"
                        >
                          Use a different number
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-3 rounded-lg bg-green-500/10 p-4">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-foreground">Phone verified</p>
                      <p className="text-sm text-muted-foreground">{phoneNumber}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={back} disabled={step === 1}>Back</Button>
            {step < totalSteps ? (
              <Button onClick={next}>
                Continue
                {currentReward && !completedSteps.has(step) && (
                  <span className="ml-2 flex items-center gap-1 text-xs opacity-80">
                    <Coins className="h-3 w-3" />+{currentReward.credits}
                  </span>
                )}
              </Button>
            ) : (
              <Button onClick={finish} disabled={saving || !phoneVerified}>
                {saving ? "Saving…" : "Finish Setup 🏆"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
