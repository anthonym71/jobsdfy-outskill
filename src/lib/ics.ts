// Export tasks as an .ics calendar file (all-day events) that Google Calendar, Apple Calendar and Outlook can import.
// Pure: no browser APIs, so it can be tested.

export interface IcsTask {
  id: string;
  title: string;
  description?: string | null;
  due_date: string | null;
  status: string;
}

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const compact = (ymd: string) => ymd.replace(/-/g, "");

function nextDay(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + 1));
  return `${dt.getUTCFullYear()}${String(dt.getUTCMonth() + 1).padStart(2, "0")}${String(dt.getUTCDate()).padStart(2, "0")}`;
}

/** Lines longer than 75 bytes must be folded: continuation lines start with a space (RFC 5545). */
export function fold(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out: string[] = [];
  let cur = "";
  let bytes = 0;
  let limit = 75;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (bytes + n > limit) {
      out.push(cur);
      cur = "";
      bytes = 0;
      limit = 74; // a leading space takes one byte
    }
    cur += ch;
    bytes += n;
  }
  out.push(cur);
  return out.join("\r\n ");
}

/** Open tasks that have a due date, as an iCalendar document. */
export function tasksToIcs(tasks: IcsTask[], now: Date = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const events = tasks
    .filter((t) => t.due_date && t.status !== "done" && t.status !== "cancelled")
    .flatMap((t) => [
      "BEGIN:VEVENT",
      `UID:${t.id}@jobsdfy`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(t.due_date!)}`,
      `DTEND;VALUE=DATE:${nextDay(t.due_date!)}`,
      `SUMMARY:${esc(t.title)}`,
      ...(t.description ? [`DESCRIPTION:${esc(t.description)}`] : []),
      "END:VEVENT",
    ]);
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//JobsDFY//Tasks//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", ...events, "END:VCALENDAR"];
  return lines.map(fold).join("\r\n") + "\r\n";
}
