import { useEffect, useRef, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { Mic, Pause, Play, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMicrophone } from "@/hooks/useMicrophone";
import MicrophoneControl from "@/components/profile/MicrophoneControl";
import { supabase } from "@/integrations/supabase/client";
import { isContinueCommand, isStopCommand, isSkipCommand, spokenNumber } from "@/lib/voiceCommands";
import type { GuidedField } from "./GuidedVoiceFill";
import { SINGLE_QUESTION_RULE, voiceMessage } from "@/lib/conversationRules";

export const CV_FIRST_PROMPT = "Do you have a CV? Uploading it is the fastest, easiest way to get your information into the system. If not, we can continue with the voice interview.";

function Inner({ fields, values, onFill, onContinue, offerCv = false, onUploadCv, autoContinue = false, askAll = false, autoStart = false, onCancel }: { fields: (GuidedField & { match?: string })[]; onCancel?: () => void; values: Record<string, string>; onFill: (key: string, value: string) => void; onContinue: () => void; offerCv?: boolean; onUploadCv?: () => void; autoContinue?: boolean; askAll?: boolean; autoStart?: boolean }) {
  const microphone = useMicrophone();
  const [connecting, setConnecting] = useState(false);
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const index = useRef(0);
  const pending = useRef<Record<string, string>>({});
  const relevant = useRef<(GuidedField & { confirmValue?: string; match?: string })[]>([]);
  const pausedRef = useRef(false);
  const autoStarted = useRef(false);
  const awaitingAnswer = useRef(false);
  const cvChoice = useRef(false);
  const completed = useRef(false);
  const reaskSent = useRef(false);
  const fieldPage = fields.map(field => field.key).join(",");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [inputLevel, setInputLevel] = useState(0);
  const conversation = useConversation({
    micMuted: false,
    onConnect: () => { setConnecting(false); setStatus("Connected — microphone is listening"); },
    onDisconnect: (details: any) => { setConnecting(false); setStatus("Voice session ended"); if (details?.reason === "error") setError(details.message || "The voice session could not start. Please check the agent settings."); },
    onError: (error: any) => { setError(typeof error === "string" ? error : "Voice connection failed. Please try again."); setConnecting(false); },
    onMessage: (message: any) => {
      const received = voiceMessage(message);
      if (!received) return;
      if (received.speaker === "agent") {
        setStatus(received.text);
        // The app owns the field order. The agent's spoken text NEVER moves the pointer:
        // answers always land in the field the app is currently asking about (relevant[index]).
        // Agent speech is used only to arm/disarm capture for the current app question.
        const field = relevant.current[index.current];
        const expected = cvChoice.current ? "Do you have a CV?" : field?.question;
        if (!expected) return;
        const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
        const said = received.text;
        const saidNorm = normalize(said);
        const expectedNorm = normalize(expected);
        // On-script when the agent speaks the app's question verbatim, speaks its field's
        // first question part (confirm wrapper trimmed), or names the current field's topic.
        const firstPart = expected.includes("?") ? expected.slice(0, expected.indexOf("?") + 1) : expected;
        // The agent is told never to split the full-name question; treat those asks as off-script.
        const splitName = /first name|last name|surname|family name|given name/i.test(said) && !/full name/i.test(said) && /full name/i.test(expected);
        const onScript = !splitName && (saidNorm.includes(expectedNorm)
          || saidNorm.includes(normalize(firstPart))
          || (!!field?.match && new RegExp(field.match, "i").test(said.toLowerCase().split("?")[0])));
        if (onScript) { awaitingAnswer.current = true; reaskSent.current = false; setCurrentQuestion(expected); return; }
        if (said.includes("?")) {
          // Off-script question (split-name, bundled or invented questions, paraphrase of a
          // different field): do NOT capture the next answer; steer back to the app's question.
          awaitingAnswer.current = false;
          conversation.sendContextualUpdate(`That was not the question the app asked. ${SINGLE_QUESTION_RULE} Ask ONLY: ${expected}`);
        }
        return;
      }
      const text = received.text;
      // Empty or placeholder STT turns ("...", whitespace): no command, no capture, no steering.
      if (!text || !text.trim() || /^[\s.…·•\-–—…]*$/.test(text)) return;
      const said = text.trim().toLowerCase().replace(/[.!?,]/g, "");
      if (/^(please )?(cancel|cancel that|never mind|forget it|quit|exit)( please)?$/.test(said)) { pausedRef.current = false; setPaused(false); void conversation.endSession(); onCancel?.(); return; }
      if (/^(please )?(update and stop|update & stop|save and stop|update and save|save and finish)( please)?$/.test(said)) { apply(); pausedRef.current = false; setPaused(false); void conversation.endSession(); onContinue(); return; }
      if (pausedRef.current) {
        if (/\b(carry on|resume|continue|go on|keep going)\b/.test(said)) {
          pausedRef.current = false; setPaused(false);
          conversation.sendContextualUpdate(`We are carrying on. Ask ONLY: ${relevant.current[index.current]?.question || "Please say update and stop."}`);
        }
        return;
      }
      if (isStopCommand(text)) { pausedRef.current = true; setPaused(true); setStatus("Paused — say \"carry on\" to resume, \"update and stop\" to save, or \"cancel\"."); conversation.sendContextualUpdate("The user paused. Say nothing at all until the user says carry on."); return; }
      if (cvChoice.current && awaitingAnswer.current) {
        if (/\b(yes|yeah|yep|upload|i do|have a cv)\b/i.test(text) && !/\b(no|not|don't|do not)\b/i.test(text)) {
          cvChoice.current = false; awaitingAnswer.current = false;
          void conversation.endSession(); onUploadCv?.(); return;
        }
        if (/\b(no|nope|not|don't|do not|continue|interview|questions)\b/i.test(text)) {
          cvChoice.current = false; awaitingAnswer.current = false;
          const first = relevant.current[0]?.question || "Your answers are complete. Say continue to proceed.";
          setCurrentQuestion(first);
          conversation.sendContextualUpdate(`CV upload declined. ${SINGLE_QUESTION_RULE} Ask ONLY: ${first}`);
        } else conversation.sendContextualUpdate("Wait for a yes or no about uploading a CV. Ask only: Do you have a CV to upload?");
        return;
      }
      if (isContinueCommand(text)) {
        if (index.current >= relevant.current.length) { apply(); void conversation.endSession(); onContinue(); }
        return;
      }
      const field = relevant.current[index.current];
      if (!field || !awaitingAnswer.current || paused) {
        // Disarmed (agent went off-script or nudged): never capture this speech, but do not
        // stay silent either - a live user reply proves presence, so steer the agent to re-ask
        // the app's question. Re-asking verbatim re-arms capture. Once per disarmed stretch.
        if (field && !paused && !reaskSent.current) {
          reaskSent.current = true;
          conversation.sendContextualUpdate(`The user is present and just replied, but you have not asked the app's current question yet. ${SINGLE_QUESTION_RULE} Ask ONLY: ${field.question}`);
        }
        return;
      }
      const confirmed = !!field.confirmValue && /\b(yes|yeah|yep|correct|right|that's it|keep it|fine)\b/i.test(text) && !/\b(no|nope|not|change|wrong)\b/i.test(text);
      if (!isSkipCommand(text) && !confirmed) {
        const cleaned = text.trim().replace(/^(yes,?\s+)?(it's|it is|my name is|my name's|i'm|i am|i live in|i'm based in|i am based in|that's|that is)\s+/i, "").replace(/[.!]+$/, "").trim();
        let value = field.type === "number" ? spokenNumber(text) : cleaned;
        if (field.options) value = field.options.find(option => option.words.some(word => text.toLowerCase().includes(word)))?.value || "";
        if (!value) { conversation.sendContextualUpdate(`Please ask this question again: ${field.question}`); return; }
        pending.current[field.key] = value;
        onFill(field.key, value);
      }
      index.current++;
      awaitingAnswer.current = false;
      const next = relevant.current[index.current];
      if (!next && (autoContinue || askAll) && !completed.current) {
        completed.current = true;
        setCurrentQuestion("All done — saving your profile.");
        if (askAll) { apply(); conversation.sendContextualUpdate("All questions are complete. Say: Thanks, your profile is saved. Then stop."); window.setTimeout(() => { void conversation.endSession(); onContinue(); }, 2500); return; }
        completed.current = true;
        setCurrentQuestion("");
        onContinue();
        return;
      }
      setCurrentQuestion(next?.question || "Review your answers, then continue.");
      conversation.sendContextualUpdate(next ? `The app recorded that answer. ${SINGLE_QUESTION_RULE} Ask ONLY: ${next.question}` : 'All questions are complete. Do not ask more questions. Invite the user to review and say "continue".');
    },
  });
  const apply = () => Object.entries(pending.current).forEach(([key, value]) => onFill(key, value));
  const start = async () => {
    setConnecting(true); setError(""); setPaused(false);
    relevant.current = askAll
      ? fields.map(field => { const current = values[field.key]?.trim(); return current ? { ...field, question: `${field.question} I have ${current}. Is that correct, or what should it be?`, confirmValue: current } : field; })
      : fields.filter(field => !values[field.key]?.trim());
    index.current = 0; pending.current = {}; completed.current = false; reaskSent.current = false;
    cvChoice.current = offerCv;
    const first = offerCv ? CV_FIRST_PROMPT : relevant.current[0]?.question || "Your answers are complete. Say continue to proceed.";
    setCurrentQuestion(first); awaitingAnswer.current = true;
    try {
      const input = await microphone.prepare();
      const { data, error } = await supabase.functions.invoke("elevenlabs-conversation-token", { body: { category: "about" } });
      if (error || !data?.signed_url) throw new Error(data?.error || error?.message || "Could not start voice interview");
      await conversation.startSession({ signedUrl: data.signed_url, ...input, overrides: { agent: { firstMessage: first, prompt: { prompt: `You are Joby guiding profile onboarding. ${SINGLE_QUESTION_RULE} The app controls the field order. Speak the supplied question EXACTLY as written. Never split full name into first and last names. Never create your own next question. Keep every reply very short: no small talk, no recap, ask the next question immediately. When the user answers, wait for the app's contextual update containing the next question, then speak that question aloud. ${offerCv ? "First ask about uploading a CV. Wait for yes or no. If yes, the app opens the upload screen. If no, acknowledge and ask the first field question supplied by the app." : ""} Do not ask work-history questions. Current question: ${first}` } } } });
    } catch (error: any) { setError(error.message || "Voice connection failed"); setConnecting(false); }
  };
  useEffect(() => {
    if (!autoStart || autoStarted.current) return;
    autoStarted.current = true;
    void start();
  }, [autoStart]);
  const live = conversation.status === "connected";
  useEffect(() => {
    if (!live) return;
    relevant.current = fields;
    index.current = 0; pending.current = {}; completed.current = false; reaskSent.current = false;
    cvChoice.current = false; awaitingAnswer.current = false;
    const question = fields[0]?.question;
    if (question) {
      setCurrentQuestion(question);
      conversation.sendContextualUpdate(`The app moved to the next form page. ${SINGLE_QUESTION_RULE} Ask ONLY: ${question}`);
    }
  }, [fieldPage]);
  useEffect(() => {
    if (!live || paused) { setInputLevel(0); return; }
    const timer = window.setInterval(() => setInputLevel(Math.min(100, Math.max(0, conversation.getInputVolume() * 100))), 80);
    return () => window.clearInterval(timer);
  }, [live, paused, conversation.getInputVolume]);
  return <div className="space-y-3">
    {currentQuestion && <p className="text-sm font-medium text-foreground" aria-live="polite">{currentQuestion}</p>}
    <MicrophoneControl microphone={microphone} disabled={live || connecting} liveLevel={live ? inputLevel : undefined} paused={paused} />
    <div className="flex flex-wrap gap-2">
      {!live ? <Button type="button" variant="secondary" onClick={start} disabled={connecting}><Mic className="h-4 w-4 mr-1" />{connecting ? "Connecting…" : "Voice Input"}</Button>
        : <Button type="button" variant="outline" onClick={() => { pausedRef.current = !paused; setPaused(!paused); if (paused) conversation.sendContextualUpdate(`We are carrying on. Ask: ${relevant.current[index.current]?.question || 'Please say continue.'}`); }}>{paused ? <Play className="h-4 w-4 mr-1" /> : <Pause className="h-4 w-4 mr-1" />}{paused ? "Carry on" : "Pause"}</Button>}
      {live && <Button type="button" variant="outline" onClick={() => { apply(); void conversation.endSession(); setPaused(false); pausedRef.current = false; if (askAll) onContinue(); }}><Save className="h-4 w-4 mr-1" />Update & stop</Button>}
      {live && <Button type="button" variant="ghost" onClick={() => { void conversation.endSession(); setPaused(false); pausedRef.current = false; onCancel?.(); }}>Cancel</Button>}
      {live && index.current >= relevant.current.length && !offerCv && <Button type="button" onClick={() => { apply(); void conversation.endSession(); onContinue(); }}><Save className="h-4 w-4 mr-1" />Save form</Button>}
    </div>
    {status && <p className="text-xs text-muted-foreground" aria-live="polite">{status}</p>}
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
  </div>;
}
export default function ConversationalVoiceFill(props: Parameters<typeof Inner>[0]) { return <ConversationProvider><Inner {...props} /></ConversationProvider>; }
