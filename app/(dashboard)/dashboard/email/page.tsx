"use client";

import { useEffect, useState } from "react";
import { Mail, Send, Eye } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo-data";
import type { GeneratedAsset } from "@/lib/types";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EMAIL_TEMPLATES, buildEmailHTML, type EmailTemplateId } from "@/lib/email-templates";

export default function EmailPage() {
  const { dealership, recentAssets } = useAppStore();
  const [assets, setAssets] = useState<GeneratedAsset[]>(recentAssets);
  const [template, setTemplate] = useState<EmailTemplateId>("sales-announcement");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  useEffect(() => {
    if (!isDemoMode()) {
      loadAssets();
    }
  }, [dealership]);

  async function loadAssets() {
    if (!dealership) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("generated_assets")
      .select("*")
      .eq("dealership_id", dealership.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setAssets(data);
  }

  const selectedAsset = assets.find((a) => a.id === selectedAssetId);

  async function handleSendTest() {
    if (!testEmail) {
      toast.error("Enter a test email address");
      return;
    }
    if (!subject || !headline || !body) {
      toast.error("Fill in subject, headline, and message body");
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: template,
          subject,
          preview_text: previewText,
          headline,
          email_body: body,
          cta_text: ctaText,
          cta_url: ctaUrl,
          asset_id: selectedAssetId || null,
          asset_url: selectedAsset?.image_url || null,
          test_email: testEmail,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send test email");
      }

      toast.success("Test email sent successfully");
      setTestEmail("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send test email");
    } finally {
      setIsSending(false);
    }
  }

  async function handleSendCampaign() {
    if (!subject || !headline || !body) {
      toast.error("Fill in subject, headline, and message body");
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: template,
          subject,
          preview_text: previewText,
          headline,
          email_body: body,
          cta_text: ctaText,
          cta_url: ctaUrl,
          asset_id: selectedAssetId || null,
          asset_url: selectedAsset?.image_url || null,
          recipients: "all",
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send campaign");
      }

      const result = await res.json();
      toast.success(`Campaign sent to ${result.sent} recipients`);

      setSubject("");
      setPreviewText("");
      setHeadline("");
      setBody("");
      setCtaText("");
      setCtaUrl("");
      setSelectedAssetId("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send campaign");
    } finally {
      setIsSending(false);
    }
  }

  const previewHtml = selectedAsset
    ? buildEmailHTML(template, {
        dealershipName: dealership?.name || "Your Dealership",
        dealershipPhone: dealership?.contact?.phone,
        dealershipWebsite: dealership?.contact?.website,
        primaryColor: dealership?.brand_colors?.primary,
        logoUrl: dealership?.logo_url ?? undefined,
        heroImageUrl: selectedAsset.image_url ?? undefined,
        subject,
        previewText,
        headline,
        body,
        ctaText,
        ctaUrl,
      })
    : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <Mail className="h-6 w-6 text-primary" />
          Email Campaigns
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Compose and send email campaigns to your subscribers
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Campaign Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template">Email Template</Label>
                <Select
                  value={template}
                  onValueChange={(v) => setTemplate(v as EmailTemplateId)}
                >
                  <SelectTrigger id="template">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMAIL_TEMPLATES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {EMAIL_TEMPLATES.find((t) => t.id === template)?.description}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Exclusive Offer: New Arrivals This Week"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  What recipients will see in their inbox
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preview">Preview Text (optional)</Label>
                <Input
                  id="preview"
                  placeholder="Short preview shown in inbox list"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  placeholder="Main heading in email"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Message Body</Label>
                <Textarea
                  id="body"
                  placeholder="Write your email message here..."
                  rows={6}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cta-text">CTA Button Text (optional)</Label>
                  <Input
                    id="cta-text"
                    placeholder="e.g., View Inventory"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cta-url">CTA URL (optional)</Label>
                  <Input
                    id="cta-url"
                    placeholder="https://..."
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hero Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="asset">Select Asset</Label>
                <Select
                  value={selectedAssetId}
                  onValueChange={(value) => value && setSelectedAssetId(value)}
                >
                  <SelectTrigger id="asset">
                    <SelectValue placeholder="Choose a generated asset..." />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.content_type.replace(/-/g, " ")} — {asset.channel.replace(/-/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAsset?.image_url && (
                <div className="rounded-lg overflow-hidden border">
                  <img
                    src={selectedAsset.image_url}
                    alt="Hero"
                    className="w-full max-h-40 object-cover"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setPreviewOpen(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Full Preview
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Send Email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="test-email">Test Email (optional)</Label>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="your@email.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleSendTest}
                  disabled={isSending}
                >
                  {isSending ? "Sending..." : "Send Test"}
                </Button>
              </div>

              <div className="border-t pt-3">
                <Button
                  className="w-full gradient-primary text-white"
                  onClick={handleSendCampaign}
                  disabled={isSending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSending ? "Sending..." : "Send to All Subscribers"}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Campaign will be sent to all active email subscribers
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          {previewHtml ? (
            <iframe
              srcDoc={previewHtml}
              className="w-full h-[600px] border rounded-lg"
            />
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Select an asset to see preview
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
