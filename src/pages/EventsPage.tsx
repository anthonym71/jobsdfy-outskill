import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, CalendarDays, MapPin, Plus, Search, Ticket, Users, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";

const EventsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<Record<string, any>>({});
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", location: "", area: "",
    event_date: "", event_end_date: "", is_free: true,
    ticket_price: 0, currency: "USD", organizer_name: "",
    max_attendees: "",
  });

  useEffect(() => { loadEvents(); }, [user]);

  const loadEvents = async () => {
    const { data } = await supabase.from("events").select("*").eq("is_active", true).order("event_date");
    if (data) setEvents(data);
    if (user) {
      const { data: regs } = await supabase.from("event_registrations").select("*").eq("user_id", user.id);
      if (regs) {
        const map: Record<string, any> = {};
        regs.forEach(r => { map[r.event_id] = r; });
        setRegistrations(map);
      }
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!user || !form.title || !form.event_date) return;
    setCreating(true);
    const { error } = await supabase.from("events").insert({
      title: form.title,
      description: form.description,
      location: form.location,
      area: form.area,
      event_date: form.event_date,
      event_end_date: form.event_end_date || null,
      is_free: form.is_free,
      ticket_price: form.is_free ? 0 : form.ticket_price,
      currency: form.currency,
      organizer_name: form.organizer_name,
      max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
      created_by: user.id,
    } as any);
    setCreating(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Event created!" });
      setShowCreate(false);
      setForm({ title: "", description: "", location: "", area: "", event_date: "", event_end_date: "", is_free: true, ticket_price: 0, currency: "USD", organizer_name: "", max_attendees: "" });
      loadEvents();
    }
  };

  const handleRegister = async (event: any) => {
    if (!user) return;
    if (registrations[event.id]) {
      toast({ title: "Already registered" });
      return;
    }
    const profile = (await supabase.from("user_profiles").select("full_name, email, phone_number").eq("user_id", user.id).maybeSingle()).data;
    const ticketCode = `TKT-${Date.now().toString(36).toUpperCase()}`;

    const { error } = await supabase.from("event_registrations").insert({
      event_id: event.id,
      user_id: user.id,
      full_name: profile?.full_name || "",
      email: profile?.email || user.email || "",
      phone: profile?.phone_number || "",
      ticket_code: ticketCode,
      payment_status: event.is_free ? "free" : "pending",
    } as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: event.is_free ? "Registered!" : "Registered — payment pending", description: `Ticket: ${ticketCode}` });
      loadEvents();
    }
  };

  const filtered = events.filter(e =>
    (!search || e.title?.toLowerCase().includes(search.toLowerCase()) || e.area?.toLowerCase().includes(search.toLowerCase()) || e.location?.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Calendar / Events</h1>
          <p className="text-sm text-muted-foreground mt-1">Browse and create events.</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" />Create Event</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Event</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Venue / Address" /></div>
                <div><Label>Area / City</Label><Input value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} placeholder="e.g. London" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Start Date/Time *</Label><Input type="datetime-local" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} /></div>
                <div><Label>End Date/Time</Label><Input type="datetime-local" value={form.event_end_date} onChange={e => setForm(f => ({ ...f, event_end_date: e.target.value }))} /></div>
              </div>
              <div><Label>Organizer Name</Label><Input value={form.organizer_name} onChange={e => setForm(f => ({ ...f, organizer_name: e.target.value }))} /></div>
              <div><Label>Max Attendees</Label><Input type="number" value={form.max_attendees} onChange={e => setForm(f => ({ ...f, max_attendees: e.target.value }))} placeholder="Leave blank for unlimited" /></div>
              <div className="flex items-center gap-3">
                <Switch checked={form.is_free} onCheckedChange={v => setForm(f => ({ ...f, is_free: v }))} />
                <Label>Free Event</Label>
              </div>
              {!form.is_free && (
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Ticket Price</Label><Input type="number" step="0.01" value={form.ticket_price} onChange={e => setForm(f => ({ ...f, ticket_price: parseFloat(e.target.value) || 0 }))} /></div>
                  <div><Label>Currency</Label><Input value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} /></div>
                </div>
              )}
              <Button onClick={handleCreate} disabled={creating || !form.title || !form.event_date} className="w-full">
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}Create Event
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, area, or location..." className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No events found.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map(event => {
            const isRegistered = !!registrations[event.id];
            return (
              <div key={event.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
                <div>
                  <h3 className="font-heading text-base font-semibold text-foreground">{event.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{new Date(event.event_date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                    {event.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>}
                    {event.area && <span className="text-primary">{event.area}</span>}
                  </div>
                </div>
                {event.description && <p className="text-sm text-muted-foreground line-clamp-3">{event.description}</p>}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${event.is_free ? "text-verdict-go" : "text-primary"}`}>
                    {event.is_free ? "Free" : `${event.currency} ${event.ticket_price}`}
                  </span>
                  {isRegistered ? (
                    <span className="text-xs text-verdict-go font-medium flex items-center gap-1"><Ticket className="h-3 w-3" />Registered</span>
                  ) : (
                    <Button size="sm" onClick={() => handleRegister(event)}>Register</Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
