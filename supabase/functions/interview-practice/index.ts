import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing authorization" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: authHeader } } });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const { jobId, sessionId, questionIndex, answer, transcript } = body;

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    if (typeof transcript === "string") {
      const clean = transcript.trim().slice(0, 30000);
      if (!clean.includes("Candidate:")) return new Response(JSON.stringify({ error: "No candidate answers to assess" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST", headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: [
          { role: "system", content: "You are an honest interview coach. Assess only what the candidate said. Never invent experience." },
          { role: "user", content: `Assess this voice interview transcript:\n${clean}` }],
          tools: [{ type: "function", function: { name: "assess_interview", parameters: { type: "object", properties: {
            score: { type: "number" }, strengths: { type: "array", items: { type: "string" } }, improvements: { type: "array", items: { type: "string" } }, suggestedAnswer: { type: "string" } },
            required: ["score", "strengths", "improvements", "suggestedAnswer"], additionalProperties: false } } }],
          tool_choice: { type: "function", function: { name: "assess_interview" } } }),
      });
      if (!aiResp.ok) return new Response(JSON.stringify({ error: aiResp.status === 429 ? "Rate limited." : aiResp.status === 402 ? "AI credits exhausted." : "AI assessment failed" }), { status: aiResp.status === 429 || aiResp.status === 402 ? aiResp.status : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const args = (await aiResp.json()).choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (!args) throw new Error("AI did not return an assessment");
      const assessment = JSON.parse(args);
      const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: saved, error: saveError } = await adminClient.from("interview_sessions").insert({ user_id: user.id, job_id: jobId && jobId !== "general" ? jobId : null, questions: ["Voice interview"], answers: [clean], feedback: [assessment] }).select("id").single();
      if (saveError) throw new Error("Could not save interview assessment. Please retry.");
      return new Response(JSON.stringify({ success: true, data: { ...assessment, sessionId: saved.id } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // MODE 1: Score an answer for an existing session
    if (sessionId && typeof questionIndex === "number" && answer) {
      const sessionRes = await supabase.from("interview_sessions").select("*").eq("id", sessionId).eq("user_id", user.id).single();
      if (sessionRes.error || !sessionRes.data) return new Response(JSON.stringify({ error: "Session not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const session = sessionRes.data;
      const questions = (session.questions as string[]) || [];
      const question = questions[questionIndex];
      if (!question) return new Response(JSON.stringify({ error: "Invalid question index" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      // Fetch profile for context
      const profileRes = await supabase.from("user_profiles").select("*").eq("user_id", user.id).single();
      const profile = profileRes.data;

      const prompt = `Score this interview answer and provide feedback.

Question: ${question}

Candidate's Answer: ${answer}

Candidate Background: ${profile?.headline || ""}, ${profile?.years_of_experience || 0} years experience, skills: ${(profile?.top_skills || []).join(", ")}

Evaluate using STAR logic. Provide:
1. What was good about the answer
2. What could be stronger
3. A suggested better answer that uses the STAR formula: Action verb + context + result + impact`;

      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are an expert interview coach. Score answers using STAR logic. Be encouraging but honest. Provide specific, actionable feedback." },
            { role: "user", content: prompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "score_answer",
              description: "Score an interview answer",
              parameters: {
                type: "object",
                properties: {
                  score: { type: "number", description: "Score 1-10" },
                  strengths: { type: "array", items: { type: "string" }, description: "What was good" },
                  improvements: { type: "array", items: { type: "string" }, description: "What could be stronger" },
                  suggestedAnswer: { type: "string", description: "A stronger version of the answer using STAR" },
                },
                required: ["score", "strengths", "improvements", "suggestedAnswer"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "score_answer" } },
        }),
      });

      if (!aiResp.ok) {
        if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (aiResp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "AI scoring failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const aiData = await aiResp.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) return new Response(JSON.stringify({ error: "AI did not return structured data" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const feedbackResult = JSON.parse(toolCall.function.arguments);

      // Update session with answer and feedback
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const adminClient = createClient(supabaseUrl, serviceKey);

      const answers = (session.answers as any[]) || [];
      const feedback = (session.feedback as any[]) || [];
      answers[questionIndex] = answer;
      feedback[questionIndex] = feedbackResult;

      const { error: saveError } = await adminClient.from("interview_sessions").update({ answers, feedback }).eq("id", sessionId).eq("user_id", user.id);
      if (saveError) throw new Error("Could not save interview feedback. Please retry.");

      return new Response(JSON.stringify({ success: true, data: feedbackResult }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // MODE 2: Generate new questions
    const [profileRes, workHistoryRes] = await Promise.all([
      supabase.from("user_profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("work_history").select("title, company, description, achievements, skills").eq("user_id", user.id).order("sort_order").limit(3),
    ]);

    const profile = profileRes.data;
    const workHistory = (workHistoryRes.data || []).map((w: any) => `${w.title} at ${w.company}: ${w.description || ""}`).join("\n");

    let jobContext = "";
    if (jobId && jobId !== "general") {
      const jobRes = await supabase.from("jobs").select("title, company, description, requirements_summary").eq("id", jobId).eq("user_id", user.id).single();
      if (jobRes.data) {
        const j = jobRes.data;
        jobContext = `\nTARGET JOB:\nTitle: ${j.title}\nCompany: ${j.company}\nDescription: ${j.description}\nRequirements: ${j.requirements_summary}`;
      }
    }

    const prompt = `Generate 6 interview questions for this candidate.

CANDIDATE:
Name: ${profile?.full_name || ""}
Headline: ${profile?.headline || ""}
Experience: ${profile?.years_of_experience || 0} years
Skills: ${(profile?.top_skills || []).join(", ")}

RECENT WORK:
${workHistory || "Not provided"}
${jobContext}

Generate questions that:
- Test the candidate's actual experience and achievements
- Probe for specific examples and measurable results
- Include behavioral questions that reveal competency
- If a job is provided, include role-specific questions
- Mix general and specific questions
- Include at least one question about gaps or transitions if relevant`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an expert interview question designer. Generate tough but fair questions that test real experience, not just knowledge. Focus on behavioral and situational questions." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_questions",
            description: "Generate interview practice questions",
            parameters: {
              type: "object",
              properties: {
                questions: { type: "array", items: { type: "string" }, description: "6 interview questions" },
              },
              required: ["questions"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_questions" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI generation failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) return new Response(JSON.stringify({ error: "AI did not return structured data" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const result = JSON.parse(toolCall.function.arguments);

    // Save session
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: sessionData, error: sessionError } = await adminClient.from("interview_sessions").insert({
      user_id: user.id,
      job_id: (jobId && jobId !== "general") ? jobId : null,
      questions: result.questions,
      answers: [],
      feedback: [],
    }).select("id").single();
    if (sessionError || !sessionData) throw new Error("Could not save interview session. Please retry.");

    return new Response(JSON.stringify({ success: true, data: { ...result, sessionId: sessionData?.id } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("interview-practice error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
