"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Car, Plus, Search, Edit, Trash2, Eye, Upload, QrCode, FileText, ScrollText, Camera } from "lucide-react";
import { buildWindowSticker, buildBuyersGuide } from "@/lib/pdf-stickers";
import { VinScanner } from "@/components/vehicles/VinScanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo-data";
import { VEHICLE_STATUSES } from "@/lib/constants";
import { VEHICLE_MAKES_MODELS, getModelsForMake, COMMON_TRIMS, getYearRange } from "@/lib/vehicle-data";
import type { Vehicle } from "@/lib/types";
import { toast } from "sonner";
import { QRCodeModal } from "@/components/dashboard/QRCodeModal";

const statusColors: Record<string, string> = {
  available: "bg-green-500/10 text-green-500",
  sold: "bg-red-500/10 text-red-500",
  coming_soon: "bg-amber-500/10 text-amber-500",
  featured: "bg-primary/10 text-primary",
};

export default function VehiclesPage() {
  const { dealership, vehicles: storeVehicles } = useAppStore();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [qrVehicle, setQrVehicle] = useState<Vehicle | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [decodingVin, setDecodingVin] = useState(false);
  const [form, setForm] = useState({
    year: "",
    make: "",
    model: "",
    trim: "",
    price: "",
    mileage: "",
    vin: "",
    stock_number: "",
    status: "available" as Vehicle["status"],
  });

  const loadVehicles = useCallback(async () => {
    if (!dealership) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("vehicles")
      .select("*")
      .eq("dealership_id", dealership.id)
      .order("created_at", { ascending: false });
    if (data) setVehicles(data);
  }, [dealership]);

  useEffect(() => {
    if (isDemoMode()) {
      const timer = window.setTimeout(() => setVehicles(storeVehicles), 0);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => {
      loadVehicles();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [dealership, storeVehicles, loadVehicles]);

  async function handleVinScanned(vin: string) {
    // Set the VIN immediately so the user sees something
    setForm((prev) => ({ ...prev, vin }));
    // Open the form if it's not already open
    setIsAddOpen(true);

    // Try to decode it to auto-fill year/make/model/trim
    setDecodingVin(true);
    try {
      const res = await fetch(`/api/vin-decode?vin=${encodeURIComponent(vin)}`);
      if (!res.ok) {
        toast.warning("VIN saved, but auto-decode failed. Fill in details manually.");
        return;
      }
      const decoded = await res.json();
      setForm((prev) => ({
        ...prev,
        vin,
        year: decoded.year ? String(decoded.year) : prev.year,
        make: decoded.make || prev.make,
        model: decoded.model || prev.model,
        trim: decoded.trim || prev.trim,
      }));
      toast.success("VIN decoded — vehicle details filled in");
    } catch {
      toast.warning("VIN saved, but auto-decode failed. Fill in details manually.");
    } finally {
      setDecodingVin(false);
    }
  }

  async function handleAdd() {
    if (!dealership) return;

    if (isDemoMode()) {
      const newVehicle: Vehicle = {
        id: `demo-vehicle-${Date.now()}`,
        dealership_id: dealership.id,
        year: form.year ? parseInt(form.year) : null,
        make: form.make || null,
        model: form.model || null,
        trim: form.trim || null,
        price: form.price ? parseFloat(form.price) : null,
        mileage: form.mileage ? parseInt(form.mileage) : null,
        vin: form.vin || null,
        stock_number: form.stock_number || null,
        status: form.status,
        photos: [],
        tags: [],
        details: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setVehicles((prev) => [newVehicle, ...prev]);
      setIsAddOpen(false);
      setForm({ year: "", make: "", model: "", trim: "", price: "", mileage: "", vin: "", stock_number: "", status: "available" });
      toast.success("Vehicle added (demo)");
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("vehicles")
      .insert({
        dealership_id: dealership.id,
        year: form.year ? parseInt(form.year) : null,
        make: form.make || null,
        model: form.model || null,
        trim: form.trim || null,
        price: form.price ? parseFloat(form.price) : null,
        mileage: form.mileage ? parseInt(form.mileage) : null,
        vin: form.vin || null,
        stock_number: form.stock_number || null,
        status: form.status,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add vehicle");
      return;
    }

    if (data) {
      setVehicles((prev) => [data, ...prev]);
      setIsAddOpen(false);
      setForm({ year: "", make: "", model: "", trim: "", price: "", mileage: "", vin: "", stock_number: "", status: "available" });
      toast.success("Vehicle added");
    }
  }

  async function handleDelete(id: string) {
    if (isDemoMode()) {
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      toast.success("Vehicle removed (demo)");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from("vehicles").delete().eq("id", id);
    if (!error) {
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      toast.success("Vehicle removed");
    }
  }

  const filtered = vehicles.filter((v) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      v.make?.toLowerCase().includes(s) ||
      v.model?.toLowerCase().includes(s) ||
      v.vin?.toLowerCase().includes(s) ||
      v.stock_number?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Car className="h-6 w-6 text-primary" />
            Vehicle Inventory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setScannerOpen(true)}>
            <Camera className="h-4 w-4 mr-2" />
            Scan VIN
          </Button>

          <Link href="/dashboard/vehicles/import">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
          </Link>

          <Link href="/dashboard/vehicles/import-from-url">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import from URL
            </Button>
          </Link>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger
            render={<Button className="gradient-primary text-white" />}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Vehicle</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Year</Label>
                <Select
                  value={form.year}
                  onValueChange={(v) => setForm({ ...form, year: v ?? "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {getYearRange().map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Make</Label>
                <Select
                  value={form.make}
                  onValueChange={(v) => setForm({ ...form, make: v ?? "", model: "", trim: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select make" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_MAKES_MODELS.map((m) => (
                      <SelectItem key={m.make} value={m.make}>
                        {m.make}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Model</Label>
                <Select
                  value={form.model}
                  onValueChange={(v) => setForm({ ...form, model: v ?? "" })}
                  disabled={!form.make}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={form.make ? "Select model" : "Choose make first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getModelsForMake(form.make).map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Trim</Label>
                <Select
                  value={form.trim}
                  onValueChange={(v) => setForm({ ...form, trim: v ?? "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trim" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_TRIMS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Price ($)</Label>
                <Input
                  type="number"
                  placeholder="35000"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Mileage</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.mileage}
                  onChange={(e) =>
                    setForm({ ...form, mileage: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center justify-between">
                  <span>VIN</span>
                  {decodingVin && (
                    <span className="text-[10px] text-muted-foreground font-normal">Decoding…</span>
                  )}
                </Label>
                <div className="flex gap-1.5">
                  <Input
                    placeholder="1VWSA7A37LC000001"
                    value={form.vin}
                    onChange={(e) =>
                      setForm({ ...form, vin: e.target.value })
                    }
                    className="font-mono text-xs"
                    maxLength={17}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setScannerOpen(true)}
                    className="shrink-0 px-2"
                    title="Scan VIN with camera"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Stock #</Label>
                <Input
                  placeholder="A12345"
                  value={form.stock_number}
                  onChange={(e) =>
                    setForm({ ...form, stock_number: e.target.value })
                  }
                  className="font-mono text-xs"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({ ...form, status: v as Vehicle["status"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className="w-full gradient-primary text-white mt-2"
              onClick={handleAdd}
            >
              Add Vehicle
            </Button>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search vehicles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 max-w-md"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Car className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="font-heading text-lg font-semibold mb-1">
              No vehicles yet
            </h3>
            <p className="text-sm text-muted-foreground">
              Add your first vehicle to start creating marketing visuals
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((v) => (
            <Card key={v.id} className="glass glass-hover">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Car className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {v.year} {v.make} {v.model} {v.trim}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {v.price && (
                        <span className="text-xs text-muted-foreground">
                          ${v.price.toLocaleString()}
                        </span>
                      )}
                      {v.stock_number && (
                        <span className="text-xs text-muted-foreground font-mono">
                          #{v.stock_number}
                        </span>
                      )}
                      {v.mileage != null && (
                        <span className="text-xs text-muted-foreground">
                          {v.mileage.toLocaleString()} mi
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={`capitalize text-xs ${statusColors[v.status] || ""}`}
                    variant="secondary"
                  >
                    {v.status.replace(/_/g, " ")}
                  </Badge>
                  <Link href={`/dashboard/create/vehicle-spotlight?vehicle=${v.id}`}>
                    <Button size="sm" variant="outline">
                      <Wand2Icon className="h-3.5 w-3.5 mr-1" />
                      Create
                    </Button>
                  </Link>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    title="QR Code"
                    onClick={() => setQrVehicle(v)}
                  >
                    <QrCode className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    title="Window Sticker PDF"
                    onClick={() => {
                      if (!dealership) return;
                      buildWindowSticker(v, dealership).save(
                        `window-sticker-${v.stock_number || v.id}.pdf`
                      );
                    }}
                  >
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    title="FTC Buyers Guide"
                    onClick={() => {
                      if (!dealership) return;
                      buildBuyersGuide(v, dealership).save(
                        `buyers-guide-${v.stock_number || v.id}.pdf`
                      );
                    }}
                  >
                    <ScrollText className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => handleDelete(v.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      {qrVehicle && (
        <QRCodeModal
          open={!!qrVehicle}
          onClose={() => setQrVehicle(null)}
          vehicleName={`${qrVehicle.year ?? ""} ${qrVehicle.make ?? ""} ${qrVehicle.model ?? ""}`.trim()}
          defaultUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/vehicles/${qrVehicle.id}`}
        />
      )}

      {/* VIN Scanner modal */}
      <VinScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScanned={handleVinScanned}
      />
    </div>
  );
}

function Wand2Icon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72" />
      <path d="m14 7 3 3" />
      <path d="M5 6v4" />
      <path d="M19 14v4" />
      <path d="M10 2v2" />
      <path d="M7 8H3" />
      <path d="M21 16h-4" />
      <path d="M11 3H9" />
    </svg>
  );
}
