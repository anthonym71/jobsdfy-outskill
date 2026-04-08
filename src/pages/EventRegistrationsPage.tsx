import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const EventRegistrationsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("events").select("*").eq("created_by", user.id).order("event_date", { ascending: false })
      .then(({ data }) => { setMyEvents(data || []); setLoading(false); });
  }, [user]);

  useEffect(() => {
    if (!selected) { setRegistrations([]); return; }
    supabase.from("event_registrations").select("*").eq("event_id", selected).order("created_at")
      .then(({ data }) => setRegistrations(data || []));
  }, [selected]);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">Event Registrations</h1>
      <p className="text-sm text-muted-foreground">View attendees for your events.</p>

      {myEvents.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">You haven't created any events yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {myEvents.map(ev => (
            <Button key={ev.id} size="sm" variant={selected === ev.id ? "default" : "outline"} onClick={() => setSelected(ev.id)}>
              {ev.title}
            </Button>
          ))}
        </div>
      )}

      {selected && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2"><Users className="h-4 w-4" />{registrations.length} registrations</h2>
          </div>
          {registrations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No registrations yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4">Name</th>
                    <th className="pb-2 pr-4">Email</th>
                    <th className="pb-2 pr-4">Phone</th>
                    <th className="pb-2 pr-4">Ticket</th>
                    <th className="pb-2 pr-4">Payment</th>
                    <th className="pb-2">Consent</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map(r => (
                    <tr key={r.id} className="border-b border-border/50">
                      <td className="py-2 pr-4 font-medium text-foreground">{r.full_name}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{r.email}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{r.phone || "—"}</td>
                      <td className="py-2 pr-4 font-mono text-xs text-primary">{r.ticket_code}</td>
                      <td className="py-2 pr-4"><span className={`text-xs ${r.payment_status === "paid" || r.payment_status === "free" ? "text-verdict-go" : "text-amber-500"}`}>{r.payment_status}</span></td>
                      <td className="py-2 text-xs text-muted-foreground">
                        {r.consent_host_email && "📧H "}
                        {r.consent_host_sms && "📱H "}
                        {r.consent_platform_email && "📧P "}
                        {r.consent_platform_sms && "📱P"}
                        {!r.consent_host_email && !r.consent_host_sms && !r.consent_platform_email && !r.consent_platform_sms && "None"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventRegistrationsPage;
