"use client";

import { useState } from "react";
import { Loader2, Pencil, Sparkles, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const QUICK_EDITS = [
  { label: "Red", prompt: "Change the vehicle color to red" },
  { label: "Black", prompt: "Change the vehicle color to black" },
  { label: "White", prompt: "Change the vehicle color to white" },
  { label: "Blue", prompt: "Change the vehicle color to blue" },
  { label: "Silver", prompt: "Change the vehicle color to silver" },
  { label: "Winter scene", prompt: "Place the vehicle in a winter snow scene with holiday decorations" },
  { label: "Summer vibes", prompt: "Place the vehicle in a bright summer setting with sunshine and palm trees" },
  { label: "Night cityscape", prompt: "Place the vehicle in a dramatic nighttime city setting with lights" },
  { label: "Studio white", prompt: "Place the vehicle on a clean white studio background" },
  { label: "Add price tag", prompt: "Add a bold price tag overlay showing the vehicle price" },
  { label: "Cinematic", prompt: "Make the image more dramatic with cinematic lighting and bold contrast" },
];

interface EditImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  aspectRatio?: string;
  onEditComplete: (newImageUrl: string) => void;
}

export function EditImageDialog({
  open,
  onOpenChange,
  imageUrl,
  aspectRatio = "1:1",
  onEditComplete,
}: EditImageDialogProps) {
  const [editPrompt, setEditPrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);

  async function handleEdit(prompt?: string) {
    const finalPrompt = prompt || editPrompt;
    if (!finalPrompt.trim()) {
      toast.error("Describe what you want to change");
      return;
    }

    setIsEditing(true);
    setEditedImageUrl(null);

    try {
      const res = await fetch("/api/edit-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          image_url: imageUrl,
          image_size: aspectRatio,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Edit failed");
      }

      const { taskId } = await res.json();
      await pollForResult(taskId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Edit failed";
      toast.error(msg);
      setIsEditing(false);
    }
  }

  async function pollForResult(taskId: string) {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      attempts++;
      try {
        const res = await fetch(`/api/edit-image?taskId=${taskId}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "completed" && data.output?.image_url) {
          setEditedImageUrl(data.output.image_url);
          setIsEditing(false);
          toast.success("Image edited successfully!");
          return;
        }

        if (data.status === "failed") {
          setIsEditing(false);
          toast.error(data.error || "Edit failed. Please try again.");
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        } else {
          setIsEditing(false);
          toast.error("Edit timed out.");
        }
      } catch {
        if (attempts < maxAttempts) setTimeout(poll, 5000);
      }
    };

    setTimeout(poll, 3000);
  }

  function handleApply() {
    if (editedImageUrl) {
      onEditComplete(editedImageUrl);
      setEditedImageUrl(null);
      setEditPrompt("");
      onOpenChange(false);
    }
  }

  function handleClose(val: boolean) {
    if (!isEditing) {
      setEditedImageUrl(null);
      setEditPrompt("");
      onOpenChange(val);
    }
  }

  // Checkered background pattern for transparent areas
  const checkeredBg = {
    backgroundImage:
      "linear-gradient(45deg, rgba(0,0,0,0.04) 25%, transparent 25%), linear-gradient(-45deg, rgba(0,0,0,0.04) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.04) 75%), linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.04) 75%)",
    backgroundSize: "20px 20px",
    backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[min(1200px,95vw)] w-full max-h-[92vh] p-0 gap-0 flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Pencil className="h-4 w-4 text-primary" />
            AI Edit Image
          </DialogTitle>
          <DialogDescription>
            Describe what you want to change — color, background, season, pricing, text, and more.
          </DialogDescription>
        </DialogHeader>

        {/* Body: image preview on top, controls below — scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Image preview area */}
          <div className="px-6 pt-6 pb-4 bg-muted/20 border-b border-border">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
              {/* Original */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Original
                  </p>
                </div>
                <div
                  className="rounded-xl overflow-hidden border border-border shadow-sm flex items-center justify-center"
                  style={checkeredBg}
                >
                  <img
                    src={imageUrl}
                    alt="Original"
                    className="max-w-full max-h-[50vh] w-auto h-auto object-contain"
                  />
                </div>
              </div>

              {/* Arrow divider */}
              <div className="hidden md:flex items-center justify-center">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ArrowRight className="h-5 w-5 text-primary" />
                </div>
              </div>

              {/* Edited / Result */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {isEditing ? "Generating…" : editedImageUrl ? "Edited" : "Result preview"}
                  </p>
                  {editedImageUrl && !isEditing && (
                    <span className="text-[10px] font-medium text-green-600 dark:text-green-500 uppercase tracking-wider">
                      ✓ Ready
                    </span>
                  )}
                </div>
                <div
                  className="rounded-xl overflow-hidden border border-border shadow-sm flex items-center justify-center min-h-[200px]"
                  style={checkeredBg}
                >
                  {isEditing ? (
                    <div className="flex flex-col items-center gap-3 py-12">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Applying edits…</p>
                      <p className="text-xs text-muted-foreground/70">This takes about 30 seconds</p>
                    </div>
                  ) : editedImageUrl ? (
                    <img
                      src={editedImageUrl}
                      alt="Edited"
                      className="max-w-full max-h-[50vh] w-auto h-auto object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-12 px-6 text-center">
                      <Sparkles className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">
                        Your edited image will appear here
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Controls area */}
          <div className="px-6 py-5 space-y-5">
            {/* Edit Prompt */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">What do you want to change?</Label>
              <Textarea
                placeholder='e.g., "Change the car color to midnight blue and add a snowy winter background"'
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                rows={2}
                disabled={isEditing}
                className="resize-none"
              />
            </div>

            {/* Quick Edit Chips */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Quick edits</Label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_EDITS.map((qe) => (
                  <button
                    key={qe.label}
                    onClick={() => {
                      setEditPrompt(qe.prompt);
                      handleEdit(qe.prompt);
                    }}
                    disabled={isEditing}
                    className="px-3 py-1.5 text-xs rounded-full border border-border bg-background hover:bg-primary/10 hover:border-primary/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {qe.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer: sticky action bar */}
        <div className="border-t border-border bg-background px-6 py-3 shrink-0 flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => handleClose(false)}
            disabled={isEditing}
          >
            Cancel
          </Button>
          {editedImageUrl && (
            <Button onClick={handleApply} className="gradient-primary text-white">
              <Sparkles className="h-4 w-4 mr-1.5" />
              Use Edited Image
            </Button>
          )}
          <Button
            onClick={() => handleEdit()}
            disabled={isEditing || !editPrompt.trim()}
            variant={editedImageUrl ? "outline" : "default"}
          >
            {isEditing ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Editing…
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4 mr-1.5" />
                {editedImageUrl ? "Edit Again" : "Apply Edit"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
