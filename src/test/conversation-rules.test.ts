import { describe, it, expect } from "vitest";
import { nextUnanswered, singleQuestion, voiceMessage } from "@/lib/conversationRules";

describe("one question and one answer", () => {
  it("reads the installed voice SDK's user transcript format", () => {
    expect(voiceMessage({ source: "user", message: "Anthony Mallett", event_id: 1 })).toEqual({ speaker: "user", text: "Anthony Mallett" });
  });
  it("reads the installed voice SDK's agent format separately", () => {
    expect(voiceMessage({ source: "ai", message: "What is your name?" })).toEqual({ speaker: "agent", text: "What is your name?" });
    expect(voiceMessage({ type: "audio" })).toBeNull();
  });
  it("keeps only the first question when generated text includes two", () => {
    expect(singleQuestion("What was your role? What did you achieve?")).toBe("What was your role?");
  });
  it("restores the first unanswered interview question", () => {
    expect(nextUnanswered(["Name?", "Role?", "Achievement?"], { 0: "Anthony" })).toBe(1);
  });
});