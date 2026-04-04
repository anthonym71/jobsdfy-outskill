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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { targetRole, targetIndustry, versionName } = await req.json();
    if (!targetRole) return new Response(JSON.stringify({ error: "Target role required" }), { status: 400, headers: corsHeaders });

    // Load all profile data
    const [profileRes, workRes, eduRes, certRes] = await Promise.all([
      supabase.from("user_profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("work_history").select("*").eq("user_id", user.id).order("sort_order"),
      supabase.from("education").select("*").eq("user_id", user.id),
      supabase.from("certificates").select("*").eq("user_id", user.id),
    ]);

    const profile = profileRes.data;
    const work = workRes.data || [];
    const edu = eduRes.data || [];
    const certs = certRes.data || [];

    if (!profile) return new Response(JSON.stringify({ error: "No profile found" }), { status: 404, headers: corsHeaders });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return new Response(JSON.stringify({ error: "AI not configured" }), { status: 500, headers: corsHeaders });

    const workText = work.map(w => `${w.title} at ${w.company} (${w.start_year}-${w.is_current ? "Present" : w.end_year}): ${w.description || ""} | Achievements: ${w.achievements || ""} | Skills: ${(w.skills || []).join(", ")}`).join("\n");
    const eduText = edu.map(e => `${e.degree || ""} ${e.field || ""} at ${e.institution} (${e.start_year}-${e.end_year})`).join("\n");
    const certText = certs.map(c => `${c.name} - ${c.issuer || "?"}`).join("\n");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: `You are an elite executive CV writer. Create a role-positioned CV version targeting: "${targetRole}"${targetIndustry ? ` in the ${targetIndustry} industry` : ""}. Rewrite the summary, reorder/emphasize relevant experience, highlight transferable skills, and use ATS-optimized keywords for the target role. Use STAR methodology for all bullets. Never fabricate experience.` },
          { role: "user", content: `CANDIDATE:\nName: ${profile.full_name}\nHeadline: ${profile.headline || ""}\nSummary: ${profile.summary || ""}\nSkills: ${(profile.top_skills || []).join(", ")}\n\nWORK HISTORY:\n${workText}\n\nEDUCATION:\n${eduText}\n\nCERTIFICATES:\n${certText}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_cv_version",
            description: "Create a role-positioned CV version",
            parameters: {
              type: "object",
              properties: {
                versionName: { type: "string" },
                professionalSummary: { type: "string" },
                coreSkills: { type: "array", items: { type: "string" } },
                experience: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      company: { type: "string" },
                      dateRange: { type: "string" },
                      bullets: { type: "array", items: { type: "string" } },
                    },
                    required: ["title", "company", "bullets"],
                  },
                },
                educationSection: { type: "array", items: { type: "string" } },
                certificatesSection: { type: "array", items: { type: "string" } },
                targetKeywords: { type: "array", items: { type: "string" } },
                positioningNotes: { type: "string" },
              },
              required: ["versionName", "professionalSummary", "coreSkills", "experience"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_cv_version" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: corsHeaders });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: corsHeaders });
      return new Response(JSON.stringify({ error: "CV version creation failed" }), { status: 500, headers: corsHeaders });
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return new Response(JSON.stringify({ error: "AI returned no result" }), { status: 500, headers: corsHeaders });

    const cvData = JSON.parse(toolCall.function.arguments);

    // Save to cv_versions
    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { error: insertError } = await adminClient.from("cv_versions").insert({
      user_id: user.id,
      version_name: versionName || cvData.versionName || `${targetRole} CV`,
      content: cvData,
      ats_keywords: cvData.targetKeywords || [],
    });

    if (insertError) console.error("Error saving CV version:", insertError);

    return new Response(JSON.stringify({ success: true, data: cvData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("position-cv-version error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
