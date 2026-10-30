import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import labelsFile from "../../eval/labels.json";
import { ORACLE } from "../../eval/oracle-extractions";
import { profileLimits } from "../../eval/profile-limits";
import { evaluate, verifyQuotes } from "../../supabase/functions/_shared/verdict";

const labels = labelsFile.postings as Array<{ id: string; file: string; expected: { verdict: string; failedLimits: string[] } }>;
const limits = profileLimits();
const sorted = (xs: string[]) => [...xs].sort();

describe("rules reproduce every confirmed label from a perfect extraction", () => {
  it("has an oracle extraction for every label", () => {
    expect(sorted(Object.keys(ORACLE))).toEqual(sorted(labels.map((l) => l.id)));
  });

  for (const l of labels) {
    it(`${l.id}: ${l.expected.verdict}`, () => {
      const text = readFileSync(`eval/postings/${l.file}`, "utf8");
      const { extraction, rejected } = verifyQuotes(ORACLE[l.id], text);
      expect(rejected, "oracle quotes must be verbatim").toEqual([]);
      const r = evaluate(extraction, limits);
      expect(r.verdict).toBe(l.expected.verdict);
      const named = (state: string) => sorted(r.results.filter((x) => x.state === state).map((x) => x.limit));
      if (l.expected.verdict === "stop") expect(named("fail")).toEqual(sorted(l.expected.failedLimits));
      if (l.expected.verdict === "review") expect(named("unknown")).toEqual(sorted(l.expected.failedLimits));
      if (l.expected.verdict === "go") expect(r.results.every((x) => x.state === "pass")).toBe(true);
      // every stop must show the line that triggered it
      for (const f of r.results.filter((x) => x.state === "fail")) expect(f.quote, `${l.id} ${f.limit}`).toBeTruthy();
    });
  }
});
