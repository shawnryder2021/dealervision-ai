"use client";

import { useEffect, useState, useMemo } from "react";
import { Image as ImageIcon } from "lucide-react";
import { AssetGrid } from "@/components/library/AssetGrid";
import { AssetFilters } from "@/components/library/AssetFilters";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo-data";
import type { GeneratedAsset } from "@/lib/types";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, Pencil, Heart, Trash2, Type, CheckSquare, X, Package, FileText } from "lucide-react";
import { EditImageDialog } from "@/components/create/EditImageDialog";
import { TextOverlayEditor } from "@/components/create/TextOverlayEditor";
import { exportAsPDF } from "@/lib/pdf-export";

export default function LibraryPage() {
  const { dealership, recentAssets } = useAppStore();
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [search, setSearch] = useState("");
  const [contentType, setContentType] = useState("all");
  const [channel, setChannel] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedAsset, setSelectedAsset] = useState<GeneratedAsset | null>(null);
  const [editAsset, setEditAsset] = useState<GeneratedAsset | null>(null);
  const [textOverlayAsset, setTextOverlayAsset] = useState<GeneratedAsset | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    async function loadAssets() {
      if (!dealership) return;

      if (isDemoMode()) {
        setAssets(recentAssets);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from("generated_assets")
        .select("*")
        .eq("dealership_id", dealership.id)
        .order("created_at", { ascending: false });

      if (data) {
        // Merge in any store assets not yet in the DB result
        // (e.g. items just saved from BG swap / batch before this query ran)
        const dbIds = new Set((data as any[]).map((a: any) => a.id));
        const storeOnly = recentAssets.filter((a) => !dbIds.has(a.id));
        setAssets([...storeOnly, ...(data as any[])]);
      }
    }
    loadAssets();
  }, [dealership, recentAssets]);

  const filteredAssets = useMemo(() => {
    let result = [...assets];

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.content_type.toLowerCase().includes(lower) ||
          a.channel.toLowerCase().includes(lower) ||
          a.prompt.toLowerCase().includes(lower) ||
          a.campaign?.toLowerCase().includes(lower)
      );
    }

    if (contentType !== "all") {
      result = result.filter((a) => a.content_type === contentType);
    }

    if (channel !== "all") {
      result = result.filter((a) => a.channel === channel);
    }

    if (sortBy === "oldest") {
      result.reverse();
    } else if (sortBy === "favorites") {
      result.sort((a, b) => (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0));
    }

    return result;
  }, [assets, search, contentType, channel, sortBy]);

  async function handleFavorite(id: string) {
    const asset = assets.find((a) => a.id === id);
    if (!asset) return;

    if (isDemoMode()) {
      setAssets((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, is_favorite: !a.is_favorite } : a
        )
      );
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("generated_assets")
      .update({ is_favorite: !asset.is_favorite })
      .eq("id", id);

    if (!error) {
      setAssets((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, is_favorite: !a.is_favorite } : a
        )
      );
    }
  }

  async function handleDownload(asset: GeneratedAsset) {
    if (!asset.image_url) return;
    try {
      const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(asset.image_url)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${asset.content_type}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(asset.image_url, "_blank");
    }
  }

  async function handleDelete(id: string) {
    if (isDemoMode()) {
      setAssets((prev) => prev.filter((a) => a.id !== id));
      toast.success("Asset deleted (demo)");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("generated_assets")
      .delete()
      .eq("id", id);

    if (!error) {
      setAssets((prev) => prev.filter((a) => a.id !== id));
      toast.success("Asset deleted");
    } else {
      toast.error("Failed to delete asset");
    }
  }

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSelectAll() {
    setSelectedIds(new Set(filteredAssets.map((a) => a.id)));
  }

  function handleClearSelection() {
    setSelectedIds(new Set());
  }

  async function handleDownloadZip() {
    const selected = assets.filter((a) => selectedIds.has(a.id) && a.image_url);
    if (selected.length === 0) return;

    setIsZipping(true);
    setZipProgress({ current: 0, total: selected.length });

    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      for (let i = 0; i < selected.length; i++) {
        const asset = selected[i];
        try {
          const res = await fetch(`/api/download-proxy?url=${encodeURIComponent(asset.image_url!)}`);
          if (!res.ok) continue;
          const blob = await res.blob();
          const ext = blob.type.includes("png") ? "png" : "jpg";
          zip.file(`${asset.content_type}-${asset.channel}-${i + 1}.${ext}`, blob);
        } catch {
          // skip failed downloads
        }
        setZipProgress({ current: i + 1, total: selected.length });
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dealeradgen-assets-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${selected.length} assets as ZIP`);
    } catch {
      toast.error("Failed to create ZIP file");
    } finally {
      setIsZipping(false);
      setZipProgress({ current: 0, total: 0 });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-primary" />
            Asset Library
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {assets.length} generated visual{assets.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          variant={selectMode ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setSelectMode(!selectMode);
            if (selectMode) setSelectedIds(new Set());
          }}
        >
          <CheckSquare className="h-4 w-4 mr-1.5" />
          {selectMode ? "Done" : "Select"}
        </Button>
      </div>

      {selectMode && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button size="sm" variant="ghost" onClick={handleClearSelection}>
              Clear
            </Button>
          </div>
          <div className="flex-1" />
          {isZipping && (
            <div className="flex items-center gap-2 min-w-[200px]">
              <Progress value={(zipProgress.current / zipProgress.total) * 100} className="h-2" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {zipProgress.current}/{zipProgress.total}
              </span>
            </div>
          )}
          <Button
            size="sm"
            disabled={selectedIds.size === 0 || isZipping}
            onClick={handleDownloadZip}
          >
            <Package className="h-4 w-4 mr-1.5" />
            {isZipping ? "Zipping..." : `Download ZIP (${selectedIds.size})`}
          </Button>
        </div>
      )}

      <AssetFilters
        search={search}
        onSearchChange={setSearch}
        contentType={contentType}
        onContentTypeChange={setContentType}
        channel={channel}
        onChannelChange={setChannel}
        sortBy={sortBy}
        onSortByChange={setSortBy}
      />

      <AssetGrid
        assets={filteredAssets}
        onFavorite={handleFavorite}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onView={setSelectedAsset}
        onEdit={setEditAsset}
        selectMode={selectMode}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
      />

      <Dialog
        open={!!selectedAsset}
        onOpenChange={(open) => !open && setSelectedAsset(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {selectedAsset?.content_type.replace(/-/g, " ")}
            </DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <div className="space-y-4">
              {selectedAsset.image_url && (
                <img
                  src={selectedAsset.image_url}
                  alt={selectedAsset.content_type}
                  className="w-full rounded-lg"
                />
              )}
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize">
                  {selectedAsset.channel.replace(/-/g, " ")}
                </Badge>
                {selectedAsset.aspect_ratio && (
                  <Badge variant="outline">{selectedAsset.aspect_ratio}</Badge>
                )}
                {selectedAsset.resolution && (
                  <Badge variant="outline">{selectedAsset.resolution}</Badge>
                )}
                {selectedAsset.campaign && (
                  <Badge variant="outline">{selectedAsset.campaign}</Badge>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Prompt
                </p>
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 font-mono">
                  {selectedAsset.prompt}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleDownload(selectedAsset)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                {selectedAsset.image_url && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await exportAsPDF(
                            selectedAsset.image_url!,
                            selectedAsset.aspect_ratio,
                            `${selectedAsset.content_type}-${selectedAsset.channel}`
                          );
                        } catch (err) {
                          toast.error("PDF export failed");
                        }
                      }}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Export PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditAsset(selectedAsset);
                        setSelectedAsset(null);
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setTextOverlayAsset(selectedAsset);
                        setSelectedAsset(null);
                      }}
                    >
                      <Type className="h-4 w-4 mr-1" />
                      Add Text
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleFavorite(selectedAsset.id)}
                >
                  <Heart
                    className={`h-4 w-4 mr-1 ${selectedAsset.is_favorite ? "fill-red-500 text-red-500" : ""}`}
                  />
                  {selectedAsset.is_favorite ? "Unfavorite" : "Favorite"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Image Dialog */}
      {editAsset?.image_url && (
        <EditImageDialog
          open={!!editAsset}
          onOpenChange={(open) => !open && setEditAsset(null)}
          imageUrl={editAsset.image_url}
          aspectRatio={editAsset.aspect_ratio || "1:1"}
          onEditComplete={(newUrl) => {
            setAssets((prev) =>
              prev.map((a) =>
                a.id === editAsset.id ? { ...a, image_url: newUrl } : a
              )
            );
            toast.success("Image updated with edits!");
          }}
        />
      )}

      {/* Text Overlay Editor */}
      {textOverlayAsset?.image_url && (
        <TextOverlayEditor
          open={!!textOverlayAsset}
          onOpenChange={(open) => !open && setTextOverlayAsset(null)}
          imageUrl={textOverlayAsset.image_url}
          onSave={(dataUrl) => {
            setAssets((prev) =>
              prev.map((a) =>
                a.id === textOverlayAsset.id ? { ...a, image_url: dataUrl } : a
              )
            );
            toast.success("Text overlay applied!");
          }}
        />
      )}
    </div>
  );
}
