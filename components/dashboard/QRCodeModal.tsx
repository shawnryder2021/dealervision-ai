"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, QrCode, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface QRCodeModalProps {
  open: boolean;
  onClose: () => void;
  vehicleName: string;
  defaultUrl: string;
}

export function QRCodeModal({ open, onClose, vehicleName, defaultUrl }: QRCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState(defaultUrl);

  useEffect(() => {
    setUrl(defaultUrl);
  }, [defaultUrl]);

  useEffect(() => {
    if (!open || !canvasRef.current) return;

    async function renderQR() {
      try {
        const QRCodeModule = await import("qrcode");
        await QRCodeModule.toCanvas(canvasRef.current, url || "https://example.com", {
          width: 280,
          margin: 2,
          color: { dark: "#000000", light: "#ffffff" },
        });
      } catch (error) {
        // Silently fail if QR code generation fails
      }
    }

    renderQR();
  }, [open, url]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qr-${vehicleName.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR code downloaded");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-primary" />
            QR Code — {vehicleName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-center rounded-xl border bg-white p-4">
            <canvas ref={canvasRef} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="qr-url">Link URL</Label>
            <Input
              id="qr-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              QR updates as you type. Use this link on window stickers, flyers, and lot signs.
            </p>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1 gradient-primary text-white gap-2" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              Download PNG
            </Button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open link"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
