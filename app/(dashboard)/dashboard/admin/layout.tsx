"use client";

import { Shield, Settings, BarChart3, Users, Zap, Image } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { href: "/dashboard/admin", label: "Overview", icon: BarChart3 },
  { href: "/dashboard/admin/pricing", label: "Pricing", icon: Zap },
  { href: "/dashboard/admin/stripe", label: "Stripe", icon: Settings },
  { href: "/dashboard/admin/image-generation", label: "Image Models", icon: Image },
  { href: "/dashboard/admin/dealerships", label: "Dealerships", icon: Users },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-sm font-semibold text-muted-foreground">
          Platform Admin
        </h1>
      </div>

      {/* Horizontal tabs */}
      <nav className="flex flex-wrap gap-1 border-b">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard/admin" &&
              pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}
