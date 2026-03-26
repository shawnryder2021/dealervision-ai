"use client";

import { useState } from "react";
import { Loader2, Pencil, Sparkles } from "lucide-react";
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
  { label: "Change color to red", prompt: "Change the vehicle color to red" },
  { label: "Change color to black", prompt: "Change the vehicle color to black" },
  { label: "Change color to white", prompt: "Change the vehicle color to white" },
  { label: "Change color to blue", prompt: "Change the vehicle color to blue" },
  { label: "Add winter scene", prompt: "Place the vehicle in a winter snow scene with holiday decorations" },
  { label: "Summer vibes", prompt: "Place the vehicle in a bright summer setting with sunshine and palm trees" },
  { label: "Night cityscape", prompt: "Place the vehicle in a dramatic nighttime city setting with lights" },
  { label: "Remove background", prompt: "Place the vehicle on a clean white studio background" },
  { label: "Add price tag", prompt: "Add a bold price tag overlay showing the vehicle price" },
  { label: "Make more dramatic", prompt: "Make the image more dramatic with cinematic lighting and bold contrast" },
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-primary" />
            Edit Image
          </DialogTitle>
          <DialogDescription>
            Describe what you want to change — color, background, season, pricing, text, and more.
          </DialogDescription>
        </DialogHeader>

        {/* Before / After Preview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Original</p>
            <div className="rounded-lg overflow-hidden border border-border">
              <img src={imageUrl} alt="Original" className="w-full" />
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              {isEditing ? "Generating..." : editedImageUrl ? "Edited" : "Result"}
            </p>
            <div className="rounded-lg overflow-hidden border border-border bg-muted/30 aspect-square flex items-center justify-center">
              {isEditing ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Applying edits...</p>
                </div>
              ) : editedImageUrl ? (
                <img src={editedImageUrl} alt="Edited" className="w-full" />
              ) : (
                <p className="text-xs text-muted-foreground text-center px-4">
                  Your edited image will appear here
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Edit Prompt */}
        <div className="space-y-2">
          <Label>What do you want to change?</Label>
          <Textarea
            placeholder='e.g., "Change the car color to midnight blue and add a snowy winter background"'
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            rows={2}
            disabled={isEditing}
          />
        </div>

        {/* Quick Edit Chips */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Quick Edits</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_EDITS.map((qe) => (
              <button
                key={qe.label}
                onClick={() => {
                  setEditPrompt(qe.prompt);
                  handleEdit(qe.prompt);
                }}
                disabled={isEditing}
                className="px-2.5 py-1 text-[11px] rounded-full border border-border bg-muted/30 hover:bg-primary/10 hover:border-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {qe.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 justify-end">
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
                Editing...
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
