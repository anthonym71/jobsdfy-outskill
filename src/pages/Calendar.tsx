import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CalendarDays, MapPin, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Calendar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [rsvps, setRsvps] = useState<Record<string, string>>({});

  useEffect(() => {
    loadEvents();
  }, [user]);

  const loadEvents = async () => {
    const { data: eventsData } = await supabase.from("events").select("*").order("event_date");
    if (eventsData) setEvents(eventsData);

    if (user) {
      const { data: rsvpData } = await supabase.from("event_rsvps").select("*").eq("user_id", user.id);
      if (rsvpData) {
        const map: Record<string, string> = {};
        rsvpData.forEach(r => { map[r.event_id] = r.status; });
        setRsvps(map);
      }
    }
    setLoading(false);
  };

  const handleRsvp = async (eventId: string, status: string) => {
    if (!user) return;
    const current = rsvps[eventId];
    if (current === status) {
      await supabase.from("event_rsvps").delete().eq("event_id", eventId).eq("user_id", user.id);
      setRsvps(prev => { const next = { ...prev }; delete next[eventId]; return next; });
    } else {
      await supabase.from("event_rsvps").upsert({ event_id: eventId, user_id: user.id, status }, { onConflict: "event_id,user_id" });
      setRsvps(prev => ({ ...prev, [eventId]: status }));
    }
    toast({ title: current === status ? "RSVP removed" : `RSVP'd as ${status}` });
  };

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Events & Calendar</h1>
        <p className="text-sm text-muted-foreground mt-1">Upcoming events hosted by AI Job OS.</p>
      </div>

      {/* Courses link */}
      <div className="rounded-xl border border-border bg-card p-5 flex items-center justify-between">
        <div>
          <h3 className="font-heading text-sm font-semibold text-foreground">Training & Courses</h3>
          <p className="text-xs text-muted-foreground">Browse recommended courses on GHL Kollab.</p>
        </div>
        <Button size="sm" variant="outline" asChild>
          <a href="https://kollab.gohighlevel.com" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-1" />View Courses
          </a>
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No upcoming events yet. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map(event => (
            <div key={event.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-heading text-base font-semibold text-foreground">{event.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{new Date(event.event_date).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
                    {event.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant={rsvps[event.id] === "going" ? "default" : "outline"} onClick={() => handleRsvp(event.id, "going")}>Going</Button>
                  <Button size="sm" variant={rsvps[event.id] === "interested" ? "default" : "outline"} onClick={() => handleRsvp(event.id, "interested")}>Interested</Button>
                </div>
              </div>
              {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Calendar;
