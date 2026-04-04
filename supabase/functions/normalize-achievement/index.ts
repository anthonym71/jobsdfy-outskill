import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text } = await req.json();
    if (!text || text.trim().length < 5) return new Response(JSON.stringify({ error: "Text too short" }), { status: 400, headers: corsHeaders });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return new Response(JSON.stringify({ error: "AI not configured" }), { status: 500, headers: corsHeaders });

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "Normalize an achievement into a CV-ready bullet point using STAR methodology. Keep it truthful, concise, and impactful." },
          { role: "user", content: text },
        ],
        tools: [{
          type: "function",
          function: {
            name: "normalize",
            description: "Normalize achievement text",
            parameters: {
              type: "object",
              properties: {
                normalized: { type: "string", description: "CV-ready bullet point" },
                category: { type: "string", enum: ["leadership", "technical", "business", "personal", "academic"] },
              },
              required: ["normalized", "category"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "normalize" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: corsHeaders });
      return new Response(JSON.stringify({ error: "Normalization failed" }), { status: 500, headers: corsHeaders });
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
