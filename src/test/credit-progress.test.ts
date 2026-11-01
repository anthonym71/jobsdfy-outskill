import { expect, it } from "vitest";
import { getXpProgress, getLevelFromXp } from "@/hooks/useCredits";
it("advances the level progress line when XP increases", () => {
  expect(getXpProgress(100)).toEqual({ current: 0, next: 200, percent: 0 });
  expect(getXpProgress(150)).toEqual({ current: 50, next: 200, percent: 25 });
  expect(getLevelFromXp(300)).toBe(3);
});