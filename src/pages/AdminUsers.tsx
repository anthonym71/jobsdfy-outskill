import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Loader2, ShieldCheck, Download, Tag, Coins, Search, X, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface UserRow {
  user_id: string;
  full_name: string;
  email?: string;
  phone_number: string | null;
  location: string | null;
  headline: string | null;
  created_at: string;
  balance?: number;
  lifetime_earned?: number;
  tags: string[];
}

const AdminUsers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [allTags, setAllTags] = useState<string[]>([]);

  // Credit allocation dialog
  const [creditDialog, setCreditDialog] = useState<{ userId: string; name: string } | null>(null);
  const [creditAmount, setCreditAmount] = useState(0);
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [allocating, setAllocating] = useState(false);

  // Tag dialog
  const [tagDialog, setTagDialog] = useState<{ userId: string; name: string } | null>(null);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (user) loadUsers();
  }, [user]);

  const loadUsers = async () => {
    try {
      // Check admin
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user!.id);
      if (!roles?.some(r => r.role === "admin")) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setIsAdmin(true);

      // Load profiles
      const { data: profiles } = await supabase.from("user_profiles").select("*").order("created_at", { ascending: false });
      // Load credits
      const { data: credits } = await supabase.from("user_credits").select("*");
      // Load tags
      const { data: tags } = await supabase.from("user_tags").select("*");

      const creditsMap = new Map((credits || []).map(c => [c.user_id, c]));
      const tagsMap = new Map<string, string[]>();
      const tagSet = new Set<string>();
      (tags || []).forEach(t => {
        const existing = tagsMap.get(t.user_id) || [];
        existing.push(t.tag);
        tagsMap.set(t.user_id, existing);
        tagSet.add(t.tag);
      });
      setAllTags(Array.from(tagSet).sort());

      const userRows: UserRow[] = (profiles || []).map(p => {
        const c = creditsMap.get(p.user_id);
        return {
          user_id: p.user_id,
          full_name: p.full_name || "—",
          phone_number: p.phone_number,
          location: p.location,
          headline: p.headline,
          created_at: p.created_at,
          balance: c?.balance ?? 0,
          lifetime_earned: c?.lifetime_earned ?? 0,
          tags: tagsMap.get(p.user_id) || [],
        };
      });
      setUsers(userRows);
    } catch (err: any) {
      toast({ title: "Error loading users", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAllocateCredits = async () => {
    if (!creditDialog || creditAmount <= 0) return;
    setAllocating(true);
    try {
      // Verify admin password by signing in
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user!.email!,
        password: adminPassword,
      });
      if (authError) throw new Error("Invalid admin password");

      // Insert credit transaction
      await supabase.from("credit_transactions").insert({
        user_id: creditDialog.userId,
        amount: creditAmount,
        action: "earned" as any,
        reason: "Admin credit allocation",
      });

      // Update balance
      const target = users.find(u => u.user_id === creditDialog.userId);
      const newBalance = (target?.balance || 0) + creditAmount;
      const newLifetime = (target?.lifetime_earned || 0) + creditAmount;
      await supabase.from("user_credits").update({
        balance: newBalance,
        lifetime_earned: newLifetime,
        updated_at: new Date().toISOString(),
      }).eq("user_id", creditDialog.userId);

      toast({ title: `${creditAmount} credits allocated to ${creditDialog.name}` });
      setCreditDialog(null);
      setCreditAmount(0);
      setAdminPassword("");
      loadUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setAllocating(false);
    }
  };

  const handleAddTag = async () => {
    if (!tagDialog || !newTag.trim()) return;
    try {
      const { error } = await supabase.from("user_tags").insert({
        user_id: tagDialog.userId,
        tag: newTag.trim().toLowerCase(),
      });
      if (error) throw error;
      toast({ title: `Tag "${newTag.trim()}" added` });
      setNewTag("");
      loadUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleRemoveTag = async (userId: string, tag: string) => {
    try {
      await supabase.from("user_tags").delete().eq("user_id", userId).eq("tag", tag);
      loadUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const exportCSV = () => {
    const headers = ["Name","Email","Phone","Location","Headline","Balance","Lifetime Earned","Tags","Joined"];
    const rows = filtered.map(u => [
      u.full_name, u.email || "", u.phone_number || "", u.location || "",
      u.headline || "", u.balance, u.lifetime_earned, u.tags.join("; "),
      new Date(u.created_at).toLocaleDateString()
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `users_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const filtered = users.filter(u => {
    if (search && !u.full_name.toLowerCase().includes(search.toLowerCase()) && !u.user_id.includes(search)) return false;
    if (tagFilter !== "all" && !u.tags.includes(tagFilter)) return false;
    return true;
  });

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <ShieldCheck className="h-12 w-12 text-muted-foreground mb-4" />
      <h2 className="text-lg font-semibold text-foreground">Admin Access Required</h2>
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" /> User Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{users.length} registered users</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-1" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {allTags.length > 0 && (
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Filter by tag" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {allTags.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* User list */}
      <div className="space-y-2">
        {filtered.map(u => (
          <div key={u.user_id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-foreground text-sm">{u.full_name}</p>
                <p className="text-xs text-muted-foreground">{u.headline || "No headline"} · {u.location || "No location"} · Joined {new Date(u.created_at).toLocaleDateString()}</p>
                {u.phone_number && <p className="text-xs text-muted-foreground">{u.phone_number}</p>}
                <div className="flex gap-1 mt-1 flex-wrap">
                  {u.tags.map(t => (
                    <Badge key={t} variant="secondary" className="text-xs gap-1">
                      {t}
                      <button onClick={() => handleRemoveTag(u.user_id, t)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-mono bg-accent rounded px-2 py-1">
                  {u.balance} credits
                </span>
                <span className="text-xs text-muted-foreground">
                  (total: {u.lifetime_earned})
                </span>
                
                {/* Tag button */}
                <Dialog open={tagDialog?.userId === u.user_id} onOpenChange={open => !open && setTagDialog(null)}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTagDialog({ userId: u.user_id, name: u.full_name })}>
                      <Tag className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Tag to {tagDialog?.name}</DialogTitle></DialogHeader>
                    <div className="flex gap-2">
                      <Input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="e.g. vip, beta-tester" />
                      <Button onClick={handleAddTag} disabled={!newTag.trim()}>Add</Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Credit allocation button */}
                <Dialog open={creditDialog?.userId === u.user_id} onOpenChange={open => !open && setCreditDialog(null)}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCreditDialog({ userId: u.user_id, name: u.full_name })}>
                      <Coins className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Allocate Credits to {creditDialog?.name}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Credits to add</Label>
                        <Input type="number" value={creditAmount || ""} onChange={e => setCreditAmount(parseInt(e.target.value) || 0)} min={1} />
                      </div>
                      <div>
                        <Label>Admin Password (verification)</Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={adminPassword}
                            onChange={e => setAdminPassword(e.target.value)}
                            placeholder="Enter your password"
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAllocateCredits} disabled={allocating || creditAmount <= 0 || !adminPassword}>
                        {allocating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                        Allocate {creditAmount} Credits
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminUsers;
