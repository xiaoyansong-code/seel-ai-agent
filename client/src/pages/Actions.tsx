/**
 * Actions — Playbook > Actions
 * Separated connected vs unconnected actions into distinct sections.
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Zap, Eye, AlertTriangle, Package, Shield, Search,
  Info, Link2, Link2Off, ChevronDown, Check, X, Plug,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
  object: string;
  usedIn: string[];
  disabledHint?: string;
}

interface ConnectorStatus {
  name: string;
  connected: boolean;
  setupUrl?: string;
}

/* ── Demo connector statuses ── */
const connectorStatuses: ConnectorStatus[] = [
  { name: "Shopify", connected: true },
  { name: "Seel API", connected: true },
  { name: "Zendesk", connected: false, setupUrl: "/seel/integrations" },
];

function isConnected(connector: string): boolean {
  const c = connectorStatuses.find(cs => cs.name === connector);
  return c ? c.connected : false;
}

/* ── Actions data ── */
const allActions: ActionItem[] = [
  {
    id: "order-lookup", name: "Look up order",
    description: "Query order details including fulfillment status, line items, and customer info.",
    type: "read", connector: "Shopify", enabled: true, object: "Order",
    usedIn: ["Order Tracking", "Order Cancellation"],
  },
  {
    id: "order-tracking", name: "Get tracking info",
    description: "Retrieve carrier tracking number, URL, and latest shipping events.",
    type: "read", connector: "Shopify", enabled: true, object: "Order",
    usedIn: ["Order Tracking"],
  },
  {
    id: "order-cancel", name: "Cancel order",
    description: "Cancel an unfulfilled order and trigger refund to original payment method.",
    type: "write", connector: "Shopify", enabled: false, object: "Order",
    usedIn: ["Order Cancellation"],
    disabledHint: "Agent will verify eligibility and escalate to human agent.",
  },
  {
    id: "protection-lookup", name: "Look up policy",
    description: "Retrieve customer's protection policy details, coverage scope, and status.",
    type: "read", connector: "Seel API", enabled: true, object: "Protection",
    usedIn: ["Seel Protection"],
  },
  {
    id: "claim-status", name: "Check claim status",
    description: "Query existing claim details including current status and resolution timeline.",
    type: "read", connector: "Seel API", enabled: true, object: "Protection",
    usedIn: ["Seel Protection"],
  },
  {
    id: "claim-file", name: "File a claim",
    description: "Initiate a new protection claim with order and issue details.",
    type: "write", connector: "Seel API", enabled: true, object: "Protection",
    usedIn: ["Seel Protection"],
    disabledHint: "Agent will collect claim details and escalate to human agent.",
  },
  {
    id: "protection-cancel", name: "Cancel policy",
    description: "Process policy cancellation and trigger refund if eligible.",
    type: "write", connector: "Seel API", enabled: true, object: "Protection",
    usedIn: ["Seel Protection"],
    disabledHint: "Agent will confirm eligibility and escalate to human agent.",
  },
  {
    id: "ticket-create", name: "Create ticket",
    description: "Create a new support ticket in Zendesk with conversation context.",
    type: "write", connector: "Zendesk", enabled: false, object: "Ticket",
    usedIn: [],
    disabledHint: "Requires Zendesk connection to enable.",
  },
  {
    id: "ticket-update", name: "Update ticket",
    description: "Add internal notes or update ticket status and priority.",
    type: "write", connector: "Zendesk", enabled: false, object: "Ticket",
    usedIn: [],
    disabledHint: "Requires Zendesk connection to enable.",
  },
  {
    id: "ticket-lookup", name: "Look up ticket",
    description: "Retrieve ticket details, history, and associated customer information.",
    type: "read", connector: "Zendesk", enabled: false, object: "Ticket",
    usedIn: [],
  },
];

/* ── Business object config ── */
const objectConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  Order: { icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
  Protection: { icon: Shield, color: "text-primary", bg: "bg-primary/10" },
  Ticket: { icon: Zap, color: "text-violet-600", bg: "bg-violet-50" },
};

type TypeFilter = "all" | "read" | "write";

const cV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const iV = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

/* ── Dropdown Component ── */
function Dropdown({
  label, value, options, onChange,
}: {
  label: string; value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card text-xs hover:bg-muted/30 transition-colors"
      >
        <span className="text-muted-foreground">{label}:</span>
        <span className="font-medium">{selected?.label || value}</span>
        <ChevronDown className={cn("w-3 h-3 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 min-w-[160px] rounded-md border border-border bg-card shadow-lg py-1">
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-muted/30 transition-colors",
                  value === opt.value && "text-primary font-medium"
                )}
              >
                {value === opt.value && <Check className="w-3 h-3 text-primary" />}
                {value !== opt.value && <span className="w-3" />}
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Main Component ── */
export default function Actions() {
  const [actions, setActions] = useState<ActionItem[]>(allActions);
  const [activeObject, setActiveObject] = useState("All");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [connectorFilter, setConnectorFilter] = useState("all");
  const [showTip, setShowTip] = useState(true);

  const objects = useMemo(() => {
    const set = new Set(actions.map(a => a.object));
    return Array.from(set);
  }, [actions]);

  const connectors = useMemo(() => {
    const set = new Set(actions.map(a => a.connector));
    return Array.from(set).sort();
  }, [actions]);

  // Split connected vs unconnected
  const connectedActions = useMemo(() => {
    return actions.filter(a => isConnected(a.connector)).filter(a => {
      if (activeObject !== "All" && a.object !== activeObject) return false;
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      if (connectorFilter !== "all" && a.connector !== connectorFilter) return false;
      return true;
    });
  }, [actions, activeObject, typeFilter, connectorFilter]);

  const unconnectedActions = useMemo(() => {
    return actions.filter(a => !isConnected(a.connector));
  }, [actions]);

  // Group unconnected by connector
  const unconnectedByConnector = useMemo(() => {
    const map = new Map<string, ActionItem[]>();
    unconnectedActions.forEach(a => {
      if (!map.has(a.connector)) map.set(a.connector, []);
      map.get(a.connector)!.push(a);
    });
    return Array.from(map.entries());
  }, [unconnectedActions]);

  const toggleAction = (id: string) => {
    const action = actions.find(a => a.id === id);
    if (action && !isConnected(action.connector)) {
      toast.error(`Connect ${action.connector} first to enable this action.`);
      return;
    }
    setActions(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const connectedObjects = useMemo(() => {
    const set = new Set(actions.filter(a => isConnected(a.connector)).map(a => a.object));
    return Array.from(set);
  }, [actions]);

  const tabs = ["All", ...connectedObjects];

  return (
    <motion.div variants={cV} initial="hidden" animate="visible" className="p-6 max-w-[960px] space-y-4">
      {/* Dismissible tip */}
      {showTip && (
        <motion.div variants={iV} className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/15">
          <Zap className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs text-primary flex-1">
            Actions are the <strong>operations</strong> your agents can perform on business objects. Toggle actions on or off to control what your agent is allowed to do.
          </p>
          <button onClick={() => setShowTip(false)} className="text-primary/50 hover:text-primary transition-colors shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* Object Tabs — only connected objects */}
      <motion.div variants={iV} className="flex items-center gap-1 border-b border-border">
        {tabs.map(tab => {
          const cfg = tab !== "All" ? objectConfig[tab] : null;
          const Icon = cfg?.icon;
          const count = tab === "All"
            ? actions.filter(a => isConnected(a.connector)).length
            : actions.filter(a => a.object === tab && isConnected(a.connector)).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveObject(tab)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-[1px] transition-colors",
                activeObject === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {Icon && <Icon className={cn("w-3.5 h-3.5", activeObject === tab ? cfg?.color : "text-muted-foreground")} />}
              {tab}
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full",
                activeObject === tab ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* Filters row */}
      <motion.div variants={iV} className="flex items-center gap-2">
        <Dropdown
          label="Type"
          value={typeFilter}
          options={[
            { value: "all", label: "All" },
            { value: "read", label: "Read" },
            { value: "write", label: "Write" },
          ]}
          onChange={v => setTypeFilter(v as TypeFilter)}
        />
        <Dropdown
          label="Connector"
          value={connectorFilter}
          options={[
            { value: "all", label: "All" },
            ...connectors.filter(c => isConnected(c)).map(c => ({
              value: c,
              label: c,
            })),
          ]}
          onChange={v => setConnectorFilter(v)}
        />
      </motion.div>

      {/* Connected Actions Grid */}
      {connectedActions.length > 0 ? (
        <motion.div variants={iV} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {connectedActions.map(action => (
            <ActionCard
              key={action.id}
              action={action}
              connected={true}
              onToggle={() => toggleAction(action.id)}
            />
          ))}
        </motion.div>
      ) : (
        <motion.div variants={iV} className="text-center py-12">
          <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No actions match your filters.</p>
        </motion.div>
      )}

      {/* ── Unconnected Actions Section ── */}
      {unconnectedByConnector.length > 0 && (
        <motion.div variants={iV} className="mt-6 pt-6 border-t border-border/60">
          <div className="flex items-center gap-2 mb-1">
            <Link2Off className="w-4 h-4 text-muted-foreground/60" />
            <h2 className="text-sm font-semibold text-muted-foreground">Unlock More Actions</h2>
          </div>
          <p className="text-[11px] text-muted-foreground/70 mb-4">
            Connect additional platforms to enable these actions for your agents.
          </p>

          <div className="space-y-4">
            {unconnectedByConnector.map(([connectorName, connectorActions]) => {
              const connectorInfo = connectorStatuses.find(c => c.name === connectorName);
              return (
                <div key={connectorName} className="rounded-xl border border-dashed border-border/70 bg-muted/10 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-muted/60 flex items-center justify-center">
                        <Plug className="w-3.5 h-3.5 text-muted-foreground/60" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold">{connectorName}</p>
                        <p className="text-[10px] text-muted-foreground">Not connected</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5 h-7"
                      onClick={() => toast.info(`Redirecting to ${connectorName} setup...`)}
                    >
                      <Plug className="w-3 h-3" /> Connect {connectorName}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {connectorActions.map(action => {
                      const objCfg = objectConfig[action.object];
                      const ObjIcon = objCfg?.icon || Zap;
                      return (
                        <div key={action.id} className="rounded-lg border border-border/40 bg-card/50 p-3 opacity-60">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Badge variant="outline" className={cn(
                              "text-[8px]",
                              action.type === "read" ? "bg-blue-50/50 text-blue-500 border-blue-200/50" : "bg-amber-50/50 text-amber-500 border-amber-200/50"
                            )}>
                              {action.type === "read" ? (
                                <span className="flex items-center gap-0.5"><Eye className="w-2 h-2" /> read</span>
                              ) : (
                                <span className="flex items-center gap-0.5"><Zap className="w-2 h-2" /> write</span>
                              )}
                            </Badge>
                            <span className="text-[9px] text-muted-foreground/50">{action.object}</span>
                          </div>
                          <p className="text-xs font-medium text-muted-foreground">{action.name}</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5 line-clamp-2">{action.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ── Action Card Component ── */
function ActionCard({
  action,
  connected,
  onToggle,
}: {
  action: ActionItem;
  connected: boolean;
  onToggle: () => void;
}) {
  const objCfg = objectConfig[action.object];
  const ObjIcon = objCfg?.icon || Zap;

  return (
    <div className={cn(
      "rounded-lg border p-4 transition-all flex flex-col",
      action.type === "write" && action.enabled
        ? "border-amber-200/80 bg-amber-50/20"
        : "border-border bg-card hover:border-border/80 hover:shadow-sm"
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className={cn(
            "text-[9px]",
            action.type === "read" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-amber-50 text-amber-600 border-amber-200"
          )}>
            {action.type === "read" ? (
              <span className="flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" /> read</span>
            ) : (
              <span className="flex items-center gap-0.5"><Zap className="w-2.5 h-2.5" /> write</span>
            )}
          </Badge>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Link2 className="w-2.5 h-2.5 text-green-500" />
            <span>{action.connector}</span>
          </div>
        </div>
        <Switch
          checked={action.enabled}
          onCheckedChange={() => {
            onToggle();
            toast.success(action.enabled ? `${action.name} disabled` : `${action.name} enabled`);
          }}
        />
      </div>

      <div className="flex items-start gap-2.5 mb-2">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", objCfg?.bg || "bg-muted")}>
          <ObjIcon className={cn("w-4 h-4", objCfg?.color || "text-muted-foreground")} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium leading-tight">{action.name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{action.description}</p>
        </div>
      </div>

      <div className="mt-auto pt-2">
        {action.type === "write" && action.enabled && (
          <div className="flex items-center gap-1.5 text-[10px] text-amber-600">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span>Will modify data in {action.connector}</span>
          </div>
        )}
        {action.type === "write" && !action.enabled && action.disabledHint && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground italic">
            <Info className="w-3 h-3 shrink-0" />
            <span>{action.disabledHint}</span>
          </div>
        )}
        {action.usedIn.length > 0 && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <p className="text-[10px] text-muted-foreground mt-1 cursor-help">
                Used in {action.usedIn.length} skill{action.usedIn.length > 1 ? "s" : ""}
              </p>
            </TooltipTrigger>
            <TooltipContent className="text-xs max-w-[260px]">
              <div className="space-y-0.5">
                {action.usedIn.map((skillName, i) => (
                  <p key={i}>{skillName}</p>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
        {action.usedIn.length === 0 && (
          <p className="text-[10px] text-muted-foreground/60 mt-1">Not used in any skill yet</p>
        )}
      </div>
    </div>
  );
}
