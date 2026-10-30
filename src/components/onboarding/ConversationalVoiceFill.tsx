import { useRef, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { Mic, Pause, Play, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMicrophone } from "@/hooks/useMicrophone";
import MicrophoneControl from "@/components/profile/MicrophoneControl";
import { supabase } from "@/integrations/supabase/client";
import { isContinueCommand, isStopCommand, isSkipCommand, spokenNumber } from "@/lib/voiceCommands";
import type { GuidedField } from "./GuidedVoiceFill";

function Inner({ fields, values, onFill, onContinue }: { fields: GuidedField[]; values: Record<string, string>; onFill: (key: string, value: string) => void; onContinue: () => void }) {
  const microphone = useMicrophone();
  const [connecting, setConnecting] = useState(false);
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const index = useRef(0);
  const pending = useRef<Record<string, string>>({});
  const relevant = useRef<GuidedField[]>([]);
  const conversation = useConversation({
    micMuted: paused,
    onConnect: () => setStatus("Connected — microphone is listening"),
    onError: (error: any) => { setError(typeof error === "string" ? error : "Voice connection failed. Please try again."); setConnecting(false); },
    onMessage: (message: any) => {
      const text = message?.user_transcription_event?.user_transcript;
      const agentText = message?.agent_response_event?.agent_response;
      if (agentText) setStatus(agentText);
      if (!text || message?.type !== "user_transcript") return;
      if (isStopCommand(text)) { setPaused(true); setStatus("Paused. Update with your answers so far, or carry on?"); return; }
      if (isContinueCommand(text)) {
        if (index.current >= relevant.current.length) { apply(); void conversation.endSession(); onContinue(); }
        return;
      }
      const field = relevant.current[index.current];
      if (!field) return;
      if (!isSkipCommand(text)) {
        let value = field.type === "number" ? spokenNumber(text) : text;
        if (field.options) value = field.options.find(option => option.words.some(word => text.toLowerCase().includes(word)))?.value || "";
        if (!value) { conversation.sendContextualUpdate(`Please ask this question again: ${field.question}`); return; }
        pending.current[field.key] = value;
        onFill(field.key, value);
      }
      index.current++;
      const next = relevant.current[index.current];
      conversation.sendContextualUpdate(next ? `The answer was recorded. Ask exactly this next question: ${next.question}` : 'All questions are complete. Ask the user to review their answers and say "continue" to move to the next page.');
    },
  });
  const apply = () => Object.entries(pending.current).forEach(([key, value]) => onFill(key, value));
  const start = async () => {
    setConnecting(true); setError(""); setPaused(false);
    relevant.current = fields.filter(field => !values[field.key]); index.current = 0; pending.current = {};
    try {
      const input = await microphone.prepare();
      const { data, error } = await supabase.functions.invoke("elevenlabs-conversation-token", { body: { category: "about" } });
      if (error || !data?.signed_url) throw new Error(data?.error || error?.message || "Could not start voice interview");
      await conversation.startSession({ signedUrl: data.signed_url, ...input });
      conversation.sendContextualUpdate(`You are guiding profile onboarding. Ask only one question at a time and wait for the answer. Do not ask work-history questions. The app will tell you the next question. If the user says STOP or PAUSE, acknowledge it and ask: Do you want me to update with the information provided thus far or carry on? First question: ${relevant.current[0]?.question || 'Your answers are complete. Say continue to proceed.'}`);
    } catch (error: any) { setError(error.message || "Voice connection failed"); }
    finally { setConnecting(false); }
  };
  const live = conversation.status === "connected";
  return <div className="space-y-3">
    <MicrophoneControl microphone={microphone} disabled={live || connecting} />
    <div className="flex flex-wrap gap-2">
      {!live ? <Button type="button" variant="secondary" onClick={start} disabled={connecting}><Mic className="h-4 w-4 mr-1" />{connecting ? "Connecting…" : "Voice Input"}</Button>
        : <Button type="button" variant="outline" onClick={() => { setPaused(!paused); if (paused) conversation.sendContextualUpdate(`We are carrying on. Ask: ${relevant.current[index.current]?.question || 'Please say continue.'}`); }}>{paused ? <Play className="h-4 w-4 mr-1" /> : <Pause className="h-4 w-4 mr-1" />}{paused ? "Carry on" : "Pause"}</Button>}
      {live && <Button type="button" variant="outline" onClick={() => { apply(); void conversation.endSession(); setPaused(false); }}><Save className="h-4 w-4 mr-1" />Update & stop</Button>}
    </div>
    {status && <p className="text-xs text-muted-foreground" aria-live="polite">{status}</p>}
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
  </div>;
}
export default function ConversationalVoiceFill(props: Parameters<typeof Inner>[0]) { return <ConversationProvider><Inner {...props} /></ConversationProvider>; }