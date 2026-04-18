"use client";

import { useState, useEffect } from "react";
import {
  Mail, Send, Plus, Loader2, CheckCircle2, Image as ImageIcon,
  Eye, ExternalLink, Users, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo-data";
import { EMAIL_TEMPLATES, buildEmailHTML, type EmailTemplateId } from "@/lib/email-templates";
import type { GeneratedAsset } from "@/lib/types";
import { toast } from "sonner";

type Tab = "compose" | "history" | "subscribers";

interface Campaign {
  id: string;
  subject: string;
  template_id: string;
  status: string;
  recipient_count: number;
  sent_at: string | null;
  created_at: string;
  asset_url: string | null;
}

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  subscribed_at: string;
  unsubscribed_at: string | null;
}

export default function EmailPage() {
  const { dealership } = useAppStore();
  const [tab, setTab] = useState<Tab>("compose");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [showAssetPicker, setShowAssetPicker] = useState(false);

  // Form state
  const [templateId, setTemplateId] = useState<EmailTemplateId>("sales-announcement");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [ctaText, setCtaText] = useState("View Inventory");
  const [ctaUrl, setCtaUrl] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<GeneratedAsset | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // New subscriber form
  const [newSubEmail, setNewSubEmail] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [isAddingSub, setIsAddingSub] = useState(false);

  useEffect(() => {
    if (tab === "history") loadHistory();
    if (tab === "subscribers") loadSubscribers();
  }, [tab]);

  useEffect(() => {
    if (!dealership) return;
    if (isDemoMode()) return;
    const supabase = createClient();
    supabase.from("generated_assets")
      .select("*")
      .eq("dealership_id", dealership.id)
      .eq("status", "completed")
      .not("image_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }: { data: GeneratedAsset[] | null }) => { if (data) setAssets(data); });
  }, [dealership]);

  async function loadHistory() {
    setLoadingHistory(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("email_campaigns")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setCampaigns(data);
    setLoadingHistory(false);
  }

  async function loadSubscribers() {
    setLoadingSubs(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("email_subscribers")
      .select("*")
      .order("subscribed_at", { ascending: false });
    if (data) setSubscribers(data);
    setLoadingSubs(false);
  }

  async function handleAddSubscriber() {
    if (!dealership || !newSubEmail) return;
    setIsAddingSub(true);
    const supabase = createClient();
    const { error } = await supabase.from("email_subscribers").insert({
      dealership_id: dealership.id,
      email: newSubEmail.trim().toLowerCase(),
      name: newSubName.trim() || null,
    });
    setIsAddingSub(false);
    if (error) {
      toast.error(error.message.includes("unique") ? "Email already subscribed" : "Failed to add subscriber");
    } else {
      toast.success("Subscriber added");
      setNewSubEmail("");
      setNewSubName("");
      loadSubscribers();
    }
  }

  function generatePreview() {
    if (!dealership) return;
    const html = buildEmailHTML(templateId, {
      dealershipName: dealership.name,
      dealershipPhone: dealership.contact?.phone,
      dealershipWebsite: dealership.contact?.website,
      primaryColor: dealership.brand_colors?.primary,
      logoUrl: dealership.logo_url || undefined,
      heroImageUrl: selectedAsset?.image_url || undefined,
      subject: subject || "Preview",
      previewText,
      headline: headline || "Your Headline Here",
      body: body || "Your email body text...",
      ctaText: ctaText || undefined,
      ctaUrl: ctaUrl || "#",
    });
    setPreview(html);
  }

  async function handleSend(isTest: boolean) {
    if (!subject || !headline || !body) {
      toast.error("Fill in subject, headline, and body first");
      return;
    }
    if (isTest && !testEmail) {
      toast.error("Enter a test email address");
      return;
    }

    isTest ? setIsSendingTest(true) : setIsSending(true);

    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: templateId,
          subject,
          preview_text: previewText,
          headline,
          email_body: body,
          cta_text: ctaText,
          cta_url: ctaUrl,
          asset_id: selectedAsset?.id,
          asset_url: selectedAsset?.image_url,
          test_email: isTest ? testEmail : undefined,
          recipients: isTest ? undefined : "all",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Send failed");
        return;
      }

      if (isTest) {
        toast.success(`Test email sent to ${testEmail}`);
      } else {
        toast.success(`Campaign sent to ${data.sent} subscribers!`);
        setSubject(""); setHeadline(""); setBody(""); setSelectedAsset(null);
        setTab("history");
      }
    } catch (err) {
      toast.error("Send failed");
    } finally {
      isTest ? setIsSendingTest(false) : setIsSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight flex items-center gap-2">
          <Mail className="h-6 w-6 text-primary" />
          Email Campaigns
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Build and send email campaigns using your generated assets
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(["compose", "history", "subscribers"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setPreview(null); setTab(t); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${
              tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Compose ── */}
      {tab === "compose" && !preview && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-5">
            {/* Template picker */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Template</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {EMAIL_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTemplateId(t.id as EmailTemplateId)}
                      className={`text-left rounded-lg border p-3 transition-all ${
                        templateId === t.id ? "border-primary bg-primary/5" : "hover:border-primary/30"
                      }`}
                    >
                      <p className={`text-sm font-medium ${templateId === t.id ? "text-primary" : ""}`}>{t.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{t.description}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Content */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Content</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Subject Line *</Label>
                    <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Don't Miss Our End of Month Sale!" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Preview Text</Label>
                    <Input value={previewText} onChange={(e) => setPreviewText(e.target.value)} placeholder="Shown below subject in inbox..." />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Headline *</Label>
                  <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Big savings this weekend only" />
                </div>
                <div className="space-y-1.5">
                  <Label>Body *</Label>
                  <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your email body here..." rows={4} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>CTA Button Text</Label>
                    <Input value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="View Inventory" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CTA URL</Label>
                    <Input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://..." />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Asset + send */}
          <div className="space-y-4">
            {/* Hero image */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Hero Image</CardTitle></CardHeader>
              <CardContent>
                {selectedAsset?.image_url ? (
                  <div className="space-y-2">
                    <img src={selectedAsset.image_url} alt="Hero" className="w-full rounded-lg object-cover max-h-40" />
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setShowAssetPicker(true)}>
                      Change Image
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAssetPicker(true)}
                    className="w-full rounded-lg border-2 border-dashed p-8 text-center hover:border-primary/50 transition-colors"
                  >
                    <ImageIcon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Pick from library</p>
                  </button>
                )}
              </CardContent>
            </Card>

            {/* Preview & send */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Send</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full gap-2" onClick={generatePreview}>
                  <Eye className="h-4 w-4" />
                  Preview Email
                </Button>
                <div className="flex gap-2">
                  <Input
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@email.com"
                    className="text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => handleSend(true)}
                    disabled={isSendingTest}
                  >
                    {isSendingTest ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Test"}
                  </Button>
                </div>
                <Button
                  className="w-full gradient-primary text-white gap-2"
                  onClick={() => handleSend(false)}
                  disabled={isSending}
                >
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {isSending ? "Sending…" : `Send to All Subscribers`}
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
                  Requires <code className="bg-muted px-1 rounded">RESEND_API_KEY</code> in environment variables
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── Preview ── */}
      {tab === "compose" && preview && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setPreview(null)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to editor
            </Button>
            <p className="text-sm text-muted-foreground">Email preview</p>
          </div>
          <div className="rounded-xl border overflow-hidden">
            <iframe
              srcDoc={preview}
              className="w-full"
              style={{ height: 600 }}
              title="Email Preview"
            />
          </div>
        </div>
      )}

      {/* ── Asset picker overlay ── */}
      {showAssetPicker && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6">
          <div className="bg-background rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <p className="font-semibold">Pick Hero Image</p>
              <Button variant="ghost" size="sm" onClick={() => setShowAssetPicker(false)}>Close</Button>
            </div>
            <div className="overflow-y-auto p-4 grid grid-cols-3 gap-3">
              {assets.map((a) => (
                <button
                  key={a.id}
                  onClick={() => { setSelectedAsset(a); setShowAssetPicker(false); }}
                  className="rounded-lg overflow-hidden border hover:border-primary transition-colors aspect-square"
                >
                  <img src={a.image_url!} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
              {assets.length === 0 && (
                <div className="col-span-3 text-center py-8 text-muted-foreground text-sm">
                  No completed assets found. Generate some images first.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── History ── */}
      {tab === "history" && (
        <div className="space-y-3">
          {loadingHistory ? (
            [1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)
          ) : campaigns.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                No campaigns sent yet. Compose your first email above.
              </CardContent>
            </Card>
          ) : campaigns.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {c.asset_url && <img src={c.asset_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />}
                  <div>
                    <p className="font-medium text-sm">{c.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.sent_at ? new Date(c.sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Draft"} · {c.recipient_count} recipients
                    </p>
                  </div>
                </div>
                <Badge className={c.status === "sent" ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}>
                  {c.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Subscribers ── */}
      {tab === "subscribers" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Add Subscriber</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input value={newSubName} onChange={(e) => setNewSubName(e.target.value)} placeholder="Name (optional)" className="max-w-[200px]" />
                <Input value={newSubEmail} onChange={(e) => setNewSubEmail(e.target.value)} placeholder="email@example.com" type="email" />
                <Button onClick={handleAddSubscriber} disabled={isAddingSub || !newSubEmail} className="gradient-primary text-white gap-2 shrink-0">
                  {isAddingSub ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {loadingSubs ? (
            [1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)
          ) : subscribers.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                No subscribers yet. Add the first one above.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {subscribers.filter((s) => !s.unsubscribed_at).length} active subscribers
              </p>
              {subscribers.map((s) => (
                <Card key={s.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{s.name || s.email}</p>
                      {s.name && <p className="text-xs text-muted-foreground">{s.email}</p>}
                    </div>
                    {s.unsubscribed_at ? (
                      <Badge variant="outline" className="text-xs">Unsubscribed</Badge>
                    ) : (
                      <Badge className="bg-green-500/10 text-green-600 text-xs">Active</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
