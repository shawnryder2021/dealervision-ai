"use client";

import { useState, useEffect } from "react";
import { Settings, Save, Building2, Globe, Phone, Mail, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BrandColorPicker } from "@/components/shared/BrandColorPicker";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo-data";
import { toast } from "sonner";

export default function SettingsPage() {
  const { dealership, setDealership } = useAppStore();

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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (dealership) {
      setName(dealership.name);
      setTagline(dealership.tagline || "");
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
    }
  }, [dealership]);

  async function handleSave() {
    if (!dealership) return;
    setIsSaving(true);

    if (isDemoMode()) {
      setDealership({
        ...dealership,
        name,
        tagline,
        brand_colors: brandColors,
        contact,
        updated_at: new Date().toISOString(),
      });
      toast.success("Settings saved (demo)");
      setIsSaving(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("dealerships")
      .update({
        name,
        tagline,
        brand_colors: brandColors,
        contact,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dealership.id)
      .select()
      .single();

    if (error) {
      toast.error("Failed to save settings");
    } else if (data) {
      setDealership(data);
      toast.success("Settings saved");
    }

    setIsSaving(false);
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
