import { describe, expect, it } from "vitest";
import labelsFile from "../../eval/labels.json";
import { score, type Label } from "../../eval/score";

const labels = labelsFile.postings as Label[];

describe("eval scorer", () => {
  it("every label points at an existing posting id and valid verdict", () => {
    for (const l of labels) {
      expect(["go", "review", "stop"]).toContain(l.expected.verdict);
    }
    expect(new Set(labels.map((l) => l.id)).size).toBe(labels.length);
  });

  it("scores a perfect engine as fully correct", () => {
    const results = Object.fromEntries(
      labels.map((l) => [l.id, { verdict: l.expected.verdict, failedLimits: l.expected.failedLimits }]),
    );
    const s = score(labels, results);
    expect(s.correct).toBe(labels.length);
    expect(s.stopToGo).toEqual([]);
    expect(s.wrongStops).toEqual([]);
  });

  it("flags a missed STOP as the worst failure and a wrong STOP separately", () => {
    const results = {
      "001": { verdict: "go" as const },
      "002": { verdict: "stop" as const },
      "003": { verdict: "review" as const },
    };
    const s = score(labels, results);
    expect(s.stopToGo).toEqual(["001"]);
    expect(s.wrongStops).toEqual(["002"]);
    expect(s.wrongGos).toEqual(["001"]);
    expect(s.correct).toBe(1);
  });

  it("reports postings the engine did not return", () => {
    expect(score(labels, {}).missing).toEqual(labels.map((l) => l.id));
  });

  it("checks that a correct STOP names every expected limit", () => {
    const s = score(labels, { "001": { verdict: "stop", failedLimits: ["ctc_min"] } });
    expect(s.stopsNamingAllLimits).toEqual({ named: 0, of: 1 });
  });
});
