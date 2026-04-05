import { useState, useCallback, useRef } from "react";
import { Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface VoiceFieldInputProps {
  onResult: (text: string) => void;
  options?: string[];
  label?: string;
  className?: string;
}

const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

const VoiceFieldInput = ({ onResult, options, label, className }: VoiceFieldInputProps) => {
  const { toast } = useToast();
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const fuzzyMatch = useCallback((spoken: string, opts: string[]): string | null => {
    const lower = spoken.toLowerCase().trim();
    const exact = opts.find(o => o.toLowerCase() === lower);
    if (exact) return exact;
    const starts = opts.find(o => o.toLowerCase().startsWith(lower));
    if (starts) return starts;
    const contains = opts.find(o => o.toLowerCase().includes(lower) || lower.includes(o.toLowerCase()));
    if (contains) return contains;
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
        description: "Voice input requires Chrome, Edge, or Safari.",
        variant: "destructive",
      });
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript as string;

      if (options && options.length > 0) {
        const matched = fuzzyMatch(transcript, options);
        if (matched) {
          onResult(matched);
          toast({ title: `Selected: ${matched}` });
        } else {
          toast({
            title: "No match found",
            description: `You said "${transcript}". Options: ${options.join(", ")}`,
            variant: "destructive",
          });
        }
      } else {
        onResult(transcript);
        toast({ title: "Voice captured", description: transcript.slice(0, 60) + (transcript.length > 60 ? "…" : "") });
      }
      setListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        toast({ title: "Microphone blocked", description: "Allow microphone access in your browser settings.", variant: "destructive" });
      } else if (event.error === "no-speech") {
        toast({ title: "No speech detected", description: "Try again and speak clearly.", variant: "destructive" });
      } else {
        toast({ title: "Voice input failed", description: `Error: ${event.error}`, variant: "destructive" });
      }
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    if (options && options.length > 0) {
      toast({ title: `Say one of: ${options.slice(0, 6).join(", ")}${options.length > 6 ? "…" : ""}` });
    } else {
      toast({ title: `Listening for ${label || "input"}…`, description: "Speak now." });
    }

    recognition.start();
    setListening(true);
  }, [listening, onResult, options, label, fuzzyMatch, toast]);

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        listening
          ? "text-destructive"
          : "text-muted-foreground hover:text-primary",
        className
      )}
      title={listening ? "Stop listening" : (label ? `Voice input for ${label}` : "Voice input")}
    >
      {listening ? (
        <MicOff className="h-3.5 w-3.5 animate-pulse" />
      ) : (
        <Mic className="h-3.5 w-3.5" />
      )}
    </button>
  );
};

export default VoiceFieldInput;
