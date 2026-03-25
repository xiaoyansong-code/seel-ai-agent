/**
 * DashboardLayout — Seel product shell
 * Left: Collapsible Seel global sidebar (light bg, product-level nav)
 * Right: AI Support module with top tab navigation (Agents / Playbook / Performance)
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Home, BarChart3, ShoppingCart, AlertCircle, Shield,
  Star, Bot, Puzzle, Bell, LayoutGrid, Users,
  HelpCircle, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
const aiTabs: { label: string; path: string; subTabs?: { label: string; path: string }[] }[] = [
  { label: "Agents", path: "/" },
  {
    label: "Playbook",
    path: "/playbook",
    subTabs: [
      { label: "Knowledge", path: "/playbook" },
      { label: "Skills", path: "/playbook/skills" },
      { label: "Actions", path: "/playbook/actions" },
    ],
  },
  {
    label: "Performance",
    path: "/performance",
    subTabs: [
      { label: "Conversations", path: "/performance" },
      { label: "Analytics", path: "/performance/analytics" },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isAiSupport = !location.startsWith("/seel/");

  // Determine active main tab
  const activeMainTab = (() => {
    if (location.startsWith("/performance")) return "/performance";
    if (location.startsWith("/playbook")) return "/playbook";
    return "/";
  })();

  // Get current tab config for sub-tabs
  const currentTab = aiTabs.find(t => t.path === activeMainTab);
  const subTabs = currentTab?.subTabs;

  // Determine active sub-tab
  const activeSubTab = (() => {
    if (!subTabs) return null;
    // Exact match first
    const exact = subTabs.find(st => st.path === location);
    if (exact) return exact.path;
    // Prefix match
    const prefix = subTabs.find(st => st.path !== currentTab.path && location.startsWith(st.path));
    if (prefix) return prefix.path;
    // Default to first sub-tab
    return subTabs[0].path;
  })();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Seel Global Sidebar ── */}
      <aside
        className={cn(
          "bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 transition-all duration-200",
          collapsed ? "w-[56px]" : "w-[200px]"
        )}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-3 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <div className="flex items-center gap-1.5 text-sm overflow-hidden whitespace-nowrap">
                <span className="text-muted-foreground truncate">johndoe.myshopify.com</span>
                <span className="text-muted-foreground/40 text-[10px]">▾</span>
              </div>
            )}
          </div>
        </div>

        {/* Main nav */}
        <nav className="flex-1 py-3 px-1.5 overflow-y-auto custom-scrollbar">
          <div className="space-y-0.5">
            {mainNav.map(item => {
              const isActive = item.path === "/" ? isAiSupport : location.startsWith(item.path);
              const linkEl = (
                <Link key={item.path} href={item.path}>
                  <div className={cn(
                    "flex items-center gap-2.5 rounded-md text-[13px] transition-colors",
                    collapsed ? "px-2 py-2 justify-center" : "px-2.5 py-2",
                    isActive
                      ? "text-primary font-semibold bg-primary/5"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                  )}>
                    <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.path} delayDuration={0}>
                    <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                    <TooltipContent side="right" className="text-xs font-medium">{item.label}</TooltipContent>
                  </Tooltip>
                );
              }
              return <div key={item.path}>{linkEl}</div>;
            })}
          </div>

          {/* CUSTOMIZE section */}
          <div className="mt-6">
            {!collapsed && (
              <p className="px-2.5 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2">Customize</p>
            )}
            {collapsed && <div className="border-t border-sidebar-border my-2" />}
            <div className="space-y-0.5">
              {customizeNav.map(item => {
                const isActive = location.startsWith(item.path);
                const linkEl = (
                  <Link key={item.path} href={item.path}>
                    <div className={cn(
                      "flex items-center gap-2.5 rounded-md text-[13px] transition-colors",
                      collapsed ? "px-2 py-2 justify-center" : "px-2.5 py-2",
                      isActive
                        ? "text-primary font-semibold bg-primary/5"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                    )}>
                      <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </div>
                  </Link>
                );

                if (collapsed) {
                  return (
                    <Tooltip key={item.path} delayDuration={0}>
                      <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                      <TooltipContent side="right" className="text-xs font-medium">{item.label}</TooltipContent>
                    </Tooltip>
                  );
                }
                return <div key={item.path}>{linkEl}</div>;
              })}
            </div>
          </div>
        </nav>

        {/* Collapse toggle */}
        <div className="p-1.5 border-t border-sidebar-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center py-2 rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header bar with main tabs */}
        <header className="bg-card border-b border-border shrink-0">
          <div className="h-14 flex items-center justify-between px-6">
            <div className="flex items-center gap-6">
              <h1 className="text-lg font-semibold tracking-tight">AI support</h1>

              {isAiSupport && (
                <nav className="flex items-center gap-1">
                  {aiTabs.map(tab => {
                    const isActive = activeMainTab === tab.path;
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
          </div>

          {/* Sub-tabs row */}
          {isAiSupport && subTabs && (
            <div className="flex items-center gap-1 px-6 border-t border-border/50">
              {subTabs.map(st => {
                const isActive = activeSubTab === st.path;
                return (
                  <Link key={st.path} href={st.path}>
                    <div className={cn(
                      "px-3 py-2.5 text-[12px] transition-colors relative",
                      isActive
                        ? "text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    )}>
                      {st.label}
                      {isActive && (
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
