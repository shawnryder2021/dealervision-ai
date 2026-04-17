"use client";

import { Shield, Settings, BarChart3, Users, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const adminNavItems = [
  { href: "/dashboard/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/dashboard/admin/pricing", label: "Pricing", icon: Zap },
  { href: "/dashboard/admin/stripe", label: "Stripe Config", icon: Settings },
  { href: "/dashboard/admin/dealerships", label: "Dealerships", icon: Users },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex gap-6 min-h-screen bg-background">
      {/* Admin Sidebar */}
      <aside className="w-64 border-r bg-muted/30 p-6 sticky top-0 h-screen overflow-y-auto">
        {/* Admin Header */}
        <div className="flex items-center gap-2 mb-8 pb-6 border-b">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <p className="text-sm font-semibold">Platform Admin</p>
            <p className="text-xs text-muted-foreground">Configuration</p>
          </div>
        </div>

        {/* Admin Navigation */}
        <nav className="space-y-2">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/60"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Link */}
        <div className="mt-12 pt-6 border-t">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted/60 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
