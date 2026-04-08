import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Ticket {
  id: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const Support = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    subject: "",
    description: "",
    category: "general",
  });

  useEffect(() => {
    if (user) loadTickets();
  }, [user]);

  const loadTickets = async () => {
    const { data } = await supabase
      .from("support_tickets_user_view" as any)
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setTickets((data as unknown as Ticket[]) || []);
    setLoading(false);
  };

  const submitTicket = async () => {
    if (!form.subject.trim()) {
      toast({ title: "Subject is required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("support-tickets", {
        body: { action: "create", ...form },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Ticket submitted!", description: "We'll get back to you soon." });
      setForm({ subject: "", description: "", category: "general" });
      setShowForm(false);
      loadTickets();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === "open") return "bg-amber-500/10 text-amber-600";
    if (s === "in_progress") return "bg-blue-500/10 text-blue-600";
    if (s === "resolved") return "bg-green-500/10 text-green-600";
    if (s === "closed") return "bg-muted text-muted-foreground";
    return "bg-muted text-muted-foreground";
  };

  if (loading) {
    return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Support</h1>
          <p className="text-sm text-muted-foreground mt-1">Need help? Submit a ticket and we'll respond quickly.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Send className="h-4 w-4 mr-2" /> New Ticket
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-heading text-base font-semibold">Submit a Ticket</h2>
          <div>
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="phone_change">Phone Number Change</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="bug">Bug Report</SelectItem>
                <SelectItem value="feature">Feature Request</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Subject</Label>
            <Input value={form.subject} onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))} className="mt-1" placeholder="Brief summary" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1" rows={4} placeholder="Describe your issue in detail…" />
          </div>
          <div className="flex gap-2">
            <Button onClick={submitTicket} disabled={submitting} size="sm">
              {submitting ? "Submitting…" : "Submit Ticket"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Ticket list */}
      {tickets.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No tickets yet. Submit one if you need help!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => (
            <div key={ticket.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-foreground text-sm">{ticket.subject}</h3>
                  <p className="text-xs text-muted-foreground">{ticket.category} • {new Date(ticket.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(ticket.status)}`}>
                  {ticket.status.replace("_", " ")}
                </span>
              </div>
              {ticket.description && <p className="text-sm text-muted-foreground">{ticket.description}</p>}
              {ticket.admin_notes && (
                <div className="rounded-lg bg-primary/5 p-3 text-sm">
                  <p className="text-xs font-medium text-primary mb-1">Admin Response</p>
                  <p className="text-foreground">{ticket.admin_notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="text-center text-xs text-muted-foreground pt-4">
        You can also email us at <a href="mailto:support@jobsdfy.com" className="text-primary underline">support@jobsdfy.com</a>
      </div>
    </div>
  );
};

export default Support;
