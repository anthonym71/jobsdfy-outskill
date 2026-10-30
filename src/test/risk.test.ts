import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import labelsFile from "../../eval/labels.json";
import { ORACLE } from "../../eval/oracle-extractions";
import { assessRisk, withHistory } from "../../supabase/functions/_shared/risk";

const labels = labelsFile.postings as Array<{ id: string; file: string; suspicious?: boolean; suspiciousSignals?: string[] }>;
const run = (l: (typeof labels)[number]) => {
  const text = readFileSync(`eval/postings/${l.file}`, "utf8");
  const s = ORACLE[l.id].salary;
  return assessRisk(text, { salaryStated: !!s && (s.min != null || s.max != null) });
};

describe("risk check on the labelled set", () => {
  it("flags every suspicious posting at least 'some', with a verbatim quote for the text-based signs", () => {
    for (const l of labels.filter((x) => x.suspicious)) {
      const r = run(l);
      expect(r.level, l.id).not.toBe("low");
      const text = readFileSync(`eval/postings/${l.file}`, "utf8");
      for (const s of r.signs.filter((x) => x.quote)) expect(text, `${l.id} ${s.id}`).toContain(s.quote!);
    }
  });

  it("does not flag any of the genuine postings (false-alarm rate 0 on this set)", () => {
    const clean = labels.filter((x) => !x.suspicious);
    const alarms = clean.filter((l) => run(l).level !== "low").map((l) => l.id);
    expect(alarms).toEqual([]);
    expect(clean.length).toBeGreaterThan(40);
  });

  it("never calls a posting fake or a scam in its own words", () => {
    for (const l of labels) {
      const r = run(l);
      expect(JSON.stringify([r.summary, r.signs.map((s) => s.label)]).toLowerCase()).not.toMatch(/\b(fake|scam)\b/);
    }
  });
});

describe("risk rules", () => {
  it("one strong sign is 'some'; two strong signs are 'several'", () => {
    expect(assessRisk("Pay a refundable security deposit of INR 3,000.").level).toBe("some");
    expect(assessRisk("Pay a registration fee.\nSend your CV on WhatsApp.").level).toBe("several");
  });
  it("legitimate Indian notice-period wording is not pressure language", () => {
    expect(assessRisk("Immediate joiners only (0-15 days notice).").level).toBe("low");
  });
  it("a salary line is not a request to pay", () => {
    expect(assessRisk("Pay: $70,000-$90,000 per year, full-time.").level).toBe("low");
    expect(assessRisk("You must pay INR 2,500 to confirm your slot.").level).toBe("some");
  });
  it("a missing salary alone is low", () => {
    expect(assessRisk("Backend engineer, hybrid.", { salaryStated: false }).level).toBe("low");
  });
  it("skips the signs it was not given data for", () => {
    expect(assessRisk("Backend engineer.").signs).toEqual([]);
  });
  it("vague employer is a weak sign", () => {
    expect(assessRisk("x", { company: "Confidential" }).signs.map((s) => s.id)).toEqual(["vague_company"]);
  });
  it("history adds source-data signs and labels them as such", () => {
    const now = new Date("2026-10-30");
    const r = withHistory(assessRisk("Backend engineer."), { firstSeenAt: "2026-08-01", seenBefore: 1, now });
    expect(r.signs.map((s) => s.basis)).toEqual(["needs_source_data", "needs_source_data"]);
    expect(r.level).toBe("some"); // two medium signs
    expect(withHistory(assessRisk("Pay a registration fee."), { seenBefore: 1, firstSeenAt: "2026-08-01", now }).level).toBe("several");
    expect(withHistory(assessRisk("x"), { firstSeenAt: "2026-10-20", now }).level).toBe("low");
  });
});
