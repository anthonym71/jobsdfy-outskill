import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ShieldCheck, Download, Tag, Coins, Search, X, Eye, EyeOff, Mail, MessageSquare, Users, Plus, ArrowUpDown, Trash2, Pencil, Ban, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface UserRow {
  user_id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  location: string | null;
  headline: string | null;
  created_at: string;
  balance?: number;
  lifetime_earned?: number;
  tags: string[];
  groups: string[];
  status: string;
  status_reason: string | null;
}

interface UserGroup {
  id: string;
  name: string;
  description: string;
  member_count: number;
}

const AdminUsers = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [sortBy, setSortBy] = useState<"first" | "last" | "tags">("first");
  const [activeTab, setActiveTab] = useState<"users" | "groups">("users");

  // Credit allocation dialog
  const [creditDialog, setCreditDialog] = useState<{ userId: string; name: string } | null>(null);
  const [creditAmount, setCreditAmount] = useState(0);
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [allocating, setAllocating] = useState(false);

  // Tag dialog
  const [tagDialog, setTagDialog] = useState<{ userId: string; name: string } | null>(null);
  const [newTag, setNewTag] = useState("");

  // Group dialog
  const [groupDialog, setGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [assignGroupDialog, setAssignGroupDialog] = useState<{ userId: string; name: string } | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState("");

  // SMS/Email dialog
  const [messageDialog, setMessageDialog] = useState<{ userId: string; name: string; phone: string | null; email: string; type: "sms" | "email" } | null>(null);
  const [messageBody, setMessageBody] = useState("");
  const [messageSubject, setMessageSubject] = useState("");
  const [sending, setSending] = useState(false);

  // Edit user dialog
  const [editDialog, setEditDialog] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", email: "", phone_number: "" });
  const [editSaving, setEditSaving] = useState(false);

  // Suspend/cancel dialog
  const [suspendDialog, setSuspendDialog] = useState<{ userId: string; name: string; currentStatus: string } | null>(null);
  const [suspendAction, setSuspendAction] = useState<"suspended" | "cancelled" | "active">("suspended");
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendSaving, setSuspendSaving] = useState(false);

  useEffect(() => {
    if (user) loadUsers();
  }, [user]);

  const loadUsers = async () => {
    try {
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user!.id);
      if (!roles?.some(r => r.role === "admin")) { setIsAdmin(false); setLoading(false); return; }
      setIsAdmin(true);

      const [profileRes, creditRes, tagRes, groupRes, memberRes] = await Promise.all([
        supabase.from("user_profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_credits").select("*"),
        supabase.from("user_tags").select("*"),
        supabase.from("user_groups").select("*"),
        supabase.from("user_group_members").select("*"),
      ]);

      const creditsMap = new Map((creditRes.data || []).map(c => [c.user_id, c]));
      const tagsMap = new Map<string, string[]>();
      const tagSet = new Set<string>();
      (tagRes.data || []).forEach((t: any) => {
        const existing = tagsMap.get(t.user_id) || [];
        existing.push(t.tag);
        tagsMap.set(t.user_id, existing);
        tagSet.add(t.tag);
      });
      setAllTags(Array.from(tagSet).sort());

      const groupMap = new Map<string, string>((groupRes.data || []).map((g: any) => [g.id, g.name]));
      const userGroupsMap = new Map<string, string[]>();
      const groupMemberCounts = new Map<string, number>();
      (memberRes.data || []).forEach((m: any) => {
        const existing = userGroupsMap.get(m.user_id) || [];
        const gName = groupMap.get(m.group_id);
        if (gName) existing.push(gName);
        userGroupsMap.set(m.user_id, existing);
        groupMemberCounts.set(m.group_id, (groupMemberCounts.get(m.group_id) || 0) + 1);
      });

      setGroups((groupRes.data || []).map((g: any) => ({
        id: g.id, name: g.name, description: g.description || "",
        member_count: groupMemberCounts.get(g.id) || 0,
      })));

      const userRows: UserRow[] = (profileRes.data || []).map((p: any) => {
        const c = creditsMap.get(p.user_id);
        return {
          user_id: p.user_id,
          full_name: p.full_name || "—",
          email: p.email || "",
          phone_number: p.phone_number,
          location: p.location,
          headline: p.headline,
          created_at: p.created_at,
          balance: c?.balance ?? 0,
          lifetime_earned: c?.lifetime_earned ?? 0,
          tags: tagsMap.get(p.user_id) || [],
          groups: userGroupsMap.get(p.user_id) || [],
          status: (p as any).status || "active",
          status_reason: (p as any).status_reason || null,
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
      const { error: authError } = await supabase.auth.signInWithPassword({ email: user!.email!, password: adminPassword });
      if (authError) throw new Error("Invalid admin password");
      await supabase.from("credit_transactions").insert({ user_id: creditDialog.userId, amount: creditAmount, action: "earned" as any, reason: "Admin credit allocation" });
      const target = users.find(u => u.user_id === creditDialog.userId);
      await supabase.from("user_credits").update({ balance: (target?.balance || 0) + creditAmount, lifetime_earned: (target?.lifetime_earned || 0) + creditAmount, updated_at: new Date().toISOString() }).eq("user_id", creditDialog.userId);
      await supabase.from("audit_logs").insert({
        user_id: user?.id,
        user_email: user?.email || "",
        user_name: "",
        action: "allocate_credits",
        description: `Allocated ${creditAmount} credits to ${creditDialog.name}`,
      });
      toast({ title: `${creditAmount} credits allocated to ${creditDialog.name}` });
      setCreditDialog(null); setCreditAmount(0); setAdminPassword("");
      loadUsers();
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
    finally { setAllocating(false); }
  };

  const handleAddTag = async () => {
    if (!tagDialog || !newTag.trim()) return;
    try {
      const { error } = await supabase.from("user_tags").insert({ user_id: tagDialog.userId, tag: newTag.trim().toLowerCase() });
      if (error) throw error;
      toast({ title: `Tag "${newTag.trim()}" added` });
      setNewTag(""); loadUsers();
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  const handleRemoveTag = async (userId: string, tag: string) => {
    await supabase.from("user_tags").delete().eq("user_id", userId).eq("tag", tag);
    loadUsers();
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const { error } = await supabase.from("user_groups").insert({ name: newGroupName.trim(), description: newGroupDesc.trim() });
      if (error) throw error;
      toast({ title: `Group "${newGroupName}" created` });
      setNewGroupName(""); setNewGroupDesc(""); setGroupDialog(false);
      loadUsers();
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  const handleAssignGroup = async () => {
    if (!assignGroupDialog || !selectedGroupId) return;
    try {
      const { error } = await supabase.from("user_group_members").insert({ group_id: selectedGroupId, user_id: assignGroupDialog.userId });
      if (error) throw error;
      toast({ title: `User added to group` });
      setAssignGroupDialog(null); setSelectedGroupId("");
      loadUsers();
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  const handleSendMessage = async () => {
    if (!messageDialog || !messageBody.trim()) return;
    setSending(true);
    try {
      if (messageDialog.type === "sms") {
        if (!messageDialog.phone) throw new Error("User has no phone number");
        const { data, error } = await supabase.functions.invoke("send-admin-sms", {
          body: { to: messageDialog.phone, message: messageBody },
        });
        if (error) throw error;
        toast({ title: "SMS sent", description: `Message sent to ${messageDialog.name}` });
      } else {
        if (!messageDialog.email) throw new Error("User has no email");
        window.open(`mailto:${messageDialog.email}?subject=${encodeURIComponent(messageSubject)}&body=${encodeURIComponent(messageBody)}`, "_blank");
        toast({ title: "Email client opened" });
      }
      setMessageDialog(null); setMessageBody(""); setMessageSubject("");
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
    finally { setSending(false); }
  };

  const handleEditUser = async () => {
    if (!editDialog) return;
    setEditSaving(true);
    try {
      const { error } = await supabase.from("user_profiles").update({
        full_name: editForm.full_name.trim(),
        email: editForm.email.trim() || null,
        phone_number: editForm.phone_number.trim() || null,
        updated_at: new Date().toISOString(),
      }).eq("user_id", editDialog.user_id);
      if (error) throw error;
      // Audit log
      await supabase.from("audit_logs").insert({
        user_id: user?.id,
        user_email: user?.email || "",
        user_name: "",
        action: "edit_user",
        description: `Updated profile for ${editForm.full_name} (${editForm.email})`,
      });
      toast({ title: "User updated" });
      setEditDialog(null);
      loadUsers();
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
    finally { setEditSaving(false); }
  };

  const handleSuspendUser = async () => {
    if (!suspendDialog) return;
    setSuspendSaving(true);
    try {
      const { error } = await supabase.from("user_profiles").update({
        status: suspendAction,
        status_reason: suspendReason.trim() || null,
        status_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any).eq("user_id", suspendDialog.userId);
      if (error) throw error;
      await supabase.from("audit_logs").insert({
        user_id: user?.id,
        user_email: user?.email || "",
        user_name: "",
        action: suspendAction === "active" ? "reactivate_user" : `${suspendAction}_user`,
        description: `${suspendAction === "active" ? "Reactivated" : suspendAction === "suspended" ? "Suspended" : "Cancelled"} account for ${suspendDialog.name}. Reason: ${suspendReason || "N/A"}`,
      });
      toast({ title: suspendAction === "active" ? "Account reactivated" : `Account ${suspendAction}` });
      setSuspendDialog(null); setSuspendReason("");
      loadUsers();
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
    finally { setSuspendSaving(false); }
  };

  const exportCSV = () => {
    const headers = ["Name","Email","Phone","Location","Headline","Status","Balance","Lifetime Earned","Tags","Groups","Joined"];
    const rows = filtered.map(u => [
      u.full_name, u.email, u.phone_number || "", u.location || "",
      u.headline || "", u.status, u.balance, u.lifetime_earned, u.tags.join("; "), u.groups.join("; "),
      new Date(u.created_at).toLocaleDateString()
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `users_export_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(a.href);
  };

  const splitName = (name: string) => {
    const parts = name.trim().split(/\s+/);
    return { first: parts[0] || "—", last: parts.slice(1).join(" ") || "—" };
  };

  const filtered = users.filter(u => {
    if (search && !u.full_name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase()) && !u.user_id.includes(search)) return false;
    if (tagFilter !== "all" && !u.tags.includes(tagFilter)) return false;
    if (groupFilter !== "all" && !u.groups.includes(groupFilter)) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "first") return splitName(a.full_name).first.localeCompare(splitName(b.full_name).first);
    if (sortBy === "last") return splitName(a.full_name).last.localeCompare(splitName(b.full_name).last);
    if (sortBy === "tags") return b.tags.length - a.tags.length;
    return 0;
  });

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <ShieldCheck className="h-12 w-12 text-muted-foreground mb-4" />
      <h2 className="text-lg font-semibold text-foreground">Admin Access Required</h2>
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" /> User Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{users.length} registered users · {groups.length} groups</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={groupDialog} onOpenChange={setGroupDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Users className="h-4 w-4 mr-1" />New Group</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create User Group</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Group Name</Label><Input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="mt-1" /></div>
                <div><Label>Description</Label><Input value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} className="mt-1" /></div>
              </div>
              <DialogFooter><Button onClick={handleCreateGroup} disabled={!newGroupName.trim()}>Create</Button></DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" />Export CSV</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="groups">Groups ({groups.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={sortBy} onValueChange={v => setSortBy(v as any)}>
              <SelectTrigger className="w-[150px]"><ArrowUpDown className="h-3.5 w-3.5 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="first">First Name</SelectItem>
                <SelectItem value="last">Last Name</SelectItem>
                <SelectItem value="tags">Most Tags</SelectItem>
              </SelectContent>
            </Select>
            {allTags.length > 0 && (
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Tag" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {allTags.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {groups.length > 0 && (
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Group" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {groups.map(g => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Users Table */}
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>First Name</TableHead>
                  <TableHead>Last Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(u => {
                  const { first, last } = splitName(u.full_name);
                  return (
                    <TableRow key={u.user_id} className={u.status !== "active" ? "opacity-60" : ""}>
                      <TableCell className="font-medium text-sm">{first}</TableCell>
                      <TableCell className="text-sm">{last}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{u.email || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{u.phone_number || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={u.status === "active" ? "default" : "destructive"} className="text-[10px]">
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {u.tags.map(t => (
                            <Badge key={t} variant="secondary" className="text-[10px] gap-0.5">
                              {t}<button onClick={() => handleRemoveTag(u.user_id, t)} className="hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell><span className="text-xs font-mono">{u.balance}</span></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Edit User" onClick={() => {
                            setEditDialog(u);
                            setEditForm({ full_name: u.full_name, email: u.email, phone_number: u.phone_number || "" });
                          }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" title={u.status === "active" ? "Suspend/Cancel" : "Reactivate"} onClick={() => {
                            setSuspendDialog({ userId: u.user_id, name: u.full_name, currentStatus: u.status });
                            setSuspendAction(u.status === "active" ? "suspended" : "active");
                            setSuspendReason(u.status_reason || "");
                          }}>
                            {u.status === "active" ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5 text-verdict-go" />}
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Send SMS" onClick={() => setMessageDialog({ userId: u.user_id, name: u.full_name, phone: u.phone_number, email: u.email, type: "sms" })}>
                            <MessageSquare className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Send Email" onClick={() => setMessageDialog({ userId: u.user_id, name: u.full_name, phone: u.phone_number, email: u.email, type: "email" })}>
                            <Mail className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Add Tag" onClick={() => setTagDialog({ userId: u.user_id, name: u.full_name })}>
                            <Tag className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Allocate Credits" onClick={() => setCreditDialog({ userId: u.user_id, name: u.full_name })}>
                            <Coins className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="groups" className="space-y-4 mt-4">
          {groups.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium text-foreground">No groups yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create a group to organize your users.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {groups.map(g => (
                <div key={g.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                  <div>
                    <p className="font-medium text-sm text-foreground">{g.name}</p>
                    {g.description && <p className="text-xs text-muted-foreground mt-0.5">{g.description}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs">{g.member_count} members</Badge>
                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Delete group" onClick={async () => {
                      await supabase.from("user_group_members").delete().eq("group_id", g.id);
                      await supabase.from("user_groups").delete().eq("id", g.id);
                      loadUsers();
                      toast({ title: `Group "${g.name}" deleted` });
                    }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={!!editDialog} onOpenChange={open => !open && setEditDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User: {editDialog?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Full Name</Label><Input value={editForm.full_name} onChange={e => setEditForm(p => ({ ...p, full_name: e.target.value }))} className="mt-1" /></div>
            <div><Label>Email</Label><Input value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} className="mt-1" /></div>
            <div><Label>Phone Number</Label><Input value={editForm.phone_number} onChange={e => setEditForm(p => ({ ...p, phone_number: e.target.value }))} placeholder="+1234567890" className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditUser} disabled={editSaving || !editForm.full_name.trim()}>
              {editSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend/Cancel/Reactivate Dialog */}
      <Dialog open={!!suspendDialog} onOpenChange={open => !open && setSuspendDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {suspendDialog?.currentStatus === "active" ? "Suspend or Cancel Account" : "Reactivate Account"}: {suspendDialog?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {suspendDialog?.currentStatus === "active" ? (
              <div>
                <Label>Action</Label>
                <Select value={suspendAction} onValueChange={v => setSuspendAction(v as any)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="suspended">Suspend (temporary)</SelectItem>
                    <SelectItem value="cancelled">Cancel (permanent)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div>
              <Label>Reason</Label>
              <Textarea value={suspendReason} onChange={e => setSuspendReason(e.target.value)} placeholder="e.g. Chargeback, abuse, non-payment…" rows={3} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant={suspendDialog?.currentStatus === "active" ? "destructive" : "default"}
              onClick={handleSuspendUser}
              disabled={suspendSaving}
            >
              {suspendSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {suspendDialog?.currentStatus === "active"
                ? suspendAction === "suspended" ? "Suspend Account" : "Cancel Account"
                : "Reactivate Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tag Dialog */}
      <Dialog open={!!tagDialog} onOpenChange={open => !open && setTagDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Tag to {tagDialog?.name}</DialogTitle></DialogHeader>
          <div className="flex gap-2">
            <Input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="e.g. vip, beta-tester" />
            <Button onClick={handleAddTag} disabled={!newTag.trim()}>Add</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Group Dialog */}
      <Dialog open={!!assignGroupDialog} onOpenChange={open => !open && setAssignGroupDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add {assignGroupDialog?.name} to Group</DialogTitle></DialogHeader>
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No groups created yet. Create a group first.</p>
          ) : (
            <div className="space-y-3">
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                <SelectContent>
                  {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={handleAssignGroup} disabled={!selectedGroupId}>Add to Group</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={!!messageDialog} onOpenChange={open => !open && setMessageDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{messageDialog?.type === "sms" ? "Send SMS" : "Send Email"} to {messageDialog?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {messageDialog?.type === "email" && (
              <div><Label>Subject</Label><Input value={messageSubject} onChange={e => setMessageSubject(e.target.value)} className="mt-1" /></div>
            )}
            <div><Label>Message</Label><Textarea value={messageBody} onChange={e => setMessageBody(e.target.value)} rows={4} className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button onClick={handleSendMessage} disabled={sending || !messageBody.trim()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {messageDialog?.type === "sms" ? "Send SMS" : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credit Allocation Dialog */}
      <Dialog open={!!creditDialog} onOpenChange={open => !open && setCreditDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Allocate Credits to {creditDialog?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Credits to add</Label><Input type="number" value={creditAmount || ""} onChange={e => setCreditAmount(parseInt(e.target.value) || 0)} min={1} /></div>
            <div>
              <Label>Admin Password (verification)</Label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Enter your password" />
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
  );
};

export default AdminUsers;
