import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ value: { session: { access_token: "t" } } }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth.value }));

import CvImportCard from "@/components/onboarding/CvImportCard";

const parsed = {
  fullName: "Asha Rao", headline: "Backend Engineer", location: "Bengaluru, India", topSkills: ["Python"],
  workHistory: [{ title: "Engineer", company: "Acme", startYear: 2020 }],
};

const pick = (name: string, content: string, type: string) => {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [new File([content], name, { type })] } });
};

afterEach(() => vi.restoreAllMocks());

describe("CvImportCard", () => {
  it("reads a text CV, reports what it understood, and hands the data to the form", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, data: parsed }) }));
    const onParsed = vi.fn();
    render(<CvImportCard onParsed={onParsed} />);
    pick("cv.txt", "Asha Rao, Backend Engineer in Bengaluru. ".repeat(5), "text/plain");

    expect(await screen.findByText("What we understood from your CV")).toBeInTheDocument();
    expect(screen.getByText("Asha Rao")).toBeInTheDocument();
    expect(screen.getByText(/1 role, most recent: Engineer at Acme/)).toBeInTheDocument();
    expect(onParsed).toHaveBeenCalledWith(parsed);
    expect(screen.getByText(/Check each one and fix anything wrong/)).toBeInTheDocument();
  });

  it("rejects unsupported files without calling the server", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<CvImportCard onParsed={vi.fn()} />);
    pick("cv.docx", "x", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    expect(screen.getByRole("alert")).toHaveTextContent(/PDF or a plain text file/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows the server's error and lets the user try again", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "AI parsing failed" }) }));
    render(<CvImportCard onParsed={vi.fn()} />);
    pick("cv.txt", "a long enough cv text ".repeat(10), "text/plain");
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("AI parsing failed"));
    expect(screen.getByRole("button", { name: "Choose a CV" })).toBeEnabled();
  });
});
