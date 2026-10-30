import { describe, it, expect } from "vitest";
import { isStopCommand, isContinueCommand, isSkipCommand, spokenNumber } from "@/lib/voiceCommands";

describe("voice commands", () => {
  it("recognises stop and pause", () => {
    expect(isStopCommand("Stop")).toBe(true);
    expect(isStopCommand("pause please")).toBe(true);
    expect(isStopCommand("okay hold on a second")).toBe(true);
  });
  it("does not treat sentences mentioning stop as a command", () => {
    expect(isStopCommand("I worked at a bus stop company for five years")).toBe(false);
  });
  it("recognises continue and skip", () => {
    expect(isContinueCommand("continue")).toBe(true);
    expect(isContinueCommand("next")).toBe(true);
    expect(isSkipCommand("skip")).toBe(true);
    expect(isContinueCommand("I continued studying")).toBe(false);
  });
  it("parses spoken salaries", () => {
    expect(spokenNumber("60k")).toBe("60000");
    expect(spokenNumber("about 80,000 a year")).toBe("80000");
    expect(spokenNumber("1.2 million")).toBe("1200000");
  });
});
