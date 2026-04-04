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

    const { candidateIds, jobId } = await req.json();
    if (!candidateIds?.length) return new Response(JSON.stringify({ error: "No candidate IDs" }), { status: 400, headers: corsHeaders });

    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Load candidate profiles
    const candidates = [];
    for (const cId of candidateIds.slice(0, 10)) {
      const [profileRes, workRes] = await Promise.all([
        adminClient.from("user_profiles").select("*").eq("user_id", cId).single(),
        adminClient.from("work_history").select("title, company, start_year, end_year, is_current, skills").eq("user_id", cId).order("sort_order").limit(5),
      ]);
      if (profileRes.data) {
        candidates.push({ profile: profileRes.data, work: workRes.data || [] });
      }
    }

    // Optionally load job
    let jobData = null;
    if (jobId) {
      const { data } = await adminClient.from("recruiter_job_posts").select("*").eq("id", jobId).single();
      jobData = data;
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return new Response(JSON.stringify({ error: "AI not configured" }), { status: 500, headers: corsHeaders });

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a senior recruiter. Create concise shortlist summaries for each candidate, highlighting strengths, concerns, and fit. Be direct and useful." },
          { role: "user", content: `${jobData ? `JOB: ${jobData.title} at ${jobData.company}\nRequirements: ${jobData.requirements}\n\n` : ""}CANDIDATES:\n${JSON.stringify(candidates, null, 2)}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_shortlist",
            description: "Create candidate shortlist summaries",
            parameters: {
              type: "object",
              properties: {
                candidates: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      headline: { type: "string" },
                      fitScore: { type: "number", description: "1-10 fit rating" },
                      strengths: { type: "array", items: { type: "string" } },
                      concerns: { type: "array", items: { type: "string" } },
                      summary: { type: "string", description: "2-3 sentence recruiter summary" },
                      recommendation: { type: "string", enum: ["strong_yes", "yes", "maybe", "no"] },
                    },
                    required: ["name", "fitScore", "strengths", "summary", "recommendation"],
                  },
                },
                overallNotes: { type: "string" },
              },
              required: ["candidates"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_shortlist" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: corsHeaders });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: corsHeaders });
      return new Response(JSON.stringify({ error: "Shortlist generation failed" }), { status: 500, headers: corsHeaders });
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return new Response(JSON.stringify({ error: "No result" }), { status: 500, headers: corsHeaders });

    return new Response(JSON.stringify({ success: true, data: JSON.parse(toolCall.function.arguments) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
