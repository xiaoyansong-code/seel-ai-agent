/* ── DashboardLayout ──────────────────────────────────────────
   Nordic Control Room: dark sidebar + warm content area
   Sidebar: deep teal-charcoal with amber active indicators
   ──────────────────────────────────────────────────────────── */

import { type ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Settings,
  BarChart3,
  Bot,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { TOPICS, AGENT_MODE } from "@/lib/mock-data";

interface NavItem {
  label: string;
  href: string;
  icon: typeof MessageSquare;
  badge?: number;
  matchPaths?: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Instruct",
    href: "/instruct",
    icon: MessageSquare,
    badge: TOPICS.filter((t) => t.status === "unread").length,
    matchPaths: ["/instruct", "/"],
  },
  {
    label: "Performance",
    href: "/performance",
    icon: BarChart3,
    matchPaths: ["/performance"],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    matchPaths: ["/settings"],
  },
];

function AgentStatusDot({ mode }: { mode: string }) {
  const colors: Record<string, string> = {
    production: "bg-emerald-400",
    shadow: "bg-amber-400",
    off: "bg-zinc-500",
  };
  return <span className={cn("w-2 h-2 rounded-full inline-block", colors[mode] || "bg-zinc-500")} />;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const isOnboarding = location.startsWith("/onboarding");
  const isZendesk = location.startsWith("/zendesk");

  // Onboarding and Zendesk views get full-width layout
  if (isOnboarding || isZendesk) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ease-in-out",
          collapsed ? "w-[68px]" : "w-[240px]"
        )}
      >
        {/* Logo area */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-heading font-semibold text-sidebar-accent-foreground truncate">
                Seel AI
              </span>
              <span className="text-[11px] text-sidebar-foreground/50 truncate">
                Support Agent
              </span>
            </div>
          )}
        </div>

        {/* Agent status */}
        <div className={cn("px-4 py-3 border-b border-sidebar-border", collapsed && "px-3")}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <AgentStatusDot mode={AGENT_MODE} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <span className="capitalize">Alex — {AGENT_MODE}</span>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-sidebar-accent-foreground" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-medium text-sidebar-accent-foreground">Alex</span>
                  <AgentStatusDot mode={AGENT_MODE} />
                </div>
                <span className="text-[11px] text-sidebar-foreground/50 capitalize">{AGENT_MODE} Mode</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = item.matchPaths?.some((p) =>
              p === "/" ? location === "/" : location.startsWith(p)
            );
            const Icon = item.icon;

            return collapsed ? (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <div
                      className={cn(
                        "flex items-center justify-center w-full h-10 rounded-lg transition-all duration-200 relative",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                    >
                      <Icon className="w-[18px] h-[18px]" />
                      {item.badge && item.badge > 0 && (
                        <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-400" />
                      )}
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {item.label}
                  {item.badge ? ` (${item.badge})` : ""}
                </TooltipContent>
              </Tooltip>
            ) : (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-2.5 px-3 h-10 rounded-lg transition-all duration-200 group",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  <span className="text-[13px] font-medium flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <Badge
                      variant="secondary"
                      className="h-5 min-w-5 px-1.5 text-[10px] font-semibold bg-amber-400/20 text-amber-300 border-0"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Zendesk App link */}
        <div className="px-2 pb-2">
          <Link href="/zendesk">
            <div
              className={cn(
                "flex items-center gap-2.5 px-3 h-9 rounded-lg text-sidebar-foreground/40 hover:text-sidebar-foreground/70 hover:bg-sidebar-accent/30 transition-all duration-200",
                collapsed && "justify-center px-0"
              )}
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="text-[12px]">Zendesk Sidebar Preview</span>}
            </div>
          </Link>
        </div>

        {/* Onboarding link */}
        <div className="px-2 pb-2">
          <Link href="/onboarding">
            <div
              className={cn(
                "flex items-center gap-2.5 px-3 h-9 rounded-lg text-sidebar-foreground/40 hover:text-sidebar-foreground/70 hover:bg-sidebar-accent/30 transition-all duration-200",
                collapsed && "justify-center px-0"
              )}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="text-[12px]">Onboarding Demo</span>}
            </div>
          </Link>
        </div>

        {/* Collapse toggle */}
        <div className="px-2 pb-3 pt-1 border-t border-sidebar-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full h-8 rounded-lg text-sidebar-foreground/40 hover:text-sidebar-foreground/70 hover:bg-sidebar-accent/30 transition-all duration-200"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
