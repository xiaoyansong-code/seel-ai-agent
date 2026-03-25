/**
 * Actions — Playbook > Actions
 * V2: Redesigned around business objects (Order, Protection) as primary Tabs.
 * Grid card layout. Dropdown filters. Unconnected connector state.
 * Stats row removed for cleaner visual.
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Zap, Eye, AlertTriangle, Package, Shield, Search,
  Info, Link2, Link2Off, ChevronDown, Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  /** Business object this action operates on */
  object: string;
  /** Which skills/scenarios reference this action */
  usedIn: { skillName: string; scenarioIntent: string }[];
  disabledHint?: string;
}

interface ConnectorStatus {
  name: string;
  connected: boolean;
}

/* ── Demo connector statuses ── */
const connectorStatuses: ConnectorStatus[] = [
  { name: "Shopify", connected: true },
  { name: "Seel API", connected: true },
  { name: "Zendesk", connected: false },
];

function isConnected(connector: string): boolean {
  const c = connectorStatuses.find(cs => cs.name === connector);
  return c ? c.connected : false;
}

/* ── Actions data organized by business object ── */
const allActions: ActionItem[] = [
  // Order object
  {
    id: "order-lookup",
    name: "Look up order",
    description: "Query order details including fulfillment status, line items, and customer info.",
    type: "read",
    connector: "Shopify",
    enabled: true,
    object: "Order",
    usedIn: [
      { skillName: "Order Tracking", scenarioIntent: "Where is my order?" },
      { skillName: "Order Tracking", scenarioIntent: "My order shows delivered but I didn't receive it." },
      { skillName: "Order Management", scenarioIntent: "I want to cancel my order." },
    ],
  },
  {
    id: "order-tracking",
    name: "Get tracking info",
    description: "Retrieve carrier tracking number, URL, and latest shipping events.",
    type: "read",
    connector: "Shopify",
    enabled: true,
    object: "Order",
    usedIn: [
      { skillName: "Order Tracking", scenarioIntent: "Where is my order?" },
      { skillName: "Order Tracking", scenarioIntent: "When will my order arrive?" },
      { skillName: "Order Tracking", scenarioIntent: "My order shows delivered but I didn't receive it." },
    ],
  },
  {
    id: "order-cancel",
    name: "Cancel order",
    description: "Cancel an unfulfilled order and trigger refund to original payment method.",
    type: "write",
    connector: "Shopify",
    enabled: false,
    object: "Order",
    usedIn: [
      { skillName: "Order Management", scenarioIntent: "I want to cancel my order." },
      { skillName: "Order Management", scenarioIntent: "Can I still cancel? I just placed it." },
      { skillName: "Order Management", scenarioIntent: "I changed my mind about my purchase." },
    ],
    disabledHint: "Agent will verify eligibility and escalate to human agent.",
  },
  // Protection object
  {
    id: "protection-lookup",
    name: "Look up policy",
    description: "Retrieve customer's protection policy details, coverage scope, and status.",
    type: "read",
    connector: "Seel API",
    enabled: true,
    object: "Protection",
    usedIn: [
      { skillName: "Seel Protection", scenarioIntent: "What does my Seel protection cover?" },
      { skillName: "Seel Protection", scenarioIntent: "I want to file a claim." },
      { skillName: "Seel Protection", scenarioIntent: "I want to cancel my protection policy." },
    ],
  },
  {
    id: "claim-status",
    name: "Check claim status",
    description: "Query existing claim details including current status and resolution timeline.",
    type: "read",
    connector: "Seel API",
    enabled: true,
    object: "Protection",
    usedIn: [
      { skillName: "Seel Protection", scenarioIntent: "What's the status of my claim?" },
    ],
  },
  {
    id: "claim-file",
    name: "File a claim",
    description: "Initiate a new protection claim with order and issue details.",
    type: "write",
    connector: "Seel API",
    enabled: true,
    object: "Protection",
    usedIn: [
      { skillName: "Seel Protection", scenarioIntent: "I want to file a claim." },
    ],
    disabledHint: "Agent will collect claim details and escalate to human agent.",
  },
  {
    id: "protection-cancel",
    name: "Cancel policy",
    description: "Process policy cancellation and trigger refund if eligible.",
    type: "write",
    connector: "Seel API",
    enabled: true,
    object: "Protection",
    usedIn: [
      { skillName: "Seel Protection", scenarioIntent: "I want to cancel my protection policy." },
    ],
    disabledHint: "Agent will confirm eligibility and escalate to human agent.",
  },
  // Ticket object (Zendesk — not connected demo)
  {
    id: "ticket-create",
    name: "Create ticket",
    description: "Create a new support ticket in Zendesk with conversation context.",
    type: "write",
    connector: "Zendesk",
    enabled: false,
    object: "Ticket",
    usedIn: [],
    disabledHint: "Requires Zendesk connection to enable.",
  },
  {
    id: "ticket-update",
    name: "Update ticket",
    description: "Add internal notes or update ticket status and priority.",
    type: "write",
    connector: "Zendesk",
    enabled: false,
    object: "Ticket",
    usedIn: [],
    disabledHint: "Requires Zendesk connection to enable.",
  },
  {
    id: "ticket-lookup",
    name: "Look up ticket",
    description: "Retrieve ticket details, history, and associated customer information.",
    type: "read",
    connector: "Zendesk",
    enabled: false,
    object: "Ticket",
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
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
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

  // Unique objects
  const objects = useMemo(() => {
    const set = new Set(actions.map(a => a.object));
    return Array.from(set);
  }, [actions]);

  // Unique connectors
  const connectors = useMemo(() => {
    const set = new Set(actions.map(a => a.connector));
    return Array.from(set).sort();
  }, [actions]);

  // Filtered actions
  const filtered = useMemo(() => {
    return actions.filter(a => {
      if (activeObject !== "All" && a.object !== activeObject) return false;
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      if (connectorFilter !== "all" && a.connector !== connectorFilter) return false;
      return true;
    });
  }, [actions, activeObject, typeFilter, connectorFilter]);

  const toggleAction = (id: string) => {
    const action = actions.find(a => a.id === id);
    if (action && !isConnected(action.connector)) {
      toast.error(`Connect ${action.connector} first to enable this action.`);
      return;
    }
    setActions(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const tabs = ["All", ...objects];

  return (
    <motion.div variants={cV} initial="hidden" animate="visible" className="p-6 max-w-[960px] space-y-4">
      {/* Header hint */}
      <motion.div variants={iV} className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/15">
        <Zap className="w-4 h-4 text-primary shrink-0" />
        <p className="text-xs text-primary">
          Actions are the <strong>operations</strong> your agents can perform on business objects. Toggle actions on or off to control what your agent is allowed to do.
        </p>
      </motion.div>

      {/* Object Tabs */}
      <motion.div variants={iV} className="flex items-center gap-1 border-b border-border">
        {tabs.map(tab => {
          const cfg = tab !== "All" ? objectConfig[tab] : null;
          const Icon = cfg?.icon;
          const count = tab === "All" ? actions.length : actions.filter(a => a.object === tab).length;
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
            ...connectors.map(c => ({
              value: c,
              label: `${c}${isConnected(c) ? "" : " (not connected)"}`,
            })),
          ]}
          onChange={v => setConnectorFilter(v)}
        />
      </motion.div>

      {/* Action Grid */}
      {filtered.length > 0 ? (
        <motion.div variants={iV} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(action => (
            <ActionCard
              key={action.id}
              action={action}
              connected={isConnected(action.connector)}
              onToggle={() => toggleAction(action.id)}
            />
          ))}
        </motion.div>
      ) : (
        <motion.div variants={iV} className="text-center py-16">
          <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No actions match your filters.</p>
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
      !connected
        ? "border-dashed border-border/60 bg-muted/5 opacity-65"
        : action.type === "write" && action.enabled
          ? "border-amber-200/80 bg-amber-50/20"
          : "border-border bg-card hover:border-border/80 hover:shadow-sm"
    )}>
      {/* Top row: type badge + connector + toggle */}
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
            {connected
              ? <Link2 className="w-2.5 h-2.5 text-green-500" />
              : <Link2Off className="w-2.5 h-2.5 text-muted-foreground/50" />
            }
            <span className={cn(!connected && "line-through")}>{action.connector}</span>
          </div>
        </div>
        <Switch
          checked={action.enabled}
          disabled={!connected}
          onCheckedChange={() => {
            onToggle();
            if (connected) {
              toast.success(action.enabled ? `${action.name} disabled` : `${action.name} enabled`);
            }
          }}
        />
      </div>

      {/* Action name + icon */}
      <div className="flex items-start gap-2.5 mb-2">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", objCfg?.bg || "bg-muted")}>
          <ObjIcon className={cn("w-4 h-4", objCfg?.color || "text-muted-foreground")} />
        </div>
        <div className="min-w-0">
          <p className={cn("text-sm font-medium leading-tight", !connected && "text-muted-foreground")}>{action.name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{action.description}</p>
        </div>
      </div>

      {/* Status hints */}
      <div className="mt-auto pt-2">
        {!connected && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Link2Off className="w-3 h-3 shrink-0" />
            <span>Connect {action.connector} to enable</span>
          </div>
        )}
        {connected && action.type === "write" && action.enabled && (
          <div className="flex items-center gap-1.5 text-[10px] text-amber-600">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span>Will modify data in {action.connector}</span>
          </div>
        )}
        {connected && action.type === "write" && !action.enabled && action.disabledHint && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground italic">
            <Info className="w-3 h-3 shrink-0" />
            <span>{action.disabledHint}</span>
          </div>
        )}
        {connected && action.usedIn.length > 0 && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <p className="text-[10px] text-muted-foreground mt-1 cursor-help">
                Used in {action.usedIn.length} scenario{action.usedIn.length > 1 ? "s" : ""}
              </p>
            </TooltipTrigger>
            <TooltipContent className="text-xs max-w-[260px]">
              <div className="space-y-0.5">
                {action.usedIn.map((u, i) => (
                  <p key={i}>{u.skillName} → "{u.scenarioIntent}"</p>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
        {connected && action.usedIn.length === 0 && (
          <p className="text-[10px] text-muted-foreground/60 mt-1">Not used in any scenario yet</p>
        )}
      </div>
    </div>
  );
}
