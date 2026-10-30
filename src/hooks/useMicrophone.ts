import { useCallback, useEffect, useRef, useState } from "react";
import { MICROPHONE_STORAGE_KEY, microphoneConstraints, microphoneError } from "@/lib/microphone";

export function useMicrophone() {
  const [deviceId, setDeviceId] = useState(() => {
    try { return localStorage.getItem(MICROPHONE_STORAGE_KEY) || "default"; } catch { return "default"; }
  });
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState("");
  const [testing, setTesting] = useState(false);
  const [level, setLevel] = useState(0);
  const [detected, setDetected] = useState(false);
  const [busy, setBusy] = useState(false);
  const cleanupRef = useRef<(() => void) | undefined>();
  const disposedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const available = await navigator.mediaDevices.enumerateDevices();
      if (!disposedRef.current) setDevices(available.filter(d => d.kind === "audioinput" && d.deviceId));
    } catch { /* Permission is requested by a user action, not on mount. */ }
  }, []);

  const stopTest = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = undefined;
    setTesting(false);
    setLevel(0);
  }, []);

  useEffect(() => {
    disposedRef.current = false;
    void refresh();
    navigator.mediaDevices?.addEventListener("devicechange", refresh);
    return () => {
      disposedRef.current = true;
      cleanupRef.current?.();
      navigator.mediaDevices?.removeEventListener("devicechange", refresh);
    };
  }, [refresh]);

  const select = (id: string) => {
    stopTest();
    setDeviceId(id);
    setError("");
    setDetected(false);
    try { localStorage.setItem(MICROPHONE_STORAGE_KEY, id); } catch { /* Storage may be disabled. */ }
  };

  const openStream = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("Microphone access is unavailable in this browser. Open jobsdfy.com in Chrome or Edge over HTTPS.");
    return navigator.mediaDevices.getUserMedia(microphoneConstraints(deviceId));
  }, [deviceId]);

  const prepare = useCallback(async () => {
    stopTest();
    setError("");
    try {
      const stream = await openStream();
      // Release the permission-check stream before the voice SDK opens its own input.
      stream.getTracks().forEach(track => track.stop());
      await refresh();
      return deviceId === "default" ? {} : { inputDeviceId: deviceId };
    } catch (e) {
      setError(microphoneError(e));
      throw new Error(microphoneError(e));
    }
  }, [deviceId, openStream, refresh, stopTest]);

  const test = async () => {
    stopTest();
    setBusy(true);
    setDetected(false);
    setError("");
    let stream: MediaStream | undefined;
    let context: AudioContext | undefined;
    try {
      stream = await openStream();
      if (disposedRef.current) { stream.getTracks().forEach(track => track.stop()); return; }
      const activeStream = stream;
      context = new AudioContext();
      const audioContext = context;
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      context.createMediaStreamSource(stream).connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);
      let frame = 0;
      let timer: ReturnType<typeof setTimeout>;
      cleanupRef.current = () => {
        cancelAnimationFrame(frame);
        clearTimeout(timer);
        activeStream.getTracks().forEach(track => track.stop());
        void audioContext.close();
      };
      await context.resume();
      if (disposedRef.current) return;
      await refresh();
      setTesting(true);
      const poll = () => {
        analyser.getByteTimeDomainData(samples);
        const rms = Math.sqrt(samples.reduce((sum, n) => sum + ((n - 128) / 128) ** 2, 0) / samples.length);
        setLevel(Math.min(100, rms * 500));
        if (rms > 0.01) setDetected(true);
        frame = requestAnimationFrame(poll);
      };
      poll();
      timer = setTimeout(stopTest, 10000);
    } catch (e) {
      stream?.getTracks().forEach(track => track.stop());
      if (context && context.state !== "closed") void context.close();
      if (!disposedRef.current) setError(microphoneError(e));
    } finally {
      if (!disposedRef.current) setBusy(false);
    }
  };

  return { deviceId, devices, select, prepare, test, stopTest, testing, busy, level, detected, error };
}