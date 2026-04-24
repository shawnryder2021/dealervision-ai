"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Send, CalendarClock, Megaphone, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import type { GeneratedAsset } from "@/lib/types";
import { logActivity } from "@/lib/db/activity";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const CHANNELS = ["facebook", "instagram", "twitter", "email"] as const;
type Channel = (typeof CHANNELS)[number];
type PublishStatus = "idle" | "queued" | "retrying" | "sent" | "failed";

interface SocialAccount {
  id: string;
  provider: "facebook" | "instagram" | "twitter";
  account_name: string;
}

export default function UnifiedPublishPage() {
  const { dealership, profile, recentAssets } = useAppStore();
  const [assets, setAssets] = useState<GeneratedAsset[]>(recentAssets);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<Set<Channel>>(new Set());
  const [caption, setCaption] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailHeadline, setEmailHeadline] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statuses, setStatuses] = useState<Record<Channel, PublishStatus>>({
    facebook: "idle",
    instagram: "idle",
    twitter: "idle",
    email: "idle",
  });

  const scheduleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadAssets = useCallback(async () => {
    if (!dealership) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("generated_assets")
      .select("*")
      .eq("dealership_id", dealership.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (data) setAssets(data as GeneratedAsset[]);
  }, [dealership]);

  const loadSocialAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/social/accounts");
      if (!res.ok) return;
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch {
      // Non-blocking: per-channel validation handles this state.
    }
  }, []);

  useEffect(() => {
    if (!dealership) return;
    loadAssets();
    loadSocialAccounts();
    return () => {
      if (scheduleTimerRef.current) clearTimeout(scheduleTimerRef.current);
    };
  }, [dealership, loadAssets, loadSocialAccounts]);

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === selectedAssetId),
    [assets, selectedAssetId]
  );

  function toggleChannel(channel: Channel) {
    setSelectedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(channel)) next.delete(channel);
      else next.add(channel);
      return next;
    });
  }

  function setAllSelectedStatuses(status: PublishStatus) {
    setStatuses((prev) => {
      const next = { ...prev };
      selectedChannels.forEach((channel) => {
        next[channel] = status;
      });
      return next;
    });
  }

  function validateForSubmit(isSchedule: boolean): boolean {
    if (!dealership || !profile) {
      toast.error("Your dealership profile is still loading.");
      return false;
    }

    if (!selectedAsset) {
      toast.error("Pick an asset before publishing.");
      return false;
    }

    if (selectedChannels.size === 0) {
      toast.error("Select at least one channel.");
      return false;
    }

    const hasSocialChannel = ["facebook", "instagram", "twitter"].some((channel) =>
      selectedChannels.has(channel as Channel)
    );

    if (hasSocialChannel && !selectedAsset.image_url) {
      toast.error("Selected asset needs an image for social publishing.");
      return false;
    }

    if (hasSocialChannel && !caption.trim()) {
      toast.error("Add a caption for social channels.");
      return false;
    }

    if (selectedChannels.has("email")) {
      if (!emailSubject.trim() || !emailHeadline.trim() || !emailBody.trim()) {
        toast.error("Email needs subject, headline, and body.");
        return false;
      }
    }

    for (const channel of selectedChannels) {
      if (channel === "email") continue;
      const accountExists = accounts.some((account) => account.provider === channel);
      if (!accountExists) {
        toast.error(`Connect a ${channel} account before publishing.`);
        return false;
      }
    }

    if (isSchedule) {
      if (!scheduleAt) {
        toast.error("Choose a schedule date and time.");
        return false;
      }
      const scheduledDate = new Date(scheduleAt);
      if (Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
        toast.error("Schedule time must be in the future.");
        return false;
      }
    }

    return true;
  }

  async function publishSingleChannel(channel: Channel, retry = false) {
    if (!dealership || !profile || !selectedAsset) return;

    setStatuses((prev) => ({
      ...prev,
      [channel]: retry ? "retrying" : "retrying",
    }));

    try {
      if (channel === "email") {
        const res = await fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            template_id: "sales-announcement",
            subject: emailSubject,
            preview_text: "",
            headline: emailHeadline,
            email_body: emailBody,
            cta_text: "View inventory",
            cta_url: dealership.contact?.website || "",
            asset_id: selectedAsset.id,
            asset_url: selectedAsset.image_url,
            recipients: "all",
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Email send failed");
        }
      } else {
        const account = accounts.find((item) => item.provider === channel);
        if (!account || !selectedAsset.image_url) {
          throw new Error(`Missing ${channel} account or asset image`);
        }

        const res = await fetch("/api/social/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assetId: selectedAsset.id,
            accountId: account.id,
            caption,
            imageUrl: selectedAsset.image_url,
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || `${channel} publish failed`);
        }
      }

      setStatuses((prev) => ({ ...prev, [channel]: "sent" }));

      await logActivity({
        dealership_id: dealership.id,
        user_id: profile.id,
        user_name: profile.full_name || "Team Member",
        action: retry ? "retrying_publish" : "published_asset",
        entity_type: "asset",
        entity_id: selectedAsset.id,
        details: {
          channel,
          status: "sent",
          scheduled: false,
        },
      });

      toast.success(`${channel[0].toUpperCase()}${channel.slice(1)} sent`);
    } catch (error) {
      setStatuses((prev) => ({ ...prev, [channel]: "failed" }));

      await logActivity({
        dealership_id: dealership.id,
        user_id: profile.id,
        user_name: profile.full_name || "Team Member",
        action: "failed_publish",
        entity_type: "asset",
        entity_id: selectedAsset.id,
        details: {
          channel,
          status: "failed",
          reason: error instanceof Error ? error.message : "Unknown error",
        },
      });

      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to publish on ${channel}`
      );
    }
  }

  async function handlePublishNow() {
    if (!validateForSubmit(false)) return;
    setIsSubmitting(true);
    setAllSelectedStatuses("queued");
    await Promise.all(Array.from(selectedChannels).map((channel) => publishSingleChannel(channel)));
    setIsSubmitting(false);
  }

  async function handleSchedule() {
    if (!validateForSubmit(true) || !scheduleAt || !dealership || !profile || !selectedAsset) return;

    const scheduledDate = new Date(scheduleAt);
    const waitMs = Math.max(scheduledDate.getTime() - Date.now(), 0);
    setAllSelectedStatuses("queued");

    await logActivity({
      dealership_id: dealership.id,
      user_id: profile.id,
      user_name: profile.full_name || "Team Member",
      action: "queued_publish",
      entity_type: "asset",
      entity_id: selectedAsset.id,
      details: {
        channels: Array.from(selectedChannels).join(","),
        status: "queued",
        scheduled_for: scheduledDate.toISOString(),
      },
    });

    toast.success(`Scheduled for ${scheduledDate.toLocaleString()}`);

    if (scheduleTimerRef.current) clearTimeout(scheduleTimerRef.current);
    scheduleTimerRef.current = setTimeout(async () => {
      await Promise.all(Array.from(selectedChannels).map((channel) => publishSingleChannel(channel)));
    }, waitMs);
  }

  function statusVariant(status: PublishStatus): "default" | "secondary" | "destructive" {
    if (status === "sent") return "default";
    if (status === "failed") return "destructive";
    return "secondary";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" />
          Unified Publish Flow
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pick one asset, choose channels, and publish now or schedule for later.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1) Asset Picker</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedAssetId}
            onValueChange={(value) => setSelectedAssetId(value ?? "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an asset" />
            </SelectTrigger>
            <SelectContent>
              {assets.map((asset) => (
                <SelectItem key={asset.id} value={asset.id}>
                  {asset.content_type} · {asset.channel} · {new Date(asset.created_at).toLocaleDateString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedAsset?.image_url && (
            <Image
              src={selectedAsset.image_url}
              alt="Selected asset"
              width={720}
              height={320}
              className="mt-4 max-h-48 rounded-md border object-cover"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2) Channel Selector</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CHANNELS.map((channel) => {
              const isConnected =
                channel === "email" || accounts.some((account) => account.provider === channel);
              return (
                <Button
                  key={channel}
                  type="button"
                  variant={selectedChannels.has(channel) ? "default" : "outline"}
                  onClick={() => toggleChannel(channel)}
                  className="capitalize"
                  disabled={!isConnected}
                >
                  {channel}
                </Button>
              );
            })}
          </div>

          <div className="space-y-2">
            <Label htmlFor="caption">Social Caption</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write your social post caption"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="email-subject">Email Subject</Label>
              <Input
                id="email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Big Spring Savings Event"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-headline">Email Headline</Label>
              <Input
                id="email-headline"
                value={emailHeadline}
                onChange={(e) => setEmailHeadline(e.target.value)}
                placeholder="Fresh inventory just arrived"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-body">Email Body</Label>
            <Textarea
              id="email-body"
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder="Tell shoppers why this offer matters today."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3) Schedule or Send</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-sm">
            <Label htmlFor="schedule-at">Schedule Date & Time</Label>
            <Input
              id="schedule-at"
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <Button onClick={handlePublishNow} disabled={isSubmitting}>
              <Send className="h-4 w-4 mr-2" />
              Publish Now
            </Button>
            <Button variant="outline" onClick={handleSchedule}>
              <CalendarClock className="h-4 w-4 mr-2" />
              Schedule
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4) Publish Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {CHANNELS.filter((channel) => selectedChannels.has(channel)).map((channel) => (
            <div key={channel} className="flex items-center justify-between border rounded-md p-3">
              <p className="capitalize font-medium">{channel}</p>
              <div className="flex items-center gap-2">
                <Badge variant={statusVariant(statuses[channel])}>{statuses[channel]}</Badge>
                {statuses[channel] === "failed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => publishSingleChannel(channel, true)}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry
                  </Button>
                )}
              </div>
            </div>
          ))}
          {selectedChannels.size === 0 && (
            <p className="text-sm text-muted-foreground">No channels selected yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
