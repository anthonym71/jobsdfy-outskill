import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");

    const callerId = userData.user.id;
    const callerEmail = userData.user.email || "";

    // Verify admin role
    const { data: roleCheck } = await supabaseAdmin.rpc("has_role", { _user_id: callerId, _role: "admin" });
    if (!roleCheck) throw new Error("Unauthorized: admin role required");

    // Parse request body
    const { user_id, amount, reason } = await req.json();
    if (!user_id || typeof amount !== "number" || amount === 0 || !reason) {
      throw new Error("Missing required fields: user_id, amount (non-zero), reason");
    }

    if (Math.abs(amount) > 10000) {
      throw new Error("Amount exceeds maximum allowed (10000)");
    }

    // Get current balance
    const { data: credits, error: creditsErr } = await supabaseAdmin
      .from("user_credits")
      .select("balance, lifetime_earned")
      .eq("user_id", user_id)
      .single();

    if (creditsErr || !credits) throw new Error("User credits not found");

    const newBalance = Math.max(0, credits.balance + amount);
    const newLifetime = amount > 0 ? credits.lifetime_earned + amount : credits.lifetime_earned;

    // Update balance
    const { error: updateErr } = await supabaseAdmin
      .from("user_credits")
      .update({
        balance: newBalance,
        lifetime_earned: newLifetime,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user_id);

    if (updateErr) throw new Error(`Failed to update credits: ${updateErr.message}`);

    // Insert transaction
    const action = amount > 0 ? "earned" : "spent";
    await supabaseAdmin.from("credit_transactions").insert({
      user_id,
      amount,
      action,
      reason: `Admin: ${reason}`,
    });

    // Get target user info for audit log
    const { data: targetProfile } = await supabaseAdmin
      .from("user_profiles")
      .select("full_name, email")
      .eq("user_id", user_id)
      .single();

    // Insert audit log via secure function
    await supabaseAdmin.rpc("log_audit_event", {
      p_user_id: callerId,
      p_user_email: callerEmail,
      p_user_name: "",
      p_action: amount > 0 ? "admin_add_credits" : "admin_deduct_credits",
      p_description: `${amount > 0 ? "Added" : "Deducted"} ${Math.abs(amount)} credits ${amount > 0 ? "to" : "from"} ${targetProfile?.full_name || user_id}. Reason: ${reason}`,
      p_metadata: { target_user_id: user_id, amount, new_balance: newBalance },
    });

    return new Response(JSON.stringify({ success: true, new_balance: newBalance }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
