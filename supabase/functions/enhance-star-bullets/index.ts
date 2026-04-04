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

    const { title, company, description, achievements, awards, performance } = await req.json();
    if (!title || !company) return new Response(JSON.stringify({ error: "Title and company required" }), { status: 400, headers: corsHeaders });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return new Response(JSON.stringify({ error: "AI not configured" }), { status: 500, headers: corsHeaders });

    const STAR_PROMPT = `You are an elite CV writer specializing in STAR methodology (Situation, Task, Action, Result).

Rewrite the provided work experience using these rules:
1. Every bullet must follow: [Strong Action Verb] + [Task/Context] + [Quantifiable Result/Impact]
2. Use power verbs: Spearheaded, Orchestrated, Accelerated, Transformed, Delivered, Drove, Optimized
3. Add metrics where plausible (%, $, time saved, team size) — but NEVER fabricate specific numbers not implied by the text
4. If the original text is vague, improve clarity while staying truthful
5. Keep it concise — max 2 lines per bullet
6. Write 4-6 bullets total for the role`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: STAR_PROMPT },
          { role: "user", content: `Role: ${title} at ${company}\n\nDescription: ${description || "Not provided"}\nAchievements: ${achievements || "Not provided"}\nAwards: ${awards || "Not provided"}\nPerformance: ${performance || "Not provided"}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "enhance_bullets",
            description: "Return STAR-enhanced experience bullets",
            parameters: {
              type: "object",
              properties: {
                enhancedDescription: { type: "string", description: "STAR-rewritten role description with bullet points" },
                enhancedAchievements: { type: "string", description: "Improved achievements section" },
                bullets: { type: "array", items: { type: "string" }, description: "Individual STAR bullets" },
                improvementNotes: { type: "string", description: "What was changed and why" },
              },
              required: ["enhancedDescription", "bullets", "improvementNotes"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "enhance_bullets" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: corsHeaders });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: corsHeaders });
      return new Response(JSON.stringify({ error: "Enhancement failed" }), { status: 500, headers: corsHeaders });
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return new Response(JSON.stringify({ error: "AI returned no result" }), { status: 500, headers: corsHeaders });

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("enhance-star-bullets error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
