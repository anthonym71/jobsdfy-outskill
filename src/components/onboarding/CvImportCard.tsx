import { useRef, useState } from "react";
import { CheckCircle2, FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { understood, type ParsedCv } from "@/lib/cvImport";

/**
 * Import-first onboarding: upload a CV, then see what we understood and correct it in the fields below.
 * Nothing is saved until the user finishes onboarding.
 */
const CvImportCard = ({ onParsed }: { onParsed: (cv: ParsedCv) => void }) => {
  const { session } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "parsing" | "done">("idle");
  const [error, setError] = useState("");
  const [cv, setCv] = useState<ParsedCv | null>(null);

  const handleFile = async (file: File) => {
    setError("");
    if (!session) return setError("Please sign in again.");
    if (file.size > 5 * 1024 * 1024) return setError("That file is over 5 MB.");
    const isPdf = file.name.toLowerCase().endsWith(".pdf");
    const isText = /\.(txt|md)$/i.test(file.name);
    if (!isPdf && !isText) return setError("Use a PDF or a plain text file. For Word files, save as PDF first.");

    setState("parsing");
    try {
      let body: Record<string, string>;
      if (isPdf) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        let binary = "";
        for (const b of bytes) binary += String.fromCharCode(b);
        body = { pdfBase64: btoa(binary), fileName: file.name };
      } else {
        const text = await file.text();
        if (text.trim().length < 50) throw new Error("That file has too little text to read.");
        body = { cvText: text };
      }
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-cv`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "We could not read that CV.");
      setCv(data.data);
      onParsed(data.data);
      setState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "We could not read that CV.");
      setState("idle");
    }
  };

  if (state === "done" && cv) {
    const facts = understood(cv);
    return (
      <section className="rounded-lg border border-verdict-go/30 bg-verdict-go-bg p-4" aria-label="What we understood from your CV">
        <div className="flex items-center gap-2 font-heading text-sm font-semibold text-foreground">
          <CheckCircle2 className="h-4 w-4 text-verdict-go" aria-hidden />What we understood from your CV
        </div>
        {facts.length ? (
          <dl className="mt-3 space-y-1.5 text-sm">
            {facts.map((f) => (
              <div key={f.label} className="flex gap-3">
                <dt className="w-24 shrink-0 text-muted-foreground">{f.label}</dt>
                <dd className="min-w-0 text-foreground">{f.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">We could not find clear details in that file. Fill in the fields below.</p>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          We filled the fields below. Check each one and fix anything wrong. Your work history and education are added when you finish.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-dashed border-border bg-accent/30 p-4" aria-label="Import your CV">
      <div className="flex items-start gap-3">
        <FileUp className="mt-0.5 h-5 w-5 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-heading text-sm font-semibold text-foreground">Start from your CV</p>
          <p className="mt-1 text-xs text-muted-foreground">Upload a PDF or text file and we will fill in your profile. You check it before anything is saved.</p>
          <input ref={inputRef} type="file" accept=".pdf,.txt,.md" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ""; }} />
          <Button type="button" size="sm" variant="outline" className="mt-3" disabled={state === "parsing"} onClick={() => inputRef.current?.click()}>
            {state === "parsing" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Reading your CV…</> : "Choose a CV"}
          </Button>
          {error && <p role="alert" className="mt-2 text-xs text-verdict-stop">{error}</p>}
        </div>
      </div>
    </section>
  );
};

export default CvImportCard;
