"use client";

import { useState, useEffect } from "react";
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
import { Facebook, Instagram, Twitter, Send, Loader } from "lucide-react";
import { toast } from "sonner";
import type { GeneratedAsset } from "@/lib/types";

interface SocialAccount {
  id: string;
  provider: "facebook" | "instagram" | "twitter";
  account_name: string;
}

interface SocialPublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: GeneratedAsset;
}

export function SocialPublishDialog({
  open,
  onOpenChange,
  asset,
}: SocialPublishDialogProps) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(
    new Set()
  );
  const [caption, setCaption] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (open) {
      loadAccounts();
    }
  }, [open]);

  async function loadAccounts() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/social/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      toast.error("Failed to load social accounts");
    } finally {
      setIsLoading(false);
    }
  }

  function toggleAccount(accountId: string) {
    const next = new Set(selectedAccounts);
    if (next.has(accountId)) {
      next.delete(accountId);
    } else {
      next.add(accountId);
    }
    setSelectedAccounts(next);
  }

  async function handlePublish() {
    if (selectedAccounts.size === 0) {
      toast.error("Select at least one social account");
      return;
    }

    if (!asset.image_url) {
      toast.error("Asset has no image");
      return;
    }

    setIsPublishing(true);
    try {
      const res = await fetch("/api/social/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_id: asset.id,
          image_url: asset.image_url,
          caption,
          account_ids: Array.from(selectedAccounts),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to publish");
      }

      const result = await res.json();
      toast.success(
        `Published to ${result.successful} account${result.successful !== 1 ? "s" : ""}`
      );

      onOpenChange(false);
      setCaption("");
      setSelectedAccounts(new Set());
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to publish asset"
      );
    } finally {
      setIsPublishing(false);
    }
  }

  const getIcon = (provider: string) => {
    switch (provider) {
      case "facebook":
        return <Facebook className="h-4 w-4" />;
      case "instagram":
        return <Instagram className="h-4 w-4" />;
      case "twitter":
        return <Twitter className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish to Social Media</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (accounts.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish to Social Media</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center space-y-4">
            <p className="text-muted-foreground">No social accounts connected</p>
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = "/dashboard/settings/social-accounts";
              }}
            >
              Connect Social Accounts
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Publish to Social Media</DialogTitle>
          <DialogDescription>
            Select platforms and add a caption for this asset
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview */}
          {asset.image_url && (
            <div className="rounded-lg overflow-hidden border">
              <img
                src={asset.image_url}
                alt="Preview"
                className="w-full max-h-32 object-cover"
              />
            </div>
          )}

          {/* Select Accounts */}
          <div className="space-y-2">
            <Label>Select Accounts</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center space-x-2 p-2 rounded border hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    id={account.id}
                    checked={selectedAccounts.has(account.id)}
                    onChange={() => toggleAccount(account.id)}
                    className="h-4 w-4"
                  />
                  <label
                    htmlFor={account.id}
                    className="flex items-center gap-2 flex-1 cursor-pointer"
                  >
                    {getIcon(account.provider)}
                    <span className="text-sm font-medium">
                      {account.account_name}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="caption">Caption (optional)</Label>
            <Textarea
              id="caption"
              placeholder="Add a caption for your post..."
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {caption.length}/500 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              disabled={selectedAccounts.size === 0 || isPublishing}
              className="flex-1 gradient-primary text-white"
            >
              {isPublishing ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Publish
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
