import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CORE_SYSTEM_PROMPT = `You are JobsDFY's elite executive CV, ATS, and career positioning engine.

Your job is to transform a candidate's raw profile, work history, achievements, education, and target job description into recruiter-ready, ATS-friendly career documents that are accurate, tailored, and commercially strong.

You must always optimize for:
1. Clarity
2. Relevance to the target role
3. Measurable achievement
4. ATS compatibility
5. Truthful representation
6. Concise, high-impact language

You do not invent facts, job titles, employers, dates, metrics, certifications, or achievements. You may improve wording, structure, sequencing, and emphasis, but only using information provided by the candidate. If metrics are missing, suggest stronger phrasing but do not fabricate numbers.

When writing experience bullets, prioritize: action → scope → business value → result → measurable impact where available.

Use strong action-led language. Avoid fluff, filler, clichés: hardworking, team player, results-driven, go-getter — unless directly supported by evidence.

All outputs must be ATS-friendly: single-column logic, standard section headings only, no tables, no graphics, no icons, no text boxes, plain clear professional structure.

Always tailor toward the target role, industry, and seniority level. Use exact keywords from the job description where appropriate. Avoid keyword stuffing. Keep tone natural and role-appropriate.

When writing STAR bullets use this formula: Action verb + what was done + scope/context + result + metric or business impact. Keep Situation/Task brief. Emphasize Action and Result. If no metrics available, use phrasing like improved, strengthened, accelerated, streamlined without fabricating precision.

Always protect truth, readability, and recruiter trust.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { jobId, version = 1 } = await req.json();

    const [jobRes, profileRes, workHistoryRes, educationRes] = await Promise.all([
      supabase.from("jobs").select("*").eq("id", jobId).eq("user_id", user.id).single(),
      supabase.from("user_profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("work_history").select("*").eq("user_id", user.id).order("sort_order"),
      supabase.from("education").select("*").eq("user_id", user.id).order("start_year", { ascending: false }),
    ]);

    if (jobRes.error || !jobRes.data) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const job = jobRes.data;
    const profile = profileRes.data;
    const workHistory = workHistoryRes.data || [];
    const education = educationRes.data || [];

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Format work history for prompt
    const workHistoryText = workHistory.map((w: any) => {
      const dateRange = `${w.start_month || ""}/${w.start_year || ""} - ${w.is_current ? "Present" : `${w.end_month || ""}/${w.end_year || ""}`}`;
      return `- ${w.title} at ${w.company} (${dateRange}, ${w.employment_type})\n  Location: ${w.location || "N/A"} (${w.location_type || ""})\n  Description: ${w.description || ""}\n  Achievements: ${w.achievements || ""}\n  Awards: ${w.awards || ""}\n  Skills: ${(w.skills || []).join(", ")}`;
    }).join("\n\n");

    const educationText = education.map((e: any) =>
      `- ${e.degree || ""} ${e.field || ""} at ${e.institution} (${e.start_year || ""}-${e.end_year || ""})`
    ).join("\n");

    const prompt = `Generate a tailored Quick Apply pack for this job application. Use the candidate's full structured profile data below.

JOB DESCRIPTION:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Work Model: ${job.work_model}
- Employment Type: ${job.employment_type}
- Requirements: ${job.requirements_summary}
- Full Description: ${job.description}

CANDIDATE PROFILE:
- Name: ${profile?.full_name || "Candidate"}
- Headline: ${profile?.headline || ""}
- Skills: ${(profile?.top_skills || []).join(", ")}
- Experience: ${profile?.years_of_experience || 0} years
- Summary: ${profile?.summary || ""}
- Location: ${profile?.location || ""}
- Industries: ${(profile?.industries || []).join(", ")}
- Languages: ${(profile?.languages_spoken || []).join(", ")}

WORK HISTORY:
${workHistoryText || "No work history provided"}

EDUCATION:
${educationText || "No education provided"}

Generate:
1. A tailored resume using ATS-friendly formatting with standard headings (Professional Summary, Core Skills, Professional Experience, Education). Rewrite experience bullets using STAR logic: action verb + scope + result + metric. Use exact keywords from the job description naturally.
2. A concise cover note (300-400 words max) that connects the candidate's experience to this specific role's requirements. Professional, confident, human tone.
3. A short recruiter outreach message (2-3 sentences, direct and relevant).

Use the tool provided to return structured output.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: CORE_SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_application_pack",
            description: "Generate tailored ATS-optimized application documents",
            parameters: {
              type: "object",
              properties: {
                resume: { type: "string", description: "Full tailored resume with ATS-friendly formatting, standard headings, STAR bullets" },
                coverNote: { type: "string", description: "Tailored cover note/letter (300-400 words)" },
                recruiterNote: { type: "string", description: "Short recruiter outreach message" },
                professionalSummary: { type: "string", description: "The professional summary section extracted" },
                coreSkills: { type: "array", items: { type: "string" }, description: "Core skills aligned to the role" },
                mustHaves: { type: "array", items: { type: "string" }, description: "Key requirements the candidate meets" },
                emphasisPoints: { type: "array", items: { type: "string" }, description: "Candidate strengths to emphasize" },
                keywordsUsed: { type: "array", items: { type: "string" }, description: "ATS keywords incorporated into the resume" },
              },
              required: ["resume", "coverNote", "recruiterNote", "professionalSummary", "coreSkills", "mustHaves", "emphasisPoints", "keywordsUsed"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_application_pack" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResp.text();
      console.error("AI error:", aiResp.status, errText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI did not return structured data" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    // Save application assets to DB
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Don't delete old versions — insert new version
    const assets = [
      { job_id: jobId, user_id: user.id, asset_type: "resume", content: result.resume, version, is_draft: true },
      { job_id: jobId, user_id: user.id, asset_type: "cover_note", content: result.coverNote, version, is_draft: true },
      { job_id: jobId, user_id: user.id, asset_type: "recruiter_note", content: result.recruiterNote, version, is_draft: true },
    ];
    await adminClient.from("application_assets").insert(assets);

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-application error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
