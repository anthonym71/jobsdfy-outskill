import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { eventsOnDate } from "@/lib/eventRules";
import { format } from "date-fns";

export default function EventCalendar({ events }: { events: { id: string; title: string; event_date: string; is_active?: boolean }[] }) {
  const [selected, setSelected] = useState<Date>(new Date());
  const daily = eventsOnDate(events, selected);
  return <section className="grid gap-6 md:grid-cols-[auto_1fr] border-y border-border py-5">
    <Calendar mode="single" selected={selected} onSelect={date => { if (date) setSelected(date); }} modifiers={{ scheduled: events.filter(e => e.is_active !== false).map(e => new Date(e.event_date)) }} modifiersClassNames={{ scheduled: "underline decoration-primary decoration-2 underline-offset-4 font-semibold" }} />
    <div className="space-y-3 min-w-0"><h2 className="font-heading font-semibold">{format(selected, "EEEE, d MMMM yyyy")}</h2>{daily.length ? daily.map(event => <div key={event.id} className="border-b border-border py-3"><p className="text-sm font-medium break-words">{event.title}</p><p className="text-xs text-muted-foreground">{format(new Date(event.event_date), "HH:mm")}</p></div>) : <p className="text-sm text-muted-foreground">No events or meetings scheduled for this day.</p>}</div>
  </section>;
}