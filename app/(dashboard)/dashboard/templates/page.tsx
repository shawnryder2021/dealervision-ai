"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutTemplate, Sparkles, ArrowRight, ChevronDown, Wand2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StarterTemplate } from "@/lib/types";
import { toast } from "sonner";

/** Build the Generate-page URL that prefills this template's settings. */
function buildUseUrl(t: StarterTemplate): string {
  const params = new URLSearchParams();
  if (t.channel) params.set("channel", t.channel);
  if (t.style) params.set("style", t.style);
  if (t.scene_location) params.set("scene", t.scene_location);
  if (t.headline) params.set("headline", t.headline);
  if (t.subheadline) params.set("subheadline", t.subheadline);
  if (t.cta) params.set("cta", t.cta);
  params.set("templateId", t.id);
  const qs = params.toString();
  return `/dashboard/create/${t.content_type}${qs ? `?${qs}` : ""}`;
}

export default function TemplatesGalleryPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<StarterTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/starter-templates");
        if (res.ok) {
          const data = await res.json();
          setTemplates(data.templates ?? []);
        }
      } catch {
        toast.error("Couldn't load templates");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    templates.forEach((t) => t.category && set.add(t.category));
    return ["All", ...Array.from(set).sort()];
  }, [templates]);

  const visible = useMemo(
    () =>
      activeCategory === "All"
        ? templates
        : templates.filter((t) => t.category === activeCategory),
    [templates, activeCategory]
  );

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
          own vehicle. Choosing a template prefills the generator — just add your
          vehicle and hit Generate.
        </p>
      </div>

      {/* Category filter */}
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

      {/* Grid */}
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
            <p className="font-medium">No templates yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Curated templates will appear here soon. In the meantime, head to{" "}
              <button
                onClick={() => router.push("/dashboard/create/vehicle-spotlight")}
                className="text-primary hover:underline"
              >
                Create
              </button>{" "}
              to generate from scratch.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((t) => {
            const isOpen = expanded === t.id;
            return (
              <Card key={t.id} className="overflow-hidden flex flex-col group">
                {/* Preview image */}
                <div className="relative aspect-[4/5] bg-muted overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.preview_image_url}
                    alt={t.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]"
                  />
                  {t.category && (
                    <Badge className="absolute top-2 left-2 bg-black/60 text-white border-0 text-[10px]">
                      {t.category}
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4 flex flex-col flex-1">
                  <h3 className="font-heading font-semibold text-sm">{t.name}</h3>
                  {t.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {t.description}
                    </p>
                  )}

                  {/* Setting badges */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {t.channel && (
                      <Badge variant="secondary" className="text-[10px]">{t.channel}</Badge>
                    )}
                    {t.style && (
                      <Badge variant="secondary" className="text-[10px]">{t.style}</Badge>
                    )}
                    {t.scene_location && (
                      <Badge variant="secondary" className="text-[10px]">{t.scene_location}</Badge>
                    )}
                  </div>

                  {/* Prompt-used disclosure */}
                  {t.prompt_notes && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : t.id)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ChevronDown
                          className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")}
                        />
                        {isOpen ? "Hide prompt" : "See the prompt used"}
                      </button>
                      {isOpen && (
                        <p className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-2.5 leading-relaxed whitespace-pre-wrap">
                          {t.prompt_notes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* CTA */}
                  <Button
                    className="w-full mt-4 mt-auto"
                    onClick={() => router.push(buildUseUrl(t))}
                  >
                    <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                    Use this template
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
