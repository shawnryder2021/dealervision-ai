"use client";

import Link from "next/link";
import {
  Car,
  Tag,
  Sparkles,
  TrendingDown,
  LayoutGrid,
  Building2,
  Star,
  Wrench,
  DollarSign,
  Gift,
  Paintbrush,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CONTENT_TYPES } from "@/lib/constants";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Car,
  Tag,
  Sparkles,
  TrendingDown,
  LayoutGrid,
  Building2,
  Star,
  Wrench,
  DollarSign,
  Gift,
  Paintbrush,
};

export function ContentTypeSelector() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {CONTENT_TYPES.map((type) => {
        const Icon = iconMap[type.icon] || Sparkles;
        return (
          <Link key={type.id} href={`/dashboard/create/${type.id}`}>
            <Card className="glass glass-hover cursor-pointer transition-all hover:scale-[1.01] hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 h-full">
              <CardContent className="flex items-start gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-sm mb-1">
                    {type.name}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {type.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
