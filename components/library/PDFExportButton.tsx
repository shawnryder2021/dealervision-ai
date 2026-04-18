"use client";

import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import type { GeneratedAsset } from "@/lib/types";

interface PDFExportButtonProps {
  asset: GeneratedAsset;
}

/**
 * Client-only PDF export button.
 * Loaded via next/dynamic with ssr: false to prevent jspdf/fflate Worker
 * resolution errors during server-side rendering.
 */
export default function PDFExportButton({ asset }: PDFExportButtonProps) {
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={async () => {
        try {
          const { exportAsPDF } = await import("@/lib/pdf-export");
          await exportAsPDF(
            asset.image_url!,
            asset.aspect_ratio,
            `${asset.content_type}-${asset.channel}`
          );
        } catch (err) {
          toast.error("PDF export failed");
        }
      }}
    >
      <FileText className="h-4 w-4 mr-1" />
      Export PDF
    </Button>
  );
}
