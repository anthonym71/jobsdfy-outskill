import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CORE_SYSTEM_PROMPT = `You are JobsDFY's elite executive CV, ATS, and career positioning engine.

Your job is to transform a candidate's raw profile, work history, achievements, education, and target job description into recruiter-ready, ATS-friendly career documents that are accurate, tailored, and commercially strong.

Optimize for: clarity, relevance to target role, measurable achievement, ATS compatibility, truthful representation, concise high-impact language.

Never invent facts, titles, employers, dates, metrics, certifications, or achievements. Improve wording, structure, sequencing, emphasis using only provided info.

Experience bullets: action → scope → business value → result → measurable impact. Use STAR logic internally: Action verb + what was done + scope/context + result + metric. Keep Situation/Task brief, emphasize Action/Result.

ATS rules: single-column, standard headings only (Professional Summary, Core Skills, Professional Experience, Education, Certifications, Additional Information), no tables/graphics/icons/text boxes.

Tailoring: use exact JD keywords naturally, no stuffing. Executive roles → strategic/concise. Specialist → capability/delivery/tools. Mixed experience → select/elevate most relevant. Career transitions → transferable strength.

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

    const { jobId, versionName } = await req.json();

    // Fetch all candidate data
    const [profileRes, workHistoryRes, educationRes, certsRes] = await Promise.all([
      supabase.from("user_profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("work_history").select("*").eq("user_id", user.id).order("sort_order"),
      supabase.from("education").select("*").eq("user_id", user.id).order("start_year", { ascending: false }),
      supabase.from("certificates").select("*").eq("user_id", user.id),
    ]);

    const profile = profileRes.data;
    const workHistory = workHistoryRes.data || [];
    const education = educationRes.data || [];
    const certs = certsRes.data || [];

    // Optionally fetch job for tailoring
    let job: any = null;
    if (jobId) {
      const jobRes = await supabase.from("jobs").select("*").eq("id", jobId).eq("user_id", user.id).single();
      job = jobRes.data;
    }

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const workHistoryText = workHistory.map((w: any) => {
      const dateRange = `${w.start_month || ""}/${w.start_year || ""} - ${w.is_current ? "Present" : `${w.end_month || ""}/${w.end_year || ""}`}`;
      return `Title: ${w.title}\nCompany: ${w.company}\nDate: ${dateRange}\nType: ${w.employment_type}\nLocation: ${w.location || ""} (${w.location_type || ""})\nDescription: ${w.description || ""}\nAchievements: ${w.achievements || ""}\nAwards: ${w.awards || ""}\nPerformance: ${w.performance || ""}\nSkills: ${(w.skills || []).join(", ")}`;
    }).join("\n---\n");

    const educationText = education.map((e: any) =>
      `${e.degree || ""} ${e.field || ""} at ${e.institution} (${e.start_year || ""}-${e.end_year || ""})\n${e.description || ""}`
    ).join("\n");

    const certsText = certs.map((c: any) => `${c.name}${c.issuer ? ` — ${c.issuer}` : ""}${c.date_issued ? ` (${c.date_issued})` : ""}`).join("\n");

    let prompt = `Generate a full tailored CV for this candidate.

CANDIDATE PROFILE:
Name: ${profile?.full_name || "Candidate"}
Headline: ${profile?.headline || ""}
Summary: ${profile?.summary || ""}
Location: ${profile?.location || ""}
Years of Experience: ${profile?.years_of_experience || 0}
Skills: ${(profile?.top_skills || []).join(", ")}
Industries: ${(profile?.industries || []).join(", ")}
Languages: ${(profile?.languages_spoken || []).join(", ")}

WORK HISTORY:
${workHistoryText || "None provided"}

EDUCATION:
${educationText || "None provided"}

CERTIFICATIONS:
${certsText || "None provided"}`;

    if (job) {
      prompt += `

TARGET JOB:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Description: ${job.description}
Requirements: ${job.requirements_summary}

First extract the top ATS keywords from this job description, then tailor the CV to match those keywords naturally. Emphasize the candidate's most relevant experience for this specific role.`;
    }

    if (versionName) {
      prompt += `\n\nCV VERSION: ${versionName}\nPosition the CV specifically for this version/market. Change emphasis, summary, skill hierarchy, and experience relevance to match. Do not change underlying facts.`;
    }

    prompt += `\n\nReturn the full structured CV using the tool provided.`;

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
            name: "generate_cv",
            description: "Generate a full structured ATS-optimized CV",
            parameters: {
              type: "object",
              properties: {
                cv_version_name: { type: "string", description: "CV version label e.g. 'SaaS Sales CV' or 'General CV'" },
                target_role: { type: "string", description: "The target role this CV is tailored for" },
                professional_summary: { type: "string", description: "Tailored professional summary paragraph" },
                core_skills: { type: "array", items: { type: "string" }, description: "Core skills section aligned to role" },
                experience: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      job_title: { type: "string" },
                      company: { type: "string" },
                      date_range: { type: "string" },
                      bullets: { type: "array", items: { type: "string" } },
                    },
                    required: ["job_title", "company", "date_range", "bullets"],
                    additionalProperties: false,
                  },
                  description: "Professional experience with STAR-rewritten bullets",
                },
                education_section: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      institution: { type: "string" },
                      degree: { type: "string" },
                      year: { type: "string" },
                    },
                    required: ["institution", "degree", "year"],
                    additionalProperties: false,
                  },
                },
                certifications: { type: "array", items: { type: "string" } },
                ats_keywords: { type: "array", items: { type: "string" }, description: "Top ATS keywords used in this CV" },
                positioning_notes: { type: "string", description: "Notes on what was emphasized and why" },
              },
              required: ["cv_version_name", "target_role", "professional_summary", "core_skills", "experience", "education_section", "certifications", "ats_keywords", "positioning_notes"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_cv" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const errText = await aiResp.text();
      console.error("AI error:", aiResp.status, errText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI did not return structured data" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const result = JSON.parse(toolCall.function.arguments);

    // Save to cv_versions using service role
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    await adminClient.from("cv_versions").insert({
      user_id: user.id,
      job_id: jobId || null,
      version_name: result.cv_version_name || versionName || "General CV",
      content: result,
      ats_keywords: { keywords: result.ats_keywords || [] },
    });

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-cv error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
