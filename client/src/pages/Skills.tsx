/**
 * Skills — Playbook > Skills sub-tab
 * List view: 3 preset Skill cards (Order Tracking, Seel Protection, Order Management)
 * Detail view: description, scenarios, editable business rules, actions with toggles
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Target, ChevronLeft, ChevronRight, Package, Shield, ShoppingCart,
  Pencil, Check, X, Info, AlertTriangle, Eye, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ── Types ── */
interface SkillAction {
  id: string;
  name: string;
  description: string;
  type: "read" | "write";
  connector: string;
  enabled: boolean;
}

interface Scenario {
  intent: string;
  handling: string;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  enabled: boolean;
  agentCount: number;
  scenarios: Scenario[];
  rules: string;
  actions: SkillAction[];
}

/* ── Preset Skills Data ── */
const initialSkills: Skill[] = [
  {
    id: "order-tracking",
    name: "Order Tracking",
    description: "Track order status, provide shipping updates, and answer delivery-related questions.",
    icon: Package,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
    enabled: true,
    agentCount: 1,
    scenarios: [
      { intent: "Where is my order?", handling: "Look up order by email or order number, return current status and tracking link." },
      { intent: "When will my order arrive?", handling: "Check carrier tracking data and provide estimated delivery date." },
      { intent: "My order shows delivered but I didn't receive it.", handling: "Verify delivery status with carrier. If confirmed delivered, advise customer to check with neighbors or building management. Escalate to human agent if unresolved." },
      { intent: "I want to track multiple orders.", handling: "Look up all recent orders for the customer and provide status summary." },
    ],
    rules: `1. Always verify customer identity before sharing order details (email or order number required).
2. If tracking shows "In Transit" for more than 7 business days past estimated delivery, automatically escalate to human agent.
3. For orders showing "Delivered" but customer claims non-receipt, collect details and escalate — do not issue refund directly.
4. When carrier tracking is unavailable, inform customer that tracking updates may be delayed and provide the carrier's contact information.
5. Do not speculate on delivery dates beyond what carrier data shows.`,
    actions: [
      { id: "ot-1", name: "Look up order status", description: "Query order details including current fulfillment status and line items.", type: "read", connector: "Shopify", enabled: true },
      { id: "ot-2", name: "Get tracking information", description: "Retrieve carrier tracking number, URL, and latest tracking events.", type: "read", connector: "Shopify", enabled: true },
    ],
  },
  {
    id: "seel-protection",
    name: "Seel Protection",
    description: "Handle protection policy inquiries, claim filing, and policy cancellation requests.",
    icon: Shield,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    enabled: true,
    agentCount: 1,
    scenarios: [
      { intent: "What does my Seel protection cover?", handling: "Retrieve the customer's policy details and explain coverage scope, limits, and expiration." },
      { intent: "I want to file a claim.", handling: "Collect claim details (order number, issue description, photos if applicable), validate against policy terms, and initiate the claim process." },
      { intent: "What's the status of my claim?", handling: "Look up existing claim and provide current status, next steps, and expected timeline." },
      { intent: "I want to cancel my protection policy.", handling: "Check policy cancellation eligibility. If within cancellation window, process cancellation and confirm refund. If outside window, explain policy terms." },
    ],
    rules: `1. Always verify the customer has an active Seel protection policy before proceeding with any claim or cancellation.
2. Claims must be filed within the coverage period specified in the policy. Reject claims outside this window with a clear explanation.
3. For claim filing, require: order number, description of the issue, and date the issue was discovered. Photos are recommended but not mandatory for MVP.
4. Policy cancellation is only allowed within 30 days of purchase and before any claim has been filed.
5. If a claim is disputed or complex (e.g., partial damage, unclear liability), escalate to human agent rather than making a judgment call.
6. Never disclose internal claim approval criteria or scoring logic to the customer.`,
    actions: [
      { id: "sp-1", name: "Look up protection policy", description: "Retrieve customer's Seel protection policy details, coverage scope, and status.", type: "read", connector: "Seel API", enabled: true },
      { id: "sp-2", name: "Check claim status", description: "Query existing claim details including current status and resolution timeline.", type: "read", connector: "Seel API", enabled: true },
      { id: "sp-3", name: "File a claim", description: "Initiate a new protection claim with order and issue details.", type: "write", connector: "Seel API", enabled: true },
      { id: "sp-4", name: "Cancel protection policy", description: "Process policy cancellation and trigger refund if eligible.", type: "write", connector: "Seel API", enabled: true },
    ],
  },
  {
    id: "order-management",
    name: "Order Management",
    description: "Handle order cancellation requests with appropriate validation and safeguards.",
    icon: ShoppingCart,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50",
    enabled: false,
    agentCount: 0,
    scenarios: [
      { intent: "I want to cancel my order.", handling: "Check order fulfillment status. If unfulfilled, proceed with cancellation. If already shipped, inform customer and offer alternatives." },
      { intent: "Can I still cancel? I just placed it.", handling: "Check order status. If within cancellation window and unfulfilled, process immediately." },
      { intent: "I changed my mind about my purchase.", handling: "Confirm which order to cancel, verify eligibility, and process if allowed." },
    ],
    rules: `1. Only cancel orders that have NOT been fulfilled or shipped. If the order is already fulfilled, inform the customer and suggest they initiate a return instead.
2. Always confirm the specific order with the customer before proceeding with cancellation — never assume.
3. After successful cancellation, confirm the refund amount and expected refund timeline (typically 5-7 business days).
4. If the order contains multiple items and customer wants partial cancellation, escalate to human agent — partial cancellation is not supported in MVP.
5. Log the cancellation reason for analytics purposes.
6. If cancellation fails due to a system error, escalate to human agent immediately.`,
    actions: [
      { id: "om-1", name: "Check order status", description: "Verify order fulfillment status and cancellation eligibility.", type: "read", connector: "Shopify", enabled: true },
      { id: "om-2", name: "Cancel order", description: "Cancel an unfulfilled order and trigger refund to original payment method.", type: "write", connector: "Shopify", enabled: false },
    ],
  },
];

const cV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const iV = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

export default function Skills() {
  const [skills, setSkills] = useState(initialSkills);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editingRules, setEditingRules] = useState(false);
  const [rulesBuffer, setRulesBuffer] = useState("");

  const detailSkill = skills.find(s => s.id === detailId);

  const toggleSkill = (id: string) => {
    setSkills(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const toggleAction = (skillId: string, actionId: string) => {
    setSkills(prev => prev.map(s => {
      if (s.id !== skillId) return s;
      return { ...s, actions: s.actions.map(a => a.id === actionId ? { ...a, enabled: !a.enabled } : a) };
    }));
  };

  const startEditRules = (rules: string) => {
    setRulesBuffer(rules);
    setEditingRules(true);
  };

  const saveRules = () => {
    if (!detailId) return;
    setSkills(prev => prev.map(s => s.id === detailId ? { ...s, rules: rulesBuffer } : s));
    setEditingRules(false);
    toast.success("Business rules updated");
  };

  // ── Detail View ──
  if (detailSkill) {
    const Icon = detailSkill.icon;
    const enabledActions = detailSkill.actions.filter(a => a.enabled).length;
    const writeActions = detailSkill.actions.filter(a => a.type === "write");
    const hasEnabledWrite = writeActions.some(a => a.enabled);

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-[800px] space-y-6">
        {/* Back */}
        <button onClick={() => { setDetailId(null); setEditingRules(false); }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Skills
        </button>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", detailSkill.iconBg)}>
              <Icon className={cn("w-5 h-5", detailSkill.iconColor)} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{detailSkill.name}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{detailSkill.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{detailSkill.enabled ? "Enabled" : "Disabled"}</span>
            <Switch checked={detailSkill.enabled} onCheckedChange={() => toggleSkill(detailSkill.id)} />
          </div>
        </div>

        {/* Summary bar */}
        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Target className="w-3.5 h-3.5" />
            {detailSkill.scenarios.length} scenarios
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Zap className="w-3.5 h-3.5" />
            {enabledActions} of {detailSkill.actions.length} actions enabled
          </div>
          {detailSkill.agentCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Used by {detailSkill.agentCount} agent{detailSkill.agentCount > 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Scenarios */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold">Handling Scenarios</h3>
            <Badge variant="outline" className="text-[10px]">Auto-managed</Badge>
          </div>
          <div className="space-y-2">
            {detailSkill.scenarios.map((s, i) => (
              <div key={i} className="p-3 rounded-lg border border-border">
                <p className="text-sm font-medium text-foreground">"{s.intent}"</p>
                <p className="text-xs text-muted-foreground mt-1.5">{s.handling}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Business Rules */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Business Rules</h3>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-[260px]">These rules define how the agent handles edge cases and makes decisions. Edit them in natural language to match your business policies.</TooltipContent>
              </Tooltip>
            </div>
            {!editingRules ? (
              <Button variant="outline" size="sm" className="text-xs h-7 gap-1.5" onClick={() => startEditRules(detailSkill.rules)}>
                <Pencil className="w-3 h-3" /> Edit rules
              </Button>
            ) : (
              <div className="flex items-center gap-1.5">
                <Button size="sm" className="text-xs h-7 gap-1" onClick={saveRules}>
                  <Check className="w-3 h-3" /> Save
                </Button>
                <Button variant="outline" size="sm" className="text-xs h-7 gap-1" onClick={() => setEditingRules(false)}>
                  <X className="w-3 h-3" /> Cancel
                </Button>
              </div>
            )}
          </div>
          {editingRules ? (
            <Textarea
              value={rulesBuffer}
              onChange={e => setRulesBuffer(e.target.value)}
              rows={10}
              className="text-sm leading-relaxed"
              placeholder="Write your business rules in natural language..."
            />
          ) : (
            <div className="p-4 rounded-lg border border-border bg-muted/10">
              <div className="space-y-2">
                {detailSkill.rules.split("\n").filter(l => l.trim()).map((line, i) => (
                  <p key={i} className="text-sm text-foreground/80 leading-relaxed">{line}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold">Actions</h3>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="text-xs max-w-[260px]">Actions are operations the agent can perform. Toggle each action on or off to control what the agent is allowed to do.</TooltipContent>
            </Tooltip>
          </div>

          {/* Write action warning */}
          {hasEnabledWrite && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200/60 mb-3">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700">Write actions are enabled. The agent will be able to modify data in external systems on behalf of your customers.</p>
            </div>
          )}

          <div className="space-y-2">
            {detailSkill.actions.map(action => (
              <div key={action.id} className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/10 transition-colors">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  action.type === "read" ? "bg-blue-50" : "bg-amber-50"
                )}>
                  {action.type === "read"
                    ? <Eye className="w-4 h-4 text-blue-500" />
                    : <Zap className="w-4 h-4 text-amber-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{action.name}</p>
                    <Badge variant="outline" className={cn(
                      "text-[9px]",
                      action.type === "read" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-amber-50 text-amber-600 border-amber-200"
                    )}>
                      {action.type}
                    </Badge>
                    <Badge variant="outline" className="text-[9px]">via {action.connector}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                  {action.type === "write" && (
                    <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      This action will modify data in {action.connector}
                    </p>
                  )}
                </div>
                <Switch
                  checked={action.enabled}
                  onCheckedChange={() => toggleAction(detailSkill.id, action.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // ── List View ──
  const enabledCount = skills.filter(s => s.enabled).length;

  return (
    <motion.div variants={cV} initial="hidden" animate="visible" className="p-6 max-w-[800px] space-y-4">
      {/* Global hint */}
      <motion.div variants={iV} className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/15">
        <Target className="w-4 h-4 text-primary shrink-0" />
        <p className="text-xs text-primary">Skills define <strong>business scenarios</strong> your agents can handle. Each skill contains handling logic, business rules, and the actions the agent is allowed to perform.</p>
      </motion.div>

      {/* Summary */}
      <motion.div variants={iV} className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{enabledCount} of {skills.length} skills enabled</p>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5 opacity-50 cursor-not-allowed">
              <Target className="w-3.5 h-3.5" /> Add Skill
            </Button>
          </TooltipTrigger>
          <TooltipContent className="text-xs">Custom skills will be available in a future release.</TooltipContent>
        </Tooltip>
      </motion.div>

      {/* Skill Cards */}
      <motion.div variants={iV} className="space-y-3">
        {skills.map(skill => {
          const Icon = skill.icon;
          const enabledActions = skill.actions.filter(a => a.enabled).length;
          const writeEnabled = skill.actions.filter(a => a.type === "write" && a.enabled).length;
          return (
            <div
              key={skill.id}
              className={cn(
                "p-4 rounded-lg border transition-all cursor-pointer",
                skill.enabled
                  ? "border-border hover:border-primary/30 hover:shadow-sm bg-card"
                  : "border-border/60 bg-muted/20 opacity-70 hover:opacity-90"
              )}
              onClick={() => setDetailId(skill.id)}
            >
              <div className="flex items-start gap-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", skill.iconBg)}>
                  <Icon className={cn("w-5 h-5", skill.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{skill.name}</h3>
                    <Badge variant={skill.enabled ? "default" : "secondary"} className={cn(
                      "text-[9px]",
                      skill.enabled ? "bg-primary/15 text-primary" : ""
                    )}>
                      {skill.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{skill.description}</p>
                  <div className="flex items-center gap-4 mt-2.5">
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Target className="w-3 h-3" /> {skill.scenarios.length} scenarios
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Zap className="w-3 h-3" /> {enabledActions} actions
                    </span>
                    {writeEnabled > 0 && (
                      <span className="flex items-center gap-1 text-[11px] text-amber-600">
                        <AlertTriangle className="w-3 h-3" /> {writeEnabled} write
                      </span>
                    )}
                    {skill.agentCount > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        Used by {skill.agentCount} agent{skill.agentCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                  <Switch checked={skill.enabled} onCheckedChange={() => toggleSkill(skill.id)} />
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-3" />
              </div>
            </div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
