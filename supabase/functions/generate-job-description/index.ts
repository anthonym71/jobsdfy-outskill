import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { title, company, level, category, subcategory, work_model, employment_type } = await req.json();

    const prompt = `Generate a professional job description and requirements for the following role.
Return JSON with two fields: "description" (the JD, 200-400 words) and "requirements" (bullet points, 100-200 words).

Title: ${title}
Company: ${company || "Not specified"}
Level: ${level || "Not specified"}
Category: ${category}
Sub-category: ${subcategory || "General"}
Work Model: ${work_model}
Employment Type: ${employment_type}

Make it professional, engaging, and inclusive. Use bullet points in requirements.`;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    const resp = await fetch("https://api.lovable.dev/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
