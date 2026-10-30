import { useState, useCallback, useEffect, useRef } from "react";
import { useConversation, ConversationProvider } from "@elevenlabs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, MicOff, Loader2, Volume2, Pause, Play, BookA, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMicrophone } from "@/hooks/useMicrophone";
import MicrophoneControl from "./MicrophoneControl";
import { isStopCommand } from "@/lib/voiceCommands";
import { PROFILE_UPDATED_EVENT, VOICE_DICTIONARY_KEY, VOICE_TOPICS, saveVoiceData } from "@/lib/voiceSave";

interface VoiceCVBuilderProps {
  category: string;
  categoryLabel: string;
  onDataExtracted?: (data: any) => void;
  agentId?: string;
}

type Line = { who: "You" | "Joby"; text: string };

const loadDictionary = (): string[] => {
  try { return JSON.parse(localStorage.getItem(VOICE_DICTIONARY_KEY) || "[]"); } catch { return []; }
};

const VoiceCVBuilderInner = ({ category, categoryLabel, onDataExtracted, onClose, agentId }: VoiceCVBuilderProps & { onClose: () => void }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [topic, setTopic] = useState(category);
  const [isConnecting, setIsConnecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paused, setPaused] = useState(false);
  const [askUpdate, setAskUpdate] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [dictionary, setDictionary] = useState<string[]>(loadDictionary);
  const [newWord, setNewWord] = useState("");
  const [showDict, setShowDict] = useState(false);
  const [inputVolume, setInputVolume] = useState(0);
  const [outputVolume, setOutputVolume] = useState(0);
  const animationRef = useRef<number>();
  const endRef = useRef<HTMLDivElement>(null);
  const microphone = useMicrophone();
  const topicLabel = VOICE_TOPICS.find((t) => t.value === topic)?.label || categoryLabel;

  const conversation = useConversation({
    micMuted: paused,
    onConnect: () => toast({ title: "Joby is ready!", description: `Tell me about your ${topicLabel.toLowerCase()}.` }),
    onDisconnect: () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); },
    onMessage: (message: any) => {
      if (message?.type === "user_transcript") {
        const t = message?.user_transcription_event?.user_transcript || "";
        if (t && isStopCommand(t)) { setPaused(true); setAskUpdate(true); return; }
        if (t) setLines((prev) => [...prev, { who: "You", text: t }]);
      } else if (message?.type === "agent_response") {
        const t = message?.agent_response_event?.agent_response || "";
        if (t) setLines((prev) => [...prev, { who: "Joby", text: t }]);
      }
    },
    onError: (error) => {
      console.error("Voice CV error:", error);
      toast({ title: "Connection Error", description: "Failed to connect. Please try again.", variant: "destructive" });
    },
  });

  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [lines.length]);
  useEffect(() => { localStorage.setItem(VOICE_DICTIONARY_KEY, JSON.stringify(dictionary)); }, [dictionary]);

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
      const input = await microphone.prepare();
      const { data, error } = await supabase.functions.invoke("elevenlabs-conversation-token", {
        body: { agent_id: agentId, category: topic },
      });
      if (error || !data?.signed_url) throw new Error(data?.error || error?.message || "Failed to get signed URL");
      await conversation.startSession({
        signedUrl: data.signed_url, ...input,
        dynamicVariables: { topic: topicLabel },
      } as any);
    } catch (e: any) {
      if (e.name === "NotAllowedError") {
        toast({ title: "Microphone Required", description: "Please allow microphone access.", variant: "destructive" });
      } else {
        toast({ title: "Connection Failed", description: e.message, variant: "destructive" });
      }
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, toast, agentId, topic, topicLabel, microphone.prepare]);

  const stopAndSave = useCallback(async () => {
    if (conversation.status === "connected") await conversation.endSession();
    const transcript = lines.map((l) => `${l.who}: ${l.text}`).join("\n");
    if (!lines.some((l) => l.who === "You")) {
      toast({ title: "Nothing to save yet", description: "Say a few things to Joby first." });
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("voice-profile-extract", {
        body: { transcript, category: topic, dictionary },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      let msg = "Saved to your Knowledgebase";
      if (onDataExtracted && topic === category) {
        onDataExtracted(data.data);
        msg = "Added to the form below — review and press Save";
      } else if (user) {
        msg = await saveVoiceData(user.id, topic, data.data);
        window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT, { detail: { category: topic } }));
      }
      toast({ title: "Interview saved", description: msg });
      onClose();
    } catch (e: any) {
      // Keep the dialog and transcript open so nothing is lost
      toast({ title: "Couldn't save yet", description: `${e.message || "Please try again"}. Your transcript is still here.`, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [conversation, lines, topic, category, dictionary, onDataExtracted, user, toast, onClose]);

  const addWord = () => {
    const w = newWord.trim();
    if (w && !dictionary.some((d) => d.toLowerCase() === w.toLowerCase())) setDictionary([...dictionary, w]);
    setNewWord("");
  };

  const isConnected = conversation.status === "connected";
  const editable = paused || !isConnected;
  const hasContent = lines.some((l) => l.who === "You");

  const bars = (volume: number) => Array.from({ length: 7 }, (_, i) =>
    4 + volume * 28 * (Math.sin(Date.now() / 200 + i * 0.8) * 0.3 + 0.7));

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-2">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30">
          <img src="/joby-192.png" alt="Joby" className="h-14 w-14 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
        <p className="text-sm font-semibold text-foreground">
          {saving ? "Saving your interview…" : isConnected ? (paused ? "Paused — fix any spelling below" : conversation.isSpeaking ? "Joby is speaking…" : "Listening to you…") : "What are we adding today?"}
        </p>
      </div>

      {!isConnected && !hasContent && (
        <Select value={topic} onValueChange={setTopic}>
          <SelectTrigger aria-label="What are we adding today"><SelectValue /></SelectTrigger>
          <SelectContent>
            {VOICE_TOPICS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {isConnected && !paused && (
        <div className="space-y-2">
          {[{ v: outputVolume, icon: Volume2, cls: "bg-primary/70", label: "Speaker" }, { v: inputVolume, icon: Mic, cls: "bg-verdict-go/70", label: "Mic" }].map(({ v, icon: Icon, cls, label }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <div className="flex items-center gap-[2px] h-7 flex-1 justify-center">
                {bars(v).map((h, i) => <div key={i} className={`w-1.5 rounded-full ${cls}`} style={{ height: `${h}px` }} />)}
              </div>
              <span className="text-[10px] text-muted-foreground w-12">{label}</span>
            </div>
          ))}
        </div>
      )}

      {askUpdate && (
        <div role="alertdialog" aria-label="Paused" className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
          <p className="text-sm font-medium text-foreground">Paused. Do you want me to update your profile with what you've told me so far, or carry on?</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { setAskUpdate(false); stopAndSave(); }} disabled={saving}>Update now</Button>
            <Button size="sm" variant="outline" onClick={() => { setAskUpdate(false); setPaused(false); }}>Carry on</Button>
          </div>
        </div>
      )}

      {lines.length > 0 && (
        <div className="max-h-56 overflow-y-auto rounded-lg border border-border bg-accent/30 p-2 space-y-1.5" aria-label="Live transcript">
          {lines.map((l, i) => (
            <div key={i} className="text-xs">
              <span className={`font-semibold ${l.who === "Joby" ? "text-primary" : "text-foreground"}`}>{l.who}: </span>
              {l.who === "You" && editable ? (
                <Input value={l.text} className="mt-0.5 h-7 text-xs"
                  onChange={(e) => setLines((prev) => prev.map((x, j) => j === i ? { ...x, text: e.target.value } : x))} />
              ) : <span className="text-muted-foreground">{l.text}</span>}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      )}

      <div>
        <button type="button" onClick={() => setShowDict(!showDict)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <BookA className="h-3.5 w-3.5" /> My dictionary ({dictionary.length})
        </button>
        {showDict && (
          <div className="mt-2 space-y-2">
            <div className="flex gap-2">
              <Input value={newWord} onChange={(e) => setNewWord(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addWord()}
                placeholder="Names, companies, technical terms" className="h-8 text-xs" />
              <Button size="sm" variant="outline" onClick={addWord}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {dictionary.map((w) => (
                <span key={w} className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px]">
                  {w}<button aria-label={`Remove ${w}`} onClick={() => setDictionary(dictionary.filter((d) => d !== w))}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <MicrophoneControl microphone={microphone} disabled={isConnecting || isConnected} />
      <div className="flex flex-wrap justify-center gap-2">
        {!isConnected ? (
          <Button onClick={startConversation} disabled={isConnecting || saving} variant={hasContent ? "outline" : "default"} className="gap-2">
            {isConnecting ? <><Loader2 className="h-4 w-4 animate-spin" />Connecting…</> : <><Mic className="h-4 w-4" />{hasContent ? "Continue Talking" : "Start Talking"}</>}
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setPaused(!paused)} className="gap-2">
            {paused ? <><Play className="h-4 w-4" />Resume</> : <><Pause className="h-4 w-4" />Pause</>}
          </Button>
        )}
        {(isConnected || hasContent) && (
          <Button variant="destructive" onClick={stopAndSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <MicOff className="h-4 w-4" />} Stop & Save
          </Button>
        )}
      </div>
    </div>
  );
};

const VoiceCVBuilderDialog = ({ category, categoryLabel, onDataExtracted, agentId }: VoiceCVBuilderProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <Mic className="h-3.5 w-3.5" /> Talk to Me
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-primary" />
              Voice CV Builder
            </DialogTitle>
          </DialogHeader>
          <ConversationProvider>
            <VoiceCVBuilderInner
              category={category}
              categoryLabel={categoryLabel}
              onDataExtracted={onDataExtracted}
              agentId={agentId}
              onClose={() => setOpen(false)}
            />
          </ConversationProvider>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VoiceCVBuilderDialog;
