"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Brain, Sparkles, Save, Check, X, RefreshCw, Loader2, Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store";
import type { BrandMemory } from "@/lib/types";
import { toast } from "sonner";

const PREF_LABELS: Record<string, string> = {
  tones: "Tone",
  styles: "Visual style",
  channels: "Top channels",
  featured_models: "Featured vehicles",
  recurring_offers: "Recurring offers",
};

function PrefChips({ preferences }: { preferences?: BrandMemory["preferences"] }) {
  if (!preferences) return null;
  const entries = Object.entries(preferences).filter(
    ([, v]) => Array.isArray(v) && v.length > 0
  ) as [string, string[]][];
  if (entries.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {entries.map(([key, values]) => (
        <div key={key} className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground w-28 shrink-0">
            {PREF_LABELS[key] ?? key}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {values.map((v) => (
              <Badge key={v} variant="secondary" className="text-xs">{v}</Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BrandMemoryPage() {
  const { dealership, adminActiveDealership } = useAppStore();

  const [memory, setMemory] = useState<BrandMemory>({});
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingNotes, setSavingNotes] = useState(false);
  const [learning, setLearning] = useState(false);
  const [proposal, setProposal] = useState<BrandMemory | null>(null);
  const [approving, setApproving] = useState(false);

  const adminHeaders = useCallback((): Record<string, string> => {
    return adminActiveDealership ? { "X-Dealership-Id": adminActiveDealership.id } : {};
  }, [adminActiveDealership]);

  useEffect(() => {
    if (!dealership) return;
    (async () => {
      try {
        const res = await fetch("/api/brand-memory", { headers: adminHeaders() });
        if (res.ok) {
          const data = await res.json();
          const mem: BrandMemory = data.brand_memory ?? {};
          setMemory(mem);
          setNotes(mem.manual_notes ?? "");
        }
      } catch {
        // soft fail
      } finally {
        setLoading(false);
      }
    })();
  }, [dealership, adminHeaders]);

  async function saveNotes() {
    setSavingNotes(true);
    try {
      const res = await fetch("/api/brand-memory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...adminHeaders() },
        body: JSON.stringify({ manual_notes: notes }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save");
      const data = await res.json();
      setMemory(data.brand_memory);
      toast.success("Saved. This now informs every generation.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save notes");
    } finally {
      setSavingNotes(false);
    }
  }

  async function runLearning() {
    setLearning(true);
    setProposal(null);
    try {
      const res = await fetch("/api/brand-memory/learn", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...adminHeaders() },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Learning failed");
      setProposal(data.proposal);
      toast.success(`Analyzed ${data.analyzed} recent pieces`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't analyze activity");
    } finally {
      setLearning(false);
    }
  }

  async function approveProposal() {
    if (!proposal) return;
    setApproving(true);
    try {
      const res = await fetch("/api/brand-memory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...adminHeaders() },
        body: JSON.stringify({
          learned_summary: proposal.learned_summary,
          preferences: proposal.preferences,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to approve");
      const data = await res.json();
      setMemory(data.brand_memory);
      setProposal(null);
      toast.success("Approved. The platform will use this going forward.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't approve");
    } finally {
      setApproving(false);
    }
  }

  if (!dealership) {
    return <div className="p-6 text-muted-foreground">Loading dealership…</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          Brand Memory
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          What the platform knows about your dealership. This context is woven into
          every image, description, and caption you generate — so your marketing
          gets more on-brand over time.
        </p>
      </div>

      {/* How it works note */}
      <div className="flex items-start gap-2 bg-muted/50 rounded-lg px-4 py-3 text-sm text-muted-foreground">
        <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
        <span>
          Two ways the platform learns: <strong className="text-foreground">tell it directly</strong> below,
          and let it <strong className="text-foreground">learn from what you generate</strong>. Anything the
          AI proposes is shown to you for approval before it&apos;s used — nothing is applied behind your back.
        </span>
      </div>

      {/* Manual notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tell the AI about your dealership</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            placeholder={
              "e.g. We're a family-owned Ford dealer serving Halifax since 1998. Known for no-haggle pricing and our truck inventory. Friendly, down-to-earth tone — never pushy. We sponsor the local minor hockey league and run a 'Truck Month' promo every September."
            }
            maxLength={4000}
            className="resize-y"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{notes.length} / 4000</span>
            <Button onClick={saveNotes} disabled={savingNotes || loading} size="sm">
              {savingNotes ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Learned profile */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            What the platform has learned
          </CardTitle>
          <Button onClick={runLearning} disabled={learning} size="sm" variant="outline">
            {learning ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
            {learning ? "Analyzing…" : "Refresh learning"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current learned state */}
          {memory.learned_summary ? (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed">{memory.learned_summary}</p>
              <PrefChips preferences={memory.preferences} />
              {memory.updated_at && (
                <p className="text-xs text-muted-foreground">
                  Last updated {new Date(memory.updated_at).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nothing learned yet. Generate a few marketing pieces, then click
              &quot;Refresh learning&quot; and the AI will distill what it sees into a
              profile you can approve.
            </p>
          )}

          {/* Proposal review */}
          {proposal && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Proposed update — review &amp; approve</span>
              </div>
              <p className="text-sm leading-relaxed">{proposal.learned_summary}</p>
              <PrefChips preferences={proposal.preferences} />
              <div className="flex items-center gap-2 pt-1">
                <Button onClick={approveProposal} disabled={approving} size="sm">
                  {approving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}
                  Approve &amp; use
                </Button>
                <Button onClick={() => setProposal(null)} disabled={approving} size="sm" variant="ghost">
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  Dismiss
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
