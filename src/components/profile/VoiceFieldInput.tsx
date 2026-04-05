import { useState, useCallback, useRef } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface VoiceFieldInputProps {
  /** Called with the transcribed text */
  onResult: (text: string) => void;
  /** For dropdowns: list of valid option labels to fuzzy-match against */
  options?: string[];
  /** Label shown in tooltip / aria */
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
    // Exact match
    const exact = opts.find(o => o.toLowerCase() === lower);
    if (exact) return exact;
    // Starts-with match
    const starts = opts.find(o => o.toLowerCase().startsWith(lower));
    if (starts) return starts;
    // Contains match
    const contains = opts.find(o => o.toLowerCase().includes(lower) || lower.includes(o.toLowerCase()));
    if (contains) return contains;
    return null;
  }, []);

  const startListening = useCallback(() => {
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
      }
      setListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        toast({ title: "Microphone blocked", description: "Allow microphone access in browser settings.", variant: "destructive" });
      }
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    if (options && options.length > 0) {
      toast({ title: `Say one of: ${options.slice(0, 6).join(", ")}${options.length > 6 ? "…" : ""}` });
    }

    recognition.start();
    setListening(true);
  }, [onResult, options, fuzzyMatch, toast]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("h-6 w-6 p-0 flex-shrink-0", className)}
      onClick={listening ? stopListening : startListening}
      title={label ? `Voice input for ${label}` : "Voice input"}
    >
      {listening ? (
        <MicOff className="h-3.5 w-3.5 text-destructive animate-pulse" />
      ) : (
        <Mic className="h-3.5 w-3.5 text-muted-foreground hover:text-primary transition-colors" />
      )}
    </Button>
  );
};

export default VoiceFieldInput;
