export function canManageEvent(createdBy: string, userId: string | undefined, access: string | null): boolean {
  return !!userId && createdBy === userId && access !== "judge";
}
export function eventsOnDate<T extends { event_date: string; is_active?: boolean }>(events: T[], date: Date): T[] {
  return events.filter(event => {
    const start = new Date(event.event_date);
    return event.is_active !== false && start.getFullYear() === date.getFullYear() && start.getMonth() === date.getMonth() && start.getDate() === date.getDate();
  });
}