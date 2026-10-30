import { describe, it, expect } from "vitest";
import { mergeList } from "@/lib/voiceSave";

describe("voice CV merge", () => {
  it("adds new skills without duplicating existing ones (case-insensitive)", () => {
    expect(mergeList(["React", "SQL"], ["react", "Python"])).toEqual(["React", "SQL", "Python"]);
  });
  it("handles an empty profile", () => {
    expect(mergeList(null, ["Sales"])).toEqual(["Sales"]);
  });
});
