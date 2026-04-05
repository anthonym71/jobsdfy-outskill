import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Download, Search, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface AuditEntry {
  id: string;
  user_id: string | null;
  user_email: string;
  user_name: string;
  action: string;
  description: string;
  metadata: any;
  created_at: string;
}

const AdminAuditLog = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => {
        setIsAdmin(!!data);
        if (data) loadLogs();
        else setLoading(false);
      });
  }, [user]);

  const loadLogs = async () => {
    setLoading(true);
    // Fetch audit_logs + also synthesize auth login events from auth logs context
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      toast({ title: "Error loading logs", description: error.message, variant: "destructive" });
    } else {
      setLogs((data as AuditEntry[]) || []);
    }
    setLoading(false);
  };

  const filtered = logs.filter(l => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      l.user_email?.toLowerCase().includes(s) ||
      l.user_name?.toLowerCase().includes(s) ||
      l.action?.toLowerCase().includes(s) ||
      l.description?.toLowerCase().includes(s)
    );
  });

  const exportCSV = () => {
    const header = ["Date", "Time", "First Name", "Last Name", "Email", "Action", "Description"];
    const rows = filtered.map(l => {
      const d = new Date(l.created_at);
      const names = (l.user_name || "").split(" ");
      const first = names[0] || "";
      const last = names.slice(1).join(" ") || "";
      return [
        format(d, "yyyy-MM-dd"),
        format(d, "HH:mm:ss"),
        first,
        last,
        l.user_email || "",
        l.action || "",
        `"${(l.description || "").replace(/"/g, '""')}"`,
      ].join(",");
    });
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <div className="p-8 text-center text-muted-foreground">Admin access required.</div>;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground">Events Log</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadLogs}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, action…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">No events recorded yet.</p>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="min-w-[200px]">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(l => {
                const d = new Date(l.created_at);
                const names = (l.user_name || "").split(" ");
                const first = names[0] || "—";
                const last = names.slice(1).join(" ") || "—";
                return (
                  <TableRow key={l.id}>
                    <TableCell className="whitespace-nowrap">{format(d, "yyyy-MM-dd")}</TableCell>
                    <TableCell className="whitespace-nowrap">{format(d, "HH:mm:ss")}</TableCell>
                    <TableCell>{first}</TableCell>
                    <TableCell>{last}</TableCell>
                    <TableCell className="text-xs">{l.user_email || "—"}</TableCell>
                    <TableCell>
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-accent text-foreground">
                        {l.action}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{l.description || "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLog;
