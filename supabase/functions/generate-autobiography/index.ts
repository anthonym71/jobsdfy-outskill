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

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { mode, topic, purpose, tone, wordCount, context } = await req.json();

    // Load all user data
    const [profileRes, workRes, eduRes, kbRes, achieveRes] = await Promise.all([
      supabase.from("user_profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("work_history").select("*").eq("user_id", user.id).order("sort_order"),
      supabase.from("education").select("*").eq("user_id", user.id),
      supabase.from("knowledgebase_entries").select("*").eq("user_id", user.id).eq("is_relevant", true),
      supabase.from("user_achievements").select("*").eq("user_id", user.id),
    ]);

    const profile = profileRes.data;
    const work = workRes.data || [];
    const edu = eduRes.data || [];
    const kb = kbRes.data || [];
    const achievements = achieveRes.data || [];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return new Response(JSON.stringify({ error: "AI not configured" }), { status: 500, headers: corsHeaders });

    const profileText = profile ? `Name: ${profile.full_name}\nHeadline: ${profile.headline || ""}\nSummary: ${profile.summary || ""}\nSkills: ${(profile.top_skills || []).join(", ")}\nLocation: ${profile.location || ""}\nHobbies: ${(profile.hobbies || []).join(", ")}\nInterests: ${(profile.interests || []).join(", ")}` : "";
    const workText = work.map(w => `${w.title} at ${w.company} (${w.start_year || "?"}-${w.is_current ? "Present" : w.end_year || "?"}): ${w.description || ""} | Achievements: ${w.achievements || ""}`).join("\n");
    const eduText = edu.map(e => `${e.degree || ""} ${e.field || ""} at ${e.institution} (${e.start_year}-${e.end_year})`).join("\n");
    const kbText = kb.map(k => `[${k.category}] ${k.title}: ${k.content}`).join("\n");

    let systemPrompt = "";
    if (mode === "full_autobiography") {
      systemPrompt = `You are a world-class ghostwriter. Create a compelling autobiography from the person's life data. Include a timeline of key events, career milestones, personal growth, and achievements. Write in ${tone} tone. Target approximately ${wordCount || 2000} words.`;
    } else if (mode === "story") {
      systemPrompt = `You are a storyteller. Write a focused story about: "${topic}". Use the person's actual data — never fabricate. Tone: ${tone}. Context/intended outcome: ${context || "general sharing"}. Target approximately ${wordCount || 500} words.`;
    } else {
      systemPrompt = `You are a professional bio writer. Create a speaker introduction/bio for: "${purpose}". Keep it ${tone} and approximately ${wordCount || 150} words. Use factual data only.`;
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `PROFILE:\n${profileText}\n\nWORK HISTORY:\n${workText}\n\nEDUCATION:\n${eduText}\n\nKNOWLEDGEBASE:\n${kbText}` },
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: corsHeaders });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: corsHeaders });
      return new Response(JSON.stringify({ error: "Generation failed" }), { status: 500, headers: corsHeaders });
    }

    const aiData = await aiResp.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-autobiography error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
