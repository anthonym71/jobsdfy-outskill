import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";
// TODO: Replace with your actual Twilio phone number
const TWILIO_FROM_NUMBER = "+13857876364";

// Simple in-memory OTP store (in production, use a database)
// For edge functions, we'll store OTPs in a temporary table or use Twilio Verify
// For now, we generate and store in the user_profiles metadata

const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
  const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
  if (!TWILIO_API_KEY) throw new Error("TWILIO_API_KEY is not configured");

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

    const { action, phoneNumber, code } = await req.json();

    if (action === "send") {
      if (!phoneNumber) throw new Error("Phone number is required");

      // Generate OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

      // Store OTP hash in user metadata (service role can do this)
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          phone_otp: otp,
          phone_otp_expires: expiresAt,
          phone_otp_number: phoneNumber,
        },
      });

      // Save phone to user_profiles immediately (unverified)
      await supabase.from("user_profiles").update({
        phone_number: phoneNumber,
        phone_verified: false,
      }).eq("user_id", user.id);

      // Send SMS via Twilio gateway
      const response = await fetch(`${GATEWAY_URL}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": TWILIO_API_KEY,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: phoneNumber,
          From: TWILIO_FROM_NUMBER,
          Body: `Your JobsDFY verification code is: ${otp}. It expires in 10 minutes.`,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Twilio error [${response.status}]: ${JSON.stringify(data)}`);
      }

      return new Response(JSON.stringify({ success: true, message: "OTP sent" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify") {
      if (!code) throw new Error("Verification code is required");

      const meta = user.user_metadata;
      const phoneNum = phoneNumber || meta?.phone_otp_number;
      if (!phoneNum) throw new Error("No phone number provided");

      // Check for admin override code
      let isOverride = false;
      const { data: overrideEnabled } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "otp_override_enabled")
        .single();

      if (overrideEnabled?.value === "true") {
        const { data: overrideCode } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "otp_override_code")
          .single();

        if (overrideCode?.value && code === overrideCode.value) {
          isOverride = true;
        }
      }

      if (!isOverride) {
        // Normal OTP verification
        if (!meta?.phone_otp) throw new Error("No pending verification");
        if (new Date(meta.phone_otp_expires) < new Date()) throw new Error("Code expired");
        if (meta.phone_otp !== code) throw new Error("Invalid code");
      }

      // Update user_profiles with verified phone
      await supabase.from("user_profiles").update({
        phone_number: phoneNum,
        phone_verified: true,
      }).eq("user_id", user.id);

      // Clear OTP from metadata
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...meta,
          phone_otp: null,
          phone_otp_expires: null,
          phone_otp_number: null,
        },
      });

      return new Response(JSON.stringify({ success: true, message: "Phone verified" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action. Use 'send' or 'verify'.");
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
