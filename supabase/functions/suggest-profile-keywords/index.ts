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

    const [profileRes, workRes] = await Promise.all([
      supabase.from("user_profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("work_history").select("title, company, description, skills").eq("user_id", user.id).limit(10),
    ]);

    const profile = profileRes.data;
    const work = workRes.data || [];

    if (!profile) return new Response(JSON.stringify({ error: "No profile found" }), { status: 404, headers: corsHeaders });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return new Response(JSON.stringify({ error: "AI not configured" }), { status: 500, headers: corsHeaders });

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "Suggest ATS-optimized keywords and skills for this candidate's profile. Focus on hard skills, tools, methodologies, and industry-standard terms. Only suggest keywords that are genuinely relevant to their experience." },
          { role: "user", content: `Current skills: ${(profile.top_skills || []).join(", ")}\nIndustries: ${(profile.industries || []).join(", ")}\nHeadline: ${profile.headline || ""}\nWork: ${work.map(w => `${w.title} at ${w.company}: ${(w.skills || []).join(", ")}`).join("; ")}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "suggest_keywords",
            description: "Suggest profile keywords",
            parameters: {
              type: "object",
              properties: {
                suggestedSkills: { type: "array", items: { type: "string" }, description: "Hard skills to add" },
                suggestedIndustries: { type: "array", items: { type: "string" }, description: "Industries to add" },
                suggestedTools: { type: "array", items: { type: "string" }, description: "Tools & platforms" },
                reasoning: { type: "string" },
              },
              required: ["suggestedSkills", "suggestedIndustries", "suggestedTools"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "suggest_keywords" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: corsHeaders });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: corsHeaders });
      return new Response(JSON.stringify({ error: "Keyword suggestion failed" }), { status: 500, headers: corsHeaders });
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return new Response(JSON.stringify({ error: "AI returned no result" }), { status: 500, headers: corsHeaders });

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-profile-keywords error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
