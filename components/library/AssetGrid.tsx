"use client";

import { AssetCard } from "./AssetCard";
import type { GeneratedAsset } from "@/lib/types";

interface AssetGridProps {
  assets: GeneratedAsset[];
  onFavorite?: (id: string) => void;
  onDownload?: (asset: GeneratedAsset) => void;
  onDelete?: (id: string) => void;
  onView?: (asset: GeneratedAsset) => void;
  onEdit?: (asset: GeneratedAsset) => void;
  onExportPDF?: (asset: GeneratedAsset) => void;
  onPublishSocial?: (asset: GeneratedAsset) => void;
  selectMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

export function AssetGrid({
  assets,
  onFavorite,
  onDownload,
  onDelete,
  onView,
  onEdit,
  onExportPDF,
  onPublishSocial,
  selectMode,
  selectedIds,
  onToggleSelect,
}: AssetGridProps) {
  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">No assets found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          onFavorite={onFavorite}
          onDownload={onDownload}
          onDelete={onDelete}
          onView={onView}
          onEdit={onEdit}
          onExportPDF={onExportPDF}
          onPublishSocial={onPublishSocial}
          selectMode={selectMode}
          isSelected={selectedIds?.has(asset.id)}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  );
}
