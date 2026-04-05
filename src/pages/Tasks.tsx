import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PlusCircle, Loader2, Trash2, CalendarDays, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const TASK_STATUSES = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
  { value: "blocked", label: "Blocked" },
  { value: "cancelled", label: "Cancelled" },
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const statusColors: Record<string, string> = {
  todo: "bg-accent text-accent-foreground",
  in_progress: "bg-verdict-review-bg text-verdict-review",
  done: "bg-verdict-go-bg text-verdict-go",
  blocked: "bg-verdict-stop-bg text-verdict-stop",
  cancelled: "bg-muted text-muted-foreground",
};

const Tasks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (user) loadTasks();
  }, [user]);

  const loadTasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user!.id)
      .order("due_date", { ascending: true, nullsFirst: false });
    setTasks(data || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("tasks").insert({
      user_id: user!.id,
      title: title.trim(),
      description: description.trim(),
      due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
      status,
      priority,
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Task created" });
      setTitle(""); setDescription(""); setDueDate(undefined); setStatus("todo"); setPriority("medium");
      setDialogOpen(false);
      loadTasks();
    }
    setSaving(false);
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    await supabase.from("tasks").update({ status: newStatus, updated_at: new Date().toISOString() } as any).eq("id", taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const deleteTask = async (taskId: string) => {
    await supabase.from("tasks").delete().eq("id", taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const setToday = () => setDueDate(new Date());

  const filtered = tasks.filter(t => statusFilter === "all" || t.status === statusFilter);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Track your to-dos and follow-ups.</p>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {TASK_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" />New Task</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1" /></div>
                <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-1" rows={2} /></div>
                <div>
                  <Label>Due Date</Label>
                  <div className="flex gap-2 mt-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus /></PopoverContent>
                    </Popover>
                    <Button variant="outline" size="sm" onClick={setToday}>Today</Button>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{TASK_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter><Button onClick={handleCreate} disabled={saving || !title.trim()}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}Create Task</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <CheckCircle2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground">No tasks</p>
          <p className="text-sm text-muted-foreground mt-1">Create a task to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => (
            <div key={task.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4 gap-3">
              <div className="min-w-0 flex-1">
                <p className={cn("font-medium text-sm truncate", task.status === "done" && "line-through text-muted-foreground")}>{task.title}</p>
                {task.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{task.description}</p>}
                <div className="flex gap-2 items-center mt-1 text-xs text-muted-foreground">
                  {task.due_date && <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{new Date(task.due_date).toLocaleDateString()}</span>}
                  <span className="capitalize">{task.priority} priority</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Select value={task.status} onValueChange={v => updateTaskStatus(task.id, v)}>
                  <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{TASK_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
                <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", statusColors[task.status] || statusColors.todo)}>
                  {TASK_STATUSES.find(s => s.value === task.status)?.label || task.status}
                </span>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteTask(task.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tasks;
