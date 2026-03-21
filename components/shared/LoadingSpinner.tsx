import { cn } from "@/lib/utils";

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export function GenerationSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card">
      <div className="aspect-square w-full shimmer bg-muted" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Generating your visual...
        </p>
      </div>
    </div>
  );
}
