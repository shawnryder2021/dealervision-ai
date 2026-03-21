"use client";

import { Download, RefreshCw, Heart, Share2, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GenerationSkeleton } from "@/components/shared/LoadingSpinner";
import type { GeneratedAsset } from "@/lib/types";

interface GenerationPreviewProps {
  asset: GeneratedAsset | null;
  isGenerating: boolean;
  onRegenerate?: () => void;
  onRefine?: () => void;
  onDownload?: () => void;
  onFavorite?: () => void;
}

export function GenerationPreview({
  asset,
  isGenerating,
  onRegenerate,
  onRefine,
  onDownload,
  onFavorite,
}: GenerationPreviewProps) {
  if (isGenerating) {
    return <GenerationSkeleton />;
  }

  if (!asset) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        {asset.image_url ? (
          <img
            src={asset.image_url}
            alt={`Generated ${asset.content_type}`}
            className="w-full"
          />
        ) : asset.status === "failed" ? (
          <div className="flex aspect-square items-center justify-center bg-muted">
            <div className="text-center">
              <p className="text-sm font-medium text-destructive">
                Generation Failed
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Please try again
              </p>
            </div>
          </div>
        ) : (
          <GenerationSkeleton />
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="capitalize">
            {asset.content_type.replace(/-/g, " ")}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {asset.channel.replace(/-/g, " ")}
          </Badge>
          {asset.aspect_ratio && (
            <Badge variant="outline">{asset.aspect_ratio}</Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onDownload && asset.image_url && (
            <Button size="sm" variant="outline" onClick={onDownload}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          )}
          {onRegenerate && (
            <Button size="sm" variant="outline" onClick={onRegenerate}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Regenerate
            </Button>
          )}
          {onRefine && asset.image_url && (
            <Button size="sm" variant="outline" onClick={onRefine}>
              <Edit3 className="h-4 w-4 mr-1" />
              Refine
            </Button>
          )}
          {onFavorite && (
            <Button size="sm" variant="ghost" onClick={onFavorite}>
              <Heart
                className={`h-4 w-4 ${asset.is_favorite ? "fill-red-500 text-red-500" : ""}`}
              />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
