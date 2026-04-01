import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, text } = await req.json();

    if (!url && !text) {
      return new Response(
        JSON.stringify({ error: "Either url or text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let jobContent = text || "";

    // If URL provided, scrape it with Firecrawl
    if (url) {
      const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
      if (!firecrawlKey) {
        return new Response(
          JSON.stringify({ error: "Firecrawl not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let formattedUrl = url.trim();
      if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
        formattedUrl = `https://${formattedUrl}`;
      }

      console.log("Scraping URL:", formattedUrl);

      const scrapeResp = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${firecrawlKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: formattedUrl,
          formats: ["markdown"],
          onlyMainContent: true,
          waitFor: 3000,
        }),
      });

      const scrapeData = await scrapeResp.json();

      if (!scrapeResp.ok) {
        console.error("Firecrawl error:", scrapeData);
        return new Response(
          JSON.stringify({ error: `Failed to scrape URL: ${scrapeData.error || scrapeResp.status}` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      jobContent = scrapeData.data?.markdown || scrapeData.markdown || "";

      if (!jobContent || jobContent.length < 50) {
        return new Response(
          JSON.stringify({ error: "Could not extract meaningful content from this URL. The page may require authentication (e.g. LinkedIn). Try pasting the job description text instead." }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Use Lovable AI to extract structured job data
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extractionPrompt = `Extract structured job posting information from the following content. Return a JSON object using the tool provided.

If a field is not found or unclear, use an empty string "".

Content:
${jobContent.slice(0, 12000)}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a precise job posting data extractor. Extract only what is present in the text. Never fabricate information.",
          },
          { role: "user", content: extractionPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_job",
              description: "Extract structured job posting data",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Job title" },
                  company: { type: "string", description: "Company name" },
                  location: { type: "string", description: "Job location" },
                  salaryMin: { type: "string", description: "Minimum salary as number string" },
                  salaryMax: { type: "string", description: "Maximum salary as number string" },
                  salaryCurrency: { type: "string", description: "Salary currency code e.g. USD, EUR, GBP" },
                  workModel: { type: "string", description: "Remote, Hybrid, or Onsite" },
                  employmentType: { type: "string", description: "Full-time, Part-time, Contract, etc." },
                  visaPolicy: { type: "string", description: "Visa/work authorization requirements" },
                  languageRequirements: { type: "string", description: "Required languages" },
                  recruiterName: { type: "string", description: "Recruiter or hiring manager name" },
                  description: { type: "string", description: "Brief job description summary (2-3 sentences)" },
                  requirementsSummary: { type: "string", description: "Key requirements summary" },
                  applicationUrl: { type: "string", description: "Application URL if found" },
                },
                required: [
                  "title", "company", "location", "salaryMin", "salaryMax",
                  "salaryCurrency", "workModel", "employmentType", "visaPolicy",
                  "languageRequirements", "recruiterName", "description",
                  "requirementsSummary", "applicationUrl",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_job" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings > Workspace > Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResp.text();
      console.error("AI error:", aiResp.status, errText);
      return new Response(
        JSON.stringify({ error: "AI extraction failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in AI response:", JSON.stringify(aiData));
      return new Response(
        JSON.stringify({ error: "AI did not return structured data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    // If we scraped a URL, use it as application URL if none extracted
    if (url && !extracted.applicationUrl) {
      extracted.applicationUrl = url;
    }

    return new Response(
      JSON.stringify({ success: true, data: extracted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("extract-job error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
