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

    const body = await req.json();
    const { cvText, pdfBase64, fileName } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return new Response(JSON.stringify({ error: "AI not configured" }), { status: 500, headers: corsHeaders });

    let textToProcess = cvText;

    // If PDF base64 is provided, use Vision API to extract text first
    if (pdfBase64 && !cvText) {
      console.log("Extracting text from PDF using Vision API...");

      const visionResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "Extract ALL text from this CV/resume document. Return ONLY the raw text content, preserving the structure (headings, sections, bullet points). Do not add any commentary or interpretation." },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:application/pdf;base64,${pdfBase64}`,
                  },
                },
              ],
            },
          ],
        }),
      });

      if (!visionResp.ok) {
        console.error("Vision extraction failed:", visionResp.status);
        return new Response(JSON.stringify({ error: "Failed to extract text from PDF. Try uploading a text-based CV instead." }), { status: 400, headers: corsHeaders });
      }

      const visionData = await visionResp.json();
      textToProcess = visionData.choices?.[0]?.message?.content;

      if (!textToProcess || textToProcess.trim().length < 50) {
        return new Response(JSON.stringify({ error: "Could not extract sufficient text from the PDF." }), { status: 400, headers: corsHeaders });
      }

      console.log(`Extracted ${textToProcess.length} chars from PDF`);
    }

    if (!textToProcess || typeof textToProcess !== "string" || textToProcess.trim().length < 50) {
      return new Response(JSON.stringify({ error: "CV text is too short or missing" }), { status: 400, headers: corsHeaders });
    }

    const systemPrompt = `You are an expert CV/resume parser. Extract structured data ONLY from the CV text provided. 

CRITICAL RULES:
- NEVER invent, guess, or hallucinate data that is not explicitly written in the text.
- If a field is not present in the text, leave it empty or omit it.
- Extract dates, job titles, company names, education EXACTLY as they appear.
- If you are unsure about any data, omit it rather than guessing.
- Pay attention to the actual content structure — headings like "Experience", "Education", "Skills" etc.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Parse this CV and extract all structured data. Only include information that is EXPLICITLY written in the text below:\n\n${textToProcess.slice(0, 15000)}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "parse_cv",
            description: "Extract structured CV data. Only include fields that are explicitly present in the CV text.",
            parameters: {
              type: "object",
              properties: {
                fullName: { type: "string", description: "Full name as written in the CV" },
                headline: { type: "string", description: "Professional title/headline if explicitly stated" },
                summary: { type: "string", description: "Professional summary if present" },
                location: { type: "string", description: "Location/address if stated" },
                email: { type: "string", description: "Email address if present" },
                phone: { type: "string", description: "Phone number if present" },
                topSkills: { type: "array", items: { type: "string" }, description: "Skills explicitly listed" },
                languages: { type: "array", items: { type: "string" }, description: "Languages explicitly mentioned" },
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
