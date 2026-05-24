"use client";

import { useEffect, useMemo, useState } from "react";
import { Code2, Copy, Save, Loader2, MessageCircle, Car, CalendarClock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { WidgetSettings } from "@/lib/types";

type WidgetKey = "chat" | "trade-in" | "book";

const WIDGETS: { key: WidgetKey; label: string; icon: typeof MessageCircle; settingKey: keyof WidgetSettings; desc: string; inline: boolean }[] = [
  { key: "chat", label: "AI Chat Bubble", icon: MessageCircle, settingKey: "chat_enabled", desc: "Floating concierge that answers inventory questions and captures leads.", inline: false },
  { key: "trade-in", label: "Trade-In Estimator", icon: Car, settingKey: "trade_in_enabled", desc: "Instant ballpark trade value form that creates a lead.", inline: true },
  { key: "book", label: "Test-Drive Booking", icon: CalendarClock, settingKey: "booking_enabled", desc: "Vehicle + time picker that creates an appointment.", inline: true },
];

export default function WidgetsSettingsPage() {
  const { dealership, setDealership } = useAppStore();
  const [settings, setSettings] = useState<WidgetSettings>({});
  const [saving, setSaving] = useState(false);
  const [previewWidget, setPreviewWidget] = useState<WidgetKey>("chat");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (dealership?.widget_settings) setSettings(dealership.widget_settings);
  }, [dealership]);

  const slug = dealership?.slug ?? "";

  const isEnabled = (k: keyof WidgetSettings) => settings[k] !== false; // default on

  const snippet = (w: typeof WIDGETS[number]) => {
    const base = `<script src="${origin}/embed.js" data-dealer="${slug}" data-widget="${w.key}"`;
    return w.inline ? `${base} data-mode="inline"></script>` : `${base}></script>`;
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => toast.success("Snippet copied"),
      () => toast.error("Copy failed")
    );
  };

  async function save() {
    if (!dealership) return;
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("dealerships")
      .update({ widget_settings: settings, updated_at: new Date().toISOString() })
      .eq("id", dealership.id)
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast.error("Failed to save widget settings");
    } else if (data) {
      setDealership(data);
      toast.success("Widget settings saved");
    }
  }

  const previewSrc = useMemo(
    () => (origin && slug ? `${origin}/embed/${slug}/${previewWidget}` : ""),
    [origin, slug, previewWidget]
  );

  if (!dealership) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight flex items-center gap-2">
          <Code2 className="h-6 w-6 text-primary" />
          Website Widgets
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Embed lead-capture tools on your own website. Paste one snippet — leads flow into your dashboard.
        </p>
      </div>

      {/* Toggles + greeting */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enabled widgets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {WIDGETS.map((w) => {
            const Icon = w.icon;
            return (
              <div key={w.key} className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{w.label}</p>
                    <p className="text-xs text-muted-foreground">{w.desc}</p>
                  </div>
                </div>
                <Switch
                  checked={isEnabled(w.settingKey)}
                  onCheckedChange={(v) => setSettings((s) => ({ ...s, [w.settingKey]: v }))}
                />
              </div>
            );
          })}

          <div className="pt-2">
            <Label htmlFor="greeting" className="text-xs">Chat greeting</Label>
            <Input
              id="greeting"
              className="mt-1"
              placeholder="Hi! 👋 What kind of vehicle are you looking for?"
              value={settings.chat_greeting ?? ""}
              onChange={(e) => setSettings((s) => ({ ...s, chat_greeting: e.target.value }))}
            />
          </div>

          <Button onClick={save} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save settings
          </Button>
        </CardContent>
      </Card>

      {/* Install snippets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Install code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {WIDGETS.filter((w) => isEnabled(w.settingKey)).map((w) => (
            <div key={w.key}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium">{w.label}</p>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => copy(snippet(w))}>
                  <Copy className="h-3 w-3" /> Copy
                </Button>
              </div>
              <pre className="overflow-x-auto rounded-md bg-muted p-3 text-[11px] leading-relaxed">
                <code>{snippet(w)}</code>
              </pre>
              {w.inline && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Inline widget — it renders where you place the script (or set <code>data-target=&quot;#selector&quot;</code>).
                </p>
              )}
            </div>
          ))}
          {WIDGETS.every((w) => !isEnabled(w.settingKey)) && (
            <p className="text-sm text-muted-foreground">Enable a widget above to get its install snippet.</p>
          )}
        </CardContent>
      </Card>

      {/* Live preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            Live preview
            {previewSrc && (
              <a
                href={previewSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-normal text-primary inline-flex items-center gap-1"
              >
                Open <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-3">
            {WIDGETS.map((w) => (
              <Button
                key={w.key}
                variant={previewWidget === w.key ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => setPreviewWidget(w.key)}
              >
                {w.label}
              </Button>
            ))}
          </div>
          <div className="rounded-lg border bg-white overflow-hidden" style={{ height: 600 }}>
            {previewSrc ? (
              <iframe key={previewSrc} src={previewSrc} title="Widget preview" className="h-full w-full border-0" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Preview unavailable
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
