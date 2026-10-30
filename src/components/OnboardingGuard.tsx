import { useEffect, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useAdminAccess } from "@/hooks/useAdminAccess";

const OnboardingGuard = () => {
  const { user, isLoading } = useAuth();
  const { canViewAdmin, loading: accessLoading } = useAdminAccess();
  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState(false);
  const [hasProfile, setHasProfile] = useState(true);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (isLoading || !user) return;

    const check = async () => {
      const { data } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const exists = !!data;
      setHasProfile(exists);
      setChecked(true);

      if (!exists) {
        setShowDialog(true);
      }
    };

    check();
  }, [user, isLoading]);

  const goToOnboarding = () => {
    setShowDialog(false);
    // Keep a job sent from the extension / phone share so it isn't lost during onboarding
    if (location.pathname === "/app/new-job" && location.search) {
      localStorage.setItem("jobsdfy-pending-import", location.pathname + location.search);
    }
    navigate("/onboarding");
  };

  if (canViewAdmin && !accessLoading) return <Outlet />;
  if (isLoading || !checked || accessLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <>
        <Dialog open={showDialog} onOpenChange={() => setShowDialog(true)}>
          <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Complete Your Profile
              </DialogTitle>
              <DialogDescription>
                You need to complete onboarding before you can access the app. This only takes 2 minutes and earns you free credits!
              </DialogDescription>
            </DialogHeader>
            <Button onClick={goToOnboarding} className="w-full mt-2">
              Complete Onboarding
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogContent>
        </Dialog>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center space-y-4 p-8">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
            <h2 className="font-heading text-xl font-bold text-foreground">Onboarding Required</h2>
            <p className="text-sm text-muted-foreground max-w-sm">Complete your profile setup to unlock all features.</p>
            <Button onClick={goToOnboarding}>
              Go to Onboarding <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </>
    );
  }

  return <Outlet />;
};

export default OnboardingGuard;
