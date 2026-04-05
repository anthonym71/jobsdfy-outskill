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

    const workSchema = {
      name: "extract_work_history",
      description: "Extract structured work history entries from a conversation transcript",
      parameters: {
        type: "object",
        properties: {
          jobs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string", description: "Job title" },
                company: { type: "string", description: "Company name" },
                employment_type: { type: "string", enum: ["Full-time", "Part-time", "Contract", "Freelance", "Fractional", "Internship", "Volunteer"], description: "Type of employment" },
                is_current: { type: "boolean", description: "Currently working here" },
                start_month: { type: "number", description: "Start month (1-12)" },
                start_year: { type: "number", description: "Start year" },
                end_month: { type: "number", description: "End month (1-12), null if current" },
                end_year: { type: "number", description: "End year, null if current" },
                location: { type: "string", description: "Job location city/country" },
                location_type: { type: "string", enum: ["onsite", "remote", "hybrid"], description: "Work arrangement" },
                description: { type: "string", description: "Role description and responsibilities" },
                achievements: { type: "string", description: "Key achievements using STAR method" },
                awards: { type: "string", description: "Awards received" },
                performance: { type: "string", description: "Performance highlights" },
                skills: { type: "array", items: { type: "string" }, description: "Top skills used (max 5)" },
              },
              required: ["title", "company"],
            },
          },
        },
        required: ["jobs"],
      },
    };

    const categoryPrompts: Record<string, string> = {
      about: `Extract profile information: full name, location, headline/title, professional summary, years of experience, top skills, industries, languages spoken, hobbies, interests, sports. Format as JSON.`,
      work: `Extract ALL work history entries mentioned in this conversation. For each role, capture the job title, company, employment type, dates, location, description, achievements (STAR-formatted), awards, performance highlights, and skills used.`,
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

    // Use tool calling for work category for structured extraction
    const isWork = category === "work";

    const requestBody: any = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Here is the conversation transcript:\n\n${transcript}` },
      ],
    };

    if (isWork) {
      requestBody.tools = [{ type: "function", function: workSchema }];
      requestBody.tool_choice = { type: "function", function: { name: "extract_work_history" } };
    } else {
      requestBody.response_format = { type: "json_object" };
    }

    const response = await fetch("https://ai-gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`AI Gateway error [${response.status}]: ${text}`);
    }

    const aiData = await response.json();

    let parsed;
    if (isWork) {
      // Extract from tool call
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          parsed = args.jobs || args;
        } catch {
          parsed = { raw: toolCall.function.arguments };
        }
      } else {
        // Fallback to content
        const content = aiData.choices?.[0]?.message?.content;
        try { parsed = JSON.parse(content); } catch { parsed = { raw: content }; }
      }
    } else {
      const extractedContent = aiData.choices?.[0]?.message?.content;
      try { parsed = JSON.parse(extractedContent); } catch { parsed = { raw: extractedContent }; }
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
