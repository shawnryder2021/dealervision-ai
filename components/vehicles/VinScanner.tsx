"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X, Loader2, FlashlightIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface VinScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanned: (vin: string) => void;
}

// VINs are 17 chars, alphanumeric, no I/O/Q
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;

// BarcodeDetector type — not yet in default lib.dom
type BarcodeDetectorAPI = {
  detect: (source: HTMLVideoElement | ImageBitmap) => Promise<Array<{ rawValue: string; format: string }>>;
};

type BarcodeDetectorCtor = new (opts?: { formats?: string[] }) => BarcodeDetectorAPI;

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorCtor;
  }
}

export function VinScanner({ open, onOpenChange, onScanned }: VinScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorAPI | null>(null);
  const zxingControlsRef = useRef<{ stop: () => void } | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [manualVin, setManualVin] = useState("");
  const [usingFallback, setUsingFallback] = useState(false);

  // Initialize camera + scanner when dialog opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function startScanner() {
      try {
        setError(null);
        setScanning(true);

        // Request rear-facing camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Check torch support
        const track = stream.getVideoTracks()[0];
        const capabilities = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean };
        setTorchSupported(!!capabilities.torch);

        // Prefer native BarcodeDetector
        if (typeof window !== "undefined" && window.BarcodeDetector) {
          const detector = new window.BarcodeDetector({
            formats: ["code_39", "code_128", "data_matrix", "qr_code"],
          });
          detectorRef.current = detector;
          startDetectionLoop();
          return;
        }

        // Fallback: @zxing/browser
        setUsingFallback(true);
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromStream(
          stream,
          videoRef.current!,
          (result) => {
            if (cancelled || !result) return;
            const text = result.getText().trim().toUpperCase();
            handleDetection(text);
          }
        );
        zxingControlsRef.current = controls;
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("Permission") || msg.includes("denied")) {
          setError("Camera permission was denied. Enable camera access in your browser settings and try again.");
        } else if (msg.includes("NotFound")) {
          setError("No camera found on this device. Use manual entry below.");
        } else {
          setError(`Camera couldn't start: ${msg}`);
        }
        setScanning(false);
      }
    }

    function startDetectionLoop() {
      const tick = async () => {
        if (cancelled || !videoRef.current || !detectorRef.current) return;
        if (videoRef.current.readyState < 2) {
          scanLoopRef.current = window.setTimeout(tick, 200);
          return;
        }
        try {
          const codes = await detectorRef.current.detect(videoRef.current);
          for (const code of codes) {
            const text = code.rawValue.trim().toUpperCase();
            if (handleDetection(text)) return; // stop loop on success
          }
        } catch {
          // Some browsers throw transient errors; ignore and continue
        }
        scanLoopRef.current = window.setTimeout(tick, 250);
      };
      tick();
    }

    function handleDetection(text: string): boolean {
      // Strip any prefix (some VIN barcodes are prefixed with "I" or "1")
      const candidate = text.replace(/[^A-Z0-9]/gi, "").toUpperCase();
      // Look for any 17-char VIN-shaped substring
      for (let i = 0; i + 17 <= candidate.length; i++) {
        const sub = candidate.substring(i, i + 17);
        if (VIN_REGEX.test(sub)) {
          stopScanner();
          toast.success("VIN detected!");
          onScanned(sub);
          onOpenChange(false);
          return true;
        }
      }
      return false;
    }

    startScanner();

    return () => {
      cancelled = true;
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function stopScanner() {
    setScanning(false);
    if (scanLoopRef.current) {
      window.clearTimeout(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (zxingControlsRef.current) {
      zxingControlsRef.current.stop();
      zxingControlsRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks?.()[0];
    if (!track) return;
    try {
      const next = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: next } as unknown as MediaTrackConstraintSet] });
      setTorchOn(next);
    } catch {
      toast.error("Torch not supported on this device");
      setTorchSupported(false);
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sub = manualVin.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!VIN_REGEX.test(sub)) {
      toast.error("VIN must be 17 letters/numbers, no I, O, or Q");
      return;
    }
    stopScanner();
    onScanned(sub);
    onOpenChange(false);
  }

  function handleClose(val: boolean) {
    if (!val) stopScanner();
    onOpenChange(val);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 py-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Camera className="h-4 w-4 text-primary" />
            Scan VIN
          </DialogTitle>
          <DialogDescription className="text-xs">
            Point camera at the VIN barcode on the windshield or driver-side door jamb
          </DialogDescription>
        </DialogHeader>

        {/* Camera area */}
        <div className="relative aspect-[4/3] bg-black overflow-hidden">
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Scanning overlay */}
          {scanning && !error && (
            <>
              {/* Targeting frame */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-3/4 h-1/3 border-2 border-primary/70 rounded-lg">
                  {/* Animated scan line */}
                  <div className="absolute inset-x-0 top-1/2 h-0.5 bg-primary shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />
                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary" />
                </div>
              </div>

              <div className="absolute bottom-2 left-0 right-0 text-center">
                <span className="inline-flex items-center gap-1.5 bg-black/60 text-white text-[11px] px-2 py-1 rounded-full backdrop-blur">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {usingFallback ? "Scanning (zxing)…" : "Scanning…"}
                </span>
              </div>
            </>
          )}

          {/* Torch button */}
          {scanning && torchSupported && (
            <button
              onClick={toggleTorch}
              className={`absolute top-2 right-2 h-9 w-9 flex items-center justify-center rounded-full backdrop-blur transition-colors ${
                torchOn ? "bg-amber-400 text-black" : "bg-black/60 text-white"
              }`}
              aria-label="Toggle torch"
            >
              <FlashlightIcon className="h-4 w-4" />
            </button>
          )}

          {/* Error state */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 text-white p-6 text-center">
              <AlertCircle className="h-8 w-8 text-amber-400 mb-2" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Manual entry fallback */}
        <form onSubmit={handleManualSubmit} className="px-5 py-4 space-y-2 border-t border-border">
          <Label htmlFor="manual-vin" className="text-xs">
            Or enter VIN manually
          </Label>
          <div className="flex gap-2">
            <Input
              id="manual-vin"
              value={manualVin}
              onChange={(e) => setManualVin(e.target.value.toUpperCase())}
              placeholder="17 characters, no I/O/Q"
              maxLength={17}
              className="font-mono text-xs uppercase"
              autoComplete="off"
            />
            <Button type="submit" size="sm" disabled={manualVin.trim().length !== 17}>
              Use VIN
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleClose(false)}
            className="w-full text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
