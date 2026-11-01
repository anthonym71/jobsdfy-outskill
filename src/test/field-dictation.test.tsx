import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ recognizers: [] as any[] }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
class Recognition {
  onresult?: (event: any) => void;
  onend?: () => void;
  start = vi.fn();
  stop = vi.fn(() => this.onend?.());
  constructor() { state.recognizers.push(this); }
}
vi.stubGlobal("SpeechRecognition", Recognition);
const { default: VoiceFieldInput } = await import("@/components/profile/VoiceFieldInput");
beforeEach(() => { state.recognizers = []; });

it("writes speech into the chosen field before stopping", () => {
  const fill = vi.fn();
  render(<VoiceFieldInput label="Location" onResult={fill} />);
  fireEvent.click(screen.getByRole("button", { name: "Voice input for Location" }));
  act(() => state.recognizers[0].onresult({ results: [{ 0: { transcript: "London" }, isFinal: false }] }));
  expect(fill).toHaveBeenLastCalledWith("London");
  act(() => state.recognizers[0].onresult({ results: [{ 0: { transcript: "London England" }, isFinal: true }] }));
  expect(fill).toHaveBeenLastCalledWith("London England");
});

it("stops the previous field without losing its already transcribed answer", () => {
  const name = vi.fn(); const location = vi.fn();
  render(<><VoiceFieldInput label="Full Name" onResult={name} /><VoiceFieldInput label="Location" onResult={location} /></>);
  fireEvent.click(screen.getByRole("button", { name: "Voice input for Full Name" }));
  act(() => state.recognizers[0].onresult({ results: [{ 0: { transcript: "Anthony Mallett" }, isFinal: false }] }));
  fireEvent.click(screen.getByRole("button", { name: "Voice input for Location" }));
  expect(state.recognizers[0].stop).toHaveBeenCalled();
  expect(name).toHaveBeenLastCalledWith("Anthony Mallett");
  expect(location).not.toHaveBeenCalled();
});