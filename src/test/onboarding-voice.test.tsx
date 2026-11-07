import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ConversationalVoiceFill, { CV_FIRST_PROMPT } from "@/components/onboarding/ConversationalVoiceFill";

const mock = vi.hoisted(() => ({ callbacks: {} as any, status: "disconnected", start: vi.fn(), context: vi.fn(), fill: vi.fn() }));
vi.mock("@elevenlabs/react", () => ({
  ConversationProvider: ({ children }: any) => children,
  useConversation: (callbacks: any) => { mock.callbacks = callbacks; return { status: mock.status, startSession: mock.start, sendContextualUpdate: mock.context, endSession: vi.fn(), getInputVolume: () => 0 }; },
}));
vi.mock("@/hooks/useMicrophone", () => ({ useMicrophone: () => ({ prepare: async () => ({ inputDeviceId: "selected-shure" }) }) }));
vi.mock("@/components/profile/MicrophoneControl", () => ({ default: () => null }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: async () => ({ data: { signed_url: "test-session" } }) } } }));

describe("onboarding voice answers", () => {
  beforeEach(() => { vi.clearAllMocks(); mock.status = "disconnected"; });
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
  it("rejects separate first/last-name questions instead of putting a surname into location", async () => {
    render(<ConversationalVoiceFill fields={[{ key: "fullName", question: "What's your full name?" }, { key: "location", question: "Where are you based?" }]} values={{}} onFill={mock.fill} onContinue={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Voice Input" }));
    await waitFor(() => expect(mock.start).toHaveBeenCalled());
    act(() => mock.callbacks.onMessage({ source: "ai", message: "What's your first name?" }));
    act(() => mock.callbacks.onMessage({ source: "user", message: "Anthony" }));
    expect(mock.fill).not.toHaveBeenCalled();
    act(() => mock.callbacks.onMessage({ source: "ai", message: "What's your full name?" }));
    act(() => mock.callbacks.onMessage({ source: "user", message: "Anthony Mallett" }));
    expect(mock.fill).toHaveBeenCalledWith("fullName", "Anthony Mallett");
    act(() => mock.callbacks.onMessage({ source: "ai", message: "What's your last name?" }));
    act(() => mock.callbacks.onMessage({ source: "user", message: "Mallett" }));
    expect(mock.fill).toHaveBeenCalledTimes(1);
  });
  it("fills the summary and automatically continues exactly once", async () => {
    const next = vi.fn();
    render(<ConversationalVoiceFill autoContinue fields={[{ key: "summary", question: "Give me a summary of your job description and what you did." }]} values={{}} onFill={mock.fill} onContinue={next} />);
    fireEvent.click(screen.getByRole("button", { name: "Voice Input" }));
    await waitFor(() => expect(mock.start).toHaveBeenCalled());
    act(() => mock.callbacks.onMessage({ source: "user", message: "I managed the sales team." }));
    expect(mock.fill).toHaveBeenCalledWith("summary", "I managed the sales team"); // answer cleaner strips trailing full stop (intended, Nov 1)
    expect(next).toHaveBeenCalledTimes(1);
    act(() => mock.callbacks.onMessage({ source: "user", message: "More speech" }));
    expect(next).toHaveBeenCalledTimes(1);
  });
  it("keeps the voice session and asks minimum salary after the summary page", async () => {
    const next = vi.fn();
    const view = render(<ConversationalVoiceFill autoContinue fields={[{ key: "summary", question: "Describe your role." }]} values={{}} onFill={mock.fill} onContinue={next} />);
    fireEvent.click(screen.getByRole("button", { name: "Voice Input" }));
    await waitFor(() => expect(mock.start).toHaveBeenCalled());
    act(() => mock.callbacks.onMessage({ source: "user", message: "I led sales." }));
    mock.status = "connected";
    view.rerender(<ConversationalVoiceFill autoContinue fields={[{ key: "salaryMin", question: "What's the minimum salary you'd accept?", type: "number" }]} values={{}} onFill={mock.fill} onContinue={next} />);
    expect(mock.start).toHaveBeenCalledTimes(1);
    expect(mock.context).toHaveBeenLastCalledWith(expect.stringContaining("Ask ONLY: What's the minimum salary you'd accept?"));
    act(() => mock.callbacks.onMessage({ source: "ai", message: "What's the minimum salary you'd accept?" }));
    act(() => mock.callbacks.onMessage({ source: "user", message: "60000" }));
    expect(mock.fill).toHaveBeenLastCalledWith("salaryMin", "60000");
  });
});
