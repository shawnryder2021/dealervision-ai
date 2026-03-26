"use client";

import Link from "next/link";
import { CalendarDays, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getSeasonalSuggestions, getCurrentSeason } from "@/lib/seasonal";
import type { SeasonalSuggestion } from "@/lib/seasonal";

export function SeasonalSuggestions() {
  const suggestions = getSeasonalSuggestions(new Date(), 6);
  const season = getCurrentSeason();

  if (suggestions.length === 0) return null;

  // Split into featured (top 2) and rest
  const featured = suggestions.slice(0, 2);
  const rest = suggestions.slice(2);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <h2 className="font-heading text-lg font-semibold">
            {season} Suggestions
          </h2>
        </div>
        <span className="text-xs text-muted-foreground">
          Based on today&apos;s date
        </span>
      </div>

      {/* Featured suggestions (larger cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {featured.map((s) => (
          <SuggestionCard key={s.id} suggestion={s} featured />
        ))}
      </div>

      {/* Rest (smaller) */}
      {rest.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {rest.map((s) => (
            <SuggestionCard key={s.id} suggestion={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function SuggestionCard({
  suggestion,
  featured = false,
}: {
  suggestion: SeasonalSuggestion;
  featured?: boolean;
}) {
  return (
    <Link href={`/dashboard/create/${suggestion.contentType}?seasonal=${suggestion.id}`}>
      <Card
        className={`glass glass-hover cursor-pointer transition-all hover:scale-[1.01] hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 ${
          featured ? "border-primary/20 bg-primary/[0.02]" : ""
        }`}
      >
        <CardContent className={featured ? "p-4" : "p-3"}>
          <div className="flex items-start gap-3">
            <span className={featured ? "text-2xl" : "text-lg"}>
              {suggestion.emoji}
            </span>
            <div className="flex-1 min-w-0">
              <h3
                className={`font-heading font-semibold leading-tight ${
                  featured ? "text-sm" : "text-xs"
                }`}
              >
                {suggestion.title}
              </h3>
              {featured && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {suggestion.description}
                </p>
              )}
              {featured && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary mt-2">
                  Create now <ArrowRight className="h-3 w-3" />
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
