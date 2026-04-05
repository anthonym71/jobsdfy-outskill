import { useState, useCallback, useRef } from "react";
import { Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
      setListening(false);
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
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;
    handledRef.current = false;

    recognition.onresult = (event: any) => {
      // Prevent duplicate firing
      if (handledRef.current) return;
      handledRef.current = true;

      const transcript = (event.results[0][0].transcript as string).trim();

      if (options && options.length > 0) {
        const matched = fuzzyMatch(transcript, options);
        if (matched) {
          onResult(matched);
          toast({ title: `✓ ${matched}` });
        } else {
          toast({
            title: "No match",
            description: `You said "${transcript}". Try: ${options.slice(0, 5).join(", ")}`,
            variant: "destructive",
          });
        }
      } else {
        // Append to existing value instead of replacing
        const existing = (currentValue || "").trim();
        const newValue = existing ? `${existing} ${transcript}` : transcript;
        onResult(newValue);
        toast({ title: "✓ Voice captured", description: transcript.slice(0, 80) });
      }
      setListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error:", event.error);
      const messages: Record<string, string> = {
        "not-allowed": "Microphone blocked — check browser settings. Won't work in iframe preview.",
        "no-speech": "No speech detected — try again.",
        "aborted": "Cancelled.",
      };
      toast({ title: messages[event.error] || `Error: ${event.error}`, variant: "destructive" });
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    if (options && options.length > 0) {
      toast({ title: `🎤 Say: ${options.slice(0, 5).join(", ")}${options.length > 5 ? "…" : ""}` });
    } else {
      toast({ title: `🎤 Listening for ${label || "input"}…` });
    }

    recognition.start();
    setListening(true);
  }, [listening, onResult, options, label, fuzzyMatch, toast, currentValue]);

  return (
    <button
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
    >
      <span className="relative inline-flex">
        <Mic className="h-3.5 w-3.5" />
        {listening && (
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
        )}
      </span>
    </button>
  );
};

export default VoiceFieldInput;
