"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Activity,
  Filter,
  Users,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ACTION_LABELS,
  ACTION_ICONS,
  type ActivityEvent,
  type ActivityAction,
} from "@/lib/activity";
import { getActivityEvents } from "@/lib/db/activity";
import { useAppStore } from "@/lib/store";
import { CONTENT_TYPES, CHANNEL_PRESETS } from "@/lib/constants";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function contentTypeLabel(id: string): string {
  return CONTENT_TYPES.find((t) => t.id === id)?.name || id;
}

function channelLabel(id: string): string {
  return CHANNEL_PRESETS.find((c) => c.id === id)?.name || id;
}

type FilterType = "all" | "images" | "vehicles" | "pages" | "settings";

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All Activity" },
  { value: "images", label: "Images" },
  { value: "vehicles", label: "Vehicles" },
  { value: "pages", label: "Landing Pages" },
  { value: "settings", label: "Settings & Templates" },
];

const ENTITY_FILTER_MAP: Record<FilterType, string[]> = {
  all: [],
  images: ["asset"],
  vehicles: ["vehicle"],
  pages: ["landing_page"],
  settings: ["settings", "template"],
};

export default function ActivityPage() {
  const { dealership } = useAppStore();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [showCount, setShowCount] = useState(30);

  useEffect(() => {
    if (!dealership) return;
    getActivityEvents(dealership.id).then(setEvents).catch(console.error);
  }, [dealership]);

  // Unique users
  const users = useMemo(() => {
    const map = new Map<string, string>();
    events.forEach((e) => map.set(e.user_id, e.user_name));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [events]);

  // Filtered events
  const filtered = useMemo(() => {
    let result = events;
    if (filter !== "all") {
      const types = ENTITY_FILTER_MAP[filter];
      result = result.filter((e) => types.includes(e.entity_type));
    }
    if (userFilter !== "all") {
      result = result.filter((e) => e.user_id === userFilter);
    }
    return result;
  }, [events, filter, userFilter]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: { date: string; events: ActivityEvent[] }[] = [];
    const visible = filtered.slice(0, showCount);
    let currentDate = "";

    visible.forEach((event) => {
      const date = formatDate(event.created_at);
      if (date !== currentDate) {
        currentDate = date;
        groups.push({ date, events: [event] });
      } else {
        groups[groups.length - 1].events.push(event);
      }
    });

    return groups;
  }, [filtered, showCount]);

  // Stats
  const todayCount = events.filter(
    (e) => formatDate(e.created_at) === "Today"
  ).length;
  const weekCount = events.filter(
    (e) => Date.now() - new Date(e.created_at).getTime() < 7 * 86400000
  ).length;

  function renderEventDetail(event: ActivityEvent) {
    const d = event.details;
    const parts: string[] = [];

    if (d.content_type) parts.push(contentTypeLabel(d.content_type as string));
    if (d.channel) parts.push(channelLabel(d.channel as string));
    if (d.vehicle) parts.push(d.vehicle as string);
    if (d.campaign) parts.push(`Campaign: ${d.campaign}`);
    if (d.template_name) parts.push(`"${d.template_name}"`);
    if (d.page_title) parts.push(`"${d.page_title}"`);
    if (d.preset) parts.push(`Preset: ${d.preset}`);
    if (d.variants) parts.push(`${d.variants} variants`);
    if (d.winner) parts.push(`Winner: ${d.winner}`);
    if (d.section) parts.push(d.section as string);
    if (d.edit_type) parts.push(d.edit_type as string);
    if (d.slug) parts.push(`/${d.slug}`);

    return parts.length > 0 ? (
      <span className="text-muted-foreground text-xs">
        {" — "}
        {parts.join(" · ")}
      </span>
    ) : null;
  }

  function getActionColor(action: ActivityAction): string {
    if (action.includes("generated") || action.includes("created"))
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    if (action.includes("edited") || action.includes("swapped") || action.includes("updated"))
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    if (action.includes("published") || action.includes("sold"))
      return "bg-green-500/10 text-green-600 dark:text-green-400";
    if (action.includes("favorited"))
      return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
    if (action.includes("deleted"))
      return "bg-red-500/10 text-red-600 dark:text-red-400";
    if (action.includes("downloaded"))
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
    return "bg-muted text-muted-foreground";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          Activity Feed
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track what your team has generated, edited, and published
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-lg">
              📊
            </div>
            <div>
              <p className="text-2xl font-bold">{events.length}</p>
              <p className="text-xs text-muted-foreground">Total Events</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center text-lg">
              📅
            </div>
            <div>
              <p className="text-2xl font-bold">{todayCount}</p>
              <p className="text-xs text-muted-foreground">Today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-lg">
              👥
            </div>
            <div>
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-xs text-muted-foreground">Team Members</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 mr-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">Filter:</span>
        </div>
        {FILTER_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            size="sm"
            variant={filter === opt.value ? "default" : "outline"}
            className="h-7 text-xs"
            onClick={() => setFilter(opt.value)}
          >
            {opt.label}
          </Button>
        ))}

        {users.length > 1 && (
          <>
            <div className="w-px h-7 bg-border mx-1" />
            <div className="flex items-center gap-1.5 mr-1">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <Button
              size="sm"
              variant={userFilter === "all" ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setUserFilter("all")}
            >
              Everyone
            </Button>
            {users.map((u) => (
              <Button
                key={u.id}
                size="sm"
                variant={userFilter === u.id ? "default" : "outline"}
                className="h-7 text-xs"
                onClick={() => setUserFilter(u.id)}
              >
                {u.name.split(" ")[0]}
              </Button>
            ))}
          </>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {grouped.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Activity className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                No activity yet. Start generating images to see your feed!
              </p>
            </CardContent>
          </Card>
        )}

        {grouped.map((group) => (
          <div key={group.date}>
            {/* Date header */}
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.date}
              </span>
              <div className="flex-1 border-t border-border" />
              <Badge variant="secondary" className="text-[10px]">
                {group.events.length} events
              </Badge>
            </div>

            {/* Events */}
            <div className="relative ml-4 border-l-2 border-border pl-6 space-y-3">
              {group.events.map((event) => (
                <div
                  key={event.id}
                  className="relative group"
                >
                  {/* Timeline dot */}
                  <div className="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 border-background bg-border flex items-center justify-center text-[8px]">
                    <span>{ACTION_ICONS[event.action]}</span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">
                          {event.user_name}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] px-1.5 py-0 ${getActionColor(event.action)}`}
                        >
                          {ACTION_LABELS[event.action]}
                        </Badge>
                        {renderEventDetail(event)}
                      </div>
                    </div>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                      {timeAgo(event.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Load more */}
        {filtered.length > showCount && (
          <div className="text-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCount((c) => c + 30)}
              className="gap-1"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              Show more ({filtered.length - showCount} remaining)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
