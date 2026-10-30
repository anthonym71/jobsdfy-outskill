import { Link } from "react-router-dom";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Shield, Zap, Link2, ChevronDown, Check, ArrowRight, Sparkles, Eye, FileText,
  BookOpen, Brain, Mic, Camera, Users, Award, Calendar, MessageSquare,
  GraduationCap, Target, Clock, TrendingUp, Briefcase, Crown, Star, Handshake,
  CalendarDays, MapPin, Search, Building2, Globe, Sun, Moon
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import jobyMascot from "@/assets/joby-mascot.webp";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const steps = [
  { icon: Link2, title: "Share a job", description: "Paste a URL, text, screenshot, or voice note — even raw LinkedIn content. Our Chrome Extension sends it in one click." },
  { icon: Shield, title: "Instant dealbreaker check", description: "AI flags salary, visa, location, language and skill mismatches before you waste a single second." },
  { icon: Eye, title: "Fit score & gap analysis", description: "See exactly where you match, where you don't, and get a clear go / review / stop recommendation." },
  { icon: Zap, title: "Apply in minutes", description: "Get an ATS-optimised CV, cover letter, and recruiter message tailored to each job — ready to send." },
];

const features = [
  { icon: Sparkles, title: "AI Job Extraction", description: "URL, text, screenshot, or voice — AI extracts structured job data from any format instantly." },
  { icon: Shield, title: "Dealbreaker Detection", description: "Salary, visa, location, language, certifications — hard mismatches flagged before you apply." },
  { icon: Eye, title: "Fit Score & Gaps", description: "Know exactly where you stand with confidence levels and actionable gap analysis." },
  { icon: Zap, title: "Quick Apply Packs", description: "AI-generated ATS-optimised CV, cover letter & recruiter message tailored per role." },
  { icon: FileText, title: "Chrome Extension", description: "One-click send from LinkedIn, Indeed, or any job board — no copy-paste required." },
  { icon: Target, title: "Pipeline Tracking", description: "Track every job from discovery through interview with verdict and status updates." },
  { icon: Brain, title: "Personality Assessments", description: "DRIVE, Big Five, DISC, Myers-Briggs, Core Archetypes, Needs Assessment and more — know yourself deeply." },
  { icon: GraduationCap, title: "Courses & Certificates", description: "Track recommended and completed courses with grades, certificates and achievement levels." },
  { icon: Mic, title: "Voice CV Builder", description: "Talk about your experience — AI turns your voice into structured CV content." },
  { icon: Clock, title: "Career Timeline", description: "Visual timeline of your entire career — jobs, education, achievements at a glance." },
  { icon: BookOpen, title: "AI Autobiography", description: "Premium: AI writes your life story, speaker intros, or topic-specific narratives from your data." },
  { icon: MessageSquare, title: "Interview Practice", description: "AI-powered mock interviews tailored to the specific job you're applying for." },
  { icon: Camera, title: "Knowledgebase & Media", description: "Upload CVs, references, photos — AI reconciles all data into a single source of truth." },
  { icon: Award, title: "Gamification & Credits", description: "Earn credits and XP for completing your profile. Level up as you progress." },
  { icon: Users, title: "Recruiter Job Board", description: "Recruiters can post jobs. Seekers get matched. Everyone wins." },
  { icon: TrendingUp, title: "Social Media Tracker", description: "Track your posts, content strategy, and follow-up tasks across platforms." },
];

const seekerTiers = [
  {
    name: "Free Forever",
    price: "Free",
    period: "",
    description: "Everything you need to get started — no trial, no expiry.",
    features: ["12 free credits", "First job check always free", "Job extraction from any format", "Dealbreaker check", "Basic fit scoring", "Profile & CV upload", "Chrome extension", "Community support"],
    highlight: false,
    cta: "Check Your First Job Free",
  },
  {
    name: "Pro",
    price: "$9",
    period: "/mo",
    description: "For active job seekers who want the full AI advantage.",
    features: ["30 credits/month", "Full AI fit scoring & gap analysis", "Quick Apply packs (CV + cover + message)", "ATS keyword optimisation", "STAR bullet enhancer", "Voice CV builder", "Career timeline", "Priority analysis", "Email support"],
    highlight: true,
    cta: "Upgrade to Pro",
  },
  {
    name: "Premium",
    price: "$19",
    period: "/mo",
    description: "Maximum power for serious career builders.",
    features: ["100 credits/month", "Everything in Pro", "AI Autobiography generator", "Interview practice bot", "Advanced personality assessments", "Knowledgebase data reconciliation", "Priority support", "Early access to new features"],
    highlight: false,
    cta: "Go Premium",
  },
];

const recruiterTiers = [
  { name: "Free", price: "Free", features: ["3 free job posts", "Basic listing"], cta: "Start Posting" },
  { name: "Standard", price: "$9/mo", features: ["Up to 10 active jobs", "AI job description generator", "Candidate shortlist"], cta: "Subscribe" },
  { name: "Unlimited", price: "$49/mo", features: ["Unlimited job posts", "Priority listing", "AI job descriptions", "Candidate insights"], cta: "Subscribe" },
];

const creditPacks = [
  { credits: 10, price: "$4.99" },
  { credits: 50, price: "$14.99" },
];

const faqs = [
  { q: "Is it really free forever?", a: "Yes. The Free plan gives you 12 credits and your first job check is always free — no trial period, no credit card required, no expiry. Use them whenever you want. Need more? Buy credit packs anytime or subscribe for monthly credits." },
  { q: "How does JobsDFY extract job information?", a: "Paste a URL, raw text, screenshot, or voice note. Our AI extracts the job title, company, salary, location, requirements, and more into structured fields you can review and edit." },
  { q: "What dealbreakers does it check for?", a: "Salary range, visa/work authorisation, location/remote mismatch, language requirements, mandatory certifications, years of experience, travel requirements, and industry exclusions." },
  { q: "Is my data private?", a: "Absolutely. Your profile, preferences, and job data are only visible to you. We never share your information with employers or third parties." },
  { q: "Does JobsDFY auto-apply for me?", a: "Never. Nothing goes out without your explicit approval. We generate drafts that you review, edit, and send yourself." },
  { q: "Does it work with LinkedIn?", a: "Yes! Our Chrome extension lets you send jobs from LinkedIn with one click. You can also Smart Paste — just Ctrl+A, Ctrl+C any job page and paste the raw content." },
  { q: "What are credits?", a: "Credits power AI features like fit scoring, CV generation, and cover letters. Free users get 12 credits and their first job check is free. Pro gets 30/month, Premium gets 100/month. You can also buy credit packs anytime." },
  { q: "What personality assessments are included?", a: "DRIVE, Big Five (OCEAN), DISC, Myers-Briggs type indicator, Core Personality Archetypes, 6 Human Needs Assessment, and more — with detailed reports and career insights." },
];

const Landing = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [landingTab, setLandingTab] = useState<"home" | "events" | "jobs">("home");
  const [publicEvents, setPublicEvents] = useState<any[]>([]);
  const [publicJobs, setPublicJobs] = useState<any[]>([]);
  const [eventSearch, setEventSearch] = useState("");
  const [jobSearch, setJobSearch] = useState("");

  // Track page view
  useEffect(() => {
    supabase.functions.invoke("track-pageview", {
      body: { page: "/", referrer: document.referrer },
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (landingTab === "events" && publicEvents.length === 0) {
      supabase.from("events").select("*").eq("is_active", true).order("event_date").then(({ data }) => {
        if (data) setPublicEvents(data);
      });
    }
    if (landingTab === "jobs" && publicJobs.length === 0) {
      supabase.from("recruiter_job_posts_public").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(50).then(({ data }) => {
        if (data) setPublicJobs(data);
      });
    }
  }, [landingTab]);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="font-heading text-lg sm:text-xl font-bold text-foreground tracking-tight cursor-pointer" onClick={() => setLandingTab("home")}>JobsDFY</span>
            <div className="hidden sm:flex items-center gap-1">
              {(["home", "events", "jobs"] as const).map(tab => (
                <button key={tab} onClick={() => setLandingTab(tab)} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${landingTab === tab ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {tab === "home" ? "Home" : tab === "events" ? "Events" : "Jobs"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex sm:hidden items-center gap-1 mr-1">
              {(["home", "events", "jobs"] as const).map(tab => (
                <button key={tab} onClick={() => setLandingTab(tab)} className={`px-2 py-1 text-xs font-medium rounded transition-colors ${landingTab === tab ? "bg-accent text-foreground" : "text-muted-foreground"}`}>
                  {tab === "home" ? "Home" : tab === "events" ? "Events" : "Jobs"}
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-label={landingTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={landingTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              onClick={() => setTheme(landingTheme === "dark" ? "light" : "dark")}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {landingTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button size="sm">Start Free <ArrowRight className="ml-1 h-3 w-3" /></Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Events Tab */}
      {landingTab === "events" && (
        <section className="py-12 md:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-6">
            <div className="text-center">
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Upcoming Events</h2>
              <p className="mt-2 text-sm text-muted-foreground">Find networking events, career fairs, and workshops near you.</p>
            </div>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={eventSearch} onChange={e => setEventSearch(e.target.value)} placeholder="Search by name or area..." className="pl-9" />
            </div>
            {publicEvents.filter(e => !eventSearch || e.title?.toLowerCase().includes(eventSearch.toLowerCase()) || e.area?.toLowerCase().includes(eventSearch.toLowerCase()) || e.location?.toLowerCase().includes(eventSearch.toLowerCase())).length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No upcoming events. Check back soon!</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {publicEvents.filter(e => !eventSearch || e.title?.toLowerCase().includes(eventSearch.toLowerCase()) || e.area?.toLowerCase().includes(eventSearch.toLowerCase()) || e.location?.toLowerCase().includes(eventSearch.toLowerCase())).map(event => (
                  <div key={event.id} className="rounded-xl border border-border bg-card p-5 space-y-2">
                    <h3 className="font-heading text-base font-semibold text-foreground">{event.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{new Date(event.event_date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
                      {event.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>}
                      {event.area && <span className="text-primary">{event.area}</span>}
                    </div>
                    {event.description && <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>}
                    <div className="flex items-center justify-between pt-1">
                      <span className={`text-xs font-medium ${event.is_free ? "text-verdict-go" : "text-primary"}`}>{event.is_free ? "Free" : `${event.currency} ${event.ticket_price}`}</span>
                      <Link to="/auth?mode=signup"><Button size="sm">Register</Button></Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Jobs Tab */}
      {landingTab === "jobs" && (
        <section className="py-12 md:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-6">
            <div className="text-center">
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Job Board</h2>
              <p className="mt-2 text-sm text-muted-foreground">Browse jobs posted by recruiters on JobsDFY.</p>
            </div>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={jobSearch} onChange={e => setJobSearch(e.target.value)} placeholder="Search jobs..." className="pl-9" />
            </div>
            {publicJobs.filter(j => !jobSearch || j.title?.toLowerCase().includes(jobSearch.toLowerCase()) || j.company?.toLowerCase().includes(jobSearch.toLowerCase())).length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No jobs posted yet.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {publicJobs.filter(j => !jobSearch || j.title?.toLowerCase().includes(jobSearch.toLowerCase()) || j.company?.toLowerCase().includes(jobSearch.toLowerCase())).map(job => (
                  <div key={job.id} className="rounded-xl border border-border bg-card p-5 space-y-2">
                    <h3 className="font-heading text-base font-semibold text-foreground">{job.title}</h3>
                    <p className="text-xs text-muted-foreground">{job.company} · {job.city}, {job.country} · {job.work_model} · {job.employment_type}</p>
                    {job.salary_basic > 0 && <p className="text-xs text-primary font-medium">{job.salary_currency} {job.salary_basic?.toLocaleString()}{job.salary_ote ? ` – ${job.salary_ote.toLocaleString()} OTE` : ""}</p>}
                    <p className="text-xs text-muted-foreground line-clamp-2">{job.description}</p>
                    <div className="pt-1">
                      <Link to="/auth?mode=signup"><Button size="sm">Apply</Button></Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {landingTab === "home" && (<>
      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-28 md:pb-32">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-accent/30" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col-reverse items-center gap-8 md:flex-row md:gap-12">
            <div className="flex-1 text-center md:text-left">
              <motion.div
                initial="hidden" animate="visible" custom={0} variants={fadeUp}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-6"
              >
                <Sparkles className="h-3 w-3" />
                AI-powered — you're always in control
              </motion.div>
              <motion.h1
                initial="hidden" animate="visible" custom={1} variants={fadeUp}
                className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]"
              >
                Never waste time on the wrong job again.
              </motion.h1>
              <motion.p
                initial="hidden" animate="visible" custom={2} variants={fadeUp}
                className="mt-5 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed"
              >
                Paste a job link, screenshot, or voice note. AI flags hard mismatches instantly — salary, visa, location, skills — then builds your entire application pack when the role is worth it. Free forever, upgrade when you're ready.
              </motion.p>
              <motion.div
                initial="hidden" animate="visible" custom={3} variants={fadeUp}
                className="mt-8 flex flex-col items-center gap-3 sm:flex-row md:justify-start sm:justify-center"
              >
                <Link to="/auth?mode=signup">
                  <Button size="lg" className="text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6">
                    Check Your First Job Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button variant="outline" size="lg" className="text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6">See All Features</Button>
                </a>
              </motion.div>
              <motion.p
                initial="hidden" animate="visible" custom={4} variants={fadeUp}
                className="mt-4 text-xs text-muted-foreground"
              >
                ✓ 12 free credits &nbsp;·&nbsp; ✓ First job check free &nbsp;·&nbsp; ✓ No credit card &nbsp;·&nbsp; ✓ Nothing auto-sends
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex-shrink-0 w-48 sm:w-56 md:w-72 lg:w-80"
            >
              <img
                src={jobyMascot}
                alt="Joby — your AI job search superhero"
                className="w-full h-auto drop-shadow-xl"
                width={640}
                height={640}
                loading="eager"
                fetchPriority="high"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 md:py-24 bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">How It Works</h2>
            <p className="mt-2 text-sm text-muted-foreground">Four steps. Zero wasted applications.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                variants={fadeUp}
                className="relative rounded-xl border border-border bg-card p-6 text-center"
              >
                <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="absolute top-3 left-3 font-heading text-xs font-bold text-muted-foreground/50">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-heading text-base font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 md:py-24 bg-accent/20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Everything You Need to Land the Right Job</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">From first glance to final application — AI tools built for speed, accuracy, and career growth.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i % 4}
                variants={fadeUp}
                className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                    <f.icon className="h-4 w-4 text-foreground" />
                  </div>
                  <h3 className="font-heading text-sm font-semibold text-foreground">{f.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-10 border-y border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
          <p className="text-xs sm:text-sm text-muted-foreground mb-4">Trusted by job seekers who value their time</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-muted-foreground/60 font-heading font-semibold text-base sm:text-lg">
            <span>2,400+ jobs checked</span>
            <span className="hidden sm:inline">·</span>
            <span>800+ hard stops avoided</span>
            <span className="hidden sm:inline">·</span>
            <span>94% accuracy</span>
          </div>
        </div>
      </section>

      {/* Job Seeker Pricing */}
      <section id="pricing" className="py-16 md:py-24 bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Simple, Transparent Pricing</h2>
            <p className="mt-2 text-sm text-muted-foreground">Free forever. Upgrade when you need more power.</p>
          </div>

          {/* Seeker Plans */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-12">
            {seekerTiers.map((tier) => (
              <div key={tier.name} className={`rounded-xl border p-6 sm:p-8 ${tier.highlight ? "border-primary bg-card shadow-lg ring-1 ring-primary/10 relative" : "border-border bg-card"}`}>
                {tier.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-heading font-semibold text-primary-foreground">
                    Most Popular
                  </span>
                )}
                <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">{tier.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{tier.description}</p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-heading text-3xl sm:text-4xl font-bold text-foreground">{tier.price}</span>
                  {tier.period && <span className="text-sm text-muted-foreground">{tier.period}</span>}
                </div>
                <ul className="mt-5 space-y-2">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-verdict-go flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/auth?mode=signup" className="block mt-6">
                  <Button className="w-full" variant={tier.highlight ? "default" : "outline"}>
                    {tier.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          {/* Credit Packs */}
          <div className="text-center mb-6">
            <h3 className="font-heading text-lg font-semibold text-foreground">Need More Credits?</h3>
            <p className="text-xs text-muted-foreground">Buy credit packs anytime — no subscription needed.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            {creditPacks.map((pack) => (
              <div key={pack.credits} className="rounded-xl border border-border bg-card px-6 py-4 text-center">
                <p className="font-heading text-lg font-bold text-foreground">{pack.credits} credits</p>
                <p className="text-sm text-muted-foreground">{pack.price}</p>
              </div>
            ))}
          </div>

          {/* Recruiter Plans */}
          <div className="text-center mb-6">
            <h3 className="font-heading text-xl font-semibold text-foreground flex items-center justify-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" /> Recruiter Plans
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Post jobs and reach candidates. Start with 3 free posts.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 max-w-3xl mx-auto">
            {recruiterTiers.map((tier) => (
              <div key={tier.name} className="rounded-xl border border-border bg-card p-5 text-center">
                <h4 className="font-heading text-sm font-semibold text-foreground">{tier.name}</h4>
                <p className="font-heading text-2xl font-bold text-foreground mt-2">{tier.price}</p>
                <ul className="mt-3 space-y-1.5">
                  {tier.features.map((f) => (
                    <li key={f} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-verdict-go flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/auth?mode=signup" className="block mt-4">
                  <Button size="sm" variant="outline" className="w-full">{tier.cta}</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why JobsDFY */}
      <section className="py-16 md:py-24 bg-accent/20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Why Job Seekers Love JobsDFY</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              { icon: Clock, title: "Save Hours Per Application", desc: "Stop manually checking requirements. AI does the tedious work — you focus on roles that actually fit." },
              { icon: Shield, title: "Never Get Blindsided", desc: "Visa issues, salary mismatch, required certifications — dealbreakers surface before you write a single word." },
              { icon: Star, title: "Stand Out Every Time", desc: "ATS-optimised CVs, tailored cover letters, and recruiter messages personalised to each specific role." },
              { icon: Brain, title: "Know Yourself Better", desc: "Personality assessments, career timelines, and AI insights help you understand what roles truly suit you." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                variants={fadeUp}
                className="flex gap-4 rounded-xl border border-border bg-card p-5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 bg-background">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Questions & Answers</h2>
          </div>
          <div className="space-y-2.5">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-3.5 text-left"
                >
                  <span className="text-sm font-medium text-foreground pr-4">{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Extension CTA */}
      <section className="py-12 md:py-16 bg-accent/20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Browser Extension</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">One-click job checking from LinkedIn, Indeed, or any job board. Works on Chrome, Edge, Brave & Arc.</p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="/jobsdfy-extension.zip" download>
              <Button size="lg" variant="outline" className="text-sm px-6 py-5">
                <FileText className="mr-2 h-4 w-4" /> Download Extension
              </Button>
            </a>
            <Link to="/app/extension">
              <Button size="lg" variant="ghost" className="text-sm px-6 py-5">
                Installation Guide <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Affiliate CTA */}
      <section className="py-12 md:py-16 bg-primary/5">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <Handshake className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Earn 25–50% Commission</h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto">Know someone who'd love JobsDFY? Earn recurring commission on every paying referral. Tiered rates reward your success — the more you refer, the more you earn.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
            <span className="rounded-full border border-border px-3 py-1">1–5 referrals: 25%</span>
            <span className="rounded-full border border-border px-3 py-1">6–10: 30%</span>
            <span className="rounded-full border border-border px-3 py-1">11–25: 40%</span>
            <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-primary font-medium">25+: 50%</span>
          </div>
          <Link to="/auth?mode=signup">
            <Button size="lg" variant="outline" className="mt-6 text-sm px-8 py-5">
              Become an Affiliate <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-background">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Ready to stop wasting time on wrong jobs?</h2>
          <p className="mt-3 text-sm text-muted-foreground">Set up in 2 minutes. Free forever — no credit card, no catch.</p>
          <Link to="/auth?mode=signup">
            <Button size="lg" className="mt-6 text-sm sm:text-base px-8 py-5 sm:py-6">
              Check Your First Job Free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <p className="mt-3 text-xs text-muted-foreground">
            Join thousands of job seekers who refuse to waste time on mismatched roles.
          </p>
        </div>
      </section>
      </>)}

      <Footer />
    </div>
  );
};

export default Landing;
