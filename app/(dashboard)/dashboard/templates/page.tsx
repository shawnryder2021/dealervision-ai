"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutTemplate, Sparkles, ArrowRight, ChevronDown, Wand2,
  Star, Search, Flame, Layers, Trash2, User,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CONTENT_TYPES, CHANNEL_PRESETS, STYLE_OPTIONS } from "@/lib/constants";
import { VehiclePickerModal } from "@/components/templates/VehiclePickerModal";
import type { StarterTemplate } from "@/lib/types";
import { toast } from "sonner";

type Scope = "all" | "platform" | "mine" | "favorites";
type Sort = "curated" | "popular" | "newest";

/** Build the Generate-page URL that prefills this template's settings. */
function buildUseUrl(t: StarterTemplate, vehicleId: string | null): string {
  const params = new URLSearchParams();
  if (t.channel) params.set("channel", t.channel);
  if (t.style) params.set("style", t.style);
  if (t.scene_location) params.set("scene", t.scene_location);
  if (t.headline) params.set("headline", t.headline);
  if (t.subheadline) params.set("subheadline", t.subheadline);
  if (t.cta) params.set("cta", t.cta);
  if (t.channels?.length) params.set("alsoChannels", t.channels.filter((c) => c !== t.channel).join(","));
  if (vehicleId) {
    params.set("vehicleId", vehicleId);
    params.set("autogen", "1");
  }
  params.set("templateId", t.id);
  return `/dashboard/create/${t.content_type}?${params.toString()}`;
}

/** use_count threshold for the Popular badge: top quartile, minimum 3 uses. */
function popularThreshold(templates: StarterTemplate[]): number {
  const counts = templates.map((t) => t.use_count).filter((c) => c > 0).sort((a, b) => b - a);
  if (counts.length === 0) return Infinity;
  const q = counts[Math.floor(counts.length / 4)] ?? counts[counts.length - 1];
  return Math.max(3, q);
}

export default function TemplatesGalleryPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<StarterTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<Scope>("all");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [sort, setSort] = useState<Sort>("curated");
  const [q, setQ] = useState("");
  const [fContentType, setFContentType] = useState("");
  const [fChannel, setFChannel] = useState("");
  const [fStyle, setFStyle] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pickerTemplate, setPickerTemplate] = useState<StarterTemplate | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/starter-templates");
      if (res.ok) setTemplates((await res.json()).templates ?? []);
    } catch {
      toast.error("Couldn't load templates");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    templates.forEach((t) => t.category && set.add(t.category));
    return ["All", ...Array.from(set).sort()];
  }, [templates]);

  const threshold = useMemo(() => popularThreshold(templates), [templates]);

  const visible = useMemo(() => {
    let list = templates;
    if (scope === "platform") list = list.filter((t) => !t.dealership_id);
    if (scope === "mine") list = list.filter((t) => !!t.dealership_id);
    if (scope === "favorites") list = list.filter((t) => t.favorited);
    if (activeCategory !== "All") list = list.filter((t) => t.category === activeCategory);
    if (fContentType) list = list.filter((t) => t.content_type === fContentType);
    if (fChannel) list = list.filter((t) => t.channel === fChannel || t.channels?.includes(fChannel));
    if (fStyle) list = list.filter((t) => t.style === fStyle);
    const needle = q.trim().toLowerCase();
    if (needle) {
      list = list.filter((t) =>
        [t.name, t.description, t.prompt_notes, t.collection]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle)
      );
    }
    const sorted = [...list];
    if (sort === "popular") sorted.sort((a, b) => b.use_count - a.use_count);
    if (sort === "newest") sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return sorted;
  }, [templates, scope, activeCategory, fContentType, fChannel, fStyle, q, sort]);

  /** Collections present among visible templates (rendered as sections first). */
  const collections = useMemo(() => {
    const map = new Map<string, StarterTemplate[]>();
    visible.forEach((t) => {
      if (t.collection) {
        map.set(t.collection, [...(map.get(t.collection) ?? []), t]);
      }
    });
    return map;
  }, [visible]);

  const uncollected = useMemo(() => visible.filter((t) => !t.collection), [visible]);

  async function toggleFavorite(t: StarterTemplate) {
    // Optimistic toggle
    setTemplates((prev) =>
      prev.map((x) => (x.id === t.id ? { ...x, favorited: !x.favorited } : x))
    );
    const res = await fetch(`/api/starter-templates/${t.id}/favorite`, {
      method: t.favorited ? "DELETE" : "POST",
    });
    if (!res.ok) {
      // Revert on failure
      setTemplates((prev) =>
        prev.map((x) => (x.id === t.id ? { ...x, favorited: t.favorited } : x))
      );
      toast.error("Couldn't update favorite");
    }
  }

  async function deleteOwn(t: StarterTemplate) {
    if (!confirm(`Delete your template "${t.name}"?`)) return;
    const res = await fetch(`/api/starter-templates/${t.id}`, { method: "DELETE" });
    if (res.ok) {
      setTemplates((prev) => prev.filter((x) => x.id !== t.id));
      toast.success("Template deleted");
    } else {
      toast.error("Couldn't delete template");
    }
  }

  function handleConfirm(t: StarterTemplate, vehicleId: string | null) {
    // Fire-and-forget usage tracking
    fetch(`/api/starter-templates/${t.id}/use`, { method: "POST" }).catch(() => {});
    setPickerTemplate(null);
    router.push(buildUseUrl(t, vehicleId));
  }

  function TemplateCard({ t }: { t: StarterTemplate }) {
    const isOpen = expanded === t.id;
    const isPopular = t.use_count >= threshold;
    const isMine = !!t.dealership_id;
    const packCount = t.channels?.length ? new Set([t.channel, ...t.channels].filter(Boolean)).size : 0;

    return (
      <Card className="overflow-hidden flex flex-col group">
        <div className="relative aspect-[4/5] bg-muted overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={t.preview_image_url}
            alt={t.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]"
          />
          <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
            {t.category && (
              <Badge className="bg-black/60 text-white border-0 text-[10px]">{t.category}</Badge>
            )}
            {isPopular && (
              <Badge className="bg-orange-500/90 text-white border-0 text-[10px]">
                <Flame className="h-3 w-3 mr-0.5" /> Popular
              </Badge>
            )}
            {packCount > 1 && (
              <Badge className="bg-primary/90 text-white border-0 text-[10px]">
                <Layers className="h-3 w-3 mr-0.5" /> Pack · {packCount} channels
              </Badge>
            )}
            {isMine && (
              <Badge className="bg-emerald-600/90 text-white border-0 text-[10px]">
                <User className="h-3 w-3 mr-0.5" /> Mine
              </Badge>
            )}
          </div>
          <button
            type="button"
            onClick={() => toggleFavorite(t)}
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
            title={t.favorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Star
              className={cn(
                "h-4 w-4",
                t.favorited ? "text-yellow-400 fill-yellow-400" : "text-white"
              )}
            />
          </button>
        </div>

        <CardContent className="p-4 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-heading font-semibold text-sm">{t.name}</h3>
            {isMine && (
              <button
                type="button"
                onClick={() => deleteOwn(t)}
                className="text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                title="Delete my template"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {t.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
          )}

          <div className="flex flex-wrap gap-1.5 mt-3">
            {t.channel && <Badge variant="secondary" className="text-[10px]">{t.channel}</Badge>}
            {t.style && <Badge variant="secondary" className="text-[10px]">{t.style}</Badge>}
            {t.scene_location && (
              <Badge variant="secondary" className="text-[10px]">{t.scene_location}</Badge>
            )}
          </div>

          {t.prompt_notes && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : t.id)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
                {isOpen ? "Hide prompt" : "See the prompt used"}
              </button>
              {isOpen && (
                <p className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-2.5 leading-relaxed whitespace-pre-wrap">
                  {t.prompt_notes}
                </p>
              )}
            </div>
          )}

          <Button className="w-full mt-4 mt-auto" onClick={() => setPickerTemplate(t)}>
            <Wand2 className="h-3.5 w-3.5 mr-1.5" />
            Use this template
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  const selectCls = "h-9 rounded-md border bg-background px-2 text-sm";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight flex items-center gap-2">
          <LayoutTemplate className="h-6 w-6 text-primary" />
          Template Gallery
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Pick a proven design, see the prompt behind it, then customize it for your
          own vehicle. You can also save your own best generations here.
        </p>
      </div>

      {/* Scope tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { id: "all", label: "All" },
            { id: "platform", label: "Platform" },
            { id: "mine", label: "My Templates" },
            { id: "favorites", label: "★ Favorites" },
          ] as { id: Scope; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setScope(tab.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-colors",
              scope === tab.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted/50"
            )}
          >
            {tab.label}
          </button>
        ))}

        {/* Sort */}
        <div className="ml-auto flex items-center gap-2">
          <select className={selectCls} value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="curated">Curated order</option>
            <option value="popular">Most popular</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-8"
          />
        </div>
        <select className={selectCls} value={fContentType} onChange={(e) => setFContentType(e.target.value)}>
          <option value="">All content types</option>
          {CONTENT_TYPES.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select className={selectCls} value={fChannel} onChange={(e) => setFChannel(e.target.value)}>
          <option value="">All channels</option>
          {CHANNEL_PRESETS.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select className={selectCls} value={fStyle} onChange={(e) => setFStyle(e.target.value)}>
          <option value="">All styles</option>
          {STYLE_OPTIONS.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Category chips */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                activeCategory === cat
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted/50"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Body */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-muted animate-pulse aspect-[4/5]" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-medium">
              {scope === "mine"
                ? "You haven't saved any templates yet"
                : scope === "favorites"
                  ? "No favorites yet"
                  : "No templates match"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {scope === "mine"
                ? "Generate something great, then hit “Save to Gallery” on the result."
                : scope === "favorites"
                  ? "Tap the star on any template to keep it here."
                  : "Try clearing the search or filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Collection sections */}
          {Array.from(collections.entries()).map(([name, items]) => (
            <div key={name} className="space-y-3">
              <h2 className="font-heading font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> {name}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map((t) => <TemplateCard key={t.id} t={t} />)}
              </div>
            </div>
          ))}

          {/* Main grid */}
          {uncollected.length > 0 && (
            <div className="space-y-3">
              {collections.size > 0 && (
                <h2 className="font-heading font-semibold text-muted-foreground">All templates</h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {uncollected.map((t) => <TemplateCard key={t.id} t={t} />)}
              </div>
            </div>
          )}
        </div>
      )}

      <VehiclePickerModal
        template={pickerTemplate}
        open={!!pickerTemplate}
        onOpenChange={(o) => !o && setPickerTemplate(null)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
