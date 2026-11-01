import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ConversationalVoiceFill, { CV_FIRST_PROMPT } from "@/components/onboarding/ConversationalVoiceFill";

const mock = vi.hoisted(() => ({ callbacks: {} as any, start: vi.fn(), context: vi.fn(), fill: vi.fn() }));
vi.mock("@elevenlabs/react", () => ({
  ConversationProvider: ({ children }: any) => children,
  useConversation: (callbacks: any) => { mock.callbacks = callbacks; return { status: "disconnected", startSession: mock.start, sendContextualUpdate: mock.context, endSession: vi.fn() }; },
}));
vi.mock("@/hooks/useMicrophone", () => ({ useMicrophone: () => ({ prepare: async () => ({ inputDeviceId: "selected-shure" }) }) }));
vi.mock("@/components/profile/MicrophoneControl", () => ({ default: () => null }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: async () => ({ data: { signed_url: "test-session" } }) } } }));

describe("onboarding voice answers", () => {
  beforeEach(() => vi.clearAllMocks());
  it("populates each answer immediately and waits for the next question", async () => {
    render(<ConversationalVoiceFill fields={[{ key: "name", question: "What is your name?" }, { key: "location", question: "Where are you based?" }]} values={{}} onFill={mock.fill} onContinue={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Voice Input" }));
    await waitFor(() => expect(mock.start).toHaveBeenCalled());
    expect(mock.start.mock.calls[0][0].inputDeviceId).toBe("selected-shure");
    expect(mock.start.mock.calls[0][0].overrides.agent.firstMessage).toBe("What is your name?");
    act(() => mock.callbacks.onMessage({ source: "user", message: "Anthony Mallett" }));
    expect(mock.fill).toHaveBeenCalledWith("name", "Anthony Mallett");
    act(() => mock.callbacks.onMessage({ source: "user", message: "Extra words before next question" }));
    expect(mock.fill).toHaveBeenCalledTimes(1);
    act(() => mock.callbacks.onMessage({ source: "ai", message: "Where are you based?" }));
    act(() => mock.callbacks.onMessage({ source: "user", message: "London" }));
    expect(mock.fill).toHaveBeenLastCalledWith("location", "London");
  });
  it("does not put the CV choice into a profile field and starts questions only after declining", async () => {
    render(<ConversationalVoiceFill offerCv fields={[{ key: "name", question: "What is your name?" }]} values={{}} onFill={mock.fill} onContinue={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Voice Input" }));
    await waitFor(() => expect(mock.start).toHaveBeenCalled());
    expect(mock.start.mock.calls[0][0].overrides.agent.firstMessage).toBe(CV_FIRST_PROMPT);
    act(() => mock.callbacks.onMessage({ source: "user", message: "No, let's continue with the interview" }));
    expect(mock.fill).not.toHaveBeenCalled();
    expect(mock.context).toHaveBeenLastCalledWith(expect.stringContaining("Ask ONLY: What is your name?"));
    act(() => mock.callbacks.onMessage({ source: "ai", message: "What is your name?" }));
    act(() => mock.callbacks.onMessage({ source: "user", message: "Anthony Mallett" }));
    expect(mock.fill).toHaveBeenCalledWith("name", "Anthony Mallett");
  });
  it("opens the upload choice when the user has a CV without filling any profile field", async () => {
    const upload = vi.fn();
    render(<ConversationalVoiceFill offerCv onUploadCv={upload} fields={[{ key: "name", question: "What is your name?" }]} values={{}} onFill={mock.fill} onContinue={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Voice Input" }));
    await waitFor(() => expect(mock.start).toHaveBeenCalled());
    act(() => mock.callbacks.onMessage({ source: "user", message: "Yes, I have a CV" }));
    expect(upload).toHaveBeenCalledTimes(1);
    expect(mock.fill).not.toHaveBeenCalled();
  });
});