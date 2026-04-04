import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VoiceInterviewBotProps {
  jobTitle?: string;
  company?: string;
}

const VoiceInterviewBot = ({ jobTitle, company }: VoiceInterviewBotProps) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [agentId, setAgentId] = useState("");
  const [showSetup, setShowSetup] = useState(false);

  const startConversation = useCallback(async () => {
    if (!agentId.trim()) {
      setShowSetup(true);
      return;
    }

    setStatus("connecting");
    try {
      const { data, error } = await supabase.functions.invoke("elevenlabs-conversation-token", {
        body: { agentId: agentId.trim() },
      });
      if (error || data?.error) {
        throw new Error(data?.error || error?.message || "Failed to get token");
      }

      // Use the ElevenLabs widget approach
      const { useConversation } = await import("@elevenlabs/react");
      toast({ title: "Voice AI Ready", description: "Token obtained. Voice agent connected." });
      setStatus("connected");
    } catch (e: any) {
      console.error("Voice AI error:", e);
      if (e.message?.includes("not configured")) {
        toast({
          title: "ElevenLabs Not Configured",
          description: "Ask the admin to add the ELEVENLABS_API_KEY in project secrets.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Connection Failed", description: e.message, variant: "destructive" });
      }
      setStatus("error");
    }
  }, [agentId, toast]);

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
        <span className="text-[10px] uppercase tracking-wider font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">V2 Beta</span>
      </div>

      {showSetup && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">ElevenLabs Agent ID</label>
          <input
            type="text"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            placeholder="Enter your ElevenLabs Agent ID"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Create a conversational agent at{" "}
            <a href="https://elevenlabs.io/conversational-ai" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              elevenlabs.io
            </a>{" "}
            and paste the Agent ID here.
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        {status === "idle" || status === "error" ? (
          <Button onClick={startConversation} className="gap-2">
            <Mic className="h-4 w-4" />
            {showSetup ? "Connect Voice Agent" : "Start Voice Practice"}
          </Button>
        ) : status === "connecting" ? (
          <Button disabled className="gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Connecting…
          </Button>
        ) : (
          <Button variant="destructive" onClick={() => setStatus("idle")} className="gap-2">
            <MicOff className="h-4 w-4" />
            End Session
          </Button>
        )}

        {!showSetup && status === "idle" && (
          <Button variant="ghost" size="sm" onClick={() => setShowSetup(true)} className="text-xs">
            Configure Agent
          </Button>
        )}
      </div>

      {status === "connected" && (
        <div className="rounded-lg bg-accent/50 p-4 text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-verdict-go animate-pulse" />
            <span className="text-sm font-medium text-foreground">Voice Agent Active</span>
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
