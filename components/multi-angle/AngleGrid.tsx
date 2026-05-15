"use client";

import { Loader2, CheckCircle2, XCircle, Clock, RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AngleJob } from "@/lib/multi-angle";

interface AngleGridProps {
  jobs: AngleJob[];
  onRetry?: (angleId: string) => void;
  onDownload?: (job: AngleJob) => void;
}

export function AngleGrid({ jobs, onRetry, onDownload }: AngleGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {jobs.map((job) => (
        <AngleCard
          key={job.angle.id}
          job={job}
          onRetry={onRetry ? () => onRetry(job.angle.id) : undefined}
          onDownload={onDownload ? () => onDownload(job) : undefined}
        />
      ))}
    </div>
  );
}

function AngleCard({
  job,
  onRetry,
  onDownload,
}: {
  job: AngleJob;
  onRetry?: () => void;
  onDownload?: () => void;
}) {
  return (
    <div
      className={`group rounded-lg border overflow-hidden bg-card transition-colors ${
        job.status === "failed"
          ? "border-destructive/40"
          : job.status === "completed"
          ? "border-primary/40"
          : "border-border"
      }`}
    >
      <div className="relative aspect-square bg-muted/40 flex items-center justify-center">
        {job.imageUrl ? (
          <img
            src={job.imageUrl}
            alt={job.angle.label}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <StatusIcon status={job.status} />
        )}

        {/* Status badge */}
        <div className="absolute top-1.5 left-1.5">
          <StatusBadge status={job.status} />
        </div>

        {/* Hover actions */}
        {job.status === "completed" && job.imageUrl && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            {onDownload && (
              <Button
                size="sm"
                variant="secondary"
                onClick={onDownload}
                className="h-7 text-xs"
              >
                <Download className="h-3 w-3 mr-1" />
                Save
              </Button>
            )}
          </div>
        )}

        {job.status === "failed" && onRetry && (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/5">
            <Button size="sm" variant="outline" onClick={onRetry} className="h-7 text-xs">
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        )}
      </div>

      <div className="px-2.5 py-1.5">
        <p className="text-xs font-medium truncate">{job.angle.label}</p>
        {job.error && (
          <p className="text-[10px] text-destructive truncate mt-0.5">{job.error}</p>
        )}
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: AngleJob["status"] }) {
  switch (status) {
    case "pending":
      return <Clock className="h-6 w-6 text-muted-foreground/40" />;
    case "processing":
      return <Loader2 className="h-6 w-6 text-primary animate-spin" />;
    case "completed":
      return <CheckCircle2 className="h-6 w-6 text-green-500" />;
    case "failed":
      return <XCircle className="h-6 w-6 text-destructive" />;
  }
}

function StatusBadge({ status }: { status: AngleJob["status"] }) {
  const styles: Record<AngleJob["status"], string> = {
    pending: "bg-muted text-muted-foreground",
    processing: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    completed: "bg-green-500/15 text-green-600 dark:text-green-400",
    failed: "bg-destructive/15 text-destructive",
  };
  const labels: Record<AngleJob["status"], string> = {
    pending: "Queued",
    processing: "Generating",
    completed: "Done",
    failed: "Failed",
  };
  return (
    <span
      className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded backdrop-blur ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
