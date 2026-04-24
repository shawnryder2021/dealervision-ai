"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wand2,
  Image,
  Car,
  Settings,
  CreditCard,
  BarChart3,
  ScanBarcode,
  ChevronLeft,
  ChevronRight,
  LogOut,
  MessageSquare,
  Sun,
  Moon,
  ImageMinus,
  FlaskConical,
  FileText,
  Activity,
  Layers,
  CalendarDays,
  Shield,
  Sparkles,
  Users,
  Mail,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useTheme } from "next-themes";
import { useAppStore } from "@/lib/store";

const navSections = [
  {
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Create",
    items: [
      { href: "/dashboard/create", label: "Generate", icon: Wand2 },
      { href: "/dashboard/campaigns", label: "Campaigns", icon: Sparkles },
      { href: "/dashboard/chat", label: "AI Assistant", icon: MessageSquare },
      { href: "/dashboard/vin-decoder", label: "VIN Decoder", icon: ScanBarcode },
      { href: "/dashboard/background-swap", label: "BG Swap", icon: ImageMinus },
      { href: "/dashboard/ab-test", label: "A/B Test", icon: FlaskConical },
      { href: "/dashboard/batch-generate", label: "Batch", icon: Layers },
    ],
  },
  {
    label: "Manage",
    items: [
      { href: "/dashboard/library", label: "Library", icon: Image },
      { href: "/dashboard/vehicles", label: "Vehicles", icon: Car },
      { href: "/dashboard/leads", label: "Leads", icon: Users },
      { href: "/dashboard/landing-pages", label: "Landing Pages", icon: FileText },
      { href: "/dashboard/email", label: "Email", icon: Mail },
      { href: "/dashboard/publish", label: "Publish", icon: Share2 },
      { href: "/dashboard/activity", label: "Activity", icon: Activity },
      { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
    ],
  },
];

const bottomItems = [
  { href: "/dashboard/usage", label: "Usage", icon: BarChart3 },
  { href: "/dashboard/settings/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings/social-accounts", label: "Social Accounts", icon: Share2 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

// NavLink defined OUTSIDE Sidebar so React doesn't remount it on every render
function NavLink({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-primary"
          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();
  const {
    isSuperAdmin,
    adminActiveDealership,
    ownDealership,
    setAdminActiveDealership,
    setDealership,
  } = useAppStore();

  const exitClientMode = () => {
    setAdminActiveDealership(null);
    if (ownDealership) setDealership(ownDealership);
  };

  function isActive(href: string) {
    return (
      pathname === href ||
      (href !== "/dashboard" && pathname.startsWith(href))
    );
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-14" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-3">
        <Link href="/dashboard" className={cn("flex items-center gap-2", collapsed && "mx-auto")}>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary">
            <Wand2 className="h-3.5 w-3.5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-heading text-base font-bold tracking-tight">
              DealerAdGen
            </span>
          )}
        </Link>
      </div>

      {/* Client mode banner */}
      {isSuperAdmin && adminActiveDealership && (
        <div className={cn(
          "mx-2 mt-2 rounded-md border border-accent/30 bg-accent/10 px-3 py-2",
          collapsed && "mx-1 px-1.5 py-1.5"
        )}>
          {!collapsed ? (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-accent/80">
                Client Mode
              </p>
              <p className="text-xs font-medium text-accent mt-0.5 truncate">
                {adminActiveDealership.name}
              </p>
              <button
                onClick={exitClientMode}
                className="mt-1 text-[10px] text-accent hover:text-accent/80 transition-colors"
              >
                ← Exit client mode
              </button>
            </>
          ) : (
            <button
              onClick={exitClientMode}
              title="Exit client mode"
              className="flex w-full items-center justify-center text-accent hover:text-accent/80"
            >
              <span className="text-[10px] font-bold">✕</span>
            </button>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {navSections.map((section, i) => (
          <div key={i} className={cn(i > 0 && "mt-4")}>
            {section.label && !collapsed && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                {section.label}
              </p>
            )}
            {collapsed && i > 0 && (
              <div className="mx-3 mb-2 border-t border-sidebar-border" />
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  {...item}
                  active={isActive(item.href)}
                  collapsed={collapsed}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-sidebar-border px-2 py-2 space-y-0.5">
        {isSuperAdmin && (
          <>
            <NavLink
              href="/dashboard/admin"
              label="Platform Admin"
              icon={Shield}
              active={isActive("/dashboard/admin")}
              collapsed={collapsed}
            />
            <div className="mx-3 my-1 border-t border-sidebar-border" />
          </>
        )}
        {bottomItems.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={isActive(item.href)}
            collapsed={collapsed}
          />
        ))}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground w-full"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 shrink-0" />
          ) : (
            <Moon className="h-4 w-4 shrink-0" />
          )}
          {!collapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
        </button>
        <div className="flex items-center gap-1 mt-1">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8 justify-center text-sidebar-foreground/40 hover:text-sidebar-foreground/60"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </Button>
          <form action="/api/auth/signout" method="post" className="flex-1">
            <Button
              variant="ghost"
              size="sm"
              type="submit"
              className="w-full h-8 justify-center text-sidebar-foreground/40 hover:text-sidebar-foreground/60"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </div>
    </aside>
  );
}
