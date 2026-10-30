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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("Not authenticated");

    const { action, ticketId, adminNotes, status: newStatus, subject, description, category, approve } = await req.json();
    if (action !== "list-all") {
      const { data: readOnly, error: accessError } = await supabase.rpc("is_read_only_admin", { _user_id: user.id });
      if (accessError || readOnly) throw new Error("This account has read-only access");
    }

    if (action === "create") {
      // Any authenticated user can create a ticket
      const { data, error } = await supabase.from("support_tickets").insert({
        user_id: user.id,
        subject: subject || "General inquiry",
        description: description || "",
        category: category || "general",
      }).select().single();

      if (error) throw new Error(error.message);

      // TODO: Send email notification to admin@jobsdfy.com

      return new Response(JSON.stringify({ success: true, ticket: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update") {
      // Only admins can update tickets
      const { data: roleCheck } = await supabase.rpc("can_write_admin", {
        _user_id: user.id,
      });

      if (!roleCheck) throw new Error("Admin access required");

      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (newStatus) updates.status = newStatus;
      if (adminNotes !== undefined) updates.admin_notes = adminNotes;

      const { data, error } = await supabase
        .from("support_tickets")
        .update(updates)
        .eq("id", ticketId)
        .select()
        .single();

      if (error) throw new Error(error.message);

      return new Response(JSON.stringify({ success: true, ticket: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list-all") {
      // Admin: list all tickets
      const { data: roleCheck } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (!roleCheck) throw new Error("Admin access required");

      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);

      // Also fetch user emails for each ticket
      const userIds = [...new Set((data || []).map((t: any) => t.user_id))];
      const ticketsWithEmail = await Promise.all(
        (data || []).map(async (ticket: any) => {
          const { data: userData } = await supabase.auth.admin.getUserById(ticket.user_id);
          return { ...ticket, user_email: userData?.user?.email || "unknown" };
        })
      );

      return new Response(JSON.stringify({ success: true, tickets: ticketsWithEmail }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "approve-phone-change") {
      const { data: roleCheck } = await supabase.rpc("can_write_admin", {
        _user_id: user.id,
      });
      if (!roleCheck) throw new Error("Admin access required");

      
      const { data: request, error: reqErr } = await supabase
        .from("phone_change_requests")
        .select("*")
        .eq("id", ticketId)
        .single();

      if (reqErr || !request) throw new Error("Request not found");

      const newStatusVal = approve !== false ? "approved" : "rejected";

      await supabase.from("phone_change_requests").update({
        status: newStatusVal,
        reviewed_by: user.id,
        updated_at: new Date().toISOString(),
      }).eq("id", ticketId);

      if (newStatusVal === "approved") {
        await supabase.from("user_profiles").update({
          phone_number: request.new_phone,
          phone_verified: false,
        }).eq("user_id", request.user_id);
      }

      return new Response(JSON.stringify({ success: true, status: newStatusVal }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
