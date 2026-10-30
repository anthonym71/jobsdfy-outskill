import { supabase } from "@/integrations/supabase/client";

export const VOICE_DICTIONARY_KEY = "jobsdfy-voice-dictionary";
export const PROFILE_UPDATED_EVENT = "jobsdfy:profile-updated";

export const VOICE_TOPICS = [
  { value: "about", label: "About Me" },
  { value: "work", label: "A job / work history" },
  { value: "skills", label: "Skills" },
  { value: "achievements", label: "An achievement" },
  { value: "education", label: "Education" },
  { value: "references", label: "A reference" },
];

const arr = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(String).map((s) => s.trim()).filter(Boolean)
  : typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];

/** Union, case-insensitive, keeps existing order first. */
export function mergeList(existing: string[] | null | undefined, incoming: string[]): string[] {
  const out = [...(existing || [])];
  const seen = new Set(out.map((s) => s.toLowerCase()));
  for (const s of incoming) if (!seen.has(s.toLowerCase())) { seen.add(s.toLowerCase()); out.push(s); }
  return out;
}

/** Saves extracted voice data into the user's profile. Returns a short description of what was saved. */
export async function saveVoiceData(userId: string, category: string, data: any): Promise<string> {
  const d = Array.isArray(data) ? data[0] ?? {} : data ?? {};
  if (category === "about" || category === "skills") {
    const { data: p } = await supabase.from("user_profiles").select("*").eq("user_id", userId).maybeSingle();
    if (!p) return "Saved to your Knowledgebase (finish onboarding to fill your profile)";
    const upd: Record<string, any> = {};
    const text = (k: string, src: string) => { if (!p[k as keyof typeof p] && d[src]) upd[k] = String(d[src]); };
    if (category === "about") {
      text("location", "location"); text("headline", "headline"); text("summary", "summary");
      if (!p.years_of_experience && Number(d.years_of_experience)) upd.years_of_experience = Number(d.years_of_experience);
      for (const k of ["industries", "languages_spoken", "hobbies", "interests", "sports"]) {
        const inc = arr(d[k]); if (inc.length) upd[k] = mergeList((p as any)[k], inc);
      }
    }
    const skills = arr(d.top_skills ?? d.skills);
    if (skills.length) upd.top_skills = mergeList(p.top_skills, skills);
    if (!Object.keys(upd).length) return "Nothing new to add — kept your existing details";
    const { error } = await supabase.from("user_profiles").update(upd).eq("user_id", userId);
    if (error) throw error;
    return `Updated ${Object.keys(upd).length} profile field(s)`;
  }
  if (category === "work") {
    const jobs = (Array.isArray(data) ? data : d.jobs || []).filter((j: any) => j?.title && j?.company);
    if (!jobs.length) return "No complete jobs found";
    const rows = jobs.map((j: any) => ({
      user_id: userId, title: j.title, company: j.company, employment_type: j.employment_type || "Full-time",
      is_current: !!j.is_current, start_month: j.start_month ?? null, start_year: j.start_year ?? null,
      end_month: j.end_month ?? null, end_year: j.end_year ?? null, location: j.location ?? null,
      location_type: j.location_type ?? null, description: j.description ?? null, achievements: j.achievements ?? null,
      awards: j.awards ?? null, performance: j.performance ?? null, skills: arr(j.skills),
    }));
    const { error } = await supabase.from("work_history").insert(rows);
    if (error) throw error;
    return `Added ${rows.length} job(s) to Work History`;
  }
  if (category === "education") {
    const list = (Array.isArray(data) ? data : d.education || []).filter((e: any) => e?.institution);
    if (!list.length) return "No education entries found";
    const { error } = await supabase.from("education").insert(list.map((e: any) => ({
      user_id: userId, institution: e.institution, degree: e.degree ?? null, field: e.field ?? null,
      start_year: Number(e.start_year) || null, end_year: Number(e.end_year) || null, description: e.description ?? null,
    })));
    if (error) throw error;
    return `Added ${list.length} education entr${list.length === 1 ? "y" : "ies"}`;
  }
  return "Saved to your Knowledgebase";
}
