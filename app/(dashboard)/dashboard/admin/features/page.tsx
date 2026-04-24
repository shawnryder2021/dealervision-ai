"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  DEFAULT_FEATURE_FLAGS,
  FEATURE_FLAG_KEYS,
  FEATURE_FLAG_LABELS,
  type FeatureFlags,
} from "@/lib/platform-feature-flags";

export default function AdminFeaturesPage() {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchFeatureFlags = async () => {
      try {
        const res = await fetch("/api/admin/feature-flags");
        if (!res.ok) throw new Error("Failed to load feature flags");
        const data = await res.json();
        setFeatureFlags(data.featureFlags || DEFAULT_FEATURE_FLAGS);
      } catch (error) {
        console.error("Failed to load feature flags:", error);
        toast.error("Could not load feature toggles");
      } finally {
        setLoading(false);
      }
    };

    fetchFeatureFlags();
  }, []);

  const toggleFlag = (key: keyof FeatureFlags, enabled: boolean) => {
    setFeatureFlags((prev) => ({ ...prev, [key]: enabled }));
  };

  const saveFeatureFlags = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featureFlags }),
      });

      if (!res.ok) throw new Error("Failed to save feature flags");
      toast.success("Feature toggles saved");
    } catch (error) {
      console.error("Failed to save feature flags:", error);
      toast.error("Could not save feature toggles");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">Feature Toggles</h1>
        <p className="text-muted-foreground mt-1">
          Turn sections of the app on or off. Hidden features are removed from dashboard navigation.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dashboard Navigation</CardTitle>
          <CardDescription>Use the sliders to hide unfinished areas until they are ready.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {FEATURE_FLAG_KEYS.map((key) => (
            <div key={key} className="flex items-center justify-between rounded-md border p-3">
              <p className="text-sm font-medium">{FEATURE_FLAG_LABELS[key]}</p>
              <Switch
                checked={featureFlags[key]}
                onCheckedChange={(enabled) => toggleFlag(key, enabled)}
                disabled={loading || saving}
              />
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <Button onClick={saveFeatureFlags} disabled={loading || saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
