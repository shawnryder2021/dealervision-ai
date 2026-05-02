"use client";

import { Heart, Download, MoreHorizontal, Trash2, Pencil, Eye, Check, FileDown, Share2, Palette } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { GeneratedAsset } from "@/lib/types";

interface AssetCardProps {
  asset: GeneratedAsset;
  onFavorite?: (id: string) => void;
  onDownload?: (asset: GeneratedAsset) => void;
  onDelete?: (id: string) => void;
  onView?: (asset: GeneratedAsset) => void;
  onEdit?: (asset: GeneratedAsset) => void;
  onExportPDF?: (asset: GeneratedAsset) => void;
  onPublishSocial?: (asset: GeneratedAsset) => void;
  selectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function AssetCard({
  asset,
  onFavorite,
  onDownload,
  onDelete,
  onView,
  onEdit,
  onExportPDF,
  onPublishSocial,
  selectMode,
  isSelected,
  onToggleSelect,
}: AssetCardProps) {
  return (
    <Card className={`group overflow-hidden transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 ${isSelected ? "ring-2 ring-primary" : ""}`}>
      <div
        className="relative aspect-square bg-muted cursor-pointer"
        onClick={() => {
          if (selectMode) {
            onToggleSelect?.(asset.id);
          } else {
            onView?.(asset);
          }
        }}
      >
        {selectMode && (
          <div className="absolute top-2 left-2 z-10">
            <div
              className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                isSelected
                  ? "bg-primary border-primary"
                  : "bg-black/40 border-white/70"
              }`}
            >
              {isSelected && <Check className="h-3 w-3 text-white" />}
            </div>
          </div>
        )}
        {asset.image_url ? (
          <img
            src={asset.image_url}
            alt={asset.content_type}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            {asset.status === "processing" || asset.status === "pending" ? (
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <p className="text-xs text-muted-foreground">Failed</p>
            )}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-1">
            {onFavorite && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 bg-black/50 hover:bg-black/70"
                onClick={(e) => {
                  e.stopPropagation();
                  onFavorite(asset.id);
                }}
              >
                <Heart
                  className={`h-3.5 w-3.5 ${asset.is_favorite ? "fill-red-500 text-red-500" : "text-white"}`}
                />
              </Button>
            )}
            {onDownload && asset.image_url && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 bg-black/50 hover:bg-black/70"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(asset);
                }}
              >
                <Download className="h-3.5 w-3.5 text-white" />
              </Button>
            )}
            {onEdit && asset.image_url && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 bg-black/50 hover:bg-black/70"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(asset);
                }}
              >
                <Pencil className="h-3.5 w-3.5 text-white" />
              </Button>
            )}
          </div>
          {onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 bg-black/50 hover:bg-black/70"
                    onClick={(e) => e.stopPropagation()}
                  />
                }
              >
                <MoreHorizontal className="h-3.5 w-3.5 text-white" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView?.(asset)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {asset.image_url && (
                  <DropdownMenuItem
                    onClick={() => {
                      window.location.href = `/dashboard/canvas/new?fromUrl=${encodeURIComponent(asset.image_url!)}`;
                    }}
                  >
                    <Palette className="h-4 w-4 mr-2" />
                    Edit in Design Studio
                  </DropdownMenuItem>
                )}
                {onExportPDF && asset.image_url && (
                  <DropdownMenuItem onClick={() => onExportPDF(asset)}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                )}
                {onExportPDF && asset.image_url && (
                  <DropdownMenuItem
                    onClick={() => onExportPDF(asset)}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Export PDF
                  </DropdownMenuItem>
                )}
                {onPublishSocial && asset.image_url && (
                  <DropdownMenuItem
                    onClick={() => onPublishSocial(asset)}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Publish to Social
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => onDelete(asset.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <CardContent className="p-3">
        <p className="text-xs font-medium truncate capitalize">
          {asset.content_type.replace(/-/g, " ")}
        </p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 capitalize">
            {asset.channel.replace(/-/g, " ")}
          </Badge>
          {asset.campaign && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              {asset.campaign}
            </Badge>
          )}
          {(() => {
            const model = (asset.metadata as Record<string, unknown>)?.model;
            if (typeof model === "string" && model) {
              return (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30">
                  {model === "kie-nano-banana" ? "KIE.ai" : "OpenAI"}
                </Badge>
              );
            }
            return null;
          })()}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">
          {new Date(asset.created_at).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}
