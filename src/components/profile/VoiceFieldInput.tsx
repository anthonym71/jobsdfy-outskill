import { useState, useCallback, useRef, useEffect } from "react";
import { Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface VoiceFieldInputProps {
  onResult: (text: string) => void;
  options?: string[];
  label?: string;
  className?: string;
  /** If provided, voice result is appended to this value instead of replacing */
  currentValue?: string;
}

const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

const VoiceFieldInput = ({ onResult, options, label, className, currentValue }: VoiceFieldInputProps) => {
  const { toast } = useToast();
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const handledRef = useRef(false);
  const transcriptRef = useRef("");
  const resultRef = useRef(onResult);
  const valueRef = useRef(currentValue);
  resultRef.current = onResult; valueRef.current = currentValue;

  useEffect(() => {
    const stopOther = (event: Event) => {
      if ((event as CustomEvent).detail !== recognitionRef.current) recognitionRef.current?.stop();
    };
    window.addEventListener("jobsdfy:field-dictation", stopOther);
    return () => { window.removeEventListener("jobsdfy:field-dictation", stopOther); recognitionRef.current?.stop(); };
  }, []);

  const fuzzyMatch = useCallback((spoken: string, opts: string[]): string | null => {
    const lower = spoken.toLowerCase().trim();
    const exact = opts.find(o => o.toLowerCase() === lower);
    if (exact) return exact;
    const starts = opts.find(o => o.toLowerCase().startsWith(lower) || lower.startsWith(o.toLowerCase()));
    if (starts) return starts;
    const contains = opts.find(o => o.toLowerCase().includes(lower) || lower.includes(o.toLowerCase()));
    if (contains) return contains;
    const norm = lower.replace(/[-\s]/g, "");
    const normMatch = opts.find(o => o.toLowerCase().replace(/[-\s]/g, "") === norm);
    if (normMatch) return normMatch;
    return null;
  }, []);

  const toggle = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    if (!SpeechRecognitionAPI) {
      toast({
        title: "Not supported",
        description: "Voice input requires Chrome, Edge, or Safari (not in iframe preview — publish first).",
        variant: "destructive",
      });
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;
    handledRef.current = false;
    transcriptRef.current = "";
    window.dispatchEvent(new CustomEvent("jobsdfy:field-dictation", { detail: recognition }));

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as ArrayLike<any>).map((result: any) => result[0]?.transcript || "").join(" ").trim();
      if (!transcript) return;
      transcriptRef.current = transcript;

      if (options && options.length > 0) {
        const matched = fuzzyMatch(transcript, options);
        if (matched) {
          resultRef.current(matched);
          handledRef.current = true;
        } else {
          if (event.results[event.results.length - 1]?.isFinal) toast({
            title: "No match",
            description: `You said "${transcript}". Try: ${options.slice(0, 5).join(", ")}`,
            variant: "destructive",
          });
        }
      } else {
        // Append to existing value instead of replacing
        const existing = (currentValue || "").trim();
        const newValue = existing ? `${existing} ${transcript}` : transcript;
        resultRef.current(newValue);
        handledRef.current = true;
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "aborted") { setListening(false); return; }
      console.error("Speech error:", event.error);
      const messages: Record<string, string> = {
        "not-allowed": "Microphone blocked — check browser settings. Won't work in iframe preview.",
        "no-speech": "No speech detected — try again.",
        "aborted": "Cancelled.",
      };
      toast({ title: messages[event.error] || `Error: ${event.error}`, variant: "destructive" });
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      if (!handledRef.current && !transcriptRef.current) toast({ title: "No words captured", description: "Check your browser's default microphone, then try again.", variant: "destructive" });
    };

    if (options && options.length > 0) {
      toast({ title: `🎤 Say: ${options.slice(0, 5).join(", ")}${options.length > 5 ? "…" : ""}` });
    } else {
      toast({ title: `🎤 Listening for ${label || "input"}…` });
    }

    recognition.start();
    setListening(true);
  }, [listening, onResult, options, label, fuzzyMatch, toast, currentValue]);

  return (
    <Button variant="ghost" size="icon"
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        listening
          ? "text-primary"
          : "text-muted-foreground hover:text-primary",
        className
      )}
      title={listening ? "Stop listening" : (label ? `Voice input for ${label}` : "Voice input")}
      aria-label={listening ? `Stop voice input for ${label || "input"}` : `Voice input for ${label || "input"}`}
      aria-pressed={listening}
    >
      <span className="relative inline-flex">
        <Mic className="h-3.5 w-3.5" />
        {listening && (
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
        )}
      </span>
    </Button>
  );
};

export default VoiceFieldInput;
