import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RiskPanel from "@/components/RiskPanel";
import TracePanel from "@/components/TracePanel";
import { assessRisk } from "@/lib/risk";
import { checkClaims, buildSources } from "../../supabase/functions/_shared/traceability";

describe("RiskPanel", () => {
  it("renders nothing without a result", () => {
    const { container } = render(<RiskPanel risk={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the quote and where the evidence came from, and never says fake", () => {
    render(<RiskPanel risk={assessRisk("A refundable security deposit of INR 3,000 is required.")} />);
    expect(screen.getByText("Some warning signs")).toBeInTheDocument();
    expect(screen.getByText(/refundable security deposit of INR 3,000/)).toBeInTheDocument();
    expect(screen.getByText("Visible in the text")).toBeInTheDocument();
    expect(document.body.textContent?.toLowerCase()).not.toMatch(/\bfake\b/);
  });

  it("says plainly when the text shows nothing, without claiming the job is real", () => {
    render(<RiskPanel risk={assessRisk("Backend engineer, hybrid.")} />);
    expect(screen.getByText("No warning signs in the text")).toBeInTheDocument();
    expect(screen.getByText(/not proof the job is real/i)).toBeInTheDocument();
  });
});

describe("TracePanel", () => {
  const sources = buildSources({ headline: "Engineer", years_of_experience: 5 }, [{ id: "w1", title: "Dev", company: "Acme", achievements: "Cut cost by 20%" }], []);

  it("asks the user to read everything when no trace was saved", () => {
    render(<TracePanel trace={null} />);
    expect(screen.getByText(/Read every line against your own profile/)).toBeInTheDocument();
  });

  it("shows sources for clean lines and flags an invented number", () => {
    const trace = checkClaims([
      { text: "Cut cost by 20%", sourceId: "work:w1" },
      { text: "Cut cost by 90%", sourceId: "work:w1" },
    ], sources);
    render(<TracePanel trace={trace} />);
    expect(screen.getByText(/1 of 2 lines trace to your profile/)).toBeInTheDocument();
    expect(screen.getByText("Dev at Acme")).toBeInTheDocument();
    expect(screen.getByText(/90% does not appear in the record it cites/)).toBeInTheDocument();
  });
});
