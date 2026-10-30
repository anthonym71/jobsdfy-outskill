import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Page = { to: string; label: string };

const AppSearch = ({ pages }: { pages: Page[] }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [jobs, setJobs] = useState<{ id: string; title: string; company: string | null }[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (!user || term.length < 2) { setJobs([]); return; }
    const t = setTimeout(async () => {
      const safe = term.replace(/[%,()]/g, " ");
      const { data } = await supabase.from("jobs").select("id,title,company")
        .eq("user_id", user.id).or(`title.ilike.%${safe}%,company.ilike.%${safe}%`).limit(5);
      setJobs(data || []);
    }, 250);
    return () => clearTimeout(t);
  }, [q, user]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? pages.filter((p) => p.label.toLowerCase().includes(t)).slice(0, 6) : [];
  }, [q, pages]);

  const go = (to: string) => { navigate(to); setQ(""); setOpen(false); };

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === "Enter") { const first = matches[0]?.to || (jobs[0] && `/app/jobs/${jobs[0].id}`); if (first) go(first); } }}
        placeholder="Search pages and your jobs…"
        aria-label="Search"
        className="h-9 pl-9"
      />
      {open && (matches.length > 0 || jobs.length > 0) && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border border-border bg-popover p-1 shadow-lg">
          {matches.map((p) => (
            <button key={p.to} onClick={() => go(p.to)} className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent">{p.label}</button>
          ))}
          {jobs.map((j) => (
            <button key={j.id} onClick={() => go(`/app/jobs/${j.id}`)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent">
              <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />{j.title}{j.company ? <span className="text-muted-foreground">· {j.company}</span> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppSearch;
