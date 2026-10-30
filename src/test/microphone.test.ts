import { describe, expect, it } from "vitest";
import { microphoneConstraints, microphoneError } from "@/lib/microphone";

describe("Voice microphone routing", () => {
  it("requests the selected microphone rather than silently using the default", () => {
    expect(microphoneConstraints("shure-device")).toEqual({ audio: { deviceId: { exact: "shure-device" } } });
  });
  it("uses the browser default only when default is selected", () => {
    expect(microphoneConstraints("default")).toEqual({ audio: true });
  });
  it("distinguishes unavailable hardware from a blocked permission", () => {
    expect(microphoneError(new DOMException("", "OverconstrainedError"))).toContain("unavailable");
    expect(microphoneError(new DOMException("", "NotAllowedError"))).toContain("blocked");
  });
});