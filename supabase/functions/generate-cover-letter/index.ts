import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing authorization" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: authHeader } } });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { jobId } = await req.json();
    if (!jobId) return new Response(JSON.stringify({ error: "jobId is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const [jobRes, profileRes, workHistoryRes] = await Promise.all([
      supabase.from("jobs").select("*").eq("id", jobId).eq("user_id", user.id).single(),
      supabase.from("user_profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("work_history").select("*").eq("user_id", user.id).order("sort_order").limit(5),
    ]);

    if (jobRes.error || !jobRes.data) return new Response(JSON.stringify({ error: "Job not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const job = jobRes.data;
    const profile = profileRes.data;
    const workHistory = (workHistoryRes.data || []).map((w: any) =>
      `${w.title} at ${w.company} (${w.start_year || ""}-${w.is_current ? "Present" : w.end_year || ""}): ${w.description || ""} ${w.achievements || ""}`
    ).join("\n");

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const prompt = `Write a tailored cover letter for this candidate applying to this specific role.

JOB:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Description: ${job.description}
Requirements: ${job.requirements_summary}

CANDIDATE:
Name: ${profile?.full_name || "Candidate"}
Headline: ${profile?.headline || ""}
Summary: ${profile?.summary || ""}
Skills: ${(profile?.top_skills || []).join(", ")}
Experience: ${profile?.years_of_experience || 0} years

RECENT WORK HISTORY:
${workHistory || "Not provided"}

RULES:
- Personalize intro based on the company and role
- Connect candidate experience directly to job requirements
- Show genuine motivation (not generic fluff)
- 300-400 words maximum
- Tone: professional, confident, human
- Do not invent facts or experiences
- Make it clear why THIS candidate is right for THIS role`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an expert cover letter writer. Write compelling, personalized cover letters that connect candidate experience to job requirements. Never use generic filler. Keep it 300-400 words, professional but human." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_cover_letter",
            description: "Generate a tailored cover letter",
            parameters: {
              type: "object",
              properties: {
                coverLetter: { type: "string", description: "The full cover letter text" },
                keyAlignments: { type: "array", items: { type: "string" }, description: "Key points where candidate experience aligns with role requirements" },
                toneNotes: { type: "string", description: "Notes on tone and positioning choices" },
              },
              required: ["coverLetter", "keyAlignments", "toneNotes"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_cover_letter" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI generation failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) return new Response(JSON.stringify({ error: "AI did not return structured data" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const result = JSON.parse(toolCall.function.arguments);

    // Save as application asset
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);
    await adminClient.from("application_assets").upsert({
      job_id: jobId, user_id: user.id, asset_type: "cover_letter", content: result.coverLetter,
    }, { onConflict: "job_id,asset_type,user_id" }).select();
    // If upsert fails due to no unique constraint, just insert
    await adminClient.from("application_assets").insert({
      job_id: jobId, user_id: user.id, asset_type: "cover_letter", content: result.coverLetter,
    });

    return new Response(JSON.stringify({ success: true, data: result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-cover-letter error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
