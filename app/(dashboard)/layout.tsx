"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Wand2 } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  isDemoMode,
  DEMO_DEALERSHIP,
  DEMO_PROFILE,
  DEMO_VEHICLES,
  DEMO_ASSETS,
} from "@/lib/demo-data";
import { loadDemoSettings } from "@/lib/demo-settings";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const {
    setDealership,
    setProfile,
    setVehicles,
    setRecentAssets,
    setIsLoading,
    setIsSuperAdmin,
    isLoading,
  } = useAppStore();
  const [initialized, setInitialized] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    async function init() {
      if (isDemoMode()) {
        // Use saved demo settings if available, otherwise fall back to defaults
        const savedDealership = loadDemoSettings();
        setDealership(savedDealership ?? DEMO_DEALERSHIP);
        setProfile(DEMO_PROFILE);
        setVehicles(DEMO_VEHICLES);
        setRecentAssets(DEMO_ASSETS);
        setIsLoading(false);
        setInitialized(true);
        return;
      }

      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Check if user is a super admin
      const { data: superAdmin } = await supabase
        .from("super_admins")
        .select("id")
        .eq("email", user.email)
        .is("revoked_at", null)
        .single();

      if (superAdmin) {
        setIsSuperAdmin(true);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      // Account exists in auth but profile/dealership not set up — send to signup
      // wizard so they can finish onboarding (this happens if /api/onboard failed
      // during signup, or the user was created out-of-band).
      if (!profile || !profile.dealership_id) {
        if (!superAdmin) {
          router.push("/signup?incomplete=1");
          return;
        }
      }

      if (profile) {
        setProfile(profile);

        if (profile.dealership_id) {
          const [dealershipRes, vehiclesRes, assetsRes] = await Promise.all([
            supabase
              .from("dealerships")
              .select("*")
              .eq("id", profile.dealership_id)
              .single(),
            supabase
              .from("vehicles")
              .select("*")
              .eq("dealership_id", profile.dealership_id)
              .order("created_at", { ascending: false }),
            supabase
              .from("generated_assets")
              .select("*")
              .eq("dealership_id", profile.dealership_id)
              .eq("status", "completed")
              .order("created_at", { ascending: false })
              .limit(50),
          ]);

          if (dealershipRes.data) setDealership(dealershipRes.data);
          if (vehiclesRes.data) setVehicles(vehiclesRes.data);
          if (assetsRes.data) setRecentAssets(assetsRes.data);
        }
      }

      setIsLoading(false);
      setInitialized(true);
    }

    init();
  }, [router, setDealership, setProfile, setVehicles, setRecentAssets, setIsLoading]);

  if (!initialized || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />
      <main className="flex-1 md:ml-56 overflow-auto">
        {/* Mobile top bar — only visible below md */}
        <div className="md:hidden sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 backdrop-blur px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary">
              <Wand2 className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-heading text-sm font-bold tracking-tight">
              DealerVision
            </span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            className="h-9 w-9 p-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
