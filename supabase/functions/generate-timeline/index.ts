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

    const [workRes, eduRes, certRes] = await Promise.all([
      supabase.from("work_history").select("*").eq("user_id", user.id).order("sort_order"),
      supabase.from("education").select("*").eq("user_id", user.id),
      supabase.from("certificates").select("*").eq("user_id", user.id),
    ]);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return new Response(JSON.stringify({ error: "AI not configured" }), { status: 500, headers: corsHeaders });

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "Analyze the candidate's career trajectory and create a structured timeline showing growth, transitions, and patterns. Identify career themes and progression." },
          { role: "user", content: `Work: ${JSON.stringify(workRes.data || [])}\nEducation: ${JSON.stringify(eduRes.data || [])}\nCerts: ${JSON.stringify(certRes.data || [])}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_timeline",
            description: "Generate career timeline",
            parameters: {
              type: "object",
              properties: {
                timelineEvents: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      year: { type: "number" },
                      type: { type: "string", enum: ["work", "education", "certification", "milestone"] },
                      title: { type: "string" },
                      subtitle: { type: "string" },
                      description: { type: "string" },
                      growthIndicator: { type: "string", enum: ["lateral", "promotion", "pivot", "entry", "leadership"] },
                    },
                    required: ["year", "type", "title"],
                  },
                },
                careerThemes: { type: "array", items: { type: "string" } },
                growthPattern: { type: "string" },
                totalYears: { type: "number" },
              },
              required: ["timelineEvents", "careerThemes", "growthPattern"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_timeline" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: corsHeaders });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: corsHeaders });
      return new Response(JSON.stringify({ error: "Timeline generation failed" }), { status: 500, headers: corsHeaders });
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return new Response(JSON.stringify({ error: "AI returned no result" }), { status: 500, headers: corsHeaders });

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-timeline error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
