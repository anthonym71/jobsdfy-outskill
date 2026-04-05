import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { page, referrer } = await req.json();
    if (!page) {
      return new Response(JSON.stringify({ error: "page is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Hash IP for privacy
    const forwarded = req.headers.get("x-forwarded-for") || "unknown";
    const ip = forwarded.split(",")[0].trim();
    const encoder = new TextEncoder();
    const data = encoder.encode(ip + "salt_jobsdfy_2024");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const ipHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16);

    const userAgent = req.headers.get("user-agent") || "";

    await supabase.from("page_views").insert({
      page,
      referrer: referrer || "",
      user_agent: userAgent.slice(0, 500),
      ip_hash: ipHash,
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
