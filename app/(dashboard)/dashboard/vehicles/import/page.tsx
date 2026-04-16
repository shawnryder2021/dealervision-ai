"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Upload, Download, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { parseCSV, generateCSVTemplate, detectDelimiter } from "@/lib/csv-parser";
import { toast } from "sonner";

interface ParsedVehicle {
  year?: string;
  make?: string;
  model?: string;
  trim?: string;
  price?: string;
  mileage?: string;
  vin?: string;
  stock_number?: string;
  status?: string;
}

export default function VehicleImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvContent, setCSVContent] = useState<string>("");
  const [vehicles, setVehicles] = useState<ParsedVehicle[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [preview, setPreview] = useState(true);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      setCSVContent(content);
      parseFile(content);
    } catch (err) {
      toast.error("Failed to read file");
    }
  };

  const parseFile = (content: string) => {
    const delimiter = detectDelimiter(content);
    const parsed = parseCSV(content, { delimiter, hasHeader: true });

    if (parsed.errors.length > 0) {
      toast.error(parsed.errors[0]);
    }

    setVehicles(parsed.rows as ParsedVehicle[]);
    setPreview(true);
  };

  const downloadTemplate = () => {
    const csv = generateCSVTemplate();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vehicle-import-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (vehicles.length === 0) {
      toast.error("No vehicles to import");
      return;
    }

    setIsImporting(true);
    try {
      const response = await fetch("/api/vehicles/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicles }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Import failed");
      }

      setImportResult(result);
      setPreview(false);

      if (result.success > 0) {
        toast.success(`Imported ${result.success} vehicle${result.success !== 1 ? "s" : ""}`);
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} vehicle${result.failed !== 1 ? "s" : ""} failed to import`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setCSVContent("");
    setVehicles([]);
    setImportResult(null);
    setPreview(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/vehicles">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold">Import Vehicles</h1>
          <p className="text-sm text-muted-foreground mt-1">Bulk upload your vehicle inventory from CSV</p>
        </div>
      </div>

      {importResult && !preview ? (
        // Results view
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Import Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Imported</p>
                  <p className="text-2xl font-bold text-green-500">{importResult.success}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-red-500">{importResult.failed}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{importResult.success + importResult.failed}</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900 dark:bg-red-900/10 dark:border-red-800">
                  <div className="flex gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="font-semibold">Errors:</p>
                  </div>
                  <ul className="space-y-1 text-sm ml-7">
                    {importResult.errors.slice(0, 5).map((err: any, i: number) => (
                      <li key={i}>Row {err.row}: {err.error}</li>
                    ))}
                    {importResult.errors.length > 5 && (
                      <li>... and {importResult.errors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleReset} variant="outline">
                  Import Another File
                </Button>
                <Link href="/dashboard/vehicles" className="flex-1">
                  <Button className="w-full gradient-primary text-white">
                    View Inventory
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : preview && vehicles.length > 0 ? (
        // Preview view
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preview ({vehicles.length} vehicles)</CardTitle>
              <CardDescription>Review your data before importing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Year</th>
                      <th className="px-3 py-2 text-left font-semibold">Make</th>
                      <th className="px-3 py-2 text-left font-semibold">Model</th>
                      <th className="px-3 py-2 text-left font-semibold">Trim</th>
                      <th className="px-3 py-2 text-right font-semibold">Price</th>
                      <th className="px-3 py-2 text-right font-semibold">Mileage</th>
                      <th className="px-3 py-2 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.slice(0, 10).map((vehicle, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-3 py-2">{vehicle.year || "—"}</td>
                        <td className="px-3 py-2 font-medium">{vehicle.make}</td>
                        <td className="px-3 py-2">{vehicle.model}</td>
                        <td className="px-3 py-2 text-muted-foreground">{vehicle.trim || "—"}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          {vehicle.price ? `$${parseInt(vehicle.price).toLocaleString()}` : "—"}
                        </td>
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          {vehicle.mileage ? parseInt(vehicle.mileage).toLocaleString() : "—"}
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                            {vehicle.status || "available"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {vehicles.length > 10 && (
                <p className="text-sm text-muted-foreground text-center">
                  Showing 10 of {vehicles.length} vehicles
                </p>
              )}

              <div className="flex gap-2">
                <Button onClick={handleReset} variant="outline">
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="flex-1 gradient-primary text-white"
                >
                  {isImporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Import {vehicles.length} Vehicles
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Upload view
        <div className="space-y-4">
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Upload className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <h3 className="font-heading text-lg font-semibold mb-1">Upload CSV File</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Drag and drop or select a file to begin
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />

              <Button
                onClick={() => fileInputRef.current?.click()}
                className="gradient-primary text-white mb-3"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>

              <p className="text-xs text-muted-foreground">CSV, TSV, or TXT files only</p>
            </CardContent>
          </Card>

          {/* Template help */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">How to format your file</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Required columns:</p>
                <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">make</code> - Vehicle manufacturer (e.g., Toyota, Honda)</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">model</code> - Vehicle model (e.g., Camry, Civic)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Optional columns:</p>
                <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">year</code> - Model year</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">trim</code> - Trim level</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">price</code> - Asking price</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">mileage</code> - Odometer reading</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">vin</code> - VIN number</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">stock_number</code> - Stock #</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">status</code> - available, sold, coming_soon, featured</li>
                </ul>
              </div>

              <Button
                onClick={downloadTemplate}
                variant="outline"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
