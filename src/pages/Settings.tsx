import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { Download, Chrome, Loader2, Phone, Mail, User } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const Settings = () => {
  const { signOut, user } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [originalPhone, setOriginalPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Email change
  const [newEmail, setNewEmail] = useState("");
  const [emailChanging, setEmailChanging] = useState(false);

  // Phone OTP
  const [phoneStep, setPhoneStep] = useState<"view" | "send" | "verify">("view");
  const [newPhone, setNewPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [phoneSending, setPhoneSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || "");
    supabase.from("user_profiles").select("full_name, phone_number").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name || "");
          setOriginalName(data.full_name || "");
          setPhone(data.phone_number || "");
          setOriginalPhone(data.phone_number || "");
        }
        setLoading(false);
      });
  }, [user]);

  const handleSaveName = async () => {
    if (!user || fullName.trim() === originalName) return;
    setSaving(true);
    const { error } = await supabase.from("user_profiles").update({ full_name: fullName.trim(), updated_at: new Date().toISOString() }).eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error saving name", variant: "destructive" });
    } else {
      setOriginalName(fullName.trim());
      toast({ title: "Name updated" });
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim() || !user) return;
    setEmailChanging(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setEmailChanging(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Confirmation sent", description: "Check both your old and new email to confirm the change." });
      setNewEmail("");
    }
  };

  const handleSendOtp = async () => {
    if (!newPhone.trim() || !user) return;
    setPhoneSending(true);
    const { data, error } = await supabase.functions.invoke("verify-phone", {
      body: { action: "send", phoneNumber: newPhone.trim() },
    });
    setPhoneSending(false);
    if (error || data?.error) {
      toast({ title: "Error", description: data?.error || error?.message, variant: "destructive" });
    } else {
      toast({ title: "OTP sent", description: `Code sent to ${newPhone}` });
      setPhoneStep("verify");
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 6 || !user) return;
    setPhoneSending(true);
    const { data, error } = await supabase.functions.invoke("verify-phone", {
      body: { action: "verify", code: otpCode, phoneNumber: newPhone.trim() },
    });
    setPhoneSending(false);
    if (error || data?.error) {
      toast({ title: "Verification failed", description: data?.error || error?.message, variant: "destructive" });
    } else {
      toast({ title: "Phone verified!" });
      setPhone(newPhone.trim());
      setOriginalPhone(newPhone.trim());
      setPhoneStep("view");
      setNewPhone("");
      setOtpCode("");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">App Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and app preferences.</p>
      </div>

      {/* Account Info */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-5">
        <h2 className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
          <User className="h-5 w-5 text-primary" /> Account Information
        </h2>

        {/* Name */}
        <div className="space-y-1.5">
          <Label>Full Name</Label>
          <div className="flex gap-2">
            <Input value={fullName} onChange={e => setFullName(e.target.value)} />
            <Button size="sm" disabled={saving || fullName.trim() === originalName} onClick={handleSaveName}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input value={email} disabled className="bg-muted" />
          <div className="flex gap-2 mt-2">
            <Input placeholder="New email address" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
            <Button size="sm" variant="outline" disabled={emailChanging || !newEmail.trim()} onClick={handleChangeEmail}>
              {emailChanging ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Mail className="h-4 w-4 mr-1" />Change</>}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">A confirmation link will be sent to both your old and new email.</p>
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label>Mobile Number</Label>
          <Input value={phone || "Not set"} disabled className="bg-muted" />

          {phoneStep === "view" && (
            <Button size="sm" variant="outline" className="mt-2" onClick={() => setPhoneStep("send")}>
              <Phone className="h-4 w-4 mr-1" />{phone ? "Change Number" : "Add Number"}
            </Button>
          )}

          {phoneStep === "send" && (
            <div className="flex gap-2 mt-2">
              <Input placeholder="+1234567890" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
              <Button size="sm" disabled={phoneSending || !newPhone.trim()} onClick={handleSendOtp}>
                {phoneSending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setPhoneStep("view"); setNewPhone(""); }}>Cancel</Button>
            </div>
          )}

          {phoneStep === "verify" && (
            <div className="space-y-3 mt-2">
              <p className="text-sm text-muted-foreground">Enter the 6-digit code sent to {newPhone}</p>
              <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              <div className="flex gap-2">
                <Button size="sm" disabled={phoneSending || otpCode.length < 6} onClick={handleVerifyOtp}>
                  {phoneSending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setPhoneStep("view"); setOtpCode(""); setNewPhone(""); }}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </section>

      <Separator />

      {/* Browser Extension */}
      <section className="rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Chrome className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-base font-semibold text-foreground">Browser Extension</h2>
        </div>
        <p className="text-sm text-muted-foreground">Send jobs from LinkedIn, Indeed, and any job board with one click.</p>
        <Button size="sm" asChild>
          <Link to="/app/extension" className="gap-2"><Download className="h-4 w-4" />Download Extension</Link>
        </Button>
      </section>

      <Separator />

      {/* Privacy */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-3">
        <h2 className="font-heading text-base font-semibold text-foreground">Privacy</h2>
        <p className="text-sm text-muted-foreground">Your data is only visible to you. We never share it with employers or third parties.</p>
      </section>

      <Separator />

      {/* Billing */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-3">
        <h2 className="font-heading text-base font-semibold text-foreground">Billing</h2>
        <p className="text-sm text-muted-foreground">Manage your subscription and buy credit packs.</p>
        <Button size="sm" asChild><Link to="/app/pricing">View Plans & Pricing</Link></Button>
      </section>

      <Separator />

      {/* Danger Zone */}
      <section className="rounded-xl border border-destructive/20 bg-card p-6 space-y-3">
        <h2 className="font-heading text-base font-semibold text-destructive">Danger Zone</h2>
        <p className="text-sm text-muted-foreground">Sign out of your account.</p>
        <Button variant="destructive" size="sm" onClick={signOut}>Sign Out</Button>
      </section>
    </div>
  );
};

export default Settings;
