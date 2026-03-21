"use client";

import Link from "next/link";
import {
  Car,
  Tag,
  Sparkles,
  TrendingDown,
  Wrench,
  DollarSign,
  Gift,
  Building2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const quickActions = [
  {
    href: "/dashboard/create/vehicle-spotlight",
    label: "Vehicle Spotlight",
    icon: Car,
    color: "text-blue-400",
  },
  {
    href: "/dashboard/create/sales-event",
    label: "Sales Event",
    icon: Tag,
    color: "text-red-400",
  },
  {
    href: "/dashboard/create/new-arrival",
    label: "New Arrival",
    icon: Sparkles,
    color: "text-amber-400",
  },
  {
    href: "/dashboard/create/price-drop",
    label: "Price Drop",
    icon: TrendingDown,
    color: "text-green-400",
  },
  {
    href: "/dashboard/create/service-promo",
    label: "Service Promo",
    icon: Wrench,
    color: "text-purple-400",
  },
  {
    href: "/dashboard/create/financing",
    label: "Financing",
    icon: DollarSign,
    color: "text-emerald-400",
  },
  {
    href: "/dashboard/create/holiday",
    label: "Holiday Post",
    icon: Gift,
    color: "text-pink-400",
  },
  {
    href: "/dashboard/create/brand-post",
    label: "Brand Post",
    icon: Building2,
    color: "text-cyan-400",
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {quickActions.map((action) => (
        <Link key={action.href} href={action.href}>
          <Card className="glass glass-hover cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg">
            <CardContent className="flex flex-col items-center gap-2 py-4 px-3">
              <action.icon className={`h-6 w-6 ${action.color}`} />
              <span className="text-xs font-medium text-center">
                {action.label}
              </span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
