import { expect, it } from "vitest";
import { interviewAnalytics } from "@/lib/interviewAnalytics";
it("summarizes saved scores and concrete improvement feedback", () => {
  expect(interviewAnalytics([{ score: 6, strengths: ["Clear"], improvements: ["Add results"] }, null, { score: 8, strengths: ["Clear"], improvements: ["Use STAR"] }])).toEqual({ answered: 2, average: 7, strengths: ["Clear"], improvements: ["Add results", "Use STAR"] });
});
it("does not treat an unscored interview as a zero score", () => {
  expect(interviewAnalytics([]).average).toBeNull();
});