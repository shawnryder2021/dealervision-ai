"use client";

import { Image as ImageIcon, Heart, Download, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GeneratedAsset } from "@/lib/types";
import Link from "next/link";

interface RecentGenerationsProps {
  assets: GeneratedAsset[];
}

export function RecentGenerations({ assets }: RecentGenerationsProps) {
  if (assets.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ImageIcon className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="font-heading text-lg font-semibold mb-1">
            No generations yet
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first AI-powered marketing visual
          </p>
          <Link href="/dashboard/create">
            <Button className="gradient-primary text-white">
              Start Creating
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {assets.slice(0, 10).map((asset) => (
        <Link
          key={asset.id}
          href={`/dashboard/library?id=${asset.id}`}
          className="group"
        >
          <Card className="overflow-hidden transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
            <div className="relative aspect-square bg-muted">
              {asset.image_url ? (
                <img
                  src={asset.image_url}
                  alt={asset.content_type}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  {asset.status === "pending" || asset.status === "processing" ? (
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                  )}
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <ExternalLink className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <CardContent className="p-2">
              <p className="text-xs font-medium truncate capitalize">
                {asset.content_type.replace(/-/g, " ")}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {asset.channel.replace(/-/g, " ")}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
