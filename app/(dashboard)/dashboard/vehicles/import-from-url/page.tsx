"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle, Loader, Upload, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface DetectionResult {
  success: boolean;
  detectedFields?: Array<{
    field: string;
    confidence: number;
    sample?: string;
  }>;
  suggestedMapping?: Record<string, string>;
  preview?: Array<{
    year?: number | null;
    make?: string;
    model?: string;
    trim?: string;
    price?: number | null;
  }>;
  confidence?: number;
  itemCount?: number;
  validationStatus?: {
    valid: boolean;
    missingRequired: string[];
    warnings: string[];
  };
  error?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
  importedIds: string[];
  syncLogId: string;
}

type Step = "input" | "preview" | "results";

export default function ImportFromURLPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("input");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  const goToStep = (s: Step) => {
    setError("");
    setStep(s);
  };

  const handleDetect = async (e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();

    if (!sourceUrl.trim()) {
      setError("Please enter a URL");
      return;
    }

    setError("");
    setIsDetecting(true);

    try {
      const response = await fetch("/api/inventory/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUrl }),
      });

      const data = (await response.json()) as DetectionResult;

      if (!data.success) {
        setError(data.error || "Failed to detect fields");
        return;
      }

      setDetectionResult(data);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Detection failed");
    } finally {
      setIsDetecting(false);
    }
  };

  const handleImport = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!sourceName.trim()) {
      setError("Please enter a source name");
      return;
    }

    setError("");
    setIsImporting(true);

    try {
      const response = await fetch("/api/inventory/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl,
          sourceName,
          fieldMapping: detectionResult?.suggestedMapping,
        }),
      });

      const data = (await response.json()) as ImportResult;
      setImportResult(data);
      setStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  const steps: { key: Step; label: string; num: number }[] = [
    { key: "input", label: "URL & Detection", num: 1 },
    { key: "preview", label: "Preview & Configure", num: 2 },
    { key: "results", label: "Results", num: 3 },
  ];

  const stepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Import from URL</h1>
        <p className="text-gray-600 mt-2">
          Enter your dealership inventory URL and we&apos;ll automatically detect and import
          your vehicles.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1">
        {steps.map((s, i) => {
          const isActive = s.key === step;
          const isDone = i < stepIndex;
          const canClick = isDone && !isDetecting && !isImporting;

          return (
            <div key={s.key} className="flex items-center gap-1">
              <button
                type="button"
                disabled={!canClick}
                onClick={() => canClick && goToStep(s.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150
                  ${isActive
                    ? s.key === "results"
                      ? "bg-green-100 text-green-900"
                      : "bg-blue-100 text-blue-900"
                    : isDone
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
                    : "bg-gray-100 text-gray-400 cursor-default"
                  }`}
              >
                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold
                  ${isActive
                    ? s.key === "results" ? "bg-green-600 text-white" : "bg-blue-600 text-white"
                    : isDone ? "bg-gray-500 text-white" : "bg-gray-300 text-gray-500"
                  }`}>
                  {isDone ? "✓" : s.num}
                </span>
                {s.label}
              </button>
              {i < steps.length - 1 && (
                <span className="text-gray-300 text-lg">›</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: URL Input */}
      {step === "input" && (
        <div className="space-y-4 bg-white p-6 rounded-lg border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Inventory Page URL
            </label>
            <input
              type="url"
              placeholder="https://example.com/inventory"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isDetecting && handleDetect(e)}
              className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-2">
              Enter the direct URL to your dealer inventory page (e.g., your website&apos;s
              inventory listing).
            </p>
          </div>

          {error && (
            <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <button
            type="button"
            onClick={handleDetect}
            disabled={isDetecting || !sourceUrl.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-150 flex items-center justify-center gap-2"
          >
            {isDetecting ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Detecting Fields...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Detect Fields
              </>
            )}
          </button>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === "preview" && detectionResult && (
        <div className="space-y-6">
          {/* Source Name */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700">
              Source Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Main Website Inventory"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <p className="text-sm text-gray-500 mt-2">
              Required — give this inventory source a name so you can identify it later.
            </p>
          </div>

          {/* Detection Summary */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Detection Complete</p>
                <p className="text-sm text-blue-800 mt-1">
                  Found {detectionResult.itemCount} inventory items with{" "}
                  {detectionResult.detectedFields?.length || 0} fields detected
                </p>
              </div>
            </div>

            {detectionResult.validationStatus && !detectionResult.validationStatus.valid && (
              <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                <p className="text-sm font-medium text-yellow-900">
                  Missing required fields:
                </p>
                <ul className="text-sm text-yellow-800 mt-2 list-disc list-inside">
                  {detectionResult.validationStatus.missingRequired.map((field) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Detected Fields */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
            <h3 className="font-semibold">Detected Fields</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {detectionResult.detectedFields?.map((field) => (
                <div
                  key={field.field}
                  className="p-3 bg-gray-50 rounded border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{field.field}</span>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {Math.round(field.confidence * 100)}%
                    </span>
                  </div>
                  {field.sample && (
                    <p className="text-xs text-gray-600 mt-2">
                      Sample: {field.sample}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Preview Table */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
            <h3 className="font-semibold">Preview (First 5 Vehicles)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Year</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Make</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Model</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Trim</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {detectionResult.preview?.map((vehicle, i) => (
                    <tr key={i} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-2">{vehicle.year || "-"}</td>
                      <td className="px-4 py-2">{vehicle.make || "-"}</td>
                      <td className="px-4 py-2">{vehicle.model || "-"}</td>
                      <td className="px-4 py-2">{vehicle.trim || "-"}</td>
                      <td className="px-4 py-2">
                        {vehicle.price ? `$${vehicle.price.toLocaleString()}` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {error && (
            <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => goToStep("input")}
              disabled={isImporting}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium rounded-lg transition-colors duration-150"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div className="flex-1 space-y-1">
              <button
                type="button"
                onClick={handleImport}
                disabled={isImporting || !sourceName.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-150 flex items-center justify-center gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import Vehicles
                  </>
                )}
              </button>
              {!sourceName.trim() && !isImporting && (
                <p className="text-xs text-center text-amber-600">
                  ↑ Enter a source name above to enable import
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {step === "results" && importResult && (
        <div className="space-y-6">
          <div
            className={`p-6 rounded-lg border ${
              importResult.failed === 0
                ? "bg-green-50 border-green-200"
                : "bg-yellow-50 border-yellow-200"
            }`}
          >
            <div className="flex items-start gap-3">
              <CheckCircle
                className={`h-6 w-6 flex-shrink-0 mt-0.5 ${
                  importResult.failed === 0 ? "text-green-600" : "text-yellow-600"
                }`}
              />
              <div>
                <p
                  className={`font-semibold text-lg ${
                    importResult.failed === 0 ? "text-green-900" : "text-yellow-900"
                  }`}
                >
                  Import Complete
                </p>
                <p
                  className={`text-sm mt-2 ${
                    importResult.failed === 0 ? "text-green-800" : "text-yellow-800"
                  }`}
                >
                  Successfully imported{" "}
                  <span className="font-semibold">{importResult.success}</span> vehicles
                  {importResult.failed > 0 && (
                    <span>, {importResult.failed} failed</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
              <h3 className="font-semibold text-red-600">
                Errors ({importResult.errors.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {importResult.errors.map((err, i) => (
                  <div
                    key={i}
                    className="text-sm p-2 bg-red-50 border border-red-200 rounded"
                  >
                    <span className="font-medium text-red-600">Row {err.row}:</span>{" "}
                    <span className="text-red-800">{err.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Link
              href="/dashboard/vehicles"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-150 text-center"
            >
              View Imported Vehicles
            </Link>
            <button
              type="button"
              onClick={() => {
                setStep("input");
                setSourceUrl("");
                setSourceName("");
                setDetectionResult(null);
                setImportResult(null);
                setError("");
              }}
              className="px-5 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors duration-150"
            >
              Import Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
