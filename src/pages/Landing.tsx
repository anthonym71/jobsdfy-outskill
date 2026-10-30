import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { ArrowRight, Check, ChevronDown, ClipboardPaste, FileSearch, Moon, ShieldCheck, Sun, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/layout/Footer";
import BlockerCard from "@/components/BlockerCard";
import VerdictBadge from "@/components/VerdictBadge";
import { supabase } from "@/integrations/supabase/client";
import { STRIPE_TIERS } from "@/hooks/useSubscription";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45 } }),
};

// A worked example, clearly labelled as one. The posting is invented for illustration.
const EXAMPLE_CARDS = [
  {
    category: "Notice period", status: "confirmed" as const, userValue: "60 days", jobValue: "up to 15 days (required)",
    quote: "Candidates serving notice longer than 15 days will not be considered.", note: "Your notice period is longer than the posting accepts.",
  },
  {
    category: "Salary", status: "confirmed" as const, userValue: "at least INR 25,00,000 a year", jobValue: "INR 18,00,000 to INR 24,00,000",
    quote: "CTC: INR 18-24 LPA", note: "The top of the range is below your minimum.",
  },
  {
    category: "Work model", status: "confirmed" as const, userValue: "up to 3 office days a week", jobValue: "fully on site",
    quote: "work-from-office role, 5 days a week", note: "Fully on site is more office time than you accept.",
  },
];

const STEPS = [
  { icon: ClipboardPaste, title: "Paste the posting", text: "A link, the text, or a page copied from LinkedIn, Naukri or a careers page. We read it into fields you can correct." },
  { icon: FileSearch, title: "See what breaks, and what it doesn't say", text: "Each of your hard limits is checked one by one. You get the line from the posting that decided it, or a plain \"the posting doesn't say\"." },
  { icon: UserCheck, title: "Apply only when it is worth it", text: "If it clears your limits, draft your CV and note from your own profile. You review every line and send it yourself." },
];

const ANSWERS = [
  { verdict: "go" as const, title: "Nothing in your way", text: "Every limit we could check fits. Next step: apply." },
  { verdict: "review" as const, title: "Check these first", text: "The posting is silent or vague on a limit that matters, such as salary or office days. We name each one so you can ask before you invest the time." },
  { verdict: "stop" as const, title: "Skip it", text: "A limit you set is broken. We show which one and the exact line that broke it." },
];

const PRINCIPLES = [
  { title: "Quotes, not scores", text: "No mystery 87% match. Every result points to the words in the posting that caused it, so you can check us." },
  { title: "We say when we cannot tell", text: "If the posting does not say, we do not guess. Unknown on a hard limit means REVIEW, never a quiet GO." },
  { title: "Limits that fit how Indian hiring works", text: "Set your notice period, minimum CTC in lakh per annum, office days per week, languages and the industries you will not work in." },
  { title: "Warning signs, not accusations", text: "We flag patterns like fees to apply, chat-app-only contact and reposted listings. We never call a job fake. We tell you what to verify." },
  { title: "Your CV, not our inventions", text: "Every line in a drafted application points to a record in your profile, and numbers that are not in your profile are flagged." },
  { title: "You press send", text: "Nothing is submitted for you. Drafts wait for your review." },
];

const FAQS = [
  { q: "How accurate is it?", a: "It can misread a posting, which is why every result shows the line it relied on. If something looks wrong, tap \"This looks wrong\" on that card. We keep those reports to improve the checks." },
  { q: "Does it apply to jobs for me?", a: "No. We draft a CV and note from your profile, you read every line, and you apply on the employer's own site or by email." },
  { q: "Which limits can I set?", a: "Minimum salary or CTC, countries you can work in, office days per week, notice period, languages, employment type, maximum travel, and industries to avoid." },
  { q: "Can it tell me if a job is fake?", a: "No, and it will not pretend to. It lists warning signs it can see in the text, such as requests for money, and tells you what to verify. It cannot see who posted a job or whether it is still open." },
  { q: "What if the posting leaves something out?", a: "Then the result for that limit is \"the posting doesn't say\" and the overall answer is REVIEW. We add a task to remind you to ask." },
  { q: "How do I get postings in?", a: "Paste a link or the text. LinkedIn blocks automated reading, so copy the description from the page and paste it. The Chrome extension can also send a job in one click." },
  { q: "Is my data private?", a: "Your profile and saved jobs belong to your account. See the privacy policy linked in the footer for the details." },
  { q: "What do credits do?", a: "Credits pay for AI work such as drafting an application pack. New accounts get 12 credits and the first posting check is free." },
];

const TIERS = [
  { name: "Free", price: "Free", period: "", note: "No card needed.", features: ["First posting check free", "12 credits to start", "Verdict with quoted evidence", "Posting warning signs"], cta: "Check a posting free", highlight: false },
  { name: STRIPE_TIERS.pro.name, price: `$${STRIPE_TIERS.pro.price}`, period: "/month", note: `${STRIPE_TIERS.pro.credits} credits a month`, features: ["Application packs traced to your profile", "Follow-up tasks and calendar export", "Everything in Free"], cta: "Start free, upgrade later", highlight: true },
  { name: STRIPE_TIERS.premium.name, price: `$${STRIPE_TIERS.premium.price}`, period: "/month", note: `${STRIPE_TIERS.premium.credits} credits a month`, features: ["Interview practice", "More credits for heavy searching", "Everything in Pro"], cta: "Start free, upgrade later", highlight: false },
];

const Landing = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    supabase.functions.invoke("track-pageview", { body: { page: "/", referrer: document.referrer } }).catch(() => {});
  }, []);

  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>

      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6" aria-label="Main">
          <Link to="/" className="font-heading text-xl font-bold tracking-tight">JobsDFY</Link>
          <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#example" className="hover:text-foreground">Example</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/auth?mode=signup"><Button size="sm">Start free<ArrowRight className="ml-1 h-3.5 w-3.5" /></Button></Link>
          </div>
        </nav>
      </header>

      <main id="main">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-accent/60 to-transparent" />
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-4 pb-16 pt-14 sm:px-6 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:items-start lg:gap-14">
            <motion.div initial="hidden" animate="visible" className="min-w-0 space-y-6 lg:pt-6">
              <motion.p variants={fadeUp} custom={0} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-verdict-go" aria-hidden />Notice period, CTC, office days: checked before you tailor
              </motion.p>
              <motion.h1 variants={fadeUp} custom={1} className="font-heading text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
                Check the posting first.
              </motion.h1>
              <motion.p variants={fadeUp} custom={2} className="max-w-xl text-lg leading-relaxed text-muted-foreground">
                Paste a job posting. We compare it with your hard limits and tell you <strong className="text-foreground">GO</strong>, <strong className="text-foreground">REVIEW</strong> or <strong className="text-foreground">STOP</strong>, naming the limit that broke and quoting the line that broke it.
              </motion.p>
              <motion.div variants={fadeUp} custom={3} className="flex flex-col gap-3 sm:flex-row">
                <Link to="/auth?mode=signup"><Button size="lg" className="w-full sm:w-auto">Check a posting free<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
                <a href="#example"><Button size="lg" variant="outline" className="w-full sm:w-auto">See an example</Button></a>
              </motion.div>
              <motion.p variants={fadeUp} custom={4} className="text-sm text-muted-foreground">
                You always apply yourself. Nothing is sent for you.
              </motion.p>
            </motion.div>

            {/* Worked example */}
            <motion.div id="example" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="min-w-0 scroll-mt-24 rounded-2xl border border-border bg-card p-4 shadow-xl shadow-primary/5 sm:p-6" aria-label="Example result">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Example, not a real posting</p>
                  <p className="truncate font-heading text-base font-semibold">Backend Engineer · Fintech startup, Bengaluru</p>
                </div>
                <VerdictBadge verdict="stop" size="lg" />
              </div>
              <p className="mb-4 rounded-lg bg-verdict-stop-bg px-3 py-2 text-sm text-verdict-stop">Stop: this role breaks your limit on Notice period, Salary, Work model.</p>
              <div className="grid gap-3">
                {EXAMPLE_CARDS.map((c) => <BlockerCard key={c.category} {...c} />)}
              </div>
              <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Check className="h-3.5 w-3.5 text-verdict-go" aria-hidden />Also checked and fine: employment type, location, language, travel.</p>
            </motion.div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 border-y border-border bg-card/50 py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">The check you run before you spend an hour tailoring</h2>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent"><s.icon className="h-5 w-5 text-foreground" aria-hidden /></span>
                    <span className="text-xs font-semibold text-muted-foreground">Step {i + 1}</span>
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Three answers */}
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Three answers, each with a next step</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {ANSWERS.map((a) => (
                <div key={a.verdict} className={`rounded-xl border p-6 verdict-banner-${a.verdict}`}>
                  <VerdictBadge verdict={a.verdict} />
                  <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">{a.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/80">{a.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Principles */}
        <section className="border-y border-border bg-card/50 py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Built to be checked, not trusted blindly</h2>
            <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {PRINCIPLES.map((p) => (
                <div key={p.title}>
                  <h3 className="flex items-start gap-2 font-heading text-base font-semibold"><Check className="mt-1 h-4 w-4 shrink-0 text-verdict-go" aria-hidden />{p.title}</h3>
                  <p className="mt-2 pl-6 text-sm leading-relaxed text-muted-foreground">{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-20 py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Start free</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Checking a posting is cheap. Credits pay for AI drafting. Prices are in US dollars and billed monthly.</p>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {TIERS.map((t) => (
                <div key={t.name} className={`flex flex-col rounded-xl border p-6 ${t.highlight ? "border-primary bg-card shadow-lg shadow-primary/10" : "border-border bg-card"}`}>
                  <h3 className="font-heading text-lg font-semibold">{t.name}</h3>
                  <p className="mt-3 flex items-baseline gap-1"><span className="font-heading text-3xl font-bold">{t.price}</span><span className="text-sm text-muted-foreground">{t.period}</span></p>
                  <p className="mt-1 text-sm text-muted-foreground">{t.note}</p>
                  <ul className="mt-5 flex-1 space-y-2 text-sm">
                    {t.features.map((f) => <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-verdict-go" aria-hidden />{f}</li>)}
                  </ul>
                  <Link to="/auth?mode=signup" className="mt-6"><Button className="w-full" variant={t.highlight ? "default" : "outline"}>{t.cta}</Button></Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 border-t border-border bg-card/50 py-16 md:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Questions</h2>
            <div className="mt-8 divide-y divide-border rounded-xl border border-border bg-card">
              {FAQS.map((f, i) => (
                <div key={f.q}>
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      aria-expanded={openFaq === i}
                      aria-controls={`faq-${i}`}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium hover:bg-accent/40"
                    >
                      {f.q}
                      <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${openFaq === i ? "rotate-180" : ""}`} aria-hidden />
                    </button>
                  </h3>
                  {openFaq === i && <p id={`faq-${i}`} className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final call */}
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Stop tailoring for jobs that were never going to work.</h2>
            <p className="mt-3 text-muted-foreground">Paste your first posting and see which of your limits it breaks.</p>
            <Link to="/auth?mode=signup" className="mt-6 inline-block"><Button size="lg">Check a posting free<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Landing;
