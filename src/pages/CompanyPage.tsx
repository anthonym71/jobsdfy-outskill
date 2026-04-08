import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Building2, Globe, ShieldCheck, Search, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const CompanyPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<any[]>([]);
  const [myCompany, setMyCompany] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [form, setForm] = useState({
    name: "", domain: "", website_url: "", description: "",
    industry: "", size: "", location: "",
  });

  useEffect(() => { load(); }, [user]);

  const load = async () => {
    const { data } = await supabase.from("companies").select("*").eq("is_verified", true).order("name");
    if (data) setCompanies(data);
    if (user) {
      const { data: mine } = await supabase.from("companies").select("*").eq("admin_user_id", user.id).maybeSingle();
      if (mine) setMyCompany(mine);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!user || !form.name || !form.domain) return;
    // Validate email matches domain
    const userEmail = user.email || "";
    const emailDomain = userEmail.split("@")[1]?.toLowerCase();
    const companyDomain = form.domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];

    if (emailDomain !== companyDomain) {
      toast({ title: "Domain mismatch", description: `Your email domain (${emailDomain}) must match the company domain (${companyDomain}). Please sign up with a matching email.`, variant: "destructive" });
      return;
    }

    setCreating(true);
    const { error } = await supabase.from("companies").insert({
      name: form.name,
      domain: companyDomain,
      website_url: form.website_url || `https://${companyDomain}`,
      description: form.description,
      industry: form.industry,
      size: form.size,
      location: form.location,
      admin_user_id: user.id,
      is_verified: false,
    } as any);
    setCreating(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Company registered!", description: "Verification email will be sent to confirm ownership." });
      setShowCreate(false);
      load();
    }
  };

  const handleScrape = async () => {
    if (!myCompany?.website_url) return;
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("firecrawl-scrape", {
        body: { url: myCompany.website_url, options: { formats: ["markdown", "branding"] } },
      });
      if (data?.success) {
        await supabase.from("companies").update({ scraped_data: data.data || data } as any).eq("id", myCompany.id);
        toast({ title: "Website scraped successfully!" });
        load();
      } else {
        toast({ title: "Scrape failed", description: data?.error || "Could not scrape website", variant: "destructive" });
      }
    } catch {
      toast({ title: "Scrape unavailable", variant: "destructive" });
    }
    setVerifying(false);
  };

  const filtered = companies.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.domain?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Companies</h1>
          <p className="text-sm text-muted-foreground mt-1">Verified company profiles on JobsDFY.</p>
        </div>
        {!myCompany && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" />Register Company</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Register Your Company</DialogTitle></DialogHeader>
              <p className="text-xs text-muted-foreground">Your email domain must match the company domain to verify ownership.</p>
              <div className="space-y-4 pt-2">
                <div><Label>Company Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><Label>Domain * (e.g. acme.com)</Label><Input value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} placeholder="acme.com" /></div>
                <div><Label>Website URL</Label><Input value={form.website_url} onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))} placeholder="https://acme.com" /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Industry</Label><Input value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} /></div>
                  <div><Label>Size</Label><Input value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))} placeholder="e.g. 50-200" /></div>
                </div>
                <div><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
                <Button onClick={handleCreate} disabled={creating || !form.name || !form.domain} className="w-full">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}Register
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* My Company Card */}
      {myCompany && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />{myCompany.name}
              {myCompany.is_verified ? <ShieldCheck className="h-4 w-4 text-verdict-go" /> : <span className="text-xs text-amber-500">(Pending Verification)</span>}
            </h3>
            <Button size="sm" variant="outline" onClick={handleScrape} disabled={verifying}>
              {verifying ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Globe className="h-3 w-3 mr-1" />}
              Scrape Website
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{myCompany.domain} · {myCompany.industry} · {myCompany.location}</p>
          {myCompany.description && <p className="text-sm text-muted-foreground">{myCompany.description}</p>}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search companies..." className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No verified companies yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(company => (
            <div key={company.id} className="rounded-xl border border-border bg-card p-5 space-y-2">
              <div className="flex items-center gap-2">
                {company.logo_url ? <img src={company.logo_url} alt="" className="h-8 w-8 rounded object-cover" /> : <Building2 className="h-8 w-8 text-muted-foreground" />}
                <div>
                  <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-1">
                    {company.name}<ShieldCheck className="h-3 w-3 text-verdict-go" />
                  </h3>
                  <p className="text-xs text-muted-foreground">{company.domain}</p>
                </div>
              </div>
              {company.industry && <p className="text-xs text-muted-foreground">{company.industry} · {company.size} · {company.location}</p>}
              {company.description && <p className="text-xs text-muted-foreground line-clamp-2">{company.description}</p>}
              {company.website_url && (
                <a href={company.website_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Globe className="h-3 w-3" />{company.website_url}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanyPage;
