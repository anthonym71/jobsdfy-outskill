import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const body = await req.json().catch(() => ({}));
  if (body.token !== "oneoff-7f3k29xq") return new Response("no", { status: 403 });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data, error } = await admin.auth.admin.createUser({
    email: "judges@jobsdfy.com",
    password: body.password,
    email_confirm: true,
    user_metadata: { full_name: "Hackathon Judges", terms_version: "2026-10-30", terms_accepted: "true" },
  });
  return new Response(JSON.stringify({ id: data?.user?.id, error: error?.message }), {
    headers: { "Content-Type": "application/json" },
  });
});
