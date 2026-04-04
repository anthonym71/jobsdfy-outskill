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

    // Load profile + work history
    const [profileRes, workRes] = await Promise.all([
      supabase.from("user_profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("work_history").select("*").eq("user_id", user.id).order("sort_order").limit(5),
    ]);

    const profile = profileRes.data;
    const work = workRes.data || [];

    if (!profile) return new Response(JSON.stringify({ error: "No profile found" }), { status: 404, headers: corsHeaders });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return new Response(JSON.stringify({ error: "AI not configured" }), { status: 500, headers: corsHeaders });

    const workText = work.map(w => `${w.title} at ${w.company} (${w.start_year || "?"}-${w.is_current ? "Present" : w.end_year || "?"}): ${w.description || ""}`).join("\n");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an expert career writer. Write a professional summary that is concise (3-4 sentences), highlights key strengths, uses strong action-oriented language, and positions the candidate for their target roles. Never fabricate details." },
          { role: "user", content: `Write an improved professional summary for this candidate:\n\nName: ${profile.full_name}\nHeadline: ${profile.headline || "Not set"}\nCurrent Summary: ${profile.summary || "None"}\nSkills: ${(profile.top_skills || []).join(", ")}\nIndustries: ${(profile.industries || []).join(", ")}\nYears of experience: ${profile.years_of_experience || "Unknown"}\n\nWork History:\n${workText}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_summary",
            description: "Generate an improved professional summary",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string", description: "The improved professional summary (3-4 sentences)" },
                headline: { type: "string", description: "A suggested improved headline" },
                reasoning: { type: "string", description: "Brief explanation of what was improved" },
              },
              required: ["summary", "headline", "reasoning"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_summary" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: corsHeaders });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: corsHeaders });
      return new Response(JSON.stringify({ error: "Summary generation failed" }), { status: 500, headers: corsHeaders });
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return new Response(JSON.stringify({ error: "AI returned no result" }), { status: 500, headers: corsHeaders });

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-profile-summary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
