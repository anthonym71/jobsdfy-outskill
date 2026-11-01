import { describe, it, expect } from "vitest";
import { canManageEvent, eventsOnDate } from "@/lib/eventRules";

describe("event management", () => {
  it("allows the event creator to edit, cancel or delete", () => {
    expect(canManageEvent("creator", "creator", null)).toBe(true);
  });
  it("does not allow another participant to manage the event", () => {
    expect(canManageEvent("creator", "other", "owner")).toBe(false);
  });
  it("preserves read-only judges", () => {
    expect(canManageEvent("judge", "judge", "judge")).toBe(false);
  });
  it("removes cancelled appointments from calendar dates", () => {
    const events = [{ id: "active", event_date: "2026-11-01T12:00:00", is_active: true }, { id: "cancelled", event_date: "2026-11-01T12:00:00", is_active: false }, { id: "tomorrow", event_date: "2026-11-02T12:00:00", is_active: true }];
    expect(eventsOnDate(events, new Date(2026, 10, 1)).map(e => e.id)).toEqual(["active"]);
  });
});