import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import labelsFile from "../../eval/labels.json";

type Ev = { limit: string; state: "fail" | "unknown"; quote: string | null };
const postings = labelsFile.postings as Array<{
  id: string;
  file: string;
  expected: { verdict: string; failedLimits: string[] };
  evidence?: Ev[];
  suspiciousSignals?: string[];
}>;

describe("eval labels", () => {
  it("has unique ids and an existing posting file for each", () => {
    expect(new Set(postings.map((p) => p.id)).size).toBe(postings.length);
    for (const p of postings) expect(() => readFileSync(`eval/postings/${p.file}`, "utf8")).not.toThrow();
  });

  it("every evidence quote and suspicious signal appears verbatim in its posting", () => {
    for (const p of postings) {
      const text = readFileSync(`eval/postings/${p.file}`, "utf8");
      for (const e of p.evidence ?? []) if (e.quote) expect(text, `${p.id}: ${e.quote}`).toContain(e.quote);
      for (const q of p.suspiciousSignals ?? []) expect(text, `${p.id}: ${q}`).toContain(q);
    }
  });

  it("each verdict follows from its evidence (fail=stop, unknown=review, else go)", () => {
    for (const p of postings.filter((x) => x.evidence)) {
      const ev = p.evidence!;
      const derived = ev.some((e) => e.state === "fail") ? "stop" : ev.length ? "review" : "go";
      expect(p.expected.verdict, p.id).toBe(derived);
      expect(p.expected.failedLimits, p.id).toEqual(ev.map((e) => e.limit));
    }
  });
});
