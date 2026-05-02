"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

interface Asset {
  id: string;
  image_url: string;
  prompt?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (url: string) => void;
}

export function AssetPickerDialog({ open, onClose, onPick }: Props) {
  const { dealership } = useAppStore();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !dealership) return;
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("generated_assets")
      .select("id, image_url, prompt")
      .eq("dealership_id", dealership.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(60)
      .then((res: { data: Asset[] | null }) => {
        setAssets((res.data ?? []) as Asset[]);
        setLoading(false);
      });
  }, [open, dealership]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Pick from Library</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : assets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No assets yet — generate one first.</p>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-[60vh] overflow-y-auto">
            {assets.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  onPick(a.image_url);
                  onClose();
                }}
                className="aspect-square overflow-hidden rounded border hover:border-primary"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.image_url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
