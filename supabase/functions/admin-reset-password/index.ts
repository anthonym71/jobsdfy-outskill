import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { canResetUserPassword, passwordResetRedirect } from "./policy.ts";

Deno.serve(async (req) => {
  const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);
  try {
    const client = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false, autoRefreshToken: false } });
    const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return respond({ error: "Sign in required" }, 401);
    const { data: auth, error: authError } = await client.auth.getUser(token);
    if (authError || !auth.user) return respond({ error: "Sign in required" }, 401);
    const { data: owner, error: ownerError } = await client.rpc("is_owner", { _user_id: auth.user.id });
    if (ownerError || !canResetUserPassword(owner)) return respond({ error: "Only the owner can reset user passwords" }, 403);
    const parsed = z.object({ user_id: z.string().uuid() }).strict().safeParse(await req.json());
    if (!parsed.success) return respond({ error: "A valid user ID is required" }, 400);
    const { data: target, error: targetError } = await client.auth.admin.getUserById(parsed.data.user_id);
    if (targetError || !target.user?.email) return respond({ error: "Account email not found" }, 404);
    const { error } = await client.auth.resetPasswordForEmail(target.user.email, { redirectTo: passwordResetRedirect });
    if (error) return respond({ error: error.message }, 400);
    await client.rpc("log_audit_event", {
      p_user_id: auth.user.id, p_user_email: auth.user.email ?? "", p_user_name: "",
      p_action: "admin_password_reset", p_description: "Requested a password reset email",
      p_metadata: { target_user_id: target.user.id },
    });
    return respond({ success: true });
  } catch {
    return respond({ error: "Unable to request password reset" }, 500);
  }
});