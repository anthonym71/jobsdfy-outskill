import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SlugRedirect = ({ type }: { type: "ref" | "aff" }) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const resolve = async () => {
      if (!slug) { navigate("/"); return; }

      if (type === "ref") {
        // Try slug first, fall back to code
        const { data } = await supabase.from("referral_codes").select("code, slug").or(`slug.eq.${slug},code.eq.${slug}`).limit(1).maybeSingle();
        if (data) {
          localStorage.setItem("ref_code", data.code);
        }
      } else {
        const { data } = await supabase.from("affiliate_partners").select("referral_code, slug").or(`slug.eq.${slug},referral_code.eq.${slug}`).limit(1).maybeSingle();
        if (data) {
          localStorage.setItem("aff_code", data.referral_code);
        }
      }

      navigate("/");
    };
    resolve();
  }, [slug, type, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Redirecting…</p>
    </div>
  );
};

export default SlugRedirect;
