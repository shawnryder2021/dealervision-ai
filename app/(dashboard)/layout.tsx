"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
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
    isLoading,
  } = useAppStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function init() {
      if (isDemoMode()) {
        setDealership(DEMO_DEALERSHIP);
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

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setProfile(profile);

        if (profile.dealership_id) {
          const { data: dealership } = await supabase
            .from("dealerships")
            .select("*")
            .eq("id", profile.dealership_id)
            .single();

          if (dealership) {
            setDealership(dealership);
          }
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
      <Sidebar />
      <main className="flex-1 ml-64 overflow-auto">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
