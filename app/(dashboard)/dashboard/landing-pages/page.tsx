"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  FileText,
  Globe,
  Pencil,
  Trash2,
  Eye,
  Copy,
  ExternalLink,
  CheckCircle2,
  Clock,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/lib/store";
import {
  generateSlug,
  LANDING_PAGE_TEMPLATES,
  type LandingPage,
  type LandingPageTemplate,
} from "@/lib/landing-pages";
import {
  getLandingPages,
  saveLandingPage,
  deleteLandingPage,
} from "@/lib/db/landing-pages";
import { logActivity } from "@/lib/db/activity";
import { toast } from "sonner";

type View = "list" | "create" | "edit" | "preview";

export default function LandingPagesPage() {
  const { dealership, vehicles, profile } = useAppStore();
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [view, setView] = useState<View>("list");
  const [editingPage, setEditingPage] = useState<LandingPage | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<LandingPageTemplate | null>(null);
  const [previewPage, setPreviewPage] = useState<LandingPage | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [description, setDescription] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaLink, setCtaLink] = useState("");
  const [features, setFeatures] = useState<string[]>([""]);
  const [showContactForm, setShowContactForm] = useState(true);
  const [showMap, setShowMap] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");

  useEffect(() => {
    if (!dealership?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getLandingPages(dealership.id);
        if (!cancelled) setPages(data);
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Unknown error";
          toast.error(`Couldn't load landing pages: ${message}`);
          setPages([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dealership?.id]);

  function resetForm() {
    setTitle("");
    setSlug("");
    setHeadline("");
    setSubheadline("");
    setDescription("");
    setCtaText("");
    setCtaLink("");
    setFeatures([""]);
    setShowContactForm(true);
    setShowMap(true);
    setSelectedVehicleId("");
    setSelectedTemplate(null);
    setEditingPage(null);
  }

  function handleSelectTemplate(templateId: LandingPageTemplate) {
    const template = LANDING_PAGE_TEMPLATES.find((t) => t.id === templateId)!;
    setSelectedTemplate(templateId);
    setHeadline(template.defaultHeadline);
    setSubheadline(template.defaultSubheadline);
    setCtaText(template.defaultCta);
    setFeatures([...template.defaultFeatures]);
    setTitle(template.name);
    setSlug(generateSlug(template.name));
    setView("create");
  }

  function handleEditPage(page: LandingPage) {
    setEditingPage(page);
    setSelectedTemplate(page.template);
    setTitle(page.title);
    setSlug(page.slug);
    setHeadline(page.headline);
    setSubheadline(page.subheadline);
    setDescription(page.description);
    setCtaText(page.cta_text);
    setCtaLink(page.cta_link);
    setFeatures(page.features.length > 0 ? page.features : [""]);
    setShowContactForm(page.show_contact_form);
    setShowMap(page.show_map);
    setSelectedVehicleId(page.vehicle ? "selected" : "");
    setView("edit");
  }

  async function handleSave(status: "draft" | "published" = "draft") {
    if (!dealership || !selectedTemplate) return;

    const vehicle = selectedVehicleId
      ? vehicles.find((v) => v.id === selectedVehicleId)
      : null;

    const page: LandingPage = {
      id: editingPage?.id || `lp-${Date.now()}`,
      dealership_id: dealership.id,
      slug: slug || generateSlug(title),
      title,
      template: selectedTemplate,
      status,
      hero_image_url: editingPage?.hero_image_url || null,
      headline,
      subheadline,
      cta_text: ctaText,
      cta_link: ctaLink,
      description,
      brand_colors: dealership.brand_colors,
      dealership_name: dealership.name,
      dealership_phone: dealership.contact.phone || "",
      dealership_address: dealership.contact.address || "",
      dealership_website: dealership.contact.website || "",
      vehicle: vehicle
        ? {
            year: vehicle.year || 0,
            make: vehicle.make || "",
            model: vehicle.model || "",
            trim: vehicle.trim || "",
            price: vehicle.price || 0,
            mileage: vehicle.mileage || 0,
            vin: vehicle.vin || "",
            stock_number: vehicle.stock_number || "",
          }
        : undefined,
      features: features.filter((f) => f.trim()),
      show_contact_form: showContactForm,
      show_map: showMap,
      custom_css: editingPage?.custom_css || "",
      created_at: editingPage?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await saveLandingPage(dealership.id, page);
      const refreshed = await getLandingPages(dealership.id);
      setPages(refreshed);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Couldn't save landing page: ${message}`);
      return;
    }

    // Activity logging is best-effort; failures shouldn't block the user.
    void logActivity({
      dealership_id: dealership.id,
      user_id: profile?.id ?? "unknown",
      user_name: profile?.full_name ?? "Unknown user",
      action: status === "published" ? "published_landing_page" : "created_landing_page",
      entity_type: "landing_page",
      entity_id: page.id,
      details: { page_title: title, slug: page.slug, template: selectedTemplate },
    }).catch(() => {
      /* swallowed intentionally — logged server-side */
    });

    toast.success(
      status === "published"
        ? "Landing page published!"
        : editingPage
        ? "Landing page updated!"
        : "Landing page saved as draft!"
    );

    resetForm();
    setView("list");
  }

  async function handleDelete(id: string) {
    if (!dealership) return;
    try {
      await deleteLandingPage(dealership.id, id);
      const refreshed = await getLandingPages(dealership.id);
      setPages(refreshed);
      toast.success("Landing page deleted");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Couldn't delete landing page: ${message}`);
    }
  }

  function handleCopyLink(page: LandingPage) {
    const url = `${window.location.origin}/p/${page.slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  }

  function handlePreview(page: LandingPage) {
    setPreviewPage(page);
    setView("preview");
  }

  function addFeature() {
    setFeatures([...features, ""]);
  }

  function updateFeature(index: number, value: string) {
    const updated = [...features];
    updated[index] = value;
    setFeatures(updated);
  }

  function removeFeature(index: number) {
    setFeatures(features.filter((_, i) => i !== index));
  }

  // ── LIST VIEW ──
  if (view === "list") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Landing Pages
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Create promotional pages for sales events, featured vehicles, and special offers
            </p>
          </div>
          <Button
            className="gradient-primary text-white gap-2"
            onClick={() => setView("create")}
          >
            <Plus className="h-4 w-4" />
            New Page
          </Button>
        </div>

        {/* Existing pages */}
        {pages.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-1">No landing pages yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Create your first promotional landing page to share with customers
              </p>
              <Button
                className="gradient-primary text-white"
                onClick={() => setView("create")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Landing Page
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pages.map((page) => (
              <Card key={page.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                        {LANDING_PAGE_TEMPLATES.find((t) => t.id === page.template)?.emoji || "📄"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base">{page.title}</h3>
                          <Badge
                            variant={page.status === "published" ? "default" : "secondary"}
                            className={`text-[10px] ${
                              page.status === "published"
                                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                : ""
                            }`}
                          >
                            {page.status === "published" ? (
                              <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                            ) : (
                              <Clock className="h-2.5 w-2.5 mr-1" />
                            )}
                            {page.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">
                          {page.headline}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            /p/{page.slug}
                          </span>
                          <span>
                            {LANDING_PAGE_TEMPLATES.find((t) => t.id === page.template)?.name}
                          </span>
                          <span>
                            Updated {new Date(page.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handlePreview(page)}
                        title="Preview"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleCopyLink(page)}
                        title="Copy link"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleEditPage(page)}
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(page.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── PREVIEW VIEW ──
  if (view === "preview" && previewPage) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => { setView("list"); setPreviewPage(null); }}>
            ← Back to list
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleCopyLink(previewPage)}>
              <Copy className="h-3.5 w-3.5 mr-1" /> Copy Link
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleEditPage(previewPage)}>
              <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
            </Button>
          </div>
        </div>

        {/* Live preview in iframe-like card */}
        <Card className="overflow-hidden">
          <div className="bg-muted/50 border-b px-4 py-2 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 bg-background rounded px-3 py-1 text-xs text-muted-foreground font-mono">
              {window.location.origin}/p/{previewPage.slug}
            </div>
          </div>
          <LandingPagePreview page={previewPage} />
        </Card>
      </div>
    );
  }

  // ── CREATE / EDIT VIEW ──
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">
            {editingPage ? "Edit Landing Page" : "Create Landing Page"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {editingPage
              ? "Update your landing page content and settings"
              : "Choose a template and customize your page"}
          </p>
        </div>
        <Button variant="ghost" onClick={() => { resetForm(); setView("list"); }}>
          Cancel
        </Button>
      </div>

      {/* Template selector (only when creating) */}
      {!editingPage && !selectedTemplate && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {LANDING_PAGE_TEMPLATES.map((template) => (
            <Card
              key={template.id}
              className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
              onClick={() => handleSelectTemplate(template.id)}
            >
              <CardContent className="p-5">
                <div className="text-3xl mb-3">{template.emoji}</div>
                <h3 className="font-semibold">{template.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {template.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form */}
      {(selectedTemplate || editingPage) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Form */}
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Page Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Page Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (!editingPage) setSlug(generateSlug(e.target.value));
                    }}
                    placeholder="e.g., Spring Clearance Event"
                  />
                </div>
                <div>
                  <Label>URL Slug</Label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">/p/</span>
                    <Input
                      value={slug}
                      onChange={(e) => setSlug(generateSlug(e.target.value))}
                      placeholder="spring-clearance"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Headline</Label>
                  <Input
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Main headline"
                  />
                </div>
                <div>
                  <Label>Subheadline</Label>
                  <Input
                    value={subheadline}
                    onChange={(e) => setSubheadline(e.target.value)}
                    placeholder="Supporting text"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Page body text..."
                    rows={4}
                  />
                </div>
                <Separator />
                <div>
                  <Label>Call-to-Action Button</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Input
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      placeholder="Button text"
                    />
                    <Input
                      value={ctaLink}
                      onChange={(e) => setCtaLink(e.target.value)}
                      placeholder="Link URL"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Key Features / Highlights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}.</span>
                    <Input
                      value={f}
                      onChange={(e) => updateFeature(i, e.target.value)}
                      placeholder="e.g., 0% APR financing available"
                      className="flex-1"
                    />
                    {features.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => removeFeature(i)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addFeature} className="w-full mt-2">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Feature
                </Button>
              </CardContent>
            </Card>

            {/* Vehicle selector (for vehicle-showcase template) */}
            {selectedTemplate === "vehicle-showcase" && vehicles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Featured Vehicle</CardTitle>
                </CardHeader>
                <CardContent>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select a vehicle...</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.year} {v.make} {v.model} {v.trim} — ${v.price?.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Page Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Contact Form</p>
                    <p className="text-xs text-muted-foreground">Show a lead capture form</p>
                  </div>
                  <Switch checked={showContactForm} onCheckedChange={setShowContactForm} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Map & Directions</p>
                    <p className="text-xs text-muted-foreground">Show dealership location</p>
                  </div>
                  <Switch checked={showMap} onCheckedChange={setShowMap} />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleSave("draft")}
                disabled={!title.trim()}
              >
                Save as Draft
              </Button>
              <Button
                className="flex-1 gradient-primary text-white"
                onClick={() => handleSave("published")}
                disabled={!title.trim()}
              >
                <Globe className="h-4 w-4 mr-2" />
                Publish
              </Button>
            </div>
          </div>

          {/* Right: Live preview */}
          <div className="hidden lg:block">
            <div className="sticky top-4">
              <p className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-1">
                <Eye className="h-3 w-3" /> Live Preview
              </p>
              <Card className="overflow-hidden">
                <div className="bg-muted/50 border-b px-3 py-1.5 flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-red-400" />
                    <div className="h-2 w-2 rounded-full bg-yellow-400" />
                    <div className="h-2 w-2 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 bg-background rounded px-2 py-0.5 text-[10px] text-muted-foreground font-mono">
                    /p/{slug || "your-page"}
                  </div>
                </div>
                <div className="max-h-[70vh] overflow-y-auto">
                  <LandingPagePreview
                    page={{
                      id: "preview",
                      dealership_id: dealership?.id || "",
                      slug,
                      title,
                      template: selectedTemplate!,
                      status: "draft",
                      hero_image_url: null,
                      headline,
                      subheadline,
                      cta_text: ctaText,
                      cta_link: ctaLink,
                      description,
                      brand_colors: dealership?.brand_colors || {
                        primary: "#003366",
                        secondary: "#FFFFFF",
                        accent: "#FF8C00",
                      },
                      dealership_name: dealership?.name || "Your Dealership",
                      dealership_phone: dealership?.contact.phone || "",
                      dealership_address: dealership?.contact.address || "",
                      dealership_website: dealership?.contact.website || "",
                      features: features.filter((f) => f.trim()),
                      show_contact_form: showContactForm,
                      show_map: showMap,
                      custom_css: "",
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    }}
                  />
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Inline preview component that renders the landing page */
function LandingPagePreview({ page }: { page: LandingPage }) {
  const { primary, secondary, accent } = page.brand_colors;

  return (
    <div className="bg-white text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Hero */}
      <div
        className="relative px-6 py-16 text-center"
        style={{
          background: `linear-gradient(135deg, ${primary}, ${primary}dd)`,
          color: secondary,
        }}
      >
        <p className="text-sm font-medium uppercase tracking-widest opacity-80 mb-3">
          {page.dealership_name}
        </p>
        <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">
          {page.headline || "Your Headline Here"}
        </h1>
        <p className="text-lg opacity-90 max-w-xl mx-auto mb-6">
          {page.subheadline || "Your subheadline goes here"}
        </p>
        {page.cta_text && (
          <button
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-base transition-transform hover:scale-105"
            style={{ backgroundColor: accent, color: "#fff" }}
          >
            {page.cta_text}
            <ExternalLink className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Vehicle (if present) */}
      {page.vehicle && (
        <div className="px-6 py-10 bg-gray-50">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-gray-500 mb-1">
              Featured Vehicle
            </p>
            <h2 className="text-2xl font-bold mb-1">
              {page.vehicle.year} {page.vehicle.make} {page.vehicle.model}
            </h2>
            <p className="text-gray-600 mb-4">{page.vehicle.trim}</p>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-500">Price</p>
                <p className="text-lg font-bold" style={{ color: primary }}>
                  ${page.vehicle.price.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-500">Mileage</p>
                <p className="text-lg font-bold">
                  {page.vehicle.mileage.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-500">Stock #</p>
                <p className="text-lg font-bold">{page.vehicle.stock_number}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features */}
      {page.features.length > 0 && (
        <div className="px-6 py-10">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-center mb-6">
              {page.template === "service-special"
                ? "What's Included"
                : page.template === "financing-offer"
                ? "Financing Highlights"
                : "Why Choose This Deal"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {page.features.map((feature, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border p-4"
                >
                  <CheckCircle2
                    className="h-5 w-5 shrink-0 mt-0.5"
                    style={{ color: accent }}
                  />
                  <p className="text-sm">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      {page.description && (
        <div className="px-6 py-8 bg-gray-50">
          <div className="max-w-2xl mx-auto">
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
              {page.description}
            </p>
          </div>
        </div>
      )}

      {/* Contact form */}
      {page.show_contact_form && (
        <div className="px-6 py-10">
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-bold text-center mb-6">
              Interested? Get in Touch
            </h2>
            <div className="space-y-3">
              <input
                className="w-full rounded-lg border px-4 py-2.5 text-sm bg-gray-50"
                placeholder="Full Name"
                readOnly
              />
              <input
                className="w-full rounded-lg border px-4 py-2.5 text-sm bg-gray-50"
                placeholder="Email Address"
                readOnly
              />
              <input
                className="w-full rounded-lg border px-4 py-2.5 text-sm bg-gray-50"
                placeholder="Phone Number"
                readOnly
              />
              <textarea
                className="w-full rounded-lg border px-4 py-2.5 text-sm bg-gray-50"
                placeholder="Message (optional)"
                rows={3}
                readOnly
              />
              <button
                className="w-full py-3 rounded-lg font-semibold text-white text-sm"
                style={{ backgroundColor: primary }}
              >
                Submit Inquiry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map / contact info */}
      {page.show_map && (
        <div
          className="px-6 py-8"
          style={{ backgroundColor: `${primary}08` }}
        >
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-xl font-bold mb-4">Visit Us</h2>
            <div className="bg-gray-200 rounded-lg h-40 flex items-center justify-center mb-4">
              <p className="text-gray-500 text-sm">Map loads here</p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
              {page.dealership_address && (
                <span>{page.dealership_address}</span>
              )}
              {page.dealership_phone && (
                <span>{page.dealership_phone}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        className="px-6 py-6 text-center text-sm"
        style={{ backgroundColor: primary, color: `${secondary}99` }}
      >
        <p className="font-semibold" style={{ color: secondary }}>
          {page.dealership_name}
        </p>
        <p className="mt-1 text-xs opacity-60">
          {page.dealership_address}
          {page.dealership_phone ? ` · ${page.dealership_phone}` : ""}
        </p>
        <p className="mt-2 text-[10px] opacity-40">
          Powered by DealerAdGen AI
        </p>
      </div>
    </div>
  );
}
