import { useState, useCallback, useEffect, useRef } from "react";
import { useConversation, ConversationProvider } from "@elevenlabs/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mic, MicOff, Loader2, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VoiceCVBuilderProps {
  category: string;
  categoryLabel: string;
  onDataExtracted?: (data: any) => void;
}

const VoiceCVBuilderInner = ({ category, categoryLabel, onDataExtracted, onClose }: VoiceCVBuilderProps & { onClose: () => void }) => {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [inputVolume, setInputVolume] = useState(0);
  const [outputVolume, setOutputVolume] = useState(0);
  const animationRef = useRef<number>();

  const conversation = useConversation({
    onConnect: () => {
      toast({ title: "Joby is ready!", description: `Tell me about your ${categoryLabel.toLowerCase()}.` });
    },
    onDisconnect: () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    },
    onMessage: (message) => {
      if (message.type === "user_transcript") {
        setTranscript(prev => [...prev, `You: ${(message as any).user_transcription_event?.user_transcript || ""}`]);
      } else if (message.type === "agent_response") {
        setTranscript(prev => [...prev, `Joby: ${(message as any).agent_response_event?.agent_response || ""}`]);
      }
    },
    onError: (error) => {
      console.error("Voice CV error:", error);
      toast({ title: "Connection Error", description: "Failed to connect. Please try again.", variant: "destructive" });
    },
  });

  // Poll volume levels
  useEffect(() => {
    if (conversation.status !== "connected") return;
    const poll = () => {
      setInputVolume(conversation.getInputVolume?.() ?? 0);
      setOutputVolume(conversation.getOutputVolume?.() ?? 0);
      animationRef.current = requestAnimationFrame(poll);
    };
    poll();
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [conversation.status]);

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const { data, error } = await supabase.functions.invoke("elevenlabs-conversation-token");
      if (error || !data?.signed_url) throw new Error(data?.error || error?.message || "Failed to get signed URL");

      await conversation.startSession({ signedUrl: data.signed_url });
    } catch (e: any) {
      if (e.name === "NotAllowedError") {
        toast({ title: "Microphone Required", description: "Please allow microphone access.", variant: "destructive" });
      } else {
        toast({ title: "Connection Failed", description: e.message, variant: "destructive" });
      }
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, toast]);

  const stopAndExtract = useCallback(async () => {
    await conversation.endSession();
    if (transcript.length > 0) {
      toast({ title: "Processing your responses…", description: "Extracting profile data from conversation." });
      try {
        const { data, error } = await supabase.functions.invoke("voice-profile-extract", {
          body: { transcript: transcript.join("\n"), category },
        });
        if (error) throw error;
        if (data?.data) {
          onDataExtracted?.(data.data);
          toast({ title: "Data extracted!", description: "Review the extracted information below." });
        }
      } catch (e: any) {
        toast({ title: "Extraction failed", description: e.message, variant: "destructive" });
      }
    }
    onClose();
  }, [conversation, transcript, category, onDataExtracted, onClose, toast]);

  const isConnected = conversation.status === "connected";

  // Generate waveform bars from volume
  const generateBars = (volume: number, count: number) =>
    Array.from({ length: count }, (_, i) => {
      const base = 4;
      const max = 28;
      const variation = Math.sin(Date.now() / 200 + i * 0.8) * 0.3 + 0.7;
      return base + volume * max * variation;
    });

  const inputBars = generateBars(inputVolume, 7);
  const outputBars = generateBars(outputVolume, 7);

  return (
    <div className="space-y-5">
      {/* Joby Avatar & Status */}
      <div className="flex flex-col items-center gap-3">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30">
          <img src="/joby-192.png" alt="Joby" className="h-16 w-16 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">
            {isConnected ? (conversation.isSpeaking ? "Joby is speaking…" : "Listening to you…") : "Ready to talk"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isConnected ? `Tell Joby about your ${categoryLabel.toLowerCase()}` : "Click start to begin your voice session"}
          </p>
        </div>
      </div>

      {/* Waveform Visualization */}
      {isConnected && (
        <div className="space-y-3">
          {/* Output (Joby speaking) */}
          <div className="flex items-center gap-2">
            <Volume2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            <div className="flex items-center gap-[2px] h-8 flex-1 justify-center">
              {outputBars.map((h, i) => (
                <div key={`o${i}`} className="w-1.5 rounded-full bg-primary/70 transition-all duration-75" style={{ height: `${h}px` }} />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground w-12">Speaker</span>
          </div>
          {/* Input (User mic) */}
          <div className="flex items-center gap-2">
            <Mic className="h-3.5 w-3.5 text-verdict-go flex-shrink-0" />
            <div className="flex items-center gap-[2px] h-8 flex-1 justify-center">
              {inputBars.map((h, i) => (
                <div key={`i${i}`} className="w-1.5 rounded-full bg-verdict-go/70 transition-all duration-75" style={{ height: `${h}px` }} />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground w-12">Mic</span>
          </div>
        </div>
      )}

      {/* Transcript preview */}
      {transcript.length > 0 && (
        <div className="max-h-32 overflow-y-auto rounded-lg bg-accent/30 p-3 text-xs text-muted-foreground space-y-1">
          {transcript.slice(-6).map((line, i) => (
            <p key={i} className={line.startsWith("Joby:") ? "text-primary" : "text-foreground"}>{line}</p>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-center gap-3">
        {!isConnected ? (
          <Button onClick={startConversation} disabled={isConnecting} className="gap-2">
            {isConnecting ? <><Loader2 className="h-4 w-4 animate-spin" />Connecting…</> : <><Mic className="h-4 w-4" />Start Talking</>}
          </Button>
        ) : (
          <Button variant="destructive" onClick={stopAndExtract} className="gap-2">
            <MicOff className="h-4 w-4" /> Stop & Extract Data
          </Button>
        )}
      </div>
    </div>
  );
};

const VoiceCVBuilderDialog = ({ category, categoryLabel, onDataExtracted }: VoiceCVBuilderProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <Mic className="h-3.5 w-3.5" /> Talk to Me
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-primary" />
              Voice CV Builder — {categoryLabel}
            </DialogTitle>
          </DialogHeader>
          <ConversationProvider>
            <VoiceCVBuilderInner
              category={category}
              categoryLabel={categoryLabel}
              onDataExtracted={onDataExtracted}
              onClose={() => setOpen(false)}
            />
          </ConversationProvider>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VoiceCVBuilderDialog;
