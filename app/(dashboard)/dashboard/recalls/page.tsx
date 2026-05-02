"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldAlert, Search, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

interface Recall {
  campaignNumber?: string;
  manufacturer?: string;
  reportReceivedDate?: string;
  component?: string;
  summary?: string;
  consequence?: string;
  remedy?: string;
}

export default function RecallsPage() {
  const { vehicles } = useAppStore();
  const [vehicleId, setVehicleId] = useState("");
  const [vinInput, setVinInput] = useState("");
  const [recalls, setRecalls] = useState<Recall[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<{ vehicleId: string; count: number }[]>([]);

  const vehicle = useMemo(() => vehicles.find((v) => v.id === vehicleId) || null, [vehicleId, vehicles]);

  useEffect(() => {
    if (vehicle?.vin) setVinInput(vehicle.vin);
  }, [vehicle]);

  const lookup = async () => {
    setLoading(true);
    setRecalls(null);
    try {
      const params = new URLSearchParams();
      if (vinInput.trim()) params.set("vin", vinInput.trim());
      else if (vehicle?.year && vehicle?.make && vehicle?.model) {
        params.set("year", String(vehicle.year));
        params.set("make", vehicle.make);
        params.set("model", vehicle.model);
      } else {
        toast.error("Enter a VIN or pick a vehicle with year/make/model");
        return;
      }
      const res = await fetch(`/api/recalls?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setRecalls(data.recalls);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  };

  const scanInventory = async () => {
    setScanning(true);
    setScanResults([]);
    const results: { vehicleId: string; count: number }[] = [];
    const candidates = vehicles.filter((v) => v.vin || (v.year && v.make && v.model));
    for (const v of candidates) {
      const params = new URLSearchParams();
      if (v.vin) params.set("vin", v.vin);
      else {
        params.set("year", String(v.year));
        params.set("make", v.make!);
        params.set("model", v.model!);
      }
      try {
        const res = await fetch(`/api/recalls?${params}`);
        if (res.ok) {
          const data = await res.json();
          if (data.count > 0) results.push({ vehicleId: v.id, count: data.count });
          setScanResults([...results]);
        }
      } catch {}
    }
    setScanning(false);
    toast.success(`Scan complete — ${results.length} of ${candidates.length} vehicles have open recalls`);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-primary" />
          NHTSA Recall Lookup
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Check any vehicle (or scan your whole inventory) for open safety recalls. Free data from NHTSA.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Look up one vehicle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>From inventory</Label>
              <Select value={vehicleId} onValueChange={(v) => setVehicleId(v ?? "")}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pick a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {[v.year, v.make, v.model, v.trim].filter(Boolean).join(" ")}
                      {v.stock_number ? ` — #${v.stock_number}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Or paste a VIN</Label>
              <Input
                value={vinInput}
                onChange={(e) => setVinInput(e.target.value)}
                placeholder="17-char VIN"
                maxLength={17}
                className="mt-1 font-mono"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={lookup} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Search className="h-4 w-4 mr-1" />}
              Look up
            </Button>
            <Button variant="outline" onClick={scanInventory} disabled={scanning || vehicles.length === 0}>
              {scanning ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <ShieldAlert className="h-4 w-4 mr-1" />}
              Scan whole inventory ({vehicles.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {recalls !== null && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {recalls.length === 0 ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  No open recalls
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  {recalls.length} open recall{recalls.length === 1 ? "" : "s"}
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recalls.map((r, i) => (
              <div key={i} className="border rounded-md p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{r.component}</p>
                  {r.campaignNumber && <Badge variant="outline">{r.campaignNumber}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{r.manufacturer} · {r.reportReceivedDate}</p>
                {r.summary && <p className="text-sm"><strong>Summary:</strong> {r.summary}</p>}
                {r.consequence && <p className="text-sm text-destructive"><strong>Consequence:</strong> {r.consequence}</p>}
                {r.remedy && <p className="text-sm"><strong>Remedy:</strong> {r.remedy}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {scanResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-destructive">Inventory with open recalls</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {scanResults.map((r) => {
                const v = vehicles.find((x) => x.id === r.vehicleId);
                if (!v) return null;
                return (
                  <li key={r.vehicleId} className="flex items-center justify-between border-b py-2 last:border-b-0">
                    <span>
                      {[v.year, v.make, v.model, v.trim].filter(Boolean).join(" ")}
                      {v.stock_number ? ` — #${v.stock_number}` : ""}
                    </span>
                    <Badge variant="destructive">{r.count} recall{r.count === 1 ? "" : "s"}</Badge>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
