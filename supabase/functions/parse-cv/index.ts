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

    const { cvText } = await req.json();
    if (!cvText || typeof cvText !== "string" || cvText.trim().length < 50) {
      return new Response(JSON.stringify({ error: "CV text is too short or missing" }), { status: 400, headers: corsHeaders });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return new Response(JSON.stringify({ error: "AI not configured" }), { status: 500, headers: corsHeaders });

    const systemPrompt = `You are an expert CV parser. Extract structured data from the CV text provided. Be thorough and accurate. Never invent data that isn't in the text.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Parse this CV and extract all structured data:\n\n${cvText.slice(0, 15000)}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "parse_cv",
            description: "Extract structured CV data",
            parameters: {
              type: "object",
              properties: {
                fullName: { type: "string" },
                headline: { type: "string", description: "Professional title/headline" },
                summary: { type: "string", description: "Professional summary if present" },
                location: { type: "string" },
                email: { type: "string" },
                phone: { type: "string" },
                topSkills: { type: "array", items: { type: "string" } },
                languages: { type: "array", items: { type: "string" } },
                workHistory: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      company: { type: "string" },
                      location: { type: "string" },
                      employmentType: { type: "string", enum: ["Full-time", "Part-time", "Contract", "Freelance", "Internship", "Volunteer"] },
                      startMonth: { type: "number" },
                      startYear: { type: "number" },
                      endMonth: { type: "number" },
                      endYear: { type: "number" },
                      isCurrent: { type: "boolean" },
                      description: { type: "string" },
                      achievements: { type: "string" },
                      skills: { type: "array", items: { type: "string" } },
                    },
                    required: ["title", "company"],
                  },
                },
                education: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      institution: { type: "string" },
                      degree: { type: "string" },
                      field: { type: "string" },
                      startYear: { type: "number" },
                      endYear: { type: "number" },
                      description: { type: "string" },
                    },
                    required: ["institution"],
                  },
                },
                certificates: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      issuer: { type: "string" },
                      dateIssued: { type: "string" },
                    },
                    required: ["name"],
                  },
                },
              },
              required: ["workHistory"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "parse_cv" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "AI rate limited. Please try again in a moment." }), { status: 429, headers: corsHeaders });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: corsHeaders });
      return new Response(JSON.stringify({ error: "AI parsing failed" }), { status: 500, headers: corsHeaders });
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return new Response(JSON.stringify({ error: "AI did not return parsed data" }), { status: 500, headers: corsHeaders });

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-cv error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
