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

    const prompt = `Generate a tailored Quick Apply pack for this job application. Create three documents.

JOB:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Requirements: ${job.requirements_summary}
- Description: ${job.description}

CANDIDATE:
- Name: ${profile?.full_name || "Candidate"}
- Headline: ${profile?.headline || ""}
- Skills: ${(profile?.top_skills || []).join(", ")}
- Experience: ${profile?.years_of_experience || 0} years
- Summary: ${profile?.summary || ""}
- Location: ${profile?.location || ""}

Generate a professional, tailored resume summary, a concise cover note, and a short recruiter outreach message. Keep them specific to this role. Use the tool provided.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an expert career coach and resume writer. Write professionally, concisely, and tailor everything to the specific job." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_application_pack",
            description: "Generate tailored application documents",
            parameters: {
              type: "object",
              properties: {
                resume: { type: "string", description: "Tailored resume draft (formatted with line breaks)" },
                coverNote: { type: "string", description: "Cover note/letter (formatted with line breaks)" },
                recruiterNote: { type: "string", description: "Short recruiter outreach message" },
                mustHaves: { type: "array", items: { type: "string" }, description: "Key requirements from the job that the candidate meets" },
                emphasisPoints: { type: "array", items: { type: "string" }, description: "Candidate strengths to emphasize" },
              },
              required: ["resume", "coverNote", "recruiterNote", "mustHaves", "emphasisPoints"],
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

    // Delete old assets for this job
    await adminClient.from("application_assets").delete().eq("job_id", jobId);

    const assets = [
      { job_id: jobId, user_id: user.id, asset_type: "resume", content: result.resume },
      { job_id: jobId, user_id: user.id, asset_type: "cover_note", content: result.coverNote },
      { job_id: jobId, user_id: user.id, asset_type: "recruiter_note", content: result.recruiterNote },
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
