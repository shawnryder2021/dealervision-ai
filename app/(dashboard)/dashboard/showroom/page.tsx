"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Tv, ExternalLink, Copy, Maximize2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

export default function ShowroomLandingPage() {
  const { dealership } = useAppStore();
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setOrigin(window.location.origin), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const url = useMemo(
    () => (dealership?.slug ? `${origin}/display/${dealership.slug}` : ""),
    [origin, dealership?.slug]
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <Tv className="h-6 w-6 text-primary" />
          Showroom TV Mode
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Full-screen rotating display of your latest assets and inventory. Open it on a lobby monitor — no login needed.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Public display URL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {url ? (
            <>
              <div className="flex items-center gap-2 p-2 border rounded font-mono text-sm break-all">
                {url}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={url}
                  target="_blank"
                  className={buttonVariants({})}
                >
                  <Maximize2 className="h-4 w-4 mr-1" /> Launch full-screen
                  <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                </Link>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(url);
                    toast.success("URL copied");
                  }}
                >
                  <Copy className="h-4 w-4 mr-1" /> Copy URL
                </Button>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Setup tips:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Open the URL on the showroom monitor&apos;s browser</li>
                  <li>Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">F11</kbd> for full-screen kiosk mode</li>
                  <li>The display rotates every 7 seconds and refreshes when you reload</li>
                  <li>It pulls from your latest 40 generated assets and 20 available vehicles</li>
                </ul>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
