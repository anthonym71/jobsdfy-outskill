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

    const { parsedCV } = await req.json();
    if (!parsedCV) return new Response(JSON.stringify({ error: "No parsed CV data" }), { status: 400, headers: corsHeaders });

    // Load existing data
    const [workRes, eduRes, certRes, profileRes] = await Promise.all([
      supabase.from("work_history").select("*").eq("user_id", user.id).order("sort_order"),
      supabase.from("education").select("*").eq("user_id", user.id),
      supabase.from("certificates").select("*").eq("user_id", user.id),
      supabase.from("user_profiles").select("*").eq("user_id", user.id).single(),
    ]);

    const existing = {
      workHistory: workRes.data || [],
      education: eduRes.data || [],
      certificates: certRes.data || [],
      profile: profileRes.data,
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return new Response(JSON.stringify({ error: "AI not configured" }), { status: 500, headers: corsHeaders });

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Compare parsed CV data against existing profile data. Identify conflicts, new entries, and matches. Be precise about which entries are new vs overlapping." },
          { role: "user", content: `EXISTING DATA:\n${JSON.stringify(existing, null, 2)}\n\nPARSED CV DATA:\n${JSON.stringify(parsedCV, null, 2)}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "detect_conflicts",
            description: "Compare parsed CV vs existing profile and return conflict analysis",
            parameters: {
              type: "object",
              properties: {
                profileConflicts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      field: { type: "string" },
                      existingValue: { type: "string" },
                      newValue: { type: "string" },
                      recommendation: { type: "string", enum: ["keep_existing", "use_new", "merge"] },
                    },
                    required: ["field", "existingValue", "newValue", "recommendation"],
                  },
                },
                workHistoryConflicts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string", enum: ["new", "conflict", "match"] },
                      parsedIndex: { type: "number" },
                      existingId: { type: "string" },
                      existingTitle: { type: "string" },
                      parsedTitle: { type: "string" },
                      parsedCompany: { type: "string" },
                      differences: { type: "array", items: { type: "string" } },
                      recommendation: { type: "string", enum: ["add", "replace", "merge", "skip"] },
                    },
                    required: ["type", "parsedIndex", "parsedTitle", "parsedCompany", "recommendation"],
                  },
                },
                educationConflicts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string", enum: ["new", "conflict", "match"] },
                      parsedIndex: { type: "number" },
                      existingId: { type: "string" },
                      parsedInstitution: { type: "string" },
                      differences: { type: "array", items: { type: "string" } },
                      recommendation: { type: "string", enum: ["add", "replace", "skip"] },
                    },
                    required: ["type", "parsedIndex", "parsedInstitution", "recommendation"],
                  },
                },
                newCertificates: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      issuer: { type: "string" },
                      isNew: { type: "boolean" },
                    },
                    required: ["name", "isNew"],
                  },
                },
                summary: { type: "string", description: "Brief summary of what was found" },
              },
              required: ["profileConflicts", "workHistoryConflicts", "educationConflicts", "newCertificates", "summary"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "detect_conflicts" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: corsHeaders });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: corsHeaders });
      return new Response(JSON.stringify({ error: "Conflict detection failed" }), { status: 500, headers: corsHeaders });
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return new Response(JSON.stringify({ error: "AI did not return analysis" }), { status: 500, headers: corsHeaders });

    const conflicts = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, data: conflicts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("detect-cv-conflicts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
