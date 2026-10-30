// Follow-up tasks created from what happens to a saved job, and the "today" view over tasks.
// The planner and splitter are pure; createJobTasks is the only function that touches the database.
import type { SupabaseClient } from "@supabase/supabase-js";

export type FollowUpEvent = "saved" | "needs_checking" | "applied";

export interface JobRef {
  id: string;
  title?: string | null;
  company?: string | null;
}

export interface TaskInsert {
  title: string;
  description: string;
  due_date: string;
  priority: "low" | "medium" | "high";
  status: "todo";
  source_type: "job";
  source_id: string;
}

/** Local calendar date as yyyy-MM-dd (what the tasks.due_date column and date inputs use). */
export function ymd(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(d: Date, days: number): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  out.setDate(out.getDate() + days);
  return out;
}

const labelOf = (job: JobRef) => {
  const t = (job.title ?? "").trim(), c = (job.company ?? "").trim();
  return t && c ? `${t} at ${c}` : t || c || "this job";
};

export function planTasks(event: FollowUpEvent, job: JobRef, opts: { now?: Date; unclear?: string[] } = {}): TaskInsert[] {
  const now = opts.now ?? new Date();
  const base = { status: "todo" as const, source_type: "job" as const, source_id: job.id };
  const label = labelOf(job);
  switch (event) {
    case "saved":
      return [{ ...base, title: `Decide on ${label}`, description: "You saved this job. Decide whether to apply, or archive it.", due_date: ymd(addDays(now, 2)), priority: "medium" }];
    case "needs_checking": {
      const what = (opts.unclear ?? []).filter(Boolean);
      return [{
        ...base,
        title: `Check the unclear limits for ${label}`,
        description: what.length
          ? `The posting does not say about: ${what.join(", ")}. Ask the recruiter or check the company page.`
          : "The posting is unclear on a limit that matters to you. Ask the recruiter or check the company page.",
        due_date: ymd(addDays(now, 1)),
        priority: "high",
      }];
    }
    case "applied":
      return [
        { ...base, title: `Follow up on ${label}`, description: "If you have not heard back, send a short, polite follow-up.", due_date: ymd(addDays(now, 5)), priority: "medium" },
        { ...base, title: `Second follow-up on ${label}`, description: "Last nudge. If there is still no reply, move on.", due_date: ymd(addDays(now, 10)), priority: "low" },
      ];
  }
}

/** Creates the planned tasks, skipping any whose title already exists for this job. Failures never block the user. */
export async function createJobTasks(client: SupabaseClient, userId: string, event: FollowUpEvent, job: JobRef, opts: { unclear?: string[] } = {}) {
  try {
    const planned = planTasks(event, job, opts);
    const { data: existing } = await client.from("tasks").select("title").eq("user_id", userId).eq("source_id", job.id);
    const have = new Set((existing ?? []).map((t: { title: string }) => t.title));
    const fresh = planned.filter((t) => !have.has(t.title));
    if (fresh.length) await client.from("tasks").insert(fresh.map((t) => ({ ...t, user_id: userId })));
    return fresh.length;
  } catch (e) {
    console.error("createJobTasks failed", e);
    return 0;
  }
}

export interface TaskLike {
  id: string;
  title: string;
  due_date: string | null;
  status: string;
  priority?: string | null;
}

const OPEN = new Set(["todo", "in_progress", "blocked"]);
const PRIORITY_RANK: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

/** What to do today: open tasks that are overdue or due today, most urgent first. */
export function splitToday<T extends TaskLike>(tasks: T[], today: Date = new Date()) {
  const t = ymd(today);
  const open = tasks.filter((x) => OPEN.has(x.status) && x.due_date);
  const byUrgency = (a: T, b: T) =>
    (a.due_date! < b.due_date! ? -1 : a.due_date! > b.due_date! ? 1 : 0) ||
    (PRIORITY_RANK[a.priority ?? "medium"] ?? 2) - (PRIORITY_RANK[b.priority ?? "medium"] ?? 2);
  return {
    overdue: open.filter((x) => x.due_date! < t).sort(byUrgency),
    today: open.filter((x) => x.due_date === t).sort(byUrgency),
    upcoming: open.filter((x) => x.due_date! > t).sort(byUrgency),
  };
}
