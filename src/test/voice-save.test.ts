import { describe, it, expect, vi } from "vitest";
import { mergeList, saveVoiceData } from "@/lib/voiceSave";
const db = vi.hoisted(() => ({ upsert: vi.fn(async () => ({ error: null })) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }), upsert: db.upsert }) } }));

describe("voice CV merge", () => {
  it("adds new skills without duplicating existing ones (case-insensitive)", () => {
    expect(mergeList(["React", "SQL"], ["react", "Python"])).toEqual(["React", "SQL", "Python"]);
  });
  it("handles an empty profile", () => {
    expect(mergeList(null, ["Sales"])).toEqual(["Sales"]);
  });
  it("creates a missing About Me profile rather than silently losing voice answers", async () => {
    await saveVoiceData("user-1", "about", { full_name: "Anthony Mallett", headline: "Engineer", summary: "I design systems." });
    expect(db.upsert).toHaveBeenCalledWith({ user_id: "user-1", full_name: "Anthony Mallett", headline: "Engineer", summary: "I design systems." }, { onConflict: "user_id" });
  });
});
