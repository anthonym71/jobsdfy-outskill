import { describe, expect, it } from "vitest";
import { addDays, planTasks, splitToday, ymd } from "@/lib/followups";
import { fold, tasksToIcs } from "@/lib/ics";

const now = new Date(2026, 9, 30); // 30 Oct 2026, local
const job = { id: "j1", title: "Backend Engineer", company: "Acme" };

describe("planTasks", () => {
  it("formats local dates and adds days across month ends", () => {
    expect(ymd(now)).toBe("2026-10-30");
    expect(ymd(addDays(now, 5))).toBe("2026-11-04");
  });
  it("saved: one decision task in 2 days", () => {
    const [t] = planTasks("saved", job, { now });
    expect(t).toMatchObject({ title: "Decide on Backend Engineer at Acme", due_date: "2026-11-01", source_type: "job", source_id: "j1" });
  });
  it("needs_checking: high priority tomorrow, naming the unclear limits", () => {
    const [t] = planTasks("needs_checking", job, { now, unclear: ["Salary", "Notice period"] });
    expect(t.priority).toBe("high");
    expect(t.due_date).toBe("2026-10-31");
    expect(t.description).toContain("Salary, Notice period");
  });
  it("applied: follow-ups at 5 and 10 days", () => {
    expect(planTasks("applied", job, { now }).map((t) => t.due_date)).toEqual(["2026-11-04", "2026-11-09"]);
  });
  it("copes with a job that has no title or company", () => {
    expect(planTasks("saved", { id: "x" }, { now })[0].title).toBe("Decide on this job");
  });
});

describe("splitToday", () => {
  const tasks = [
    { id: "a", title: "old", due_date: "2026-10-28", status: "todo", priority: "low" },
    { id: "b", title: "now high", due_date: "2026-10-30", status: "todo", priority: "high" },
    { id: "c", title: "now low", due_date: "2026-10-30", status: "in_progress", priority: "low" },
    { id: "d", title: "later", due_date: "2026-11-02", status: "todo" },
    { id: "e", title: "done", due_date: "2026-10-30", status: "done" },
    { id: "f", title: "no date", due_date: null, status: "todo" },
  ];
  it("separates overdue, today and upcoming, ignoring finished and undated tasks", () => {
    const r = splitToday(tasks, now);
    expect(r.overdue.map((t) => t.id)).toEqual(["a"]);
    expect(r.today.map((t) => t.id)).toEqual(["b", "c"]);
    expect(r.upcoming.map((t) => t.id)).toEqual(["d"]);
  });
});

describe("tasksToIcs", () => {
  const ics = tasksToIcs(
    [
      { id: "t1", title: "Follow up, Acme; ask", description: "Line one\nLine two", due_date: "2026-12-31", status: "todo" },
      { id: "t2", title: "Done already", due_date: "2026-11-01", status: "done" },
      { id: "t3", title: "No date", due_date: null, status: "todo" },
    ],
    new Date("2026-10-30T12:00:00Z"),
  );

  it("is a valid calendar with CRLF lines", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).not.toMatch(/[^\r]\n/);
  });
  it("includes only open tasks that have a date, as all-day events that end the next day", () => {
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(ics).toContain("DTSTART;VALUE=DATE:20261231");
    expect(ics).toContain("DTEND;VALUE=DATE:20270101");
    expect(ics).toContain("UID:t1@jobsdfy");
    expect(ics).toContain("DTSTAMP:20261030T120000Z");
  });
  it("escapes commas, semicolons and newlines", () => {
    expect(ics).toContain("SUMMARY:Follow up\\, Acme\\; ask");
    expect(ics).toContain("DESCRIPTION:Line one\\nLine two");
  });
  it("folds long lines at 75 bytes without splitting characters", () => {
    const text = "SUMMARY:" + "é".repeat(60);
    const long = fold(text);
    for (const l of long.split("\r\n")) expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75);
    expect(long.replace(/\r\n /g, "")).toBe(text);
  });
});
