"use client";

import { useState } from "react";
import { Star, Copy, MessageCircle, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

const PLATFORMS = ["Google", "DealerRater", "Yelp", "Facebook", "Cars.com", "Edmunds"];

export default function ReviewReplyPage() {
  const { dealership } = useAppStore();
  const [review, setReview] = useState("");
  const [stars, setStars] = useState(5);
  const [platform, setPlatform] = useState("Google");
  const [reviewerName, setReviewerName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    if (!review.trim()) {
      toast.error("Paste the review first");
      return;
    }
    setBusy(true);
    setReply("");
    try {
      const res = await fetch("/api/review-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review, stars, platform, reviewerName, managerName, dealership }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setReply(data.reply);
      toast.success("Reply ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(reply);
    toast.success("Copied");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-primary" />
          Review Response Generator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Paste a public review. Get a brand-aligned reply with built-in compliance guardrails (no refund promises, no admissions of fault).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">The review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Platform</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v ?? "Google")}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Stars</Label>
              <div className="mt-1 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setStars(n)} type="button">
                    <Star className={`h-6 w-6 ${n <= stars ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Reviewer name</Label>
              <Input value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} placeholder="Sarah K." className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Review text</Label>
            <Textarea
              rows={6}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Paste the customer's review here…"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Sign as (optional)</Label>
            <Input
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              placeholder="e.g. Mike Rivera"
              className="mt-1"
            />
          </div>
          <Button onClick={generate} disabled={busy || !review.trim()}>
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Generate reply
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            Suggested reply
            {reply && (
              <Button size="sm" variant="ghost" onClick={copy}>
                <Copy className="h-4 w-4 mr-1" /> Copy
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={8}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Click 'Generate reply' to draft a response."
            className="text-sm"
          />
        </CardContent>
      </Card>
    </div>
  );
}
