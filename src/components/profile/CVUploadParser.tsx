import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, FileText, CheckCircle, XCircle, AlertTriangle, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface CVUploadParserProps {
  onImportComplete: () => void;
  onReviewComplete?: (data: any) => void;
}

const CVUploadParser = ({ onImportComplete, onReviewComplete }: CVUploadParserProps) => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "parsing" | "review" | "importing">("upload");
  const [parsedData, setParsedData] = useState<any>(null);
  const [conflicts, setConflicts] = useState<any>(null);
  const [selectedActions, setSelectedActions] = useState<Record<string, string>>({});
  const [dragging, setDragging] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);

  const processFile = async (file: File) => {
    if (!user || !session) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum 5MB", variant: "destructive" });
      return;
    }

    setStep("parsing");

    try {
      // Upload to cv-uploads bucket
      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("cv-uploads").upload(path, file);
      if (uploadError) throw uploadError;

      // For PDFs: read as base64 and use Vision API on server side
      // For text files: read as text
      const isPdf = file.name.toLowerCase().endsWith(".pdf");
      let cvText = "";

      if (isPdf) {
        // Convert PDF to base64 and send to server for extraction
        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
        );

        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-cv`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ pdfBase64: base64, fileName: file.name }),
        });

        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || "Parsing failed");
        setParsedData(data.data);

        // Detect conflicts
        const conflictResp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detect-cv-conflicts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ parsedCV: data.data }),
        });

        const conflictData = await conflictResp.json();
        if (!conflictResp.ok) throw new Error(conflictData.error || "Conflict detection failed");
        setConflicts(conflictData.data);
        initDefaults(conflictData.data);
        setStep("review");
        return;
      }

      // Text-based files
      cvText = await file.text();

      if (cvText.trim().length < 50) {
        toast({ title: "CV text too short", description: "The extracted text is too short. Try a different format.", variant: "destructive" });
        setStep("upload");
        return;
      }

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-cv`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ cvText }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Parsing failed");

      setParsedData(data.data);

      // Detect conflicts
      const conflictResp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detect-cv-conflicts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ parsedCV: data.data }),
      });

      const conflictData = await conflictResp.json();
      if (!conflictResp.ok) throw new Error(conflictData.error || "Conflict detection failed");
      setConflicts(conflictData.data);
      initDefaults(conflictData.data);
      setStep("review");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setStep("upload");
    }
  };

  const initDefaults = (conflictData: any) => {
    const defaults: Record<string, string> = {};
    conflictData.workHistoryConflicts?.forEach((_: any, i: number) => {
      defaults[`work_${i}`] = "add";
    });
    conflictData.educationConflicts?.forEach((_: any, i: number) => {
      defaults[`edu_${i}`] = "add";
    });
    conflictData.profileConflicts?.forEach((c: any, i: number) => {
      defaults[`profile_${i}`] = c.recommendation === "keep_existing" ? "skip" : "use_new";
    });
    setSelectedActions(defaults);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await processFile(file);
  }, [user, session]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  // Inline editing for parsed data
  const updateParsedField = (path: string, value: any) => {
    setParsedData((prev: any) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let obj = copy;
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return copy;
    });
  };

  const handleImport = async () => {
    if (!user || !parsedData) return;
    if (onReviewComplete) {
      onReviewComplete(parsedData);
      setStep("upload");
      return;
    }
    setStep("importing");

    try {
      // Import work history
      const workToAdd = conflicts?.workHistoryConflicts?.filter((_: any, i: number) =>
        selectedActions[`work_${i}`] === "add" || selectedActions[`work_${i}`] === "replace"
      ) || [];

      for (const conflict of workToAdd) {
        const parsed = parsedData.workHistory?.[conflict.parsedIndex];
        if (!parsed) continue;

        if (conflict.existingId && selectedActions[`work_${workToAdd.indexOf(conflict)}`] === "replace") {
          await supabase.from("work_history").delete().eq("id", conflict.existingId);
        }

        await supabase.from("work_history").insert({
          user_id: user.id,
          title: parsed.title || "",
          company: parsed.company || "",
          employment_type: parsed.employmentType || "Full-time",
          is_current: parsed.isCurrent || false,
          is_concurrent: false,
          start_month: parsed.startMonth || null,
          start_year: parsed.startYear || null,
          end_month: parsed.endMonth || null,
          end_year: parsed.endYear || null,
          description: parsed.description || "",
          achievements: parsed.achievements || "",
          skills: parsed.skills || [],
          sort_order: 99,
        });
      }

      // Import education
      const eduToAdd = conflicts?.educationConflicts?.filter((_: any, i: number) =>
        selectedActions[`edu_${i}`] === "add" || selectedActions[`edu_${i}`] === "replace"
      ) || [];

      for (const conflict of eduToAdd) {
        const parsed = parsedData.education?.[conflict.parsedIndex];
        if (!parsed) continue;

        await supabase.from("education").insert({
          user_id: user.id,
          institution: parsed.institution || "",
          degree: parsed.degree || null,
          field: parsed.field || null,
          start_year: parsed.startYear || null,
          end_year: parsed.endYear || null,
          description: parsed.description || null,
        });
      }

      // Import certificates
      const newCerts = conflicts?.newCertificates?.filter((c: any) => c.isNew) || [];
      for (const cert of newCerts) {
        const parsed = parsedData.certificates?.find((c: any) => c.name === cert.name);
        if (!parsed) continue;

        await supabase.from("certificates").insert({
          user_id: user.id,
          name: parsed.name,
          issuer: parsed.issuer || null,
          date_issued: parsed.dateIssued || null,
        });
      }

      // Update profile fields
      const profileUpdates: any = {};
      conflicts?.profileConflicts?.forEach((c: any, i: number) => {
        if (selectedActions[`profile_${i}`] === "use_new") {
          const fieldMap: Record<string, string> = {
            "fullName": "full_name",
            "headline": "headline",
            "summary": "summary",
            "location": "location",
            "topSkills": "top_skills",
          };
          const dbField = fieldMap[c.field];
          if (dbField) profileUpdates[dbField] = c.newValue;
        }
      });

      if (Object.keys(profileUpdates).length > 0) {
        await supabase.from("user_profiles").update(profileUpdates).eq("user_id", user.id);
      }

      toast({ title: "CV imported successfully!" });
      onImportComplete();
    } catch (err: any) {
      toast({ title: "Import error", description: err.message, variant: "destructive" });
    }

    setStep("upload");
  };

  if (step === "upload") {
    return (
      <div
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
          dragging ? "border-primary bg-primary/10" : "border-border bg-card/50 hover:border-primary/50"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-foreground mb-1">
          {dragging ? "Drop your CV here" : "Drag & drop your CV here"}
        </p>
        <p className="text-xs text-muted-foreground mb-4">or click to browse · Supports .pdf, .txt, .docx (max 5MB)</p>
        <input ref={fileInputRef} type="file" accept=".txt,.docx,.pdf,.doc" onChange={handleFileSelect} className="hidden" />
        <Button variant="outline" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
          <Upload className="h-4 w-4 mr-1" />Choose File
        </Button>
      </div>
    );
  }

  if (step === "parsing") {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">Parsing your CV with AI…</p>
        <p className="text-xs text-muted-foreground mt-1">Extracting work history, education, and skills</p>
      </div>
    );
  }

  if (step === "importing") {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">Importing data…</p>
      </div>
    );
  }

  // Review view with editable fields
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5">
      <div>
        <h3 className="font-heading text-sm font-semibold text-foreground">CV Import Review</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Review the extracted data below. Click <Pencil className="h-3 w-3 inline" /> to edit any field before importing.</p>
      </div>

      {/* Parsed summary */}
      {parsedData && (
        <div className="rounded-lg bg-accent/20 p-3 space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Extracted Data Summary</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-muted-foreground">Name: </span>
              {editingField === "fullName" ? (
                <Input className="h-6 text-xs inline-flex w-40" value={parsedData.fullName || ""} onChange={e => updateParsedField("fullName", e.target.value)} onBlur={() => setEditingField(null)} autoFocus />
              ) : (
                <span className="text-foreground">{parsedData.fullName || "—"} <button onClick={() => setEditingField("fullName")}><Pencil className="h-2.5 w-2.5 inline text-muted-foreground hover:text-primary" /></button></span>
              )}
            </div>
            <div><span className="text-muted-foreground">Email: </span><span className="text-foreground">{parsedData.email || "—"}</span></div>
            <div><span className="text-muted-foreground">Phone: </span><span className="text-foreground">{parsedData.phone || "—"}</span></div>
            <div><span className="text-muted-foreground">Location: </span><span className="text-foreground">{parsedData.location || "—"}</span></div>
            <div className="col-span-2"><span className="text-muted-foreground">Headline: </span>
              {editingField === "headline" ? (
                <Input className="h-6 text-xs inline-flex w-full" value={parsedData.headline || ""} onChange={e => updateParsedField("headline", e.target.value)} onBlur={() => setEditingField(null)} autoFocus />
              ) : (
                <span className="text-foreground">{parsedData.headline || "—"} <button onClick={() => setEditingField("headline")}><Pencil className="h-2.5 w-2.5 inline text-muted-foreground hover:text-primary" /></button></span>
              )}
            </div>
            {parsedData.topSkills?.length > 0 && (
              <div className="col-span-2"><span className="text-muted-foreground">Skills: </span><span className="text-foreground">{parsedData.topSkills.join(", ")}</span></div>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground italic">Source: imported from uploaded CV</p>
        </div>
      )}

      {/* Profile conflicts */}
      {conflicts?.profileConflicts?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Profile Fields</h4>
          {conflicts.profileConflicts.map((c: any, i: number) => (
            <div key={i} className="rounded-lg bg-accent/30 p-3 space-y-1">
              <p className="text-xs font-medium text-foreground">{c.field}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Current: </span><span className="text-foreground">{c.existingValue || "—"}</span></div>
                <div><span className="text-muted-foreground">CV: </span><span className="text-primary">{c.newValue || "—"}</span></div>
              </div>
              <div className="flex gap-2 mt-1">
                <label className="flex items-center gap-1 text-xs cursor-pointer">
                  <input type="radio" name={`profile_${i}`} checked={selectedActions[`profile_${i}`] === "skip"} onChange={() => setSelectedActions(p => ({ ...p, [`profile_${i}`]: "skip" }))} />
                  Keep current
                </label>
                <label className="flex items-center gap-1 text-xs cursor-pointer">
                  <input type="radio" name={`profile_${i}`} checked={selectedActions[`profile_${i}`] === "use_new"} onChange={() => setSelectedActions(p => ({ ...p, [`profile_${i}`]: "use_new" }))} />
                  Use CV value
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Work history */}
      {conflicts?.workHistoryConflicts?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Work History</h4>
          {conflicts.workHistoryConflicts.map((c: any, i: number) => {
            const parsed = parsedData?.workHistory?.[c.parsedIndex];
            const pi = c.parsedIndex;
            return (
              <div key={i} className="rounded-lg bg-accent/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {c.type === "new" && <CheckCircle className="h-3.5 w-3.5 text-verdict-go" />}
                    {c.type === "conflict" && <AlertTriangle className="h-3.5 w-3.5 text-verdict-review" />}
                    {c.type === "match" && <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                    <span className="text-xs font-medium text-muted-foreground uppercase">{c.type === "new" ? "New" : c.type === "conflict" ? "Conflict" : "Match"}</span>
                  </div>
                  <select
                    className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                    value={selectedActions[`work_${i}`] || "skip"}
                    onChange={e => setSelectedActions(p => ({ ...p, [`work_${i}`]: e.target.value }))}
                  >
                    <option value="add">Add</option>
                    <option value="replace">Replace</option>
                    <option value="skip">Skip</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground">Company</label>
                    <Input className="h-7 text-xs mt-0.5" value={parsed?.company || ""} onChange={e => updateParsedField(`workHistory.${pi}.company`, e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Job Title</label>
                    <Input className="h-7 text-xs mt-0.5" value={parsed?.title || ""} onChange={e => updateParsedField(`workHistory.${pi}.title`, e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground">Start Day</label>
                    <Input className="h-7 text-xs mt-0.5" type="number" min={0} max={31} placeholder="DD" value={parsed?.startDay || ""} onChange={e => updateParsedField(`workHistory.${pi}.startDay`, e.target.value ? parseInt(e.target.value) : null)} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Start Month</label>
                    <Input className="h-7 text-xs mt-0.5" type="number" min={0} max={12} placeholder="MM" value={parsed?.startMonth || ""} onChange={e => updateParsedField(`workHistory.${pi}.startMonth`, e.target.value ? parseInt(e.target.value) : null)} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Start Year</label>
                    <Input className="h-7 text-xs mt-0.5" type="number" min={1950} max={2030} placeholder="YYYY" value={parsed?.startYear || ""} onChange={e => updateParsedField(`workHistory.${pi}.startYear`, e.target.value ? parseInt(e.target.value) : null)} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">End Day</label>
                    <Input className="h-7 text-xs mt-0.5" type="number" min={0} max={31} placeholder="DD" value={parsed?.endDay || ""} onChange={e => updateParsedField(`workHistory.${pi}.endDay`, e.target.value ? parseInt(e.target.value) : null)} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">End Month</label>
                    <Input className="h-7 text-xs mt-0.5" type="number" min={0} max={12} placeholder="MM" value={parsed?.endMonth || ""} onChange={e => updateParsedField(`workHistory.${pi}.endMonth`, e.target.value ? parseInt(e.target.value) : null)} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">End Year</label>
                    <Input className="h-7 text-xs mt-0.5" type="number" min={1950} max={2030} placeholder="YYYY" value={parsed?.endYear || ""} onChange={e => updateParsedField(`workHistory.${pi}.endYear`, e.target.value ? parseInt(e.target.value) : null)} />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground">Achievements</label>
                  <textarea
                    className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs min-h-[48px] resize-y"
                    value={parsed?.achievements || ""}
                    onChange={e => updateParsedField(`workHistory.${pi}.achievements`, e.target.value)}
                    placeholder="Key achievements in this role..."
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Education */}
      {conflicts?.educationConflicts?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Education</h4>
          {conflicts.educationConflicts.map((c: any, i: number) => (
            <div key={i} className="rounded-lg bg-accent/30 p-3 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-foreground">{c.parsedInstitution}</span>
                <span className="text-xs text-muted-foreground ml-2">{c.type === "new" ? "(New)" : c.type === "match" ? "(Exists)" : "(Conflict)"}</span>
              </div>
              <select
                className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                value={selectedActions[`edu_${i}`] || "skip"}
                onChange={e => setSelectedActions(p => ({ ...p, [`edu_${i}`]: e.target.value }))}
              >
                <option value="add">Add</option>
                <option value="replace">Replace</option>
                <option value="skip">Skip</option>
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Certificates */}
      {conflicts?.newCertificates?.filter((c: any) => c.isNew).length > 0 && (
        <div className="space-y-1">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">New Certificates</h4>
          {conflicts.newCertificates.filter((c: any) => c.isNew).map((c: any, i: number) => (
            <div key={i} className="text-xs text-foreground flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3 text-verdict-go" />
              {c.name}{c.issuer ? ` — ${c.issuer}` : ""}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={() => setStep("upload")}>Cancel</Button>
        <Button size="sm" onClick={handleImport}>
          Import Selected
        </Button>
      </div>
    </div>
  );
};

export default CVUploadParser;
