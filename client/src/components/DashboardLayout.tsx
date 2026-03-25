/**
 * DashboardLayout — Seel product shell
 * Left: Seel global sidebar (light bg, product-level nav)
 * Right: AI Support module with top tab navigation
 * Matches Seel product UI from reference screenshot
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Home, BarChart3, ShoppingCart, AlertCircle, Shield,
  Star, Bot, Puzzle, Bell, LayoutGrid, Users,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Seel global sidebar nav ── */
const mainNav = [
  { icon: Home, label: "Home", path: "/seel/home" },
  { icon: BarChart3, label: "Analytics", path: "/seel/analytics" },
  { icon: ShoppingCart, label: "Orders", path: "/seel/orders" },
  { icon: AlertCircle, label: "Issues", path: "/seel/issues" },
  { icon: Shield, label: "Protection", path: "/seel/protection" },
  { icon: Star, label: "Reviews", path: "/seel/reviews" },
  { icon: Bot, label: "AI support", path: "/" },
  { icon: Puzzle, label: "Integrations", path: "/seel/integrations" },
];

const customizeNav = [
  { icon: Bell, label: "Notification", path: "/seel/notification" },
  { icon: LayoutGrid, label: "Widgets", path: "/seel/widgets" },
  { icon: Users, label: "Customer portal", path: "/seel/customer-portal" },
];

/* ── AI Support top tabs ── */
const aiTabs = [
  { label: "Settings", path: "/settings" },
  { label: "Agents", path: "/" },
  { label: "Knowledges", path: "/knowledge" },
  { label: "Test", path: "/test" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  // Determine if current route is within AI Support
  const isAiSupport = !location.startsWith("/seel/");

  // Determine active AI tab
  const activeTab = (() => {
    if (location === "/settings") return "/settings";
    if (location === "/knowledge") return "/knowledge";
    if (location === "/test" || location === "/conversations") return "/test";
    // Default: Agents tab covers /, /agents, /agents/new, /agents/:id
    return "/";
  })();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Seel Global Sidebar ── */}
      <aside className="w-[200px] bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-muted-foreground">johndoe.myshopify.com</span>
              <span className="text-muted-foreground/40 text-[10px]">▾</span>
            </div>
          </div>
        </div>

        {/* Main nav */}
        <nav className="flex-1 py-3 px-2.5 overflow-y-auto custom-scrollbar">
          <div className="space-y-0.5">
            {mainNav.map(item => {
              const isActive = item.path === "/" ? isAiSupport : location.startsWith(item.path);
              return (
                <Link key={item.path} href={item.path}>
                  <div className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-colors",
                    isActive
                      ? "text-primary font-semibold bg-primary/5"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                  )}>
                    <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* CUSTOMIZE section */}
          <div className="mt-6">
            <p className="px-2.5 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2">Customize</p>
            <div className="space-y-0.5">
              {customizeNav.map(item => {
                const isActive = location.startsWith(item.path);
                return (
                  <Link key={item.path} href={item.path}>
                    <div className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-colors",
                      isActive
                        ? "text-primary font-semibold bg-primary/5"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                    )}>
                      <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header bar */}
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-6">
            {/* Module title */}
            <h1 className="text-lg font-semibold tracking-tight">AI support</h1>

            {/* AI Support tabs */}
            {isAiSupport && (
              <nav className="flex items-center gap-1 -mb-[1px]">
                {aiTabs.map(tab => {
                  const isActive = activeTab === tab.path;
                  return (
                    <Link key={tab.path} href={tab.path}>
                      <div className={cn(
                        "px-3 py-3.5 text-[13px] transition-colors relative",
                        isActive
                          ? "text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      )}>
                        {tab.label}
                        {isActive && (
                          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 rounded-md hover:bg-muted transition-colors">
              <HelpCircle className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <span className="text-[10px] font-semibold text-white">J</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
