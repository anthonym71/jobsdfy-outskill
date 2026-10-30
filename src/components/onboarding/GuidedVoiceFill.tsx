import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isContinueCommand, isSkipCommand, isStopCommand, spokenNumber } from "@/lib/voiceCommands";

export type GuidedField = {
  key: string;
  question: string;
  type?: "text" | "number";
  /** value -> spoken words that select it */
  options?: { value: string; words: string[] }[];
};

interface Props {
  fields: GuidedField[];
  values: Record<string, string>;
  onFill: (key: string, value: string) => void;
  /** Called when the user says "continue" after the last question */
  onContinue: () => void;
}

const SR = typeof window !== "undefined" ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;

const speak = (text: string) => new Promise<void>((resolve) => {
  if (!("speechSynthesis" in window)) return resolve();
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.05;
  u.onend = () => resolve();
  u.onerror = () => resolve();
  window.speechSynthesis.speak(u);
});

/** Free, in-browser guided voice form filling: asks each field, listens, fills, then waits for "continue". */
const GuidedVoiceFill = ({ fields, values, onFill, onContinue }: Props) => {
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState("");
  const activeRef = useRef(false);
  const recRef = useRef<any>(null);

  const listen = () => new Promise<string>((resolve) => {
    const r = new SR();
    r.lang = "en-US"; r.interimResults = false; r.continuous = false;
    recRef.current = r;
    let said = "";
    r.onresult = (e: any) => { said = e.results[0][0].transcript; };
    r.onend = () => resolve(said.trim());
    r.onerror = () => resolve("");
    r.start();
  });

  const stop = useCallback((msg = "Voice input stopped") => {
    activeRef.current = false;
    setActive(false);
    recRef.current?.abort?.();
    window.speechSynthesis?.cancel();
    setStatus(msg);
  }, []);

  useEffect(() => () => stop(""), [stop]);

  const run = async () => {
    if (!SR) { setStatus("Voice input needs Chrome, Edge or Safari on the published site."); return; }
    activeRef.current = true; setActive(true);
    for (const f of fields) {
      if (!activeRef.current) return;
      if (values[f.key]) continue; // already filled
      let attempts = 0;
      while (activeRef.current && attempts < 2) {
        setStatus(f.question);
        await speak(f.question);
        if (!activeRef.current) return;
        const said = await listen();
        if (!activeRef.current) return;
        if (!said) { attempts++; continue; }
        if (isStopCommand(said)) return stop("Paused — press Voice Input to carry on.");
        if (isSkipCommand(said)) break;
        let value = said;
        if (f.type === "number") value = spokenNumber(said);
        if (f.options) {
          const low = said.toLowerCase();
          value = f.options.find((o) => o.words.some((w) => low.includes(w)))?.value || "";
        }
        if (value) { onFill(f.key, value); break; }
        attempts++;
      }
    }
    if (!activeRef.current) return;
    setStatus('All done here. Say "continue" to go to the next page.');
    await speak("Thanks. Check the answers, then say continue to move on.");
    for (let i = 0; i < 3 && activeRef.current; i++) {
      const said = await listen();
      if (isContinueCommand(said)) { stop(""); onContinue(); return; }
      if (isStopCommand(said)) break;
    }
    stop("Press Continue when you're ready.");
  };

  return (
    <div className="flex flex-col items-end gap-1">
      {active ? (
        <Button type="button" variant="outline" onClick={() => stop()} className="gap-2">
          <Square className="h-4 w-4" /> Stop voice
        </Button>
      ) : (
        <Button type="button" variant="secondary" onClick={run} className="gap-2">
          <Mic className="h-4 w-4" /> Voice Input
        </Button>
      )}
      {status && <p className="max-w-xs text-right text-xs text-muted-foreground" aria-live="polite">{status}</p>}
    </div>
  );
};

export default GuidedVoiceFill;
