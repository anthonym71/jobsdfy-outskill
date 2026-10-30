import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMicrophone } from "@/hooks/useMicrophone";

export default function MicrophoneControl({ microphone, disabled }: { microphone: ReturnType<typeof useMicrophone>; disabled: boolean }) {
  const unavailable = microphone.deviceId !== "default" && !microphone.devices.some(d => d.deviceId === microphone.deviceId);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Select value={microphone.deviceId} onValueChange={microphone.select} disabled={disabled || microphone.busy}>
          <SelectTrigger aria-label="Voice microphone" className="min-w-0 flex-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="default">System default microphone</SelectItem>
            {unavailable && <SelectItem value={microphone.deviceId}>Saved microphone (unavailable)</SelectItem>}
            {microphone.devices.filter(d => d.deviceId !== "default").map((device, index) => (
              <SelectItem key={device.deviceId} value={device.deviceId}>{device.label || `Microphone ${index + 1}`}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" disabled={disabled || microphone.busy} onClick={microphone.testing ? microphone.stopTest : microphone.test} className="shrink-0 gap-1.5">
          {microphone.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : microphone.testing ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {microphone.testing ? "Stop test" : "Test mic"}
        </Button>
      </div>
      {(microphone.testing || microphone.detected) && <div className="space-y-1">
        <progress aria-label="Microphone input level" max={100} value={microphone.level} className="h-2 w-full accent-primary" />
        <p role="status" className="text-xs text-muted-foreground">{microphone.detected ? "Microphone sound detected" : "Waiting for microphone sound…"}</p>
      </div>}
      {microphone.error && <p role="alert" className="text-xs text-destructive">{microphone.error}</p>}
    </div>
  );
}