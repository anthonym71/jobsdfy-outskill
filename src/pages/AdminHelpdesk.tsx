import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShieldCheck, Phone, Ticket, Settings, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SupportTicket {
  id: string;
  user_id: string;
  user_email?: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

interface PhoneChangeReq {
  id: string;
  user_id: string;
  current_phone: string | null;
  new_phone: string;
  status: string;
  created_at: string;
}

const AdminHelpdesk = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [phoneRequests, setPhoneRequests] = useState<PhoneChangeReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) checkAdminAndLoad();
  }, [user]);

  const checkAdminAndLoad = async () => {
    // Check admin role via edge function
    const { data: ticketData, error } = await supabase.functions.invoke("support-tickets", {
      body: { action: "list-all" },
    });

    if (error || ticketData?.error) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setIsAdmin(true);
    setTickets(ticketData?.tickets || []);

    // Load phone change requests
    const { data: phoneData } = await supabase
      .from("phone_change_requests")
      .select("*")
      .order("created_at", { ascending: false });
    setPhoneRequests((phoneData as PhoneChangeReq[]) || []);

    setLoading(false);
  };

  const updateTicket = async (ticketId: string, status: string, adminNotes?: string) => {
    setUpdatingId(ticketId);
    try {
      const { data, error } = await supabase.functions.invoke("support-tickets", {
        body: { action: "update", ticketId, status, adminNotes },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Ticket updated" });
      checkAdminAndLoad();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePhoneRequest = async (requestId: string, approve: boolean) => {
    setUpdatingId(requestId);
    try {
      const { data, error } = await supabase.functions.invoke("support-tickets", {
        body: { action: "approve-phone-change", ticketId: requestId, approve },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: approve ? "Phone change approved" : "Phone change rejected" });
      checkAdminAndLoad();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldCheck className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold text-foreground">Admin Access Required</h2>
        <p className="text-sm text-muted-foreground mt-1">You don't have permission to access this page.</p>
      </div>
    );
  }

  const statusColor = (s: string) => {
    if (s === "open" || s === "pending") return "bg-amber-500/10 text-amber-600";
    if (s === "in_progress") return "bg-blue-500/10 text-blue-600";
    if (s === "resolved" || s === "approved") return "bg-green-500/10 text-green-600";
    if (s === "closed" || s === "rejected") return "bg-muted text-muted-foreground";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="h-6 w-6" /> Admin Helpdesk
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage support tickets and approval requests.</p>
      </div>

      <Tabs defaultValue="tickets">
        <TabsList>
          <TabsTrigger value="tickets" className="flex items-center gap-1">
            <Ticket className="h-4 w-4" /> Tickets ({tickets.length})
          </TabsTrigger>
          <TabsTrigger value="phone" className="flex items-center gap-1">
            <Phone className="h-4 w-4" /> Phone Changes ({phoneRequests.filter(r => r.status === "pending").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-3 mt-4">
          {tickets.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No tickets yet.</p>
          ) : (
            tickets.map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                statusColor={statusColor}
                updatingId={updatingId}
                onUpdate={updateTicket}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="phone" className="space-y-3 mt-4">
          {phoneRequests.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No phone change requests.</p>
          ) : (
            phoneRequests.map(req => (
              <div key={req.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {req.current_phone || "None"} → {req.new_phone}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(req.status)}`}>
                    {req.status}
                  </span>
                </div>
                {req.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handlePhoneRequest(req.id, true)} disabled={updatingId === req.id}>
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handlePhoneRequest(req.id, false)} disabled={updatingId === req.id}>
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const TicketCard = ({
  ticket,
  statusColor,
  updatingId,
  onUpdate,
}: {
  ticket: SupportTicket;
  statusColor: (s: string) => string;
  updatingId: string | null;
  onUpdate: (id: string, status: string, notes?: string) => void;
}) => {
  const [notes, setNotes] = useState(ticket.admin_notes || "");
  const [status, setStatus] = useState(ticket.status);

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-foreground text-sm">{ticket.subject}</h3>
          <p className="text-xs text-muted-foreground">
            {ticket.user_email} • {ticket.category} • {new Date(ticket.created_at).toLocaleDateString()}
          </p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(ticket.status)}`}>
          {ticket.status.replace("_", " ")}
        </span>
      </div>
      {ticket.description && <p className="text-sm text-muted-foreground">{ticket.description}</p>}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Admin notes / response…"
            rows={2}
            className="text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="h-8"
            onClick={() => onUpdate(ticket.id, status, notes)}
            disabled={updatingId === ticket.id}
          >
            {updatingId === ticket.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminHelpdesk;
