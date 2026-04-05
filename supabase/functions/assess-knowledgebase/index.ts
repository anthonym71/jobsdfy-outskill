import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    // Load profile data (source of truth) and knowledgebase
    const [profileRes, workRes, eduRes, kbRes] = await Promise.all([
      supabase.from("user_profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("work_history").select("*").eq("user_id", user.id).order("sort_order"),
      supabase.from("education").select("*").eq("user_id", user.id),
      supabase.from("knowledgebase_entries").select("*").eq("user_id", user.id),
    ]);

    const profile = profileRes.data;
    const work = workRes.data || [];
    const edu = eduRes.data || [];
    const kb = kbRes.data || [];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return new Response(JSON.stringify({ error: "AI not configured" }), { status: 500, headers: corsHeaders });

    const profileText = profile ? `Name: ${profile.full_name}\nHeadline: ${profile.headline}\nSummary: ${profile.summary}\nSkills: ${(profile.top_skills || []).join(", ")}` : "";
    const workText = work.map(w => `${w.title} at ${w.company} (${w.start_year}-${w.is_current ? "Present" : w.end_year}): ${w.description || ""} | Achievements: ${w.achievements || ""}`).join("\n");
    const eduText = edu.map(e => `${e.degree || ""} ${e.field || ""} at ${e.institution}`).join("\n");
    const kbText = kb.map(k => `[${k.category}] ${k.title}: ${k.content}`).join("\n---\n");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: `You are a data integrity analyst. Compare the knowledgebase entries against the verified profile data (Work History, Education, Profile). Identify:
1. CONFLICTS: Where knowledgebase entries contradict verified data (dates, titles, companies, skills)
2. DUPLICATES: Entries that say the same thing
3. OUTDATED: Info that appears superseded by verified records
4. SUPPLEMENTARY: Valid additional info not in verified data

Create a comprehensive assessment report.` },
          { role: "user", content: `VERIFIED PROFILE:\n${profileText}\n\nVERIFIED WORK HISTORY:\n${workText}\n\nVERIFIED EDUCATION:\n${eduText}\n\nKNOWLEDGEBASE ENTRIES:\n${kbText}` },
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: corsHeaders });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: corsHeaders });
      return new Response(JSON.stringify({ error: "Assessment failed" }), { status: 500, headers: corsHeaders });
    }

    const aiData = await aiResp.json();
    const report = aiData.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ report }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("assess-knowledgebase error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
