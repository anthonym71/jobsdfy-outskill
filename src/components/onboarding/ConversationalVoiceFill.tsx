import { useRef, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { Mic, Pause, Play, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMicrophone } from "@/hooks/useMicrophone";
import MicrophoneControl from "@/components/profile/MicrophoneControl";
import { supabase } from "@/integrations/supabase/client";
import { isContinueCommand, isStopCommand, isSkipCommand, spokenNumber } from "@/lib/voiceCommands";
import type { GuidedField } from "./GuidedVoiceFill";
import { SINGLE_QUESTION_RULE, voiceMessage } from "@/lib/conversationRules";

function Inner({ fields, values, onFill, onContinue }: { fields: GuidedField[]; values: Record<string, string>; onFill: (key: string, value: string) => void; onContinue: () => void }) {
  const microphone = useMicrophone();
  const [connecting, setConnecting] = useState(false);
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const index = useRef(0);
  const pending = useRef<Record<string, string>>({});
  const relevant = useRef<GuidedField[]>([]);
  const awaitingAnswer = useRef(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const conversation = useConversation({
    micMuted: paused,
    onConnect: () => setStatus("Connected — microphone is listening"),
    onError: (error: any) => { setError(typeof error === "string" ? error : "Voice connection failed. Please try again."); setConnecting(false); },
    onMessage: (message: any) => {
      const received = voiceMessage(message);
      if (!received) return;
      if (received.speaker === "agent") { setStatus(received.text); awaitingAnswer.current = true; return; }
      const text = received.text;
      if (isStopCommand(text)) { setPaused(true); setStatus("Paused. Update with your answers so far, or carry on?"); return; }
      if (isContinueCommand(text)) {
        if (index.current >= relevant.current.length) { apply(); void conversation.endSession(); onContinue(); }
        return;
      }
      const field = relevant.current[index.current];
      if (!field || !awaitingAnswer.current || paused) return;
      if (!isSkipCommand(text)) {
        let value = field.type === "number" ? spokenNumber(text) : text;
        if (field.options) value = field.options.find(option => option.words.some(word => text.toLowerCase().includes(word)))?.value || "";
        if (!value) { conversation.sendContextualUpdate(`Please ask this question again: ${field.question}`); return; }
        pending.current[field.key] = value;
        onFill(field.key, value);
      }
      index.current++;
      awaitingAnswer.current = false;
      const next = relevant.current[index.current];
      setCurrentQuestion(next?.question || "Review your answers, then continue.");
      conversation.sendContextualUpdate(next ? `The app recorded that answer. ${SINGLE_QUESTION_RULE} Ask ONLY: ${next.question}` : 'All questions are complete. Do not ask more questions. Invite the user to review and say "continue".');
    },
  });
  const apply = () => Object.entries(pending.current).forEach(([key, value]) => onFill(key, value));
  const start = async () => {
    setConnecting(true); setError(""); setPaused(false);
    relevant.current = fields.filter(field => !values[field.key]); index.current = 0; pending.current = {};
    const first = relevant.current[0]?.question || "Your answers are complete. Say continue to proceed.";
    setCurrentQuestion(first); awaitingAnswer.current = true;
    try {
      const input = await microphone.prepare();
      const { data, error } = await supabase.functions.invoke("elevenlabs-conversation-token", { body: { category: "about" } });
      if (error || !data?.signed_url) throw new Error(data?.error || error?.message || "Could not start voice interview");
      await conversation.startSession({ signedUrl: data.signed_url, ...input, overrides: { agent: { firstMessage: first, prompt: { prompt: `You are Joby guiding profile onboarding. ${SINGLE_QUESTION_RULE} The app controls the field order. Ask only the current question supplied by the app, never create your own next question. Do not ask work-history questions. Current question: ${first}` } } } });
    } catch (error: any) { setError(error.message || "Voice connection failed"); }
    finally { setConnecting(false); }
  };
  const live = conversation.status === "connected";
  return <div className="space-y-3">
    {currentQuestion && <p className="text-sm font-medium text-foreground" aria-live="polite">{currentQuestion}</p>}
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