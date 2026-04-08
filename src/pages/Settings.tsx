import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { Download, Chrome, Loader2, Phone, Mail, User, Copy, Gift, Handshake } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [referralLink, setReferralLink] = useState("");

  // Email change
  const [newEmail, setNewEmail] = useState("");
  const [emailChanging, setEmailChanging] = useState(false);

  // Phone OTP
  const [phoneStep, setPhoneStep] = useState<"view" | "send" | "verify">("view");
  const [newPhone, setNewPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [phoneSending, setPhoneSending] = useState(false);

  // Affiliate
  const [affiliate, setAffiliate] = useState<any>(null);
  const [affiliateLoading, setAffiliateLoading] = useState(true);
  const [affiliateApplying, setAffiliateApplying] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState("");
  const [payoutDetails, setPayoutDetails] = useState("");
  const [payoutSaving, setPayoutSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || "");
    supabase.from("user_profiles").select("full_name, phone_number, referral_link").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name || "");
          setOriginalName(data.full_name || "");
          setPhone(data.phone_number || "");
          setOriginalPhone(data.phone_number || "");
          // Generate referral link if not set
          const baseUrl = window.location.origin;
          if (data.referral_link) {
            setReferralLink(data.referral_link);
          } else {
            const code = user.id.slice(0, 8);
            const link = `${baseUrl}/auth?mode=signup&ref=${code}`;
            setReferralLink(link);
            supabase.from("user_profiles").update({ referral_link: link }).eq("user_id", user.id);
          }
        }
        setLoading(false);
      });
    // Load affiliate data
    supabase.from("affiliate_partners").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setAffiliate(data);
          setPayoutMethod(data.payout_method || "");
          setPayoutDetails(data.payout_details || "");
        }
        setAffiliateLoading(false);
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

      {/* Referral / Invite a Friend */}
      <section className="rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-base font-semibold text-foreground">Invite a Friend — Both Get 5 Credits</h2>
        </div>
        <p className="text-sm text-muted-foreground">Share your unique link. When a friend signs up, you both get 5 bonus credits!</p>
        <div className="flex gap-2">
          <Input value={referralLink} readOnly className="bg-muted text-xs" />
          <Button size="sm" variant="outline" onClick={() => {
            navigator.clipboard.writeText(referralLink);
            toast({ title: "Copied!", description: "Referral link copied to clipboard." });
          }}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <Separator />

      {/* Affiliate Program */}
      <section id="affiliate" className="rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Handshake className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-base font-semibold text-foreground">Affiliate Program — Earn 25-50% Commission</h2>
        </div>

        {affiliateLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : !affiliate ? (
          <>
            <p className="text-sm text-muted-foreground">Earn commission on every paying customer you refer. Tiered rates reward your success — up to 50% on a 30-day rolling basis.</p>
            <Button size="sm" disabled={affiliateApplying} onClick={async () => {
              if (!user) return;
              setAffiliateApplying(true);
              const code = `AFF-${user.id.slice(0, 8).toUpperCase()}`;
              const { data, error } = await supabase.from("affiliate_partners").insert({ user_id: user.id, referral_code: code }).select().single();
              setAffiliateApplying(false);
              if (error) {
                toast({ title: "Error", description: error.message, variant: "destructive" });
              } else {
                setAffiliate(data);
                toast({ title: "Welcome to the Affiliate Program!" });
              }
            }}>
              {affiliateApplying ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Become an Affiliate
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border border-border bg-card p-3 text-center">
                <p className="text-xs text-muted-foreground">Referral Code</p>
                <p className="font-semibold text-foreground text-sm mt-1">{affiliate.referral_code}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3 text-center">
                <p className="text-xs text-muted-foreground">Total Signups</p>
                <p className="font-semibold text-foreground text-lg mt-1">{affiliate.total_signups || 0}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3 text-center">
                <p className="text-xs text-muted-foreground">Paying Signups</p>
                <p className="font-semibold text-foreground text-lg mt-1">{affiliate.paying_signups || 0}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3 text-center">
                <p className="text-xs text-muted-foreground">Total Earned</p>
                <p className="font-semibold text-foreground text-lg mt-1">${Number(affiliate.total_earned || 0).toFixed(2)}</p>
              </div>
            </div>

            {/* Commission tier */}
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground mb-2">Commission Tiers (30-day rolling)</p>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {[
                  { range: "1-5", rate: "25%" },
                  { range: "6-10", rate: "30%" },
                  { range: "11-25", rate: "40%" },
                  { range: "25+", rate: "50%" },
                ].map(t => (
                  <div key={t.range} className={`rounded p-2 ${(affiliate.paying_signups || 0) >= parseInt(t.range) ? "bg-primary/10 text-primary font-semibold" : "bg-muted text-muted-foreground"}`}>
                    <p>{t.range}</p>
                    <p className="text-sm font-bold mt-0.5">{t.rate}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Affiliate link */}
            <div>
              <Label className="text-xs">Your Affiliate Link</Label>
              <div className="flex gap-2 mt-1">
                <Input value={`${window.location.origin}/auth?mode=signup&aff=${affiliate.referral_code}`} readOnly className="bg-muted text-xs" />
                <Button size="sm" variant="outline" onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/auth?mode=signup&aff=${affiliate.referral_code}`);
                  toast({ title: "Copied!" });
                }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Payout method */}
            <div className="space-y-2">
              <Label className="text-xs">Payout Method</Label>
              <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="crypto">Crypto (USDT)</SelectItem>
                </SelectContent>
              </Select>
              <Input value={payoutDetails} onChange={e => setPayoutDetails(e.target.value)} placeholder={payoutMethod === "paypal" ? "PayPal email" : payoutMethod === "crypto" ? "Wallet address" : "Bank details"} className="text-sm" />
              <Button size="sm" variant="outline" disabled={payoutSaving} onClick={async () => {
                setPayoutSaving(true);
                await supabase.from("affiliate_partners").update({ payout_method: payoutMethod, payout_details: payoutDetails, updated_at: new Date().toISOString() }).eq("id", affiliate.id);
                setPayoutSaving(false);
                toast({ title: "Payout details saved" });
              }}>
                {payoutSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Save Payout Info
              </Button>
            </div>
          </div>
        )}
      </section>

      <Separator />

      {/* Danger Zone */}
      <section className="rounded-xl border border-destructive/20 bg-card p-6 space-y-4">
        <h2 className="font-heading text-base font-semibold text-destructive">Danger Zone</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">Delete Account</p>
            <p className="text-xs text-muted-foreground">Permanently delete your account and all data. This cannot be undone.</p>
            <p className="text-xs text-destructive mt-1">⚠️ If you have an active subscription, cancel it first via the Pricing page before deleting your account.</p>
          </div>
          <Button variant="destructive" size="sm" onClick={async () => {
            const confirm1 = window.confirm("Are you sure you want to delete your account? This action is permanent and cannot be undone.");
            if (!confirm1) return;
            const confirm2 = window.confirm("FINAL WARNING: All your data, credits, and history will be permanently deleted. Continue?");
            if (!confirm2) return;
            toast({ title: "Account deletion requested", description: "Please contact support@jobsdfy.com to complete account deletion." });
          }}>
            Delete My Account
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Settings;
