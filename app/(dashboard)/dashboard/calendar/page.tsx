"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  ImageIcon,
  Clock,
  CheckCircle2,
  Send,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { getSeasonalSuggestions } from "@/lib/seasonal";
import type { SeasonalSuggestion } from "@/lib/seasonal";
import {
  getPlannedContent,
  addPlannedContent,
  deletePlannedContent,
  type PlannedContent,
} from "@/lib/planned-content";
import { CONTENT_TYPES, CHANNEL_PRESETS } from "@/lib/constants";
import type { GeneratedAsset } from "@/lib/types";

// ── Color mapping for content type dots ─────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  "vehicle-spotlight": "bg-blue-500",
  "sales-event": "bg-orange-500",
  "new-arrival": "bg-green-500",
  "price-drop": "bg-red-500",
  "service-promo": "bg-purple-500",
  "brand-post": "bg-teal-500",
  "financing": "bg-amber-500",
  "testimonial": "bg-pink-500",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  planned: <Clock className="h-3 w-3 text-muted-foreground" />,
  created: <CheckCircle2 className="h-3 w-3 text-blue-500" />,
  published: <Send className="h-3 w-3 text-green-500" />,
};

// ── Helpers ─────────────────────────────────────────────────────────────

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function contentTypeLabel(id: string): string {
  return CONTENT_TYPES.find((t) => t.id === id)?.name ?? id;
}

function channelLabel(id: string): string {
  return CHANNEL_PRESETS.find((c) => c.id === id)?.name ?? id;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Build an array of Date objects for the calendar grid (up to 42 cells / 6 weeks) */
function buildCalendarDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const startDay = first.getDay(); // 0=Sun
  const start = new Date(year, month, 1 - startDay);

  const days: Date[] = [];
  // Always produce 42 cells (6 rows)
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

/** Get seasonal events active on a specific date */
function getEventsForDate(date: Date): SeasonalSuggestion[] {
  return getSeasonalSuggestions(date, 20);
}

// ── Page Component ──────────────────────────────────────────────────────

export default function CalendarPage() {
  const { recentAssets, vehicles } = useAppStore();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [planned, setPlanned] = useState<PlannedContent[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [formDate, setFormDate] = useState("");
  const [formType, setFormType] = useState("");
  const [formChannel, setFormChannel] = useState("");
  const [formVehicle, setFormVehicle] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formStatus, setFormStatus] = useState<"planned" | "created" | "published">("planned");

  // Load planned content
  useEffect(() => {
    setPlanned(getPlannedContent());
  }, []);

  // ── Pre-computed asset map by date ──────────────────────────────────
  const assetsByDate = useMemo(() => {
    const map = new Map<string, GeneratedAsset[]>();
    for (const asset of recentAssets) {
      if (!asset.created_at) continue;
      const key = asset.created_at.slice(0, 10); // YYYY-MM-DD
      const arr = map.get(key);
      if (arr) arr.push(asset);
      else map.set(key, [asset]);
    }
    return map;
  }, [recentAssets]);

  // ── Pre-computed planned content map by date ────────────────────────
  const plannedByDate = useMemo(() => {
    const map = new Map<string, PlannedContent[]>();
    for (const item of planned) {
      const arr = map.get(item.date);
      if (arr) arr.push(item);
      else map.set(item.date, [item]);
    }
    return map;
  }, [planned]);

  // ── Calendar grid ───────────────────────────────────────────────────
  const calendarDays = useMemo(
    () => buildCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  // ── Navigation ──────────────────────────────────────────────────────
  const goToday = useCallback(() => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(toDateKey(today));
  }, []);

  const goPrev = useCallback(() => {
    setViewMonth((prev) => {
      if (prev === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const goNext = useCallback(() => {
    setViewMonth((prev) => {
      if (prev === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  // ── Plan content dialog ─────────────────────────────────────────────
  function openPlanDialog(dateStr?: string) {
    setFormDate(dateStr ?? toDateKey(today));
    setFormType("");
    setFormChannel("");
    setFormVehicle("");
    setFormNotes("");
    setFormStatus("planned");
    setDialogOpen(true);
  }

  function handleAddPlanned() {
    if (!formDate || !formType || !formChannel) return;
    const newItem = addPlannedContent({
      date: formDate,
      content_type: formType,
      channel: formChannel,
      vehicle_id: formVehicle || undefined,
      notes: formNotes,
      status: formStatus,
      asset_id: undefined,
    });
    setPlanned((prev) => [...prev, newItem]);
    setDialogOpen(false);
  }

  function handleDeletePlanned(id: string) {
    deletePlannedContent(id);
    setPlanned((prev) => prev.filter((p) => p.id !== id));
  }

  // ── Detail panel data ───────────────────────────────────────────────
  const selectedAssets = selectedDate ? assetsByDate.get(selectedDate) ?? [] : [];
  const selectedPlanned = selectedDate ? plannedByDate.get(selectedDate) ?? [] : [];
  const selectedEvents = selectedDate
    ? getEventsForDate(new Date(selectedDate + "T12:00:00"))
    : [];
  const selectedDateObj = selectedDate ? new Date(selectedDate + "T12:00:00") : null;

  const todayKey = toDateKey(today);

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            Content Calendar
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Plan, schedule, and track your dealership content across every channel
          </p>
        </div>
        <Button onClick={() => openPlanDialog()} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Plan Content
        </Button>
      </div>

      {/* ── Calendar + Detail layout ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Calendar card */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {/* Month nav */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <Button variant="ghost" size="icon" onClick={goPrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-heading font-semibold">
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </h2>
                <Button variant="outline" size="sm" onClick={goToday}>
                  Today
                </Button>
              </div>
              <Button variant="ghost" size="icon" onClick={goNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b">
              {DAY_HEADERS.map((d) => (
                <div
                  key={d}
                  className="py-2 text-center text-xs font-medium text-muted-foreground"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {calendarDays.map((date, idx) => {
                const key = toDateKey(date);
                const isCurrentMonth = date.getMonth() === viewMonth;
                const isToday = key === todayKey;
                const isSelected = key === selectedDate;
                const dayAssets = assetsByDate.get(key) ?? [];
                const dayPlanned = plannedByDate.get(key) ?? [];
                const dayEvents = getEventsForDate(date);

                // Only show events that are higher priority (not evergreen)
                const topEvents = dayEvents.filter((e) => e.priority >= 6).slice(0, 2);

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(key)}
                    className={`
                      relative min-h-[80px] p-1.5 border-b border-r text-left transition-colors
                      hover:bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary/50
                      ${!isCurrentMonth ? "bg-muted/30" : ""}
                      ${isSelected ? "ring-2 ring-primary/60 bg-primary/5" : ""}
                    `}
                  >
                    {/* Day number */}
                    <span
                      className={`
                        inline-flex items-center justify-center text-xs font-medium rounded-full
                        h-6 w-6
                        ${isToday ? "bg-primary text-primary-foreground" : ""}
                        ${!isCurrentMonth ? "text-muted-foreground/50" : "text-foreground"}
                      `}
                    >
                      {date.getDate()}
                    </span>

                    {/* Indicators row */}
                    <div className="mt-0.5 flex flex-wrap gap-0.5">
                      {/* Asset dots */}
                      {dayAssets.slice(0, 4).map((a) => (
                        <span
                          key={a.id}
                          className={`h-1.5 w-1.5 rounded-full ${TYPE_COLORS[a.content_type] ?? "bg-gray-400"}`}
                          title={contentTypeLabel(a.content_type)}
                        />
                      ))}
                      {dayAssets.length > 4 && (
                        <span className="text-[9px] text-muted-foreground leading-none">
                          +{dayAssets.length - 4}
                        </span>
                      )}
                    </div>

                    {/* Seasonal event badges */}
                    {isCurrentMonth && topEvents.length > 0 && (
                      <div className="mt-0.5 flex gap-0.5">
                        {topEvents.map((ev) => (
                          <span
                            key={ev.id}
                            className="text-[10px] leading-none"
                            title={ev.title}
                          >
                            {ev.emoji}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Planned content indicator */}
                    {dayPlanned.length > 0 && (
                      <div className="mt-0.5">
                        <span className="inline-block h-1 w-4 rounded-full bg-primary/60" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── Detail panel ─────────────────────────────────────────── */}
        <div className="space-y-4">
          {selectedDate && selectedDateObj ? (
            <>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-heading font-semibold">
                      {selectedDateObj.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPlanDialog(selectedDate)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Plan
                    </Button>
                  </div>

                  {/* Generated assets for this day */}
                  {selectedAssets.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Generated Assets ({selectedAssets.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedAssets.map((asset) => (
                          <div
                            key={asset.id}
                            className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                          >
                            {asset.image_url ? (
                              <img
                                src={asset.image_url}
                                alt=""
                                className="h-10 w-10 rounded object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium truncate">
                                {contentTypeLabel(asset.content_type)}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {channelLabel(asset.channel)}
                              </p>
                            </div>
                            <span
                              className={`h-2 w-2 rounded-full shrink-0 ${TYPE_COLORS[asset.content_type] ?? "bg-gray-400"}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Seasonal events active today */}
                  {selectedEvents.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Seasonal Events
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedEvents.map((ev) => (
                          <Badge
                            key={ev.id}
                            variant="secondary"
                            className="text-xs gap-1"
                          >
                            {ev.emoji} {ev.title}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Planned content */}
                  {selectedPlanned.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Planned Content ({selectedPlanned.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedPlanned.map((item) => (
                          <div
                            key={item.id}
                            className="p-2 rounded-md border bg-card"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span
                                    className={`h-2 w-2 rounded-full shrink-0 ${TYPE_COLORS[item.content_type] ?? "bg-gray-400"}`}
                                  />
                                  <span className="text-xs font-medium truncate">
                                    {contentTypeLabel(item.content_type)}
                                  </span>
                                  {STATUS_ICONS[item.status]}
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                  {channelLabel(item.channel)}
                                </p>
                                {item.notes && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {item.notes}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeletePlanned(item.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="mt-1.5">
                              <Badge
                                variant={
                                  item.status === "published"
                                    ? "default"
                                    : item.status === "created"
                                      ? "secondary"
                                      : "outline"
                                }
                                className="text-[10px] h-4"
                              >
                                {item.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {selectedAssets.length === 0 &&
                    selectedPlanned.length === 0 &&
                    selectedEvents.length === 0 && (
                      <div className="text-center py-6 text-muted-foreground">
                        <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">Nothing scheduled for this day</p>
                        <Button
                          variant="link"
                          size="sm"
                          className="mt-1"
                          onClick={() => openPlanDialog(selectedDate)}
                        >
                          Plan something
                        </Button>
                      </div>
                    )}
                </CardContent>
              </Card>

              {/* Legend */}
              <Card>
                <CardContent className="p-4">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Legend
                  </h4>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                    {Object.entries(TYPE_COLORS).map(([type, color]) => (
                      <div key={type} className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${color}`} />
                        <span className="text-[10px] text-muted-foreground truncate">
                          {contentTypeLabel(type)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Select a day</p>
                <p className="text-xs mt-1">
                  Click any date to see assets, events, and planned content
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── Plan Content Dialog ─────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Plan Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Date */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Date
              </label>
              <Input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>

            {/* Content Type */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Content Type
              </label>
              <Select value={formType} onValueChange={(v) => v && setFormType(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Channel */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Channel
              </label>
              <Select value={formChannel} onValueChange={(v) => v && setFormChannel(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  {CHANNEL_PRESETS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vehicle (optional) */}
            {vehicles.length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Vehicle (optional)
                </label>
                <Select value={formVehicle} onValueChange={(v) => v && setFormVehicle(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {[v.year, v.make, v.model].filter(Boolean).join(" ") || v.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Notes
              </label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="What should this post be about?"
                rows={3}
              />
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Status
              </label>
              <Select
                value={formStatus}
                onValueChange={(v) => setFormStatus(v as PlannedContent["status"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddPlanned}
                disabled={!formDate || !formType || !formChannel}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add to Calendar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
