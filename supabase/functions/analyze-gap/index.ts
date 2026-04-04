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

    const [jobRes, profileRes, workHistoryRes, educationRes] = await Promise.all([
      supabase.from("jobs").select("*").eq("id", jobId).eq("user_id", user.id).single(),
      supabase.from("user_profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("work_history").select("*").eq("user_id", user.id).order("sort_order"),
      supabase.from("education").select("*").eq("user_id", user.id),
    ]);

    if (jobRes.error || !jobRes.data) return new Response(JSON.stringify({ error: "Job not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const job = jobRes.data;
    const profile = profileRes.data;
    const workHistory = (workHistoryRes.data || []).map((w: any) =>
      `${w.title} at ${w.company}: ${w.description || ""} | Achievements: ${w.achievements || ""} | Skills: ${(w.skills || []).join(", ")}`
    ).join("\n");
    const educationText = (educationRes.data || []).map((e: any) => `${e.degree || ""} ${e.field || ""} at ${e.institution}`).join(", ");

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const prompt = `Compare this candidate's profile against the target job description and provide a gap analysis.

JOB DESCRIPTION:
Title: ${job.title}
Company: ${job.company}
Requirements: ${job.requirements_summary}
Full Description: ${job.description}

CANDIDATE PROFILE:
Name: ${profile?.full_name || ""}
Headline: ${profile?.headline || ""}
Summary: ${profile?.summary || ""}
Skills: ${(profile?.top_skills || []).join(", ")}
Experience: ${profile?.years_of_experience || 0} years
Education: ${educationText}

WORK HISTORY:
${workHistory || "None provided"}

RULES:
- Be direct but not cruel
- Do not invent missing experience
- Focus on improving the application quality
- Distinguish between true dealbreakers and fixable weaknesses
- Identify specific keywords from the JD that are missing from the candidate's profile
- Suggest concrete improvements the candidate can make`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a recruiter-fit and improvement advisor. Compare candidates against job descriptions and provide actionable, honest gap analysis. Be direct but constructive." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "analyze_gap",
            description: "Analyze the gap between candidate and job requirements",
            parameters: {
              type: "object",
              properties: {
                strongestFitAreas: { type: "array", items: { type: "string" }, description: "Areas where the candidate is a strong match" },
                recruiterConcerns: { type: "array", items: { type: "string" }, description: "Likely concerns a recruiter would have" },
                missingKeywords: { type: "array", items: { type: "string" }, description: "Important JD keywords missing from candidate profile" },
                missingEvidence: { type: "array", items: { type: "string" }, description: "Claims or skills that lack supporting evidence/metrics" },
                improvementSuggestions: { type: "array", items: { type: "string" }, description: "Specific actionable suggestions to improve alignment" },
                verdict: { type: "string", enum: ["apply", "improve_then_apply", "skip"], description: "Overall recommendation" },
                verdictReason: { type: "string", description: "Brief explanation of the verdict" },
              },
              required: ["strongestFitAreas", "recruiterConcerns", "missingKeywords", "missingEvidence", "improvementSuggestions", "verdict", "verdictReason"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "analyze_gap" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI analysis failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) return new Response(JSON.stringify({ error: "AI did not return structured data" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, data: result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("analyze-gap error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
