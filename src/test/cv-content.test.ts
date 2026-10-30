import { expect, it } from "vitest";
import { mergeCvContent, parsedCvContent } from "@/lib/cvContent";
it("merge preserves wording and deduplicates skills", () => {
  expect(mergeCvContent({ professionalSummary: "Original", coreSkills: ["Sales"] }, { professionalSummary: "New", coreSkills: ["Sales", "Excel"] }, "merge")).toEqual({ professionalSummary: "Original", coreSkills: ["Sales", "Excel"] });
});
it("combine includes both summaries", () => { expect(mergeCvContent({ professionalSummary: "Original" }, { professionalSummary: "New" }, "combine").professionalSummary).toBe("Original\n\nNew"); });
it("overwrite replaces the chosen CV content", () => { expect(mergeCvContent({ professionalSummary: "Old", coreSkills: ["Old"] }, { professionalSummary: "New" }, "overwrite")).toEqual({ professionalSummary: "New" }); });
it("maps upload fields into the CV viewer contract", () => { expect(parsedCvContent({ summary: "Leader", topSkills: ["Sales"], workHistory: [{ title: "Director", company: "Test", startYear: 2020, isCurrent: true, achievements: "Grew sales" }] }).experience[0]).toEqual({ title: "Director", company: "Test", dateRange: "2020–Present", bullets: ["Grew sales"] }); });