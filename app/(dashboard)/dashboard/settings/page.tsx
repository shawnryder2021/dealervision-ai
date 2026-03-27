"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Save,
  Building2,
  Globe,
  Phone,
  Upload,
  Loader2,
  X,
  Webhook,
  Send,
  CheckCircle2,
  XCircle,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { BrandColorPicker } from "@/components/shared/BrandColorPicker";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo-data";
import { updateProfile } from "@/lib/db/profiles";
import { logActivity } from "@/lib/db/activity";
import { saveDemoSettings } from "@/lib/demo-settings";
import { toast } from "sonner";

export default function SettingsPage() {
  const { dealership, setDealership, profile, setProfile } = useAppStore();

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [brandColors, setBrandColors] = useState({
    primary: "#003366",
    secondary: "#FFFFFF",
    accent: "#FF8C00",
  });
  const [contact, setContact] = useState({
    address: "",
    phone: "",
    website: "",
    email: "",
    social: {
      instagram: "",
      facebook: "",
      x: "",
      youtube: "",
    },
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localContext, setLocalContext] = useState({
    inventory_type: "both" as "new" | "used" | "both",
    years_established: "",
    communities_served: "",
    landmarks: "",
    personality: "",
    specialties: "",
    seasonal_notes: "",
    community_involvement: "",
    unique_selling_points: "",
  });
  const [webhookConfig, setWebhookConfig] = useState({
    url: "",
    enabled: false,
    include_prompt: true,
    include_vehicle: true,
    include_dealership: true,
    include_user_email: true,
    secret: "",
  });
  const [webhookTestStatus, setWebhookTestStatus] = useState<
    "idle" | "testing" | "success" | "failed"
  >("idle");
  const [webhookTestError, setWebhookTestError] = useState("");

  // Profile state
  const [fullName, setFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
    }
  }, [profile]);

  useEffect(() => {
    if (dealership) {
      setName(dealership.name);
      setTagline(dealership.tagline || "");
      setLogoUrl(dealership.logo_url || null);
      setBrandColors(dealership.brand_colors);
      setContact({
        address: dealership.contact.address || "",
        phone: dealership.contact.phone || "",
        website: dealership.contact.website || "",
        email: dealership.contact.email || "",
        social: {
          instagram: dealership.contact.social?.instagram || "",
          facebook: dealership.contact.social?.facebook || "",
          x: dealership.contact.social?.x || "",
          youtube: dealership.contact.social?.youtube || "",
        },
      });
      if (dealership.webhook_config) {
        setWebhookConfig({
          url: dealership.webhook_config.url || "",
          enabled: dealership.webhook_config.enabled || false,
          include_prompt: dealership.webhook_config.include_prompt ?? true,
          include_vehicle: dealership.webhook_config.include_vehicle ?? true,
          include_dealership: dealership.webhook_config.include_dealership ?? true,
          include_user_email: dealership.webhook_config.include_user_email ?? true,
          secret: dealership.webhook_config.secret || "",
        });
      }
      if (dealership.local_context) {
        const lc = dealership.local_context;
        setLocalContext({
          inventory_type: lc.inventory_type ?? "both",
          years_established: lc.years_established || "",
          communities_served: lc.communities_served || "",
          landmarks: lc.landmarks || "",
          personality: lc.personality || "",
          specialties: lc.specialties || "",
          seasonal_notes: lc.seasonal_notes || "",
          community_involvement: lc.community_involvement || "",
          unique_selling_points: lc.unique_selling_points || "",
        });
      }
    }
  }, [dealership]);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }
      const data = await res.json();
      setLogoUrl(data.url);
      toast.success("Logo uploaded");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error(msg);
    }
    setIsUploadingLogo(false);
    e.target.value = "";
  }

  async function handleSave() {
    if (!dealership) return;
    setIsSaving(true);

    const webhookToSave = {
      url: webhookConfig.url.trim(),
      enabled: webhookConfig.enabled,
      include_prompt: webhookConfig.include_prompt,
      include_vehicle: webhookConfig.include_vehicle,
      include_dealership: webhookConfig.include_dealership,
      include_user_email: webhookConfig.include_user_email,
      secret: webhookConfig.secret.trim() || undefined,
    };

    const localContextToSave = {
      inventory_type: localContext.inventory_type,
      years_established: localContext.years_established.trim() || undefined,
      communities_served: localContext.communities_served.trim() || undefined,
      landmarks: localContext.landmarks.trim() || undefined,
      personality: localContext.personality.trim() || undefined,
      specialties: localContext.specialties.trim() || undefined,
      seasonal_notes: localContext.seasonal_notes.trim() || undefined,
      community_involvement: localContext.community_involvement.trim() || undefined,
      unique_selling_points: localContext.unique_selling_points.trim() || undefined,
    };

    if (isDemoMode()) {
      const updated = {
        ...dealership,
        name,
        tagline,
        logo_url: logoUrl,
        brand_colors: brandColors,
        contact,
        local_context: localContextToSave,
        webhook_config: webhookToSave,
        updated_at: new Date().toISOString(),
      };
      setDealership(updated);
      saveDemoSettings(updated);
      toast.success("Settings saved");
      setIsSaving(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("dealerships")
      .update({
        name,
        tagline,
        logo_url: logoUrl,
        brand_colors: brandColors,
        contact,
        local_context: localContextToSave,
        webhook_config: webhookToSave,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dealership.id)
      .select()
      .single();

    if (error) {
      toast.error("Failed to save settings");
    } else if (data) {
      setDealership(data);
      logActivity({
        dealership_id: dealership.id,
        user_id: profile?.id ?? "",
        user_name: profile?.full_name ?? "User",
        action: "updated_settings",
        entity_type: "settings",
        details: { section: "Dealership settings" },
      });
      toast.success("Settings saved");
    }

    setIsSaving(false);
  }

  async function handleTestWebhook() {
    if (!webhookConfig.url.trim()) {
      toast.error("Enter a webhook URL first");
      return;
    }
    setWebhookTestStatus("testing");
    setWebhookTestError("");
    try {
      const res = await fetch("/api/webhook-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhook_config: webhookConfig,
          dealership_name: name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWebhookTestStatus("success");
        toast.success(`Webhook delivered! (HTTP ${data.status})`);
      } else {
        setWebhookTestStatus("failed");
        setWebhookTestError(data.error || `HTTP ${data.status}`);
        toast.error(`Webhook failed: ${data.error || `HTTP ${data.status}`}`);
      }
    } catch {
      setWebhookTestStatus("failed");
      setWebhookTestError("Network error");
      toast.error("Failed to send test webhook");
    }
  }

  async function handleSaveProfile() {
    if (!profile) return;
    setIsSavingProfile(true);
    try {
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          toast.error("Passwords do not match");
          setIsSavingProfile(false);
          return;
        }
        if (newPassword.length < 8) {
          toast.error("Password must be at least 8 characters");
          setIsSavingProfile(false);
          return;
        }
        if (!isDemoMode()) {
          const supabase = createClient();
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          if (error) throw error;
        }
        setNewPassword("");
        setConfirmPassword("");
      }
      const updated = await updateProfile(profile.id, { full_name: fullName });
      setProfile(updated);
      logActivity({
        dealership_id: dealership?.id ?? "",
        user_id: profile.id,
        user_name: fullName || profile.full_name || "User",
        action: "updated_settings",
        entity_type: "settings",
        details: { section: "Your Profile" },
      });
      toast.success("Profile saved");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save profile";
      toast.error(msg);
    }
    setIsSavingProfile(false);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Dealership Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your brand profile and contact information
        </p>
      </div>

      {/* Your Profile */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="h-4 w-4 text-lg">👤</span>
            Your Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <div className="flex-1">
              {profile && (
                <p className="text-xs text-muted-foreground">
                  Role: <span className="capitalize font-medium">{profile.role}</span>
                </p>
              )}
            </div>
            <Button
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              size="sm"
              className="gradient-primary text-white"
            >
              {isSavingProfile ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Brand Profile */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Brand Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Dealership Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Dealership Name"
            />
          </div>

          <div className="space-y-2">
            <Label>Tagline</Label>
            <Input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Your dealership tagline..."
            />
          </div>

          <Separator />

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Dealership Logo</Label>
            <p className="text-xs text-muted-foreground">
              Used as a watermark overlay on generated images
            </p>
            {logoUrl ? (
              <div className="flex items-center gap-3">
                <div className="relative h-16 w-32 rounded-lg border border-border overflow-hidden bg-muted/30">
                  <img
                    src={logoUrl}
                    alt="Dealership logo"
                    className="h-full w-full object-contain p-1"
                  />
                </div>
                <button
                  onClick={() => setLogoUrl(null)}
                  className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:bg-destructive/10 transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                  disabled={isUploadingLogo}
                />
                <label htmlFor="logo-upload">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-muted/30 text-sm cursor-pointer hover:bg-muted/50 transition-colors">
                    {isUploadingLogo ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload Logo
                      </>
                    )}
                  </span>
                </label>
              </div>
            )}
          </div>

          <Separator />

          <BrandColorPicker value={brandColors} onChange={setBrandColors} />
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Address</Label>
            <Input
              value={contact.address}
              onChange={(e) =>
                setContact({ ...contact, address: e.target.value })
              }
              placeholder="123 Main St, City, State 12345"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={contact.phone}
                onChange={(e) =>
                  setContact({ ...contact, phone: e.target.value })
                }
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={contact.email}
                onChange={(e) =>
                  setContact({ ...contact, email: e.target.value })
                }
                placeholder="info@dealership.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Website</Label>
            <Input
              value={contact.website}
              onChange={(e) =>
                setContact({ ...contact, website: e.target.value })
              }
              placeholder="https://www.yourdealership.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Social Media
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input
                value={contact.social.instagram}
                onChange={(e) =>
                  setContact({
                    ...contact,
                    social: { ...contact.social, instagram: e.target.value },
                  })
                }
                placeholder="@yourdealership"
              />
            </div>
            <div className="space-y-2">
              <Label>Facebook</Label>
              <Input
                value={contact.social.facebook}
                onChange={(e) =>
                  setContact({
                    ...contact,
                    social: { ...contact.social, facebook: e.target.value },
                  })
                }
                placeholder="yourdealership"
              />
            </div>
            <div className="space-y-2">
              <Label>X (Twitter)</Label>
              <Input
                value={contact.social.x}
                onChange={(e) =>
                  setContact({
                    ...contact,
                    social: { ...contact.social, x: e.target.value },
                  })
                }
                placeholder="@yourdealership"
              />
            </div>
            <div className="space-y-2">
              <Label>YouTube</Label>
              <Input
                value={contact.social.youtube}
                onChange={(e) =>
                  setContact({
                    ...contact,
                    social: { ...contact.social, youtube: e.target.value },
                  })
                }
                placeholder="yourdealership"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Local Market & Personalization */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Local Market & Personalization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            These details are injected into every AI prompt to make generated images and content specific to your dealership and local market.
          </p>

          {/* Inventory Type */}
          <div className="space-y-2">
            <Label>Inventory Type</Label>
            <div className="flex gap-2">
              {(["new", "used", "both"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setLocalContext({ ...localContext, inventory_type: v })}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all capitalize ${
                    localContext.inventory_type === v
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {v === "both" ? "New & Used" : v === "new" ? "New Only" : "Used/Pre-Owned Only"}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Years / History</Label>
              <Input
                value={localContext.years_established}
                onChange={(e) => setLocalContext({ ...localContext, years_established: e.target.value })}
                placeholder='e.g., "serving PEI since 1985"'
              />
            </div>
            <div className="space-y-2">
              <Label>Dealership Personality</Label>
              <Input
                value={localContext.personality}
                onChange={(e) => setLocalContext({ ...localContext, personality: e.target.value })}
                placeholder='e.g., "family-owned, community-driven"'
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Communities Served</Label>
            <Input
              value={localContext.communities_served}
              onChange={(e) => setLocalContext({ ...localContext, communities_served: e.target.value })}
              placeholder='e.g., "Charlottetown, Summerside, Montague and all of PEI"'
            />
          </div>

          <div className="space-y-2">
            <Label>Local Landmarks & Location Context</Label>
            <Input
              value={localContext.landmarks}
              onChange={(e) => setLocalContext({ ...localContext, landmarks: e.target.value })}
              placeholder='e.g., "near Confederation Bridge, Victoria Park, downtown waterfront"'
            />
            <p className="text-[11px] text-muted-foreground">Used to add recognizable local scenery and references to generated images</p>
          </div>

          <div className="space-y-2">
            <Label>Specialties & Certifications</Label>
            <Input
              value={localContext.specialties}
              onChange={(e) => setLocalContext({ ...localContext, specialties: e.target.value })}
              placeholder='e.g., "Certified Pre-Owned specialist, EV charging, bilingual service"'
            />
          </div>

          <div className="space-y-2">
            <Label>Local Climate & Seasonal Context</Label>
            <Input
              value={localContext.seasonal_notes}
              onChange={(e) => setLocalContext({ ...localContext, seasonal_notes: e.target.value })}
              placeholder='e.g., "harsh Maritime winters, busy summer tourist season"'
            />
            <p className="text-[11px] text-muted-foreground">Helps the AI generate seasonally relevant backgrounds and messaging</p>
          </div>

          <div className="space-y-2">
            <Label>Community Involvement</Label>
            <Input
              value={localContext.community_involvement}
              onChange={(e) => setLocalContext({ ...localContext, community_involvement: e.target.value })}
              placeholder='e.g., "proud sponsor of local hockey team and community events"'
            />
          </div>

          <div className="space-y-2">
            <Label>Unique Selling Points</Label>
            <Textarea
              value={localContext.unique_selling_points}
              onChange={(e) => setLocalContext({ ...localContext, unique_selling_points: e.target.value })}
              placeholder='e.g., "largest selection in the region, free winter tire storage, same-day service, price match guarantee"'
              rows={2}
            />
            <p className="text-[11px] text-muted-foreground">What makes your dealership stand out — used in sales event and brand post content</p>
          </div>
        </CardContent>
      </Card>

      {/* Webhooks & Integrations */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks & Integrations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Send generated images and details to an external URL for email
            delivery, CRM integration, or custom workflows.
          </p>

          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Webhook</Label>
              <p className="text-xs text-muted-foreground">
                Automatically send data when images are generated
              </p>
            </div>
            <Switch
              checked={webhookConfig.enabled}
              onCheckedChange={(checked: boolean) =>
                setWebhookConfig({ ...webhookConfig, enabled: checked })
              }
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <Input
              value={webhookConfig.url}
              onChange={(e) =>
                setWebhookConfig({ ...webhookConfig, url: e.target.value })
              }
              placeholder="https://your-server.com/api/webhook"
              type="url"
            />
          </div>

          <div className="space-y-2">
            <Label>Signing Secret (optional)</Label>
            <Input
              value={webhookConfig.secret}
              onChange={(e) =>
                setWebhookConfig({ ...webhookConfig, secret: e.target.value })
              }
              placeholder="Enter a secret for HMAC-SHA256 signature verification"
              type="password"
            />
            <p className="text-[10px] text-muted-foreground">
              If set, each webhook includes an X-Webhook-Signature header for
              verification
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Payload Options</Label>
            <p className="text-xs text-muted-foreground">
              Image URL is always included. Choose additional data to send:
            </p>

            <div className="space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm">Prompt used</span>
                <Switch
                  checked={webhookConfig.include_prompt}
                  onCheckedChange={(checked: boolean) =>
                    setWebhookConfig({
                      ...webhookConfig,
                      include_prompt: checked,
                    })
                  }
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm">Vehicle details</span>
                <Switch
                  checked={webhookConfig.include_vehicle}
                  onCheckedChange={(checked: boolean) =>
                    setWebhookConfig({
                      ...webhookConfig,
                      include_vehicle: checked,
                    })
                  }
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm">Dealership info</span>
                <Switch
                  checked={webhookConfig.include_dealership}
                  onCheckedChange={(checked: boolean) =>
                    setWebhookConfig({
                      ...webhookConfig,
                      include_dealership: checked,
                    })
                  }
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm">User email</span>
                <Switch
                  checked={webhookConfig.include_user_email}
                  onCheckedChange={(checked: boolean) =>
                    setWebhookConfig({
                      ...webhookConfig,
                      include_user_email: checked,
                    })
                  }
                />
              </label>
            </div>
          </div>

          <Separator />

          {/* Test & Status */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestWebhook}
              disabled={
                webhookTestStatus === "testing" || !webhookConfig.url.trim()
              }
            >
              {webhookTestStatus === "testing" ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Test Webhook
                </>
              )}
            </Button>

            {webhookTestStatus === "success" && (
              <span className="flex items-center gap-1.5 text-xs text-green-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Delivered successfully
              </span>
            )}
            {webhookTestStatus === "failed" && (
              <span className="flex items-center gap-1.5 text-xs text-destructive">
                <XCircle className="h-3.5 w-3.5" />
                Failed: {webhookTestError}
              </span>
            )}
          </div>

          {/* Payload Preview */}
          {webhookConfig.url && (
            <div className="rounded-lg bg-muted/30 border border-border p-3 space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Sample Payload
              </p>
              <pre className="text-[10px] text-muted-foreground overflow-x-auto whitespace-pre-wrap">
{JSON.stringify(
  {
    event: "image.generated",
    timestamp: "2026-03-21T12:00:00Z",
    image_url: "https://i.ibb.co/example.png",
    content_type: "vehicle-spotlight",
    channel: "instagram-post",
    aspect_ratio: "1:1",
    ...(webhookConfig.include_prompt && {
      prompt: "Professional automotive photography...",
    }),
    ...(webhookConfig.include_vehicle && {
      vehicle: { year: 2025, make: "VW", model: "Atlas" },
    }),
    ...(webhookConfig.include_dealership && {
      dealership: { name, phone: contact.phone },
    }),
    ...(webhookConfig.include_user_email && {
      user_email: "user@dealership.com",
    }),
  },
  null,
  2
)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        className="gradient-primary text-white"
        onClick={handleSave}
        disabled={isSaving}
      >
        <Save className="h-4 w-4 mr-2" />
        {isSaving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
