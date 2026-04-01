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
    if (!jobId) {
      return new Response(JSON.stringify({ error: "jobId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch job + user non-negotiables
    const [jobRes, nonNegRes] = await Promise.all([
      supabase.from("jobs").select("*").eq("id", jobId).eq("user_id", user.id).single(),
      supabase.from("user_non_negotiables").select("*").eq("user_id", user.id).single(),
    ]);

    if (jobRes.error || !jobRes.data) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const job = jobRes.data;
    const nonNegs = nonNegRes.data;

    if (!nonNegs) {
      return new Response(JSON.stringify({ error: "Please complete onboarding first (set your non-negotiables)." }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are a job dealbreaker analyzer. Compare this job against the user's non-negotiables and determine if there are hard blockers.

JOB DATA:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Salary: ${job.salary_min}-${job.salary_max} ${job.salary_currency}
- Work Model: ${job.work_model}
- Employment Type: ${job.employment_type}
- Visa Policy: ${job.visa_policy}
- Language Requirements: ${job.language_requirements}
- Description: ${job.description}
- Requirements: ${job.requirements_summary}

USER NON-NEGOTIABLES:
- Minimum Salary: ${nonNegs.min_salary} ${nonNegs.salary_currency}
- Allowed Countries: ${(nonNegs.allowed_countries || []).join(", ") || "Any"}
- Remote Preference: ${nonNegs.remote_preference}
- Requires Visa Sponsorship: ${nonNegs.requires_visa_sponsorship}
- Employment Types: ${(nonNegs.employment_type_preferences || []).join(", ") || "Any"}
- Max Travel: ${nonNegs.max_travel_percent}%
- Industry Exclusions: ${(nonNegs.industry_exclusions || []).join(", ") || "None"}

Analyze each category and return the result using the tool provided. The verdict should be:
- "stop" if there's at least one confirmed hard mismatch
- "review" if there are unclear or likely issues
- "go" if everything aligns well`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a precise job dealbreaker analyzer. Only flag real mismatches." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "analyze_dealbreakers",
            description: "Return structured dealbreaker analysis",
            parameters: {
              type: "object",
              properties: {
                verdict: { type: "string", enum: ["go", "review", "stop"] },
                summary: { type: "string", description: "One-line summary of the verdict" },
                blockers: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      category: { type: "string", description: "e.g. Salary, Visa, Location, Remote/Onsite, Language, Experience, Travel" },
                      severity: { type: "string", enum: ["confirmed", "likely", "unclear"] },
                      status: { type: "string", enum: ["confirmed", "ok", "unclear"] },
                      userValue: { type: "string" },
                      jobValue: { type: "string" },
                      note: { type: "string" },
                    },
                    required: ["category", "severity", "status", "userValue", "jobValue"],
                    additionalProperties: false,
                  },
                },
                alignment: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      label: { type: "string" },
                      aligned: { type: "boolean" },
                    },
                    required: ["label", "aligned"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["verdict", "summary", "blockers", "alignment"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "analyze_dealbreakers" } },
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

    // Save blockers to DB and update job verdict
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Delete old blockers for this job
    await adminClient.from("job_blockers").delete().eq("job_id", jobId);

    // Insert new blockers
    if (result.blockers?.length) {
      const blockerRows = result.blockers.map((b: any) => ({
        job_id: jobId,
        user_id: user.id,
        category: b.category,
        label: b.category,
        description: b.note || "",
        severity: b.severity === "ok" ? "unclear" : b.severity,
        job_value: b.jobValue,
        user_value: b.userValue,
      }));
      await adminClient.from("job_blockers").insert(blockerRows);
    }

    // Update job verdict
    await adminClient.from("jobs").update({
      verdict: result.verdict,
      status: result.verdict === "stop" ? "blocked" : "reviewing",
      updated_at: new Date().toISOString(),
    }).eq("id", jobId);

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-dealbreakers error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
