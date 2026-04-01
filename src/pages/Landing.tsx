import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Zap, Link2, ChevronDown, Check, ArrowRight, Sparkles, Eye, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const steps = [
  { icon: Link2, title: "Share a job", description: "Paste a URL, description text, screenshot, or voice note. We handle any format — even raw LinkedIn page content." },
  { icon: Shield, title: "See dealbreakers instantly", description: "AI checks salary, visa, location, language, and skills for hard mismatches before you invest time." },
  { icon: Eye, title: "Get your fit score", description: "See how well the role matches your profile — strengths, gaps, and a clear recommendation." },
  { icon: Zap, title: "Apply fast if it's worth it", description: "Get a tailored resume draft, cover note, and recruiter message — ready to send in minutes." },
];

const features = [
  { icon: Sparkles, title: "AI-Powered Extraction", description: "Paste any format — URL, text, screenshot, or voice. AI extracts structured job data instantly." },
  { icon: Shield, title: "Dealbreaker Detection", description: "Salary, visa, location, language, skills — hard mismatches flagged before you waste a second." },
  { icon: Eye, title: "Fit Score & Gaps", description: "See exactly where you match, where you don't, and how confident we are." },
  { icon: Zap, title: "Quick Apply Packs", description: "AI-generated resume, cover note, and recruiter message tailored to each job." },
  { icon: FileText, title: "Chrome Extension", description: "One-click send from LinkedIn or any job page. No copy-paste required." },
  { icon: Link2, title: "Pipeline Tracking", description: "Track every job from discovery through application with verdict and status." },
];

const pricing = [
  { name: "Starter", price: "Free", period: "", features: ["3 job checks / month", "Basic dealbreaker check", "Extraction preview", "Manual apply"], highlight: false },
  { name: "Pro", price: "$19", period: "/mo", features: ["Unlimited job checks", "Full fit scoring", "Quick Apply packs", "Job pipeline tracking", "Chrome extension", "Priority extraction"], highlight: true },
  { name: "Team", price: "$49", period: "/mo", features: ["Everything in Pro", "Advanced role matching", "Priority processing", "Recruiter insights", "Custom templates", "Team dashboard"], highlight: false },
];

const faqs = [
  { q: "How does AI Job OS extract job information?", a: "Paste a URL, raw text, screenshot, or voice note. Our AI extracts the job title, company, salary, location, requirements, and more into structured fields you can review and edit." },
  { q: "What dealbreakers does it check for?", a: "Salary range, visa/work authorization, location/remote mismatch, language requirements, mandatory certifications, years of experience, travel requirements, and industry exclusions." },
  { q: "Is my data private?", a: "Absolutely. Your profile, non-negotiables, and job data are only visible to you. We never share your information with employers or third parties." },
  { q: "How accurate is the fit score?", a: "The fit score is based on your profile, skills, and the extracted job requirements. We show a confidence level alongside it so you know when information is inferred vs. confirmed." },
  { q: "Does AI Job OS auto-apply for me?", a: "Never. Nothing goes out without your explicit approval. We generate drafts that you review, edit, and send yourself." },
  { q: "Does it work with LinkedIn?", a: "LinkedIn blocks automated scraping, but our Chrome extension lets you send jobs with one click. You can also use Smart Paste — just Ctrl+A, Ctrl+C any job page and paste the raw content." },
];

const Landing = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <span className="font-heading text-lg sm:text-xl font-bold text-foreground tracking-tight">AI Job OS</span>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-28 md:pb-32">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-accent/30" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <motion.div
            initial="hidden" animate="visible" custom={0} variants={fadeUp}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-6"
          >
            <Sparkles className="h-3 w-3" />
            Powered by AI — never auto-sends
          </motion.div>
          <motion.h1
            initial="hidden" animate="visible" custom={1} variants={fadeUp}
            className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]"
          >
            Never waste time on the wrong job again.
          </motion.h1>
          <motion.p
            initial="hidden" animate="visible" custom={2} variants={fadeUp}
            className="mx-auto mt-5 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed"
          >
            Paste a job link, screenshot, or voice note. AI flags hard mismatches — salary, visa, location, language, skills — before you invest time. Then helps you apply fast when the role is worth it.
          </motion.p>
          <motion.div
            initial="hidden" animate="visible" custom={3} variants={fadeUp}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            <Link to="/auth?mode=signup">
              <Button size="lg" className="text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="outline" size="lg" className="text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6">See How It Works</Button>
            </a>
          </motion.div>
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
      <section className="py-16 md:py-24 bg-accent/20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Everything You Need</h2>
            <p className="mt-2 text-sm text-muted-foreground">Built for speed, accuracy, and peace of mind.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                variants={fadeUp}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                    <f.icon className="h-4 w-4 text-foreground" />
                  </div>
                  <h3 className="font-heading text-sm font-semibold text-foreground">{f.title}</h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{f.description}</p>
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

      {/* Pricing */}
      <section className="py-16 md:py-24 bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Simple, Transparent Pricing</h2>
            <p className="mt-2 text-sm text-muted-foreground">Start free. Upgrade when you need more.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pricing.map((tier) => (
              <div key={tier.name} className={`rounded-xl border p-6 sm:p-8 ${tier.highlight ? "border-primary bg-card shadow-lg ring-1 ring-primary/10 relative" : "border-border bg-card"}`}>
                {tier.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-heading font-semibold text-primary-foreground">
                    Most Popular
                  </span>
                )}
                <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">{tier.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-heading text-3xl sm:text-4xl font-bold text-foreground">{tier.price}</span>
                  {tier.period && <span className="text-sm text-muted-foreground">{tier.period}</span>}
                </div>
                <ul className="mt-5 space-y-2.5">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-verdict-go flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/auth?mode=signup" className="block mt-6">
                  <Button className="w-full" variant={tier.highlight ? "default" : "outline"}>
                    {tier.price === "Free" ? "Get Started" : "Subscribe"}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 bg-accent/20">
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

      {/* CTA */}
      <section className="py-16 md:py-24 bg-background">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Ready to stop wasting time?</h2>
          <p className="mt-3 text-sm text-muted-foreground">Set up in 2 minutes. Check your first job free.</p>
          <Link to="/auth?mode=signup">
            <Button size="lg" className="mt-6 text-sm sm:text-base px-8 py-5 sm:py-6">
              Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-8 sm:py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <span className="font-heading text-sm font-semibold text-foreground">AI Job OS</span>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} AI Job OS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
