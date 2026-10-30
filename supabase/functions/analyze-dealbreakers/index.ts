import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { evaluate, type Extraction } from "../_shared/verdict.ts";
import { toLimits } from "../_shared/limits.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// The verdict is decided by plain code (see _shared/verdict.ts), not by an AI model.
// The AI only read the posting earlier, in extract-job, and had to quote every fact it used.

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const { jobId } = await req.json();
    if (!jobId) return json({ error: "jobId required" }, 400);

    const [jobRes, nonNegRes] = await Promise.all([
      supabase.from("jobs").select("*").eq("id", jobId).eq("user_id", user.id).single(),
      supabase.from("user_non_negotiables").select("*").eq("user_id", user.id).single(),
    ]);
    if (jobRes.error || !jobRes.data) return json({ error: "Job not found" }, 404);
    if (!nonNegRes.data) return json({ error: "Please complete onboarding first (set your non-negotiables)." }, 422);

    const job = jobRes.data;
    const hasEvidence = !!job.extraction;
    // Salary corrections made on the extraction form are merged into job.extraction when the job is saved (NewJob.tsx).
    const result = evaluate((job.extraction ?? {}) as Extraction, toLimits(nonNegRes.data));

    // Same shape the screen already reads (status / severity), plus the new evidence fields.
    const blockers = result.results.map((r) => ({
      limit: r.limit,
      category: r.label,
      state: r.state,
      soft: !!r.soft,
      status: r.state === "fail" ? "confirmed" : r.state === "unknown" ? "unclear" : "ok",
      severity: r.state === "fail" ? "confirmed" : "unclear",
      userValue: r.userValue,
      jobValue: r.jobValue,
      note: r.reason,
      quote: r.quote ?? null,
    }));
    const alignment = result.results.map((r) => ({ label: r.label, aligned: r.state === "pass" }));
    const summary = hasEvidence
      ? result.summary
      : "This job was saved before evidence checking existed, so nothing could be verified. Add it again to get a full check.";

    // Save one row per checked limit, then the verdict.
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await admin.from("job_blockers").delete().eq("job_id", jobId);
    if (blockers.length) {
      await admin.from("job_blockers").insert(
        blockers.map((b) => ({
          job_id: jobId,
          user_id: user.id,
          category: b.category,
          label: b.category,
          description: b.note,
          severity: b.severity,
          job_value: b.jobValue,
          user_value: b.userValue,
          limit_key: b.limit,
          state: b.state,
          quote: b.quote,
          soft: b.soft,
        })),
      );
    }
    await admin.from("jobs").update({
      verdict: result.verdict,
      status: result.verdict === "stop" ? "blocked" : "reviewing",
      updated_at: new Date().toISOString(),
    }).eq("id", jobId);

    return json({ success: true, data: { verdict: result.verdict, summary, blockers, alignment, hasEvidence } });
  } catch (e) {
    console.error("analyze-dealbreakers error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
