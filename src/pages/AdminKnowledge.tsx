import { useMemo, useState } from "react";
import { Download, Search, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import guide from "@/content/user-guide.json";
import { GHL_WIDGET_ID } from "@/lib/ghl";

const AdminKnowledge = () => {
  const [q, setQ] = useState("");
  const sections = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return guide.sections;
    return guide.sections
      .map((s) => ({ ...s, body: s.title.toLowerCase().includes(t) ? s.body : s.body.filter((b) => b.toLowerCase().includes(t)) }))
      .filter((s) => s.body.length);
  }, [q]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Knowledgebase & User Guide</h1>
          <p className="text-sm text-muted-foreground">Version {guide.version}. This content also powers the support bot.</p>
        </div>
        <Button asChild className="gap-2">
          <a href="/downloads/jobsdfy-user-guide.pdf" download="jobsdfy-user-guide.pdf"><Download className="h-4 w-4" />Download PDF</a>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the knowledgebase…" className="pl-9" />
      </div>

      <div className="rounded-xl border border-border bg-card p-4 text-sm">
        <div className="flex items-center gap-2 font-medium text-foreground"><MessageCircle className="h-4 w-4" />Support bot (GoHighLevel)</div>
        <p className="mt-1 text-muted-foreground">
          {GHL_WIDGET_ID ? "Connected — the chat bubble shows across the site." : "Not connected yet. Send us your GHL chat widget ID and it will appear across the site. Upload the PDF above into the GHL bot's knowledge so it answers from this guide."}
        </p>
      </div>

      {sections.map((s) => (
        <section key={s.id} className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-heading text-lg font-semibold text-foreground">{s.title}</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            {s.body.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        </section>
      ))}
      {!sections.length && <p className="text-sm text-muted-foreground">No matches.</p>}
    </div>
  );
};

export default AdminKnowledge;
