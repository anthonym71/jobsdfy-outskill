import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Unauthorized");

    const { transcript, category } = await req.json();
    if (!transcript || !category) throw new Error("'transcript' and 'category' are required");

    const categoryPrompts: Record<string, string> = {
      about: `Extract profile information: full name, location, headline/title, professional summary, years of experience, top skills, industries, languages spoken, hobbies, interests, sports. Format as JSON.`,
      work: `Extract work history entries using STAR method (Situation, Task, Action, Result) for achievements. For each role extract: title, company, employment type, dates, location, description, key achievements (STAR-formatted), awards, performance highlights, skills used. Format as JSON array.`,
      education: `Extract education entries: institution, degree, field of study, start/end years, description, certifications. Format as JSON array.`,
      references: `Extract professional references: name, email, phone, relationship/context, testimonial quotes. Format as JSON array.`,
      achievements: `Extract achievements, awards, certifications, and notable accomplishments. Use STAR method for structuring. Format as JSON array with achievement_key and description.`,
    };

    const systemPrompt = `You are an expert CV/resume data extractor. Given a conversation transcript where a person describes their professional background, extract structured data for the "${category}" category.

${categoryPrompts[category] || categoryPrompts.about}

Rules:
- Use STAR method (Situation, Task, Action, Result) for any achievements or accomplishments
- Optimize all text for ATS (Applicant Tracking Systems) — use industry-standard keywords
- Be thorough — extract ALL relevant information mentioned
- If information is ambiguous, include it with a note
- Return valid JSON only`;

    const response = await fetch("https://ai-gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Here is the conversation transcript:\n\n${transcript}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`AI Gateway error [${response.status}]: ${text}`);
    }

    const aiData = await response.json();
    const extractedContent = aiData.choices?.[0]?.message?.content;
    
    let parsed;
    try {
      parsed = JSON.parse(extractedContent);
    } catch {
      parsed = { raw: extractedContent };
    }

    // Store in knowledgebase
    const entries = Array.isArray(parsed) ? parsed : [parsed];
    for (const entry of entries) {
      await supabase.from("knowledgebase_entries").insert({
        user_id: userData.user.id,
        category,
        title: entry.title || entry.name || entry.achievement_key || `${category} entry`,
        content: JSON.stringify(entry),
        source_type: "voice",
        source_name: "Voice CV Builder",
      });
    }

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
    });
  }
});
