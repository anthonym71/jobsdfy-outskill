import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ORACLE } from "../../eval/oracle-extractions";
import { profileLimits } from "../../eval/profile-limits";
import VerdictView from "@/components/VerdictView";
import { evaluate } from "../../supabase/functions/_shared/verdict";
import { toResponse } from "../../supabase/functions/_shared/present";

const limits = profileLimits();
const respond = (id: string) => toResponse(evaluate(ORACLE[id], limits), true);

const setup = (id: string) => {
  const h = { onBack: vi.fn(), onSave: vi.fn(), onSkip: vi.fn(), onContinue: vi.fn(), onReportWrong: vi.fn() };
  render(<VerdictView result={respond(id)} risk={null} {...h} />);
  return h;
};

describe("toResponse", () => {
  it("keeps one entry per limit and a quote on every broken limit", () => {
    const r = respond("001");
    expect(r.verdict).toBe("stop");
    expect(r.blockers.filter((b) => b.state === "fail").every((b) => b.quote)).toBe(true);
    expect(r.alignment).toHaveLength(r.blockers.length);
  });
  it("explains old jobs that have no evidence instead of showing a clean result", () => {
    const r = toResponse(evaluate(null, limits), false);
    expect(r.verdict).toBe("review");
    expect(r.summary).toMatch(/saved before evidence checking/);
  });
});

describe("VerdictView", () => {
  it("STOP: leads with what breaks, quotes the posting, and offers Skip as the primary action", () => {
    const h = setup("001");
    expect(screen.getByText("What breaks your limits")).toBeInTheDocument();
    expect(screen.getByText(/CTC: INR 18-24 LPA/)).toBeInTheDocument();
    expect(screen.getByText("3 broken")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Skip this job" }));
    expect(h.onSkip).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Continue anyway" }));
    expect(h.onContinue).toHaveBeenCalledOnce();
  });

  it("REVIEW: shows what the posting does not say, and never calls it a mismatch", () => {
    setup("I06");
    expect(screen.getByText("What the posting doesn't say")).toBeInTheDocument();
    expect(screen.queryByText("What breaks your limits")).not.toBeInTheDocument();
    expect(screen.getByText("Posting doesn't say")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continue to decision/ })).toBeInTheDocument();
  });

  it("GO: lists what fits and has no broken or unclear sections", () => {
    setup("I01");
    expect(screen.getByText("What fits")).toBeInTheDocument();
    expect(screen.queryByText("What breaks your limits")).not.toBeInTheDocument();
    expect(screen.queryByText("What the posting doesn't say")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Skip this job" })).not.toBeInTheDocument();
  });

  it("reports a wrong card with its limit key, and a wrong verdict with none", () => {
    const h = setup("001");
    fireEvent.click(screen.getAllByText("This looks wrong")[0]);
    expect(h.onReportWrong).toHaveBeenCalledWith(expect.stringMatching(/ctc_min|office_policy|notice_period/));
    fireEvent.click(screen.getByRole("button", { name: "I disagree" }));
    expect(h.onReportWrong).toHaveBeenLastCalledWith();
  });
});
