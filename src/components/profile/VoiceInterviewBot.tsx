import { useState, useCallback } from "react";
import { useConversation, ConversationProvider } from "@elevenlabs/react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VoiceInterviewBotProps {
  jobTitle?: string;
  company?: string;
}

const VoiceInterviewBotInner = ({ jobTitle, company }: VoiceInterviewBotProps) => {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  const conversation = useConversation({
    onConnect: () => {
      toast({ title: "Connected", description: "Voice AI interviewer is ready. Start speaking!" });
    },
    onDisconnect: () => {
      toast({ title: "Session Ended", description: "Voice interview practice session has ended." });
    },
    onError: (error) => {
      console.error("Voice AI error:", error);
      toast({ title: "Connection Error", description: "Failed to connect to voice agent. Please try again.", variant: "destructive" });
    },
  });

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const { data, error } = await supabase.functions.invoke("elevenlabs-conversation-token");
      if (error || !data?.token) {
        throw new Error(data?.error || error?.message || "Failed to get token");
      }

      await conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
      });
    } catch (e: any) {
      console.error("Voice AI error:", e);
      if (e.name === "NotAllowedError") {
        toast({ title: "Microphone Required", description: "Please allow microphone access to use voice practice.", variant: "destructive" });
      } else {
        toast({ title: "Connection Failed", description: e.message, variant: "destructive" });
      }
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, toast]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const isConnected = conversation.status === "connected";

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-primary" />
            Voice AI Interview Practice
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Practice with a voice-powered AI interviewer{jobTitle ? ` for ${jobTitle}${company ? ` at ${company}` : ""}` : ""}.
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          {isConnected ? "Live" : "V2 Beta"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {!isConnected ? (
          <Button onClick={startConversation} disabled={isConnecting} className="gap-2">
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting…
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                Start Voice Practice
              </>
            )}
          </Button>
        ) : (
          <Button variant="destructive" onClick={stopConversation} className="gap-2">
            <MicOff className="h-4 w-4" />
            End Session
          </Button>
        )}
      </div>

      {isConnected && (
        <div className="rounded-lg bg-accent/50 p-4 text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-verdict-go animate-pulse" />
            <span className="text-sm font-medium text-foreground">
              {conversation.isSpeaking ? "Agent Speaking…" : "Listening…"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Speak naturally. The AI interviewer will ask follow-up questions based on your responses.
          </p>
          <div className="flex justify-center gap-1 mt-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-primary rounded-full animate-pulse"
                style={{
                  height: `${12 + Math.random() * 16}px`,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceInterviewBot;
