import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ymd, addDays } from "@/lib/followups";

const state: { tasks: unknown[]; updated: unknown[] } = { tasks: [], updated: [] };

// A chainable stand-in for the Supabase query builder: any method returns itself, awaiting it yields data.
type Chain = Record<string, unknown>;
const chain = (data: unknown): Chain =>
  new Proxy({}, {
    get: (_t, prop) => {
      if (prop === "then") return (resolve: (v: unknown) => void) => resolve({ data, error: null });
      if (prop === "update") return (patch: unknown) => { state.updated.push(patch); return chain(null); };
      return () => chain(data);
    },
  });

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (table: string) => chain(table === "tasks" ? state.tasks : table === "jobs" ? [] : null) },
}));
// The same object every render: a fresh one would re-trigger the dashboard's [user] effect forever.
const auth = vi.hoisted(() => ({ value: { user: { id: "u1abcdefgh" } } }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth.value }));

import Dashboard from "@/pages/Dashboard";

const open = () => render(<MemoryRouter><Dashboard /></MemoryRouter>);

describe("Dashboard Today list", () => {
  beforeEach(() => { state.tasks = []; state.updated = []; });

  it("says so when nothing is due", async () => {
    open();
    expect(await screen.findByText(/Nothing due today/)).toBeInTheDocument();
  });

  it("lists overdue and due-today tasks but not future ones, and marks one done", async () => {
    const today = new Date();
    state.tasks = [
      { id: "1", title: "Follow up on Backend at Acme", due_date: ymd(today), status: "todo", priority: "medium" },
      { id: "2", title: "Decide on Old Role", due_date: ymd(addDays(today, -3)), status: "todo", priority: "low" },
      { id: "3", title: "Not yet", due_date: ymd(addDays(today, 4)), status: "todo", priority: "high" },
    ];
    open();
    expect(await screen.findByText("Follow up on Backend at Acme")).toBeInTheDocument();
    expect(screen.getByText("Decide on Old Role")).toBeInTheDocument();
    expect(screen.getByText(/Overdue since/)).toBeInTheDocument();
    expect(screen.queryByText("Not yet")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Mark done: Follow up on Backend at Acme" }));
    await waitFor(() => expect(screen.queryByText("Follow up on Backend at Acme")).not.toBeInTheDocument());
    expect(state.updated[0]).toMatchObject({ status: "done" });
  });
});
