"use client";

import { useState } from "react";
import { LayoutTemplate, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The completed asset image to use as the template preview. */
  imageUrl: string | null;
  /** Generation settings captured from the current form state. */
  settings: {
    content_type: string;
    channel?: string | null;
    style?: string;
    scene_location?: string;
    headline?: string;
    subheadline?: string;
    cta?: string;
  };
}

/**
 * Saves the active result + its settings as the dealer's own gallery template
 * (starter_templates row scoped to their dealership).
 */
export function SaveToGalleryDialog({ open, onOpenChange, imageUrl, settings }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!imageUrl) return;
    if (!name.trim()) {
      toast.error("Give your template a name");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/starter-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category: category.trim() || null,
          preview_image_url: imageUrl,
          content_type: settings.content_type,
          channel: settings.channel || null,
          style: settings.style || null,
          scene_location: settings.scene_location || null,
          headline: settings.headline || null,
          subheadline: settings.subheadline || null,
          cta: settings.cta || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      toast.success("Saved to your Template Gallery");
      setName("");
      setCategory("");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save template");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4 text-primary" />
            Save to Gallery
          </DialogTitle>
          <DialogDescription>
            Saves this image and its settings as a reusable template in your
            Template Gallery — pick it later for any vehicle.
          </DialogDescription>
        </DialogHeader>

        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Template preview"
            className="w-full rounded-lg border max-h-56 object-cover"
          />
        )}

        <div className="space-y-3">
          <div>
            <Label>Template name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sunset spotlight — trucks"
              maxLength={80}
            />
          </div>
          <div>
            <Label>Category (optional)</Label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Vehicle Spotlight"
              maxLength={40}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !imageUrl}>
            {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            Save template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
