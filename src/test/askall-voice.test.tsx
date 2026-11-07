import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ConversationalVoiceFill from "@/components/onboarding/ConversationalVoiceFill";

const mock = vi.hoisted(() => ({ callbacks: {} as any, status: "disconnected", start: vi.fn(), context: vi.fn(), fill: vi.fn(), cont: vi.fn() }));
vi.mock("@elevenlabs/react", () => ({
  ConversationProvider: ({ children }: any) => children,
  useConversation: (callbacks: any) => { mock.callbacks = callbacks; return { status: mock.status, startSession: mock.start, sendContextualUpdate: mock.context, endSession: vi.fn(), getInputVolume: () => 0 }; },
}));
vi.mock("@/hooks/useMicrophone", () => ({ useMicrophone: () => ({ prepare: async () => ({}) }) }));
vi.mock("@/components/profile/MicrophoneControl", () => ({ default: () => null }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: async () => ({ data: { signed_url: "test" } }) } } }));

// The exact Talk to Me field list from AboutMeTab (email/phone excluded: never persisted).
const FIELDS = [
  { key: "fullName", question: "What's your full name?", match: "name" },
  { key: "location", question: "Where are you based?", match: "based|located|location|live" },
  { key: "headline", question: "What's your job title?", match: "job title|title|role" },
  { key: "yearsExp", question: "How many years of experience do you have?", type: "number" as const, match: "years" },
  { key: "summary", question: "Give me a summary of your job description and what you did.", match: "summary|describe" },
  { key: "topSkills", question: "What are your top skills?", match: "skills" },
  { key: "industries", question: "Which industries have you worked in?", match: "industr" },
  { key: "languages", question: "Which languages do you speak?", match: "language" },
];

const wrap = (f: any, values: Record<string, string>) => {
  const cur = values[f.key]?.trim();
  return cur ? { ...f, question: `${f.question} I have ${cur}. Is that correct, or what should it be?` } : f;
};

const filledProfile: Record<string, string> = {
  fullName: "Sam Carter",
  location: "Dublin",
  headline: "Sales Director",
  yearsExp: "15",
  // keyword-rich summary: contains "based", "role", "years" - old code snapped the pointer to these fields
  summary: "Experienced sales leader based in Dublin. I ran EMEA teams, owned the full sales role end to end for years.",
  topSkills: "Sales, Leadership",
  industries: "SaaS",
  languages: "English",
};

async function startTalkToMe(values: Record<string, string>) {
  render(<ConversationalVoiceFill autoStart askAll fields={FIELDS} values={values} onFill={mock.fill} onContinue={mock.cont} onCancel={vi.fn()} />);
  await waitFor(() => expect(mock.start).toHaveBeenCalled());
}

const agent = (text: string) => act(() => mock.callbacks.onMessage({ source: "ai", message: text }));
const user = (text: string) => act(() => mock.callbacks.onMessage({ source: "user", message: text }));
/** Speak the question the app most recently told the agent to ask (perfect verbatim agent). */
function agentAsksExpected(values: Record<string, string>) {
  const last = mock.context.mock.calls.at(-1)?.[0] as string | undefined;
  const m = last?.match(/Ask ONLY: ([\s\S]+)$/);
  const first = wrap(FIELDS[0], values).question;
  agent(m ? m[1] : first);
}

describe("Talk to Me (askAll) field alignment", () => {
  beforeEach(() => { vi.clearAllMocks(); mock.status = "disconnected"; });

  it("repeat run on a filled profile with a keyword-rich summary keeps every answer in its own field", async () => {
    await startTalkToMe(filledProfile);
    agent(wrap(FIELDS[0], filledProfile).question);          // agent speaks first message
    user("Sam Carter");                                       // name
    agentAsksExpected(filledProfile);
    user("yes");                                              // location confirm
    agentAsksExpected(filledProfile);
    user("yes");                                              // headline confirm
    agentAsksExpected(filledProfile);
    user("yes");                                              // years confirm
    agentAsksExpected(filledProfile);
    user("I am a senior sales leader with fifteen years in SaaS, now focused on AI tooling."); // NEW summary
    agentAsksExpected(filledProfile);
    user("yes");                                              // skills confirm
    agentAsksExpected(filledProfile);
    user("yes");                                              // industries confirm
    agentAsksExpected(filledProfile);
    user("yes");                                              // languages confirm -> complete
    const byKey = Object.fromEntries(mock.fill.mock.calls.map(([k, v]: any[]) => [k, v]));
    expect(byKey.location).toBeUndefined();                   // city NOT overwritten
    expect(byKey.headline).toBeUndefined();
    expect(byKey.yearsExp).toBeUndefined();
    expect(byKey.summary).toBe("a senior sales leader with fifteen years in SaaS, now focused on AI tooling"); // lead-in/trailing-. cleaner
    await waitFor(() => expect(mock.cont).toHaveBeenCalledTimes(1), { timeout: 4000 }); // completes exactly once (2.5s save timer)
  });

  it("ignores off-script agent questions (split first/last name) and steers back", async () => {
    await startTalkToMe({});
    agent(FIELDS[0].question);
    agent("What's your first name?");                         // off-script
    expect(mock.context).toHaveBeenLastCalledWith(expect.stringContaining(`Ask ONLY: ${FIELDS[0].question}`));
    user("Anthony");                                          // must NOT be captured
    expect(mock.fill).not.toHaveBeenCalled();
    agent(FIELDS[0].question);                                // back on script
    user("Anthony Mallett");
    expect(mock.fill).toHaveBeenCalledWith("fullName", "Anthony Mallett");
  });

  it("does not capture answers after a bundled two-question turn until the app question is re-asked", async () => {
    await startTalkToMe({});
    agent(FIELDS[0].question);
    user("Sam Carter");
    // agent bundles: app said ask location, agent adds job title too
    agent("Where are you based? And what's your job title?");
    user("Dublin");                                           // answers the FIRST part
    expect(mock.fill).toHaveBeenLastCalledWith("location", "Dublin");
    user("Sales Director");                                   // blurts second answer before app question re-asked
    expect(mock.fill).toHaveBeenCalledTimes(2);               // not captured into a wrong field
    agent(FIELDS[2].question);                                // agent re-asks on script
    user("Sales Director");
    expect(mock.fill).toHaveBeenLastCalledWith("headline", "Sales Director");
  });

  it("an acknowledgment containing a question mark does not arm capture", async () => {
    await startTalkToMe({});
    agent(FIELDS[0].question);
    user("Sam Carter");
    agent("Lovely, thanks! Shall we keep going?");            // not the app's question
    user("hello? are you there");                             // stray speech while agent silent
    expect(mock.fill).toHaveBeenCalledTimes(1);
  });

  it("recovers from an agent nudge disarm: user speech re-issues steering, re-ask re-arms, next answer lands", async () => {
    await startTalkToMe(filledProfile);
    agent(wrap(FIELDS[0], filledProfile).question);          // armed on full name confirm
    agent("Are you still there? If you need more time, just let me know when you're ready to continue."); // nudge: off-script, disarms
    user("yes");                                             // must NOT be captured while disarmed
    expect(mock.fill).not.toHaveBeenCalled();
    // but the app must not stay silent: it steers the agent to re-ask the current question
    expect(mock.context).toHaveBeenLastCalledWith(expect.stringContaining(`Ask ONLY: ${wrap(FIELDS[0], filledProfile).question}`));
    agent(wrap(FIELDS[0], filledProfile).question);          // agent re-asks verbatim -> re-armed
    user("yes");                                             // confirmation now lands, pointer advances
    expect(mock.context).toHaveBeenLastCalledWith(expect.stringContaining("Where are you based?"));
  });

  it("steers only once per disarmed stretch, then re-arms cleanly", async () => {
    await startTalkToMe(filledProfile);
    agent(wrap(FIELDS[0], filledProfile).question);
    agent("Are you still there?");
    user("yes");
    user("hello");                                            // second stray reply: no steering spam
    const steers = mock.context.mock.calls.filter(([m]: any[]) => String(m).includes("The user is present and just replied"));
    expect(steers.length).toBe(1);
    agent(wrap(FIELDS[0], filledProfile).question);          // re-ask re-arms and resets the flag
    user("yes");
    expect(mock.context).toHaveBeenLastCalledWith(expect.stringContaining("Where are you based?"));
  });

  it("ignores placeholder ellipsis/blank user turns: no capture, no advance, no steering", async () => {
    await startTalkToMe(filledProfile);
    agent(wrap(FIELDS[0], filledProfile).question);
    const callsBefore = mock.context.mock.calls.length;
    user("...");
    user("   ");
    expect(mock.fill).not.toHaveBeenCalled();
    expect(mock.context.mock.calls.length).toBe(callsBefore);
    user("yes");                                             // still armed on full name: answer lands
    expect(mock.context).toHaveBeenLastCalledWith(expect.stringContaining("Where are you based?"));
  });

  it("skip advances without writing; empty re-ask does not advance", async () => {
    await startTalkToMe({});
    agent(FIELDS[0].question);
    user("skip");
    expect(mock.fill).not.toHaveBeenCalled();
    expect(mock.context).toHaveBeenLastCalledWith(expect.stringContaining(`Ask ONLY: ${FIELDS[1].question}`));
    agent(FIELDS[1].question);
    user("");                                                 // empty transcript ignored
    user("Dublin, Ireland");
    expect(mock.fill).toHaveBeenCalledWith("location", "Dublin, Ireland");
  });

  it("first run on an empty profile fills every field in order (control)", async () => {
    await startTalkToMe({});
    const answers: Record<string, string> = {
      fullName: "Sam Carter", location: "Dublin", headline: "Sales Director", yearsExp: "15",
      summary: "Senior sales leader", topSkills: "Sales", industries: "SaaS", languages: "English",
    };
    agent(FIELDS[0].question);
    for (const f of FIELDS) { user(answers[f.key]); agentAsksExpected({}); }
    const byKey = Object.fromEntries(mock.fill.mock.calls.map(([k, v]: any[]) => [k, v]));
    for (const f of FIELDS) expect(byKey[f.key]).toBe(answers[f.key]);
    await waitFor(() => expect(mock.cont).toHaveBeenCalledTimes(1), { timeout: 4000 });
  });


  it("reconnect after a dropped session restarts from saved profile state, never from agent text", async () => {
    await startTalkToMe({});
    agent(FIELDS[0].question);
    user("Sam Carter");                                   // fullName captured before the drop
    expect(mock.fill).toHaveBeenCalledWith("fullName", "Sam Carter");
    mock.fill.mockClear();
    // Session drops; parent has persisted fullName. User taps Talk to Me again.
    await startTalkToMe({ fullName: "Sam Carter" });
    agent(wrap(FIELDS[0], { fullName: "Sam Carter" }).question);  // re-confirm name first
    user("yes");                                          // keep it - must NOT rewrite
    expect(mock.fill).not.toHaveBeenCalled();
    agent(FIELDS[1].question);                            // next unfilled field: location
    user("Dublin");
    expect(mock.fill).toHaveBeenCalledWith("location", "Dublin");
  });

  it("voice field list never asks for email or phone (not persisted / admin-approved)", () => {
    const keys = FIELDS.map(f => f.key);
    expect(keys).not.toContain("emailConfirm");
    expect(keys).not.toContain("phoneNumber");
  });
});
