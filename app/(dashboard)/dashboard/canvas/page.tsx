"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Palette, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface Design {
  id: string;
  name: string;
  kind: "template" | "draft";
  thumbnail_url: string | null;
  canvas_size: string;
  canvas_width: number;
  canvas_height: number;
  updated_at: string;
}

export default function CanvasGalleryPage() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "template" | "draft">("all");

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/canvas-templates");
    if (res.ok) {
      const data = await res.json();
      setDesigns(data.designs || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    if (!confirm("Delete this design?")) return;
    const res = await fetch(`/api/canvas-templates/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Deleted");
      load();
    } else {
      toast.error("Failed");
    }
  };

  const filtered = filter === "all" ? designs : designs.filter((d) => d.kind === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Palette className="h-6 w-6 text-primary" />
            Design Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Layered editor for text overlays, dealership badges, and reusable templates.
          </p>
        </div>
        <Link href="/dashboard/canvas/new" className={buttonVariants({ variant: "default" })}>
          <Plus className="h-4 w-4 mr-1" /> New Design
        </Link>
      </div>

      <div className="flex gap-2 text-sm">
        {(["all", "draft", "template"] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "ghost"}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f === "template" ? "Templates" : "Drafts"} (
            {f === "all" ? designs.length : designs.filter((d) => d.kind === f).length})
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="pt-10 pb-10 text-center text-sm text-muted-foreground">
            <Palette className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No designs yet.</p>
            <Link href="/dashboard/canvas/new" className={`${buttonVariants({ variant: "default" })} mt-4`}>
              <Plus className="h-4 w-4 mr-1" /> Create your first design
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((d) => (
            <Card key={d.id} className="group overflow-hidden">
              <Link href={`/dashboard/canvas/${d.id}`}>
                <div
                  className="bg-muted flex items-center justify-center"
                  style={{ aspectRatio: `${d.canvas_width} / ${d.canvas_height}` }}
                >
                  {d.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.thumbnail_url} alt={d.name} className="w-full h-full object-cover" />
                  ) : (
                    <Palette className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
              </Link>
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/dashboard/canvas/${d.id}`} className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{d.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.kind === "template" ? "Template" : "Draft"} · {d.canvas_size}
                    </p>
                  </Link>
                  <Button size="icon-xs" variant="ghost" onClick={() => remove(d.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
