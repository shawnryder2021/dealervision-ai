"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BookmarkPlus,
  Trash2,
  Clock,
  ArrowRight,
  FolderOpen,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CONTENT_TYPES, CHANNEL_PRESETS } from "@/lib/constants";
import {
  getTemplates,
  saveTemplate,
  deleteTemplate,
  recordTemplateUse,
} from "@/lib/templates";
import type { Template } from "@/lib/templates";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// === Template Gallery (shown on /dashboard/create) ===
export function TemplateGallery() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setTemplates(getTemplates());
  }, []);

  function handleUse(template: Template) {
    recordTemplateUse(template.id);
    // Navigate to create page with template params
    const params = new URLSearchParams();
    params.set("template", template.id);
    if (template.channel) params.set("channel", template.channel);
    if (template.style) params.set("style", template.style);
    if (template.headline) params.set("headline", template.headline);
    if (template.subheadline) params.set("subheadline", template.subheadline);
    if (template.cta) params.set("cta", template.cta);
    if (template.eventName) params.set("eventName", template.eventName);
    if (template.eventDates) params.set("eventDates", template.eventDates);
    if (template.offerDetails) params.set("offerDetails", template.offerDetails);
    if (template.serviceOffer) params.set("serviceOffer", template.serviceOffer);
    if (template.serviceDetails) params.set("serviceDetails", template.serviceDetails);
    if (template.customPrompt) params.set("customPrompt", template.customPrompt);
    if (template.campaign) params.set("campaign", template.campaign);
    router.push(
      `/dashboard/create/${template.contentType}?${params.toString()}`
    );
  }

  function handleDelete(id: string) {
    deleteTemplate(id);
    setTemplates(getTemplates());
    toast.success("Template deleted");
  }

  const displayed = showAll ? templates : templates.slice(0, 6);

  if (templates.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-primary" />
          <h2 className="font-heading text-lg font-semibold">Templates</h2>
        </div>
        {templates.length > 6 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-primary hover:underline"
          >
            {showAll ? "Show less" : `View all (${templates.length})`}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {displayed.map((t) => {
          const typeInfo = CONTENT_TYPES.find((c) => c.id === t.contentType);
          const channelInfo = CHANNEL_PRESETS.find((c) => c.id === t.channel);
          return (
            <Card
              key={t.id}
              className="glass glass-hover cursor-pointer group transition-all hover:scale-[1.02] hover:border-primary/30 relative"
              onClick={() => handleUse(t)}
            >
              <CardContent className="p-3 space-y-1.5">
                <div className="flex items-start justify-between">
                  <h4 className="text-xs font-semibold leading-tight line-clamp-2 pr-4">
                    {t.name}
                  </h4>
                  {!t.id.startsWith("default-") && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(t.id);
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-1">
                  {typeInfo?.name || t.contentType}
                </p>
                <p className="text-[10px] text-muted-foreground/70">
                  {channelInfo?.name || t.channel}
                </p>
                {t.usedCount > 0 && (
                  <p className="text-[9px] text-muted-foreground/50 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    Used {t.usedCount}x
                  </p>
                )}
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Use <ArrowRight className="h-2.5 w-2.5" />
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// === Save as Template Dialog (used from create/[type] page) ===
interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaults: {
    contentType: string;
    channel: string;
    style: string;
    headline?: string;
    subheadline?: string;
    cta?: string;
    eventName?: string;
    eventDates?: string;
    offerDetails?: string;
    serviceOffer?: string;
    serviceDetails?: string;
    customPrompt?: string;
    campaign?: string;
  };
}

export function SaveTemplateDialog({
  open,
  onOpenChange,
  defaults,
}: SaveTemplateDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      const typeInfo = CONTENT_TYPES.find((t) => t.id === defaults.contentType);
      const channelInfo = CHANNEL_PRESETS.find(
        (c) => c.id === defaults.channel
      );
      setName(
        `${typeInfo?.name || defaults.contentType} — ${channelInfo?.name || defaults.channel}`
      );
      setDescription("");
    }
  }, [open, defaults]);

  function handleSave() {
    if (!name.trim()) {
      toast.error("Give your template a name");
      return;
    }
    saveTemplate({
      name: name.trim(),
      description: description.trim(),
      ...defaults,
    });
    toast.success("Template saved!");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookmarkPlus className="h-4 w-4 text-primary" />
            Save as Template
          </DialogTitle>
          <DialogDescription>
            Save your current settings as a reusable template for one-click
            generation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Template Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summer Sale Instagram"
            />
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Quick note about when to use this template"
              rows={2}
            />
          </div>

          {/* Preview of what's saved */}
          <div className="rounded-lg bg-muted/30 border border-border p-3 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Settings saved
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
              <span className="text-muted-foreground">Type:</span>
              <span>
                {CONTENT_TYPES.find((t) => t.id === defaults.contentType)
                  ?.name || defaults.contentType}
              </span>
              <span className="text-muted-foreground">Channel:</span>
              <span>
                {CHANNEL_PRESETS.find((c) => c.id === defaults.channel)?.name ||
                  defaults.channel}
              </span>
              <span className="text-muted-foreground">Style:</span>
              <span className="capitalize">{defaults.style}</span>
              {defaults.headline && (
                <>
                  <span className="text-muted-foreground">Headline:</span>
                  <span className="truncate">{defaults.headline}</span>
                </>
              )}
              {defaults.cta && (
                <>
                  <span className="text-muted-foreground">CTA:</span>
                  <span className="truncate">{defaults.cta}</span>
                </>
              )}
              {defaults.campaign && (
                <>
                  <span className="text-muted-foreground">Campaign:</span>
                  <span className="truncate">{defaults.campaign}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="gradient-primary text-white"
            >
              <BookmarkPlus className="h-4 w-4 mr-1.5" />
              Save Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
