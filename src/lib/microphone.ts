export const MICROPHONE_STORAGE_KEY = "jobsdfy-voice-microphone";

export function microphoneConstraints(deviceId: string): MediaStreamConstraints {
  return { audio: deviceId && deviceId !== "default" ? { deviceId: { exact: deviceId } } : true };
}

export function microphoneError(error: unknown): string {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Microphone access is blocked. Allow microphone access in your browser’s site permissions. If you are in the embedded preview, open jobsdfy.com in a separate tab and try there.";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") return "The selected microphone is unavailable. Reconnect it or choose another microphone.";
  if (name === "NotReadableError") return "Your microphone cannot be opened. Close other apps using it, check its connection and try again.";
  return error instanceof Error ? error.message : "Unable to access your microphone.";
}