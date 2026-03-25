/**
 * Actions — Playbook > Actions global view
 * Shows all actions across all skills in a single inventory view.
 * Highlights write operations, connector dependencies, and enabled status.
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Zap, Eye, AlertTriangle, Filter, Package, Shield, ShoppingCart,
  Search, Info, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ── Types ── */
interface ActionItem {
  id: string;
  name: string;
  description: string;
  type: "read" | "write";
  connector: string;
  enabled: boolean;
  skillId: string;
  skillName: string;
  skillIcon: React.ElementType;
  skillIconColor: string;
  skillIconBg: string;
  scenarioId: string;
  scenarioIntent: string;
}

/* ── Build flat action list from Skills data ── */
function buildActionList(): ActionItem[] {
  const skills = [
    {
      id: "order-tracking",
      name: "Order Tracking",
      icon: Package,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
      scenarios: [
        {
          id: "ot-s1", intent: "Where is my order?",
          actions: [
            { id: "ot-a1", name: "Look up order status", description: "Query order details including current fulfillment status and line items.", type: "read" as const, connector: "Shopify", enabled: true },
            { id: "ot-a2", name: "Get tracking information", description: "Retrieve carrier tracking number, URL, and latest tracking events.", type: "read" as const, connector: "Shopify", enabled: true },
          ],
        },
        {
          id: "ot-s2", intent: "When will my order arrive?",
          actions: [
            { id: "ot-a2b", name: "Get tracking information", description: "Retrieve carrier tracking number, URL, and latest tracking events.", type: "read" as const, connector: "Shopify", enabled: true },
          ],
        },
        {
          id: "ot-s3", intent: "My order shows delivered but I didn't receive it.",
          actions: [
            { id: "ot-a1b", name: "Look up order status", description: "Query order details including current fulfillment status.", type: "read" as const, connector: "Shopify", enabled: true },
            { id: "ot-a2c", name: "Get tracking information", description: "Retrieve carrier tracking details and delivery confirmation.", type: "read" as const, connector: "Shopify", enabled: true },
          ],
        },
      ],
    },
    {
      id: "seel-protection",
      name: "Seel Protection",
      icon: Shield,
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
      scenarios: [
        {
          id: "sp-s1", intent: "What does my Seel protection cover?",
          actions: [
            { id: "sp-a1", name: "Look up protection policy", description: "Retrieve customer's Seel protection policy details, coverage scope, and status.", type: "read" as const, connector: "Seel API", enabled: true },
          ],
        },
        {
          id: "sp-s2", intent: "I want to file a claim.",
          actions: [
            { id: "sp-a1b", name: "Look up protection policy", description: "Verify customer has an active policy and check eligibility.", type: "read" as const, connector: "Seel API", enabled: true },
            { id: "sp-a3", name: "File a claim", description: "Initiate a new protection claim with order and issue details.", type: "write" as const, connector: "Seel API", enabled: true },
          ],
        },
        {
          id: "sp-s3", intent: "What's the status of my claim?",
          actions: [
            { id: "sp-a2", name: "Check claim status", description: "Query existing claim details including current status and resolution timeline.", type: "read" as const, connector: "Seel API", enabled: true },
          ],
        },
        {
          id: "sp-s4", intent: "I want to cancel my protection policy.",
          actions: [
            { id: "sp-a1c", name: "Look up protection policy", description: "Check policy status and cancellation eligibility.", type: "read" as const, connector: "Seel API", enabled: true },
            { id: "sp-a4", name: "Cancel protection policy", description: "Process policy cancellation and trigger refund if eligible.", type: "write" as const, connector: "Seel API", enabled: true },
          ],
        },
      ],
    },
    {
      id: "order-management",
      name: "Order Management",
      icon: ShoppingCart,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
      scenarios: [
        {
          id: "om-s1", intent: "I want to cancel my order.",
          actions: [
            { id: "om-a1", name: "Check order status", description: "Verify order fulfillment status and cancellation eligibility.", type: "read" as const, connector: "Shopify", enabled: true },
            { id: "om-a2", name: "Cancel order", description: "Cancel an unfulfilled order and trigger refund to original payment method.", type: "write" as const, connector: "Shopify", enabled: false },
          ],
        },
        {
          id: "om-s2", intent: "Can I still cancel? I just placed it.",
          actions: [
            { id: "om-a1b", name: "Check order status", description: "Verify order fulfillment status and cancellation eligibility.", type: "read" as const, connector: "Shopify", enabled: true },
            { id: "om-a2b", name: "Cancel order", description: "Cancel an unfulfilled order and trigger refund.", type: "write" as const, connector: "Shopify", enabled: false },
          ],
        },
        {
          id: "om-s3", intent: "I changed my mind about my purchase.",
          actions: [
            { id: "om-a1c", name: "Check order status", description: "Verify order details and fulfillment status.", type: "read" as const, connector: "Shopify", enabled: true },
            { id: "om-a2c", name: "Cancel order", description: "Cancel an unfulfilled order and trigger refund.", type: "write" as const, connector: "Shopify", enabled: false },
          ],
        },
      ],
    },
  ];

  const items: ActionItem[] = [];
  for (const skill of skills) {
    for (const scenario of skill.scenarios) {
      for (const action of scenario.actions) {
        items.push({
          ...action,
          skillId: skill.id,
          skillName: skill.name,
          skillIcon: skill.icon,
          skillIconColor: skill.iconColor,
          skillIconBg: skill.iconBg,
          scenarioId: scenario.id,
          scenarioIntent: scenario.intent,
        });
      }
    }
  }
  return items;
}

type FilterType = "all" | "read" | "write";
type FilterConnector = "all" | string;

const cV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const iV = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

export default function Actions() {
  const [actions, setActions] = useState<ActionItem[]>(buildActionList);
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [connectorFilter, setConnectorFilter] = useState<FilterConnector>("all");
  const [search, setSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["write"]));

  // Unique connectors
  const connectors = useMemo(() => {
    const set = new Set(actions.map(a => a.connector));
    return Array.from(set).sort();
  }, [actions]);

  // Deduplicated actions (by name + type + connector) for display
  const deduped = useMemo(() => {
    const map = new Map<string, { action: ActionItem; usedIn: { skillName: string; scenarioIntent: string; skillId: string; scenarioId: string }[] }>();
    for (const a of actions) {
      const key = `${a.name}|${a.type}|${a.connector}`;
      if (!map.has(key)) {
        map.set(key, { action: a, usedIn: [] });
      }
      map.get(key)!.usedIn.push({
        skillName: a.skillName,
        scenarioIntent: a.scenarioIntent,
        skillId: a.skillId,
        scenarioId: a.scenarioId,
      });
    }
    return Array.from(map.values());
  }, [actions]);

  // Filtered
  const filtered = useMemo(() => {
    return deduped.filter(({ action }) => {
      if (typeFilter !== "all" && action.type !== typeFilter) return false;
      if (connectorFilter !== "all" && action.connector !== connectorFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!action.name.toLowerCase().includes(q) && !action.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [deduped, typeFilter, connectorFilter, search]);

  // Group by type
  const writeActions = filtered.filter(({ action }) => action.type === "write");
  const readActions = filtered.filter(({ action }) => action.type === "read");

  // Stats
  const totalUnique = deduped.length;
  const writeCount = deduped.filter(d => d.action.type === "write").length;
  const enabledWriteCount = deduped.filter(d => d.action.type === "write" && d.action.enabled).length;

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const toggleAction = (actionName: string, actionType: string, actionConnector: string) => {
    setActions(prev => prev.map(a => {
      if (a.name === actionName && a.type === actionType && a.connector === actionConnector) {
        return { ...a, enabled: !a.enabled };
      }
      return a;
    }));
  };

  return (
    <motion.div variants={cV} initial="hidden" animate="visible" className="p-6 max-w-[900px] space-y-4">
      {/* Header hint */}
      <motion.div variants={iV} className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/15">
        <Zap className="w-4 h-4 text-primary shrink-0" />
        <p className="text-xs text-primary">
          Actions are the <strong>API operations</strong> your agents can perform. <strong>Write actions</strong> modify external data and require careful review before enabling.
        </p>
      </motion.div>

      {/* Summary stats */}
      <motion.div variants={iV} className="flex items-center gap-6">
        <div className="flex items-center gap-1.5 text-sm">
          <span className="font-semibold">{totalUnique}</span>
          <span className="text-muted-foreground">unique actions</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="font-semibold text-amber-600">{writeCount}</span>
          <span className="text-muted-foreground">write operations</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="font-semibold text-amber-600">{enabledWriteCount}</span>
          <span className="text-muted-foreground">write enabled</span>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={iV} className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-[260px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search actions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <div className="flex items-center gap-1 p-0.5 rounded-md bg-muted/50 border border-border">
          {(["all", "read", "write"] as FilterType[]).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                "px-2.5 py-1 rounded text-[11px] font-medium transition-all",
                typeFilter === t ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "all" ? "All types" : t === "read" ? "Read" : "Write"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 p-0.5 rounded-md bg-muted/50 border border-border">
          <button
            onClick={() => setConnectorFilter("all")}
            className={cn(
              "px-2.5 py-1 rounded text-[11px] font-medium transition-all",
              connectorFilter === "all" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            All connectors
          </button>
          {connectors.map(c => (
            <button
              key={c}
              onClick={() => setConnectorFilter(c)}
              className={cn(
                "px-2.5 py-1 rounded text-[11px] font-medium transition-all",
                connectorFilter === c ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Write Actions Group */}
      {writeActions.length > 0 && (
        <motion.div variants={iV}>
          <button
            onClick={() => toggleGroup("write")}
            className="w-full flex items-center gap-2 py-2 text-left group"
          >
            <div className="w-5 h-5 rounded bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
            </div>
            <span className="text-sm font-semibold text-amber-700">Write Operations</span>
            <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-600 border-amber-200 ml-1">{writeActions.length}</Badge>
            <span className="flex-1" />
            {expandedGroups.has("write") ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {expandedGroups.has("write") && (
            <div className="space-y-2 mt-1">
              {writeActions.map(({ action, usedIn }) => (
                <ActionRow
                  key={`${action.name}|${action.connector}`}
                  action={action}
                  usedIn={usedIn}
                  onToggle={() => toggleAction(action.name, action.type, action.connector)}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Read Actions Group */}
      {readActions.length > 0 && (
        <motion.div variants={iV}>
          <button
            onClick={() => toggleGroup("read")}
            className="w-full flex items-center gap-2 py-2 text-left group"
          >
            <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center shrink-0">
              <Eye className="w-3 h-3 text-blue-600" />
            </div>
            <span className="text-sm font-semibold text-blue-700">Read Operations</span>
            <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-600 border-blue-200 ml-1">{readActions.length}</Badge>
            <span className="flex-1" />
            {expandedGroups.has("read") ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {expandedGroups.has("read") && (
            <div className="space-y-2 mt-1">
              {readActions.map(({ action, usedIn }) => (
                <ActionRow
                  key={`${action.name}|${action.connector}`}
                  action={action}
                  usedIn={usedIn}
                  onToggle={() => toggleAction(action.name, action.type, action.connector)}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}

      {filtered.length === 0 && (
        <motion.div variants={iV} className="text-center py-12">
          <Filter className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No actions match your filters.</p>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ── Action Row Component ── */
function ActionRow({
  action,
  usedIn,
  onToggle,
}: {
  action: ActionItem;
  usedIn: { skillName: string; scenarioIntent: string; skillId: string; scenarioId: string }[];
  onToggle: () => void;
}) {
  const [showUsage, setShowUsage] = useState(false);
  const Icon = action.skillIcon;

  return (
    <div className={cn(
      "rounded-lg border transition-all",
      action.type === "write"
        ? action.enabled
          ? "border-amber-200 bg-amber-50/30"
          : "border-border bg-card"
        : "border-border bg-card"
    )}>
      <div className="flex items-center gap-3 p-3">
        {/* Type icon */}
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
          action.type === "read" ? "bg-blue-50" : "bg-amber-50"
        )}>
          {action.type === "read"
            ? <Eye className="w-4 h-4 text-blue-500" />
            : <Zap className="w-4 h-4 text-amber-500" />
          }
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-medium">{action.name}</p>
            <Badge variant="outline" className={cn(
              "text-[8px]",
              action.type === "read" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-amber-50 text-amber-600 border-amber-200"
            )}>
              {action.type}
            </Badge>
            <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted/40">via {action.connector}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{action.description}</p>
          {action.type === "write" && action.enabled && (
            <p className="text-[10px] text-amber-600 mt-0.5 flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" />
              Will modify data in {action.connector}
            </p>
          )}
        </div>

        {/* Usage count */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={() => setShowUsage(!showUsage)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-muted-foreground hover:bg-muted/30 transition-colors shrink-0"
            >
              <Info className="w-3 h-3" />
              {usedIn.length} scenario{usedIn.length > 1 ? "s" : ""}
            </button>
          </TooltipTrigger>
          <TooltipContent className="text-xs">Click to see which scenarios use this action</TooltipContent>
        </Tooltip>

        {/* Toggle */}
        <Switch
          checked={action.enabled}
          onCheckedChange={() => {
            onToggle();
            toast.success(
              action.enabled
                ? `${action.name} disabled across all scenarios`
                : `${action.name} enabled across all scenarios`
            );
          }}
        />
      </div>

      {/* Usage details */}
      {showUsage && (
        <div className="border-t border-border/60 px-3 pb-3 pt-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Used in scenarios:</p>
          <div className="space-y-1">
            {usedIn.map((u, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                <span className="text-muted-foreground">{u.skillName}</span>
                <span className="text-muted-foreground/40">→</span>
                <span className="text-foreground/80">"{u.scenarioIntent}"</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
