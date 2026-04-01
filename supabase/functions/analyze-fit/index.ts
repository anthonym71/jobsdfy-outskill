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

    const { jobId } = await req.json();

    const [jobRes, profileRes] = await Promise.all([
      supabase.from("jobs").select("*").eq("id", jobId).eq("user_id", user.id).single(),
      supabase.from("user_profiles").select("*").eq("user_id", user.id).single(),
    ]);

    if (jobRes.error || !jobRes.data) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const job = jobRes.data;
    const profile = profileRes.data;

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Score how well this job fits the candidate's profile on a 1-10 scale.

JOB:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Salary: ${job.salary_min}-${job.salary_max} ${job.salary_currency}
- Work Model: ${job.work_model}
- Employment Type: ${job.employment_type}
- Requirements: ${job.requirements_summary}
- Description: ${job.description}

CANDIDATE PROFILE:
- Headline: ${profile?.headline || "N/A"}
- Skills: ${(profile?.top_skills || []).join(", ") || "N/A"}
- Experience: ${profile?.years_of_experience || "N/A"} years
- Industries: ${(profile?.industries || []).join(", ") || "N/A"}
- Location: ${profile?.location || "N/A"}
- Summary: ${profile?.summary || "N/A"}

Be honest and specific. Use the tool to return structured analysis.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a precise job fit analyzer. Score honestly based on evidence." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "analyze_fit",
            description: "Return structured fit analysis",
            parameters: {
              type: "object",
              properties: {
                score: { type: "number", description: "Fit score 1-10" },
                confidence: { type: "string", enum: ["low", "medium", "high"] },
                strengths: { type: "array", items: { type: "string" }, description: "Top 3 strengths" },
                gaps: { type: "array", items: { type: "string" }, description: "Top 3 gaps" },
                recommendation: { type: "string", description: "2-3 sentence recommendation" },
                salarySummary: { type: "string" },
                locationSummary: { type: "string" },
              },
              required: ["score", "confidence", "strengths", "gaps", "recommendation", "salarySummary", "locationSummary"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "analyze_fit" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited." }), {
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
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
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

    // Save to DB
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    await adminClient.from("job_matches").upsert({
      job_id: jobId,
      user_id: user.id,
      fit_score: result.score,
      fit_confidence: result.confidence === "high" ? 9 : result.confidence === "medium" ? 6 : 3,
      strengths: result.strengths,
      gaps: result.gaps,
      recommendation: result.recommendation,
      salary_summary: result.salarySummary,
      location_summary: result.locationSummary,
    }, { onConflict: "job_id" });

    await adminClient.from("jobs").update({
      fit_score: result.score,
      fit_confidence: result.confidence === "high" ? 9 : result.confidence === "medium" ? 6 : 3,
      updated_at: new Date().toISOString(),
    }).eq("id", jobId);

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-fit error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
