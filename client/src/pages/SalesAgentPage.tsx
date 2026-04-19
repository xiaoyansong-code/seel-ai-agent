/* ── Sales Agent Page ──────────────────────────────────────
   Single page, 3 top-level tabs: Touchpoints · Strategies · Analytics
   ──────────────────────────────────────────────────────── */

import { useLocation, useRoute, Link } from "wouter";
import { cn } from "@/lib/utils";
import TouchpointsTab from "@/components/sales-agent/TouchpointsTab";
import StrategiesTab from "@/components/sales-agent/StrategiesTab";
import AnalyticsTab from "@/components/sales-agent/AnalyticsTab";
import DemoConsole from "@/components/sales-agent/DemoConsole";

type TabKey = "touchpoints" | "strategies" | "analytics";

const TABS: { key: TabKey; label: string }[] = [
  { key: "touchpoints", label: "Touchpoints" },
  { key: "strategies", label: "Strategies" },
  { key: "analytics", label: "Analytics" },
];

export default function SalesAgentPage() {
  const [, params] = useRoute<{ tab?: string }>("/sales-agent/:tab");
  const [location] = useLocation();

  const activeTab: TabKey = (() => {
    const t = params?.tab;
    if (t === "strategies" || t === "analytics" || t === "touchpoints") return t;
    return "touchpoints";
  })();

  // Silence unused var warning on location while keeping it as a re-render trigger
  void location;

  return (
    <div className="flex flex-col h-full bg-[#fafafa]">
      {/* Module header */}
      <div className="shrink-0 bg-white border-b border-neutral-200">
        <div className="px-6 pt-4">
          <h1 className="text-[18px] font-bold text-neutral-900 leading-tight">
            Sales Agent
          </h1>
          <p className="text-[12px] text-neutral-500 mt-0.5">
            Configure product recommendations across the shopper journey.
          </p>
          <div className="flex items-center gap-1 mt-3 -mb-px">
            {TABS.map((t) => {
              const href =
                t.key === "touchpoints" ? "/sales-agent" : `/sales-agent/${t.key}`;
              const active = activeTab === t.key;
              return (
                <Link key={t.key} href={href}>
                  <button
                    className={cn(
                      "px-3 pb-2.5 text-[13px] font-medium transition-colors relative",
                      active
                        ? "text-neutral-900"
                        : "text-neutral-500 hover:text-neutral-900",
                    )}
                  >
                    {t.label}
                    {active && (
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-neutral-900" />
                    )}
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {activeTab === "touchpoints" && <TouchpointsTab />}
        {activeTab === "strategies" && <StrategiesTab />}
        {activeTab === "analytics" && <AnalyticsTab />}
      </div>

      {/* Demo console */}
      <DemoConsole />
    </div>
  );
}
