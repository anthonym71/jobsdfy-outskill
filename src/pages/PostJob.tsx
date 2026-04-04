import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, ArrowLeft, ArrowRight, Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  COUNTRIES, CITIES, JOB_LEVELS, JOB_CATEGORIES, BENEFITS_OPTIONS,
  QUALIFICATION_OPTIONS, CURRENCIES, LANGUAGE_OPTIONS
} from "@/data/jobFormData";

const STEPS = ["Basics", "Details", "Compensation", "Contact"];

const PostJob = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  const [form, setForm] = useState({
    title: "", company: "", country: "", city: "", work_model: "onsite",
    travel_required: false, travel_percent: 0,
    job_level: "", job_category: "", job_subcategory: "", employment_type: "full-time",
    description: "", requirements: "", employee_provides: "", employer_provides: "",
    salary_currency: "USD", salary_basic: 0, salary_ote: 0,
    benefits: [] as string[],
    special_requirements: "", relocation_offered: false,
    language_primary: "English", language_secondary: "", language_other: "",
    qualifications: "",
    show_email: false, show_phone: false, phone_type: "mobile", phone_extension: "",
    recruiter_email: "", recruiter_phone: "", recruiter_name: "",
    application_url: "", application_email: "",
  });

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));
  const toggleBenefit = (b: string) => {
    setForm(f => ({
      ...f,
      benefits: f.benefits.includes(b) ? f.benefits.filter(x => x !== b) : [...f.benefits, b]
    }));
  };

  const subcategories = form.job_category ? (JOB_CATEGORIES[form.job_category] || []) : [];
  const cities = form.country ? (CITIES[form.country] || []) : [];

  const handleAiDescription = async () => {
    if (!form.title || !form.job_category) {
      toast({ title: "Need more info", description: "Fill in title and category first.", variant: "destructive" });
      return;
    }
    setAiGenerating(true);
    try {
      const resp = await supabase.functions.invoke("generate-job-description", {
        body: {
          title: form.title, company: form.company, level: form.job_level,
          category: form.job_category, subcategory: form.job_subcategory,
          work_model: form.work_model, employment_type: form.employment_type,
        }
      });
      if (resp.data?.description) set("description", resp.data.description);
      if (resp.data?.requirements) set("requirements", resp.data.requirements);
      toast({ title: "AI draft generated!", description: "Review and edit as needed." });
    } catch {
      toast({ title: "AI generation failed", variant: "destructive" });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("recruiter_job_posts").insert({
        user_id: user.id,
        ...form,
        salary_basic: form.salary_basic || 0,
        salary_ote: form.salary_ote || 0,
        travel_percent: form.travel_required ? form.travel_percent : 0,
      });
      if (error) throw error;
      toast({ title: "Job posted!", description: "Your job listing is now live." });
      navigate("/app/jobs");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Post a Job</h1>
        <p className="text-sm text-muted-foreground mt-1">Fill in the details. Seekers will see your listing on the job board.</p>
      </div>

      {/* Step indicator */}
      <div className="flex gap-1">
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => setStep(i)}
            className={`flex-1 text-xs py-2 rounded-lg font-medium transition-colors ${
              i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
            }`}
          >{s}</button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        {step === 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Job Title *</Label>
                <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Senior Sales Manager" />
              </div>
              <div>
                <Label>Company</Label>
                <Input value={form.company} onChange={e => set("company", e.target.value)} placeholder="Company name" />
              </div>
              <div>
                <Label>Employment Type</Label>
                <Select value={form.employment_type} onValueChange={v => set("employment_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["full-time","part-time","contract","freelance","internship"].map(t => (
                      <SelectItem key={t} value={t}>{t.replace("-"," ").replace(/\b\w/g,l=>l.toUpperCase())}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Country</Label>
                <Select value={form.country} onValueChange={v => { set("country", v); set("city", ""); }}>
                  <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>City</Label>
                {cities.length > 0 ? (
                  <Select value={form.city} onValueChange={v => set("city", v)}>
                    <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={form.city} onChange={e => set("city", e.target.value)} placeholder="Type city name" />
                )}
              </div>
              <div>
                <Label>Work Model</Label>
                <Select value={form.work_model} onValueChange={v => set("work_model", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="onsite">On-site</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Job Level</Label>
                <Select value={form.job_level} onValueChange={v => set("job_level", v)}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    {JOB_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Job Category</Label>
                <Select value={form.job_category} onValueChange={v => { set("job_category", v); set("job_subcategory", ""); }}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {Object.keys(JOB_CATEGORIES).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sub-Category</Label>
                <Select value={form.job_subcategory} onValueChange={v => set("job_subcategory", v)} disabled={!form.job_category}>
                  <SelectTrigger><SelectValue placeholder="Select sub-category" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {subcategories.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.travel_required} onCheckedChange={v => set("travel_required", v)} />
                <Label className="text-sm">Travel Required</Label>
              </div>
              {form.travel_required && (
                <div className="flex items-center gap-2">
                  <Input type="number" className="w-20" value={form.travel_percent} onChange={e => set("travel_percent", parseInt(e.target.value) || 0)} min={0} max={100} />
                  <span className="text-xs text-muted-foreground">% travel</span>
                </div>
              )}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleAiDescription} disabled={aiGenerating}>
                {aiGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                AI Generate Description
              </Button>
            </div>
            <div>
              <Label>Job Description *</Label>
              <Textarea rows={6} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Describe the role, responsibilities, and day-to-day…" />
            </div>
            <div>
              <Label>Requirements</Label>
              <Textarea rows={4} value={form.requirements} onChange={e => set("requirements", e.target.value)} placeholder="Skills, experience, and qualifications needed…" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>What Employee Provides</Label>
                <Textarea rows={3} value={form.employee_provides} onChange={e => set("employee_provides", e.target.value)} placeholder="e.g. Own laptop, car for travel…" />
              </div>
              <div>
                <Label>What Employer Provides</Label>
                <Textarea rows={3} value={form.employer_provides} onChange={e => set("employer_provides", e.target.value)} placeholder="e.g. Training, equipment, software…" />
              </div>
            </div>
            <div>
              <Label>Special Requirements</Label>
              <Textarea rows={2} value={form.special_requirements} onChange={e => set("special_requirements", e.target.value)} placeholder="Any special needs or conditions…" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Primary Language</Label>
                <Select value={form.language_primary} onValueChange={v => set("language_primary", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {LANGUAGE_OPTIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Secondary Language</Label>
                <Select value={form.language_secondary} onValueChange={v => set("language_secondary", v)}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="">None</SelectItem>
                    {LANGUAGE_OPTIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Other Languages</Label>
                <Input value={form.language_other} onChange={e => set("language_other", e.target.value)} placeholder="Comma-separated" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Qualifications</Label>
                <Select value={form.qualifications} onValueChange={v => set("qualifications", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {QUALIFICATION_OPTIONS.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.relocation_offered} onCheckedChange={v => set("relocation_offered", v)} />
                <Label className="text-sm">Relocation Offered</Label>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Currency</Label>
                <Select value={form.salary_currency} onValueChange={v => set("salary_currency", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Basic Salary</Label>
                <Input type="number" value={form.salary_basic || ""} onChange={e => set("salary_basic", parseInt(e.target.value) || 0)} placeholder="Annual basic" />
              </div>
              <div>
                <Label>OTE (if applicable)</Label>
                <Input type="number" value={form.salary_ote || ""} onChange={e => set("salary_ote", parseInt(e.target.value) || 0)} placeholder="On-target earnings" />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Benefits</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BENEFITS_OPTIONS.map(b => (
                  <label key={b} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={form.benefits.includes(b)} onCheckedChange={() => toggleBenefit(b)} />
                    {b}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Recruiter / Contact Name</Label>
                <Input value={form.recruiter_name} onChange={e => set("recruiter_name", e.target.value)} placeholder="Name shown to interested candidates" />
              </div>
              <div>
                <Label>Contact Email</Label>
                <Input type="email" value={form.recruiter_email} onChange={e => set("recruiter_email", e.target.value)} placeholder="recruiter@company.com" />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.show_email} onCheckedChange={v => set("show_email", v)} />
                <Label className="text-sm">Make email visible to candidates</Label>
              </div>
              <div>
                <Label>Contact Phone</Label>
                <Input value={form.recruiter_phone} onChange={e => set("recruiter_phone", e.target.value)} placeholder="+1 555 123 4567" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 pt-6">
                  <Switch checked={form.show_phone} onCheckedChange={v => set("show_phone", v)} />
                  <Label className="text-sm">Make phone visible to candidates</Label>
                </div>
                {form.show_phone && (
                  <div className="flex gap-2">
                    <Select value={form.phone_type} onValueChange={v => set("phone_type", v)}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mobile">Mobile</SelectItem>
                        <SelectItem value="landline">Landline</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.phone_type === "landline" && (
                      <Input className="w-24" value={form.phone_extension} onChange={e => set("phone_extension", e.target.value)} placeholder="Ext." />
                    )}
                  </div>
                )}
              </div>
              <div>
                <Label>Application URL (optional)</Label>
                <Input value={form.application_url} onChange={e => set("application_url", e.target.value)} placeholder="https://apply.company.com/role" />
              </div>
              <div>
                <Label>Application Email (optional)</Label>
                <Input type="email" value={form.application_email} onChange={e => set("application_email", e.target.value)} placeholder="apply@company.com" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : navigate("/app/jobs")} disabled={saving}>
          <ArrowLeft className="h-4 w-4 mr-1" />{step === 0 ? "Cancel" : "Back"}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(step + 1)}>
            Next <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
            Publish Job
          </Button>
        )}
      </div>
    </div>
  );
};

export default PostJob;
