import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Tiered commission: 1-5 paying = 25%, 6-10 = 30%, 11-25 = 40%, 25+ = 50%
function getCommissionRate(payingSignups: number): number {
  if (payingSignups > 25) return 0.50;
  if (payingSignups > 10) return 0.40;
  if (payingSignups > 5) return 0.30;
  return 0.25;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { affiliate_id, purchase_amount } = await req.json();
    if (!affiliate_id || !purchase_amount) {
      return new Response(JSON.stringify({ error: "affiliate_id and purchase_amount required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Get affiliate data
    const { data: affiliate, error: affErr } = await supabase
      .from("affiliate_partners")
      .select("*")
      .eq("id", affiliate_id)
      .single();

    if (affErr || !affiliate) {
      return new Response(JSON.stringify({ error: "Affiliate not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Count paying signups in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("affiliate_conversions")
      .select("*", { count: "exact", head: true })
      .eq("affiliate_id", affiliate_id)
      .eq("status", "paid")
      .gte("created_at", thirtyDaysAgo);

    const payingInWindow = (count || 0) + 1; // include current
    const rate = getCommissionRate(payingInWindow);
    const commissionAmount = purchase_amount * rate;

    return new Response(JSON.stringify({
      commission_rate: rate,
      commission_amount: commissionAmount,
      paying_signups_in_window: payingInWindow,
    }), {
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
