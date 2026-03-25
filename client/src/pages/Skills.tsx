/**
 * Skills — Playbook > Skills sub-tab
 * V22: Gorgias-style Markdown guidance per Scenario.
 * Each Scenario has a single editable Markdown document (the "Guidance")
 * that contains all rules, conditions, and handling logic.
 * Actions are listed separately below the guidance with individual toggles.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import Markdown from "react-markdown";
import {
  Target, ChevronLeft, ChevronRight, ChevronDown, Package, Shield, ShoppingCart,
  Pencil, Check, X, Info, AlertTriangle, Eye, Zap, MessageSquare,
  FileText, Upload, Sparkles, Bell, ArrowRight, Play, Clock,
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  disabledHint?: string;
}

interface Scenario {
  id: string;
  intent: string;
  /** Markdown guidance document — the single source of truth for this scenario */
  guidance: string;
  actions: SkillAction[];
  escalation?: string;
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
      {
        id: "ot-s1",
        intent: "Where is my order?",
        guidance: `**WHEN:** The customer asks about their order status or tracking.

### 1. Verify customer identity

**IF** the customer hasn't provided an order number or email, **THEN** ask for one of the following:
- Order number
- Email address associated with the order

### 2. Look up order and tracking

Use the order number or email to retrieve the current fulfillment status and tracking details.

- Provide the current status (e.g. Unfulfilled, In Transit, Delivered).
- If a tracking link is available, share it with the customer.

### 3. Handle delays

**IF** tracking shows "In Transit" for more than **7 business days** past the estimated delivery date, **THEN** escalate to a human agent.

**Note:** Do not speculate on delivery dates beyond what carrier data shows.`,
        actions: [
          { id: "ot-a1", name: "Look up order status", description: "Query order details including current fulfillment status and line items.", type: "read", connector: "Shopify", enabled: true },
          { id: "ot-a2", name: "Get tracking information", description: "Retrieve carrier tracking number, URL, and latest tracking events.", type: "read", connector: "Shopify", enabled: true },
        ],
        escalation: "If tracking data is unavailable for more than 48 hours, escalate to human agent.",
      },
      {
        id: "ot-s2",
        intent: "When will my order arrive?",
        guidance: `**WHEN:** The customer asks about estimated delivery date.

### 1. Retrieve tracking data

Look up the carrier tracking information for the customer's order.

### 2. Provide estimate

- **Only** provide estimated dates that come directly from carrier tracking data.
- **IF** no estimated date is available, inform the customer that tracking updates may be delayed and provide the carrier's contact info.

**Note:** Do not make promises about delivery timing.`,
        actions: [
          { id: "ot-a2b", name: "Get tracking information", description: "Retrieve carrier tracking number, URL, and latest tracking events.", type: "read", connector: "Shopify", enabled: true },
        ],
      },
      {
        id: "ot-s3",
        intent: "My order shows delivered but I didn't receive it.",
        guidance: `**WHEN:** The customer reports non-receipt despite delivery confirmation.

### 1. Verify delivery details

Look up the order and check delivery confirmation details from the carrier (date, time, delivery location).

### 2. Advise the customer

- Suggest checking with neighbors, building management, or other household members.
- Share the specific delivery details from the carrier.

### 3. Escalation

**IF** the customer confirms they still haven't received the package after checking, **THEN** escalate to a human agent.

**Note:** Do not issue refund or replacement directly — this requires human review.`,
        actions: [
          { id: "ot-a1b", name: "Look up order status", description: "Query order details including current fulfillment status.", type: "read", connector: "Shopify", enabled: true },
          { id: "ot-a2c", name: "Get tracking information", description: "Retrieve carrier tracking details and delivery confirmation.", type: "read", connector: "Shopify", enabled: true },
        ],
        escalation: "Always escalate if customer confirms non-receipt after checking surroundings.",
      },
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
      {
        id: "sp-s1",
        intent: "What does my Seel protection cover?",
        guidance: `**WHEN:** The customer asks about their protection coverage.

### 1. Look up the specific policy

Always retrieve the customer's actual policy before answering. Do not provide generic coverage information.

### 2. Explain coverage

- Clearly state the **coverage period** and what is covered.
- Mention any **exclusions** that apply.

**IF** no active policy is found, **THEN** inform the customer and suggest they check their order confirmation email.`,
        actions: [
          { id: "sp-a1", name: "Look up protection policy", description: "Retrieve customer's Seel protection policy details, coverage scope, and status.", type: "read", connector: "Seel API", enabled: true },
        ],
      },
      {
        id: "sp-s2",
        intent: "I want to file a claim.",
        guidance: `**WHEN:** The customer wants to file a protection claim.

### 1. Verify eligibility

Look up the customer's policy and confirm it is active and within the coverage period.

**IF** the policy is expired or no policy exists, **THEN** inform the customer with a clear explanation.

### 2. Collect claim details

Required information:
- Order number
- Description of the issue
- Date the issue was discovered

Photos are recommended but not mandatory.

### 3. File the claim

**IF** eligible, initiate the claim with the collected details.

**Note:** Never disclose internal claim approval criteria or scoring logic to the customer.`,
        actions: [
          { id: "sp-a1b", name: "Look up protection policy", description: "Verify customer has an active policy and check eligibility.", type: "read", connector: "Seel API", enabled: true },
          { id: "sp-a3", name: "File a claim", description: "Initiate a new protection claim with order and issue details.", type: "write", connector: "Seel API", enabled: true, disabledHint: "Agent will collect claim details and escalate to human agent for manual filing." },
        ],
        escalation: "If claim is disputed or involves partial damage with unclear liability, escalate to human agent.",
      },
      {
        id: "sp-s3",
        intent: "What's the status of my claim?",
        guidance: `**WHEN:** The customer asks about an existing claim.

### 1. Look up claim

Retrieve the claim details and current status.

### 2. Provide update

- Share the current status and any next steps.
- **IF** the claim has been pending for more than **5 business days**, acknowledge the delay and provide an updated timeline.

**Note:** Provide factual status updates only — do not predict claim outcomes.`,
        actions: [
          { id: "sp-a2", name: "Check claim status", description: "Query existing claim details including current status and resolution timeline.", type: "read", connector: "Seel API", enabled: true },
        ],
      },
      {
        id: "sp-s4",
        intent: "I want to cancel my protection policy.",
        guidance: `**WHEN:** The customer requests to cancel their protection policy.

### 1. Check eligibility

Look up the policy and verify cancellation eligibility:
- Must be within **30 days** of purchase
- **AND** no claim has been filed

**IF** outside the cancellation window or a claim exists, **THEN** explain the policy terms clearly.

### 2. Process cancellation

**IF** eligible, process the cancellation and confirm:
- Refund amount
- Expected refund timeline`,
        actions: [
          { id: "sp-a1c", name: "Look up protection policy", description: "Check policy status and cancellation eligibility.", type: "read", connector: "Seel API", enabled: true },
          { id: "sp-a4", name: "Cancel protection policy", description: "Process policy cancellation and trigger refund if eligible.", type: "write", connector: "Seel API", enabled: true, disabledHint: "Agent will confirm eligibility and escalate to human agent for manual cancellation." },
        ],
        escalation: "If customer disputes the cancellation policy terms, escalate to human agent.",
      },
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
      {
        id: "om-s1",
        intent: "I want to cancel my order.",
        guidance: `**WHEN:** The customer asks to cancel an order.

### 1. Verify the order

Confirm which order the customer wants to cancel. Ask for the order number if not provided.

### 2. Check eligibility

**IF** the order is **Unfulfilled**, **THEN** proceed with cancellation.

**IF** the order is already fulfilled or shipped, **THEN** inform the customer and suggest they initiate a return instead.

### 3. Confirm and cancel

- Always confirm the cancellation intent with the customer before proceeding.
- After successful cancellation, confirm:
  - Refund amount
  - Expected timeline (5-7 business days)
- Log the cancellation reason for analytics.`,
        actions: [
          { id: "om-a1", name: "Check order status", description: "Verify order fulfillment status and cancellation eligibility.", type: "read", connector: "Shopify", enabled: true },
          { id: "om-a2", name: "Cancel order", description: "Cancel an unfulfilled order and trigger refund to original payment method.", type: "write", connector: "Shopify", enabled: false, disabledHint: "Agent will verify eligibility and escalate to human agent for manual cancellation." },
        ],
        escalation: "If cancellation fails due to system error, escalate to human agent immediately.",
      },
      {
        id: "om-s2",
        intent: "Can I still cancel? I just placed it.",
        guidance: `**WHEN:** The customer wants to cancel a recently placed order.

### 1. Check order status immediately

Prioritize speed — the customer expects a just-placed order to be easy to cancel.

### 2. Process

**IF** the order is still **Unfulfilled**, **THEN** proceed with cancellation following standard rules.

**IF** the order has already entered the fulfillment pipeline, **THEN** inform the customer honestly.`,
        actions: [
          { id: "om-a1b", name: "Check order status", description: "Verify order fulfillment status and cancellation eligibility.", type: "read", connector: "Shopify", enabled: true },
          { id: "om-a2b", name: "Cancel order", description: "Cancel an unfulfilled order and trigger refund.", type: "write", connector: "Shopify", enabled: false, disabledHint: "Agent will verify eligibility and escalate to human agent for manual cancellation." },
        ],
      },
      {
        id: "om-s3",
        intent: "I changed my mind about my purchase.",
        guidance: `**WHEN:** The customer wants to cancel because they changed their mind.

### 1. Identify the order

Confirm which order the customer is referring to.

### 2. Check eligibility and cancel

Apply the same fulfillment-status check before cancellation. Log reason as "changed mind" for analytics.

**IF** the order contains multiple items and the customer wants **partial cancellation**, **THEN** escalate to a human agent — partial cancellation is not supported.`,
        actions: [
          { id: "om-a1c", name: "Check order status", description: "Verify order details and fulfillment status.", type: "read", connector: "Shopify", enabled: true },
          { id: "om-a2c", name: "Cancel order", description: "Cancel an unfulfilled order and trigger refund.", type: "write", connector: "Shopify", enabled: false, disabledHint: "Agent will verify eligibility and escalate to human agent for manual cancellation." },
        ],
        escalation: "Partial cancellation (cancel some items but not others) is not supported — escalate to human agent.",
      },
    ],
  },
];

const cV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const iV = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

/* ── Markdown renderer with Gorgias-like styling ── */
function GuidanceView({ content }: { content: string }) {
  return (
    <div className="guidance-markdown">
      <Markdown
        components={{
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mt-4 mb-1.5 pb-1 border-b border-border/40">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-[13px] text-foreground/80 leading-relaxed mb-2">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside ml-4 mb-2 space-y-0.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-4 mb-2 space-y-0.5">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-[13px] text-foreground/80 leading-relaxed">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/30 pl-3 my-2 text-[13px] text-foreground/70 italic">{children}</blockquote>
          ),
        }}
      />
    </div>
  );
}

/* ── Scenario Card Component ── */
function ScenarioCard({
  scenario,
  skillId,
  defaultOpen,
  onToggleAction,
  onSaveGuidance,
  onTestScenario,
}: {
  scenario: Scenario;
  skillId: string;
  defaultOpen: boolean;
  onToggleAction: (skillId: string, scenarioId: string, actionId: string) => void;
  onSaveGuidance: (skillId: string, scenarioId: string, guidance: string) => void;
  onTestScenario: (intent: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [editing, setEditing] = useState(false);
  const [editBuffer, setEditBuffer] = useState("");

  const hasWrite = scenario.actions.some(a => a.type === "write" && a.enabled);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Scenario header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/20 transition-colors"
      >
        <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium flex-1">"{scenario.intent}"</span>
        <div className="flex items-center gap-2 shrink-0">
          {hasWrite && (
            <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-600 border-amber-200">write</Badge>
          )}
          <span className="text-[11px] text-muted-foreground">{scenario.actions.length} actions</span>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-border">
          {/* Guidance section */}
          <div className="px-4 pt-3 pb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Guidance</p>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-muted-foreground/60 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="text-xs max-w-[280px]">
                    This is the complete instruction document for this scenario. Edit it in Markdown to define how the agent should handle this customer intent — including verification steps, conditions, and response guidelines.
                  </TooltipContent>
                </Tooltip>
              </div>
              {!editing ? (
                <button
                  onClick={() => { setEditBuffer(scenario.guidance); setEditing(true); }}
                  className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 transition-colors"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { onSaveGuidance(skillId, scenario.id, editBuffer); setEditing(false); toast.success("Guidance updated"); }}
                    className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80"
                  >
                    <Check className="w-3 h-3" /> Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" /> Cancel
                  </button>
                </div>
              )}
            </div>

            {editing ? (
              <Textarea
                value={editBuffer}
                onChange={e => setEditBuffer(e.target.value)}
                rows={14}
                className="text-[13px] leading-relaxed font-mono"
                placeholder="Write your guidance in Markdown..."
              />
            ) : (
              <div className="p-4 rounded-md bg-muted/15 border border-border/50">
                <GuidanceView content={scenario.guidance} />
              </div>
            )}
          </div>

          {/* Escalation — shown between guidance and actions */}
          {scenario.escalation && (
            <div className="mx-4 mb-3 flex items-start gap-2 p-2.5 rounded-md bg-orange-50/50 border border-orange-200/40">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-medium text-orange-700">Escalation</p>
                <p className="text-[11px] text-orange-600 mt-0.5">{scenario.escalation}</p>
              </div>
            </div>
          )}

          {/* Actions — separate section below guidance */}
          <div className="border-t border-border/50 px-4 py-3">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Actions</p>
            <div className="space-y-1.5">
              {scenario.actions.map(action => (
                <div key={action.id} className={cn(
                  "flex items-center gap-3 p-2.5 rounded-md border transition-colors",
                  !action.enabled && action.type === "write"
                    ? "border-border/50 bg-muted/5"
                    : "border-border/60 hover:bg-muted/10"
                )}>
                  <div className={cn(
                    "w-7 h-7 rounded flex items-center justify-center shrink-0",
                    action.type === "read" ? "bg-blue-50" : "bg-amber-50"
                  )}>
                    {action.type === "read"
                      ? <Eye className="w-3.5 h-3.5 text-blue-500" />
                      : <Zap className="w-3.5 h-3.5 text-amber-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={cn("text-xs font-medium", !action.enabled && "text-muted-foreground")}>{action.name}</p>
                      <Badge variant="outline" className={cn(
                        "text-[8px]",
                        action.type === "read" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-amber-50 text-amber-600 border-amber-200"
                      )}>
                        {action.type}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">via {action.connector}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{action.description}</p>
                    {action.type === "write" && action.enabled && (
                      <p className="text-[10px] text-amber-600 mt-0.5 flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Will modify data in {action.connector}
                      </p>
                    )}
                    {action.type === "write" && !action.enabled && action.disabledHint && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1 italic">
                        <Info className="w-2.5 h-2.5 shrink-0" />
                        {action.disabledHint}
                      </p>
                    )}
                  </div>
                  <Switch
                    checked={action.enabled}
                    onCheckedChange={() => onToggleAction(skillId, scenario.id, action.id)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Test this scenario */}
          <div className="border-t border-border/40 px-4 py-2.5">
            <button
              onClick={() => onTestScenario(scenario.intent)}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <Play className="w-3 h-3" /> Test this scenario
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Component ── */
export default function Skills() {
  const [skills, setSkills] = useState(initialSkills);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [addSkillOpen, setAddSkillOpen] = useState(false);
  const [sopBannerDismissed, setSopBannerDismissed] = useState(false);
  const [notified, setNotified] = useState(false);

  const [, navigate] = useLocation();
  const detailSkill = skills.find(s => s.id === detailId);

  const handleTestScenario = (intent: string) => {
    navigate(`/performance?test=${encodeURIComponent(intent)}`);
  };

  const toggleSkill = (id: string) => {
    setSkills(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const toggleAction = (skillId: string, scenarioId: string, actionId: string) => {
    setSkills(prev => prev.map(s => {
      if (s.id !== skillId) return s;
      return {
        ...s,
        scenarios: s.scenarios.map(sc => {
          if (sc.id !== scenarioId) return sc;
          return { ...sc, actions: sc.actions.map(a => a.id === actionId ? { ...a, enabled: !a.enabled } : a) };
        }),
      };
    }));
  };

  const saveGuidance = (skillId: string, scenarioId: string, guidance: string) => {
    setSkills(prev => prev.map(s => {
      if (s.id !== skillId) return s;
      return {
        ...s,
        scenarios: s.scenarios.map(sc => sc.id === scenarioId ? { ...sc, guidance } : sc),
      };
    }));
  };

  // ── Detail View ──
  if (detailSkill) {
    const Icon = detailSkill.icon;
    const totalActions = detailSkill.scenarios.reduce((sum, sc) => sum + sc.actions.length, 0);
    const enabledActions = detailSkill.scenarios.reduce((sum, sc) => sum + sc.actions.filter(a => a.enabled).length, 0);
    const hasEnabledWrite = detailSkill.scenarios.some(sc => sc.actions.some(a => a.type === "write" && a.enabled));

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-[800px] space-y-5">
        {/* Back */}
        <button onClick={() => setDetailId(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
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
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-muted-foreground">{detailSkill.enabled ? "Enabled" : "Disabled"}</span>
            <Switch checked={detailSkill.enabled} onCheckedChange={() => toggleSkill(detailSkill.id)} />
          </div>
        </div>

        {/* Summary bar */}
        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MessageSquare className="w-3.5 h-3.5" />
            {detailSkill.scenarios.length} scenarios
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Zap className="w-3.5 h-3.5" />
            {enabledActions} of {totalActions} actions enabled
          </div>
          {hasEnabledWrite && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600">
              <AlertTriangle className="w-3.5 h-3.5" />
              Write actions enabled
            </div>
          )}
          {detailSkill.agentCount > 0 && (
            <div className="text-xs text-muted-foreground">
              Used by {detailSkill.agentCount} agent{detailSkill.agentCount > 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Scenarios */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold">Scenarios</h3>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="text-xs max-w-[280px]">Each scenario represents a customer intent. The guidance document defines how the agent handles it. Actions below can be toggled independently.</TooltipContent>
            </Tooltip>
          </div>
          <div className="space-y-3">
            {detailSkill.scenarios.map((scenario, idx) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                skillId={detailSkill.id}
                defaultOpen={idx === 0}
                onToggleAction={toggleAction}
                onSaveGuidance={saveGuidance}
                onTestScenario={handleTestScenario}
              />
            ))}
          </div>
        </div>

        {/* SOP hint */}
        <div className="mt-6 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary/60" />
            <span>Want to auto-generate skills from your SOP? <button onClick={() => { setDetailId(null); setAddSkillOpen(true); }} className="text-primary hover:underline">Learn more</button></span>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── List View ──
  const enabledCount = skills.filter(s => s.enabled).length;

  return (
    <motion.div variants={cV} initial="hidden" animate="visible" className="p-6 max-w-[800px] space-y-4">
      {/* SOP Coming Soon Banner */}
      {!sopBannerDismissed && (
        <motion.div variants={iV} className="flex items-center gap-3 p-3.5 rounded-lg bg-gradient-to-r from-primary/5 to-violet-50 border border-primary/15">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-foreground">Coming soon: Import skills from your SOP</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Upload your team's standard operating procedures and let AI create skills automatically.</p>
          </div>
          <button onClick={() => setSopBannerDismissed(true)} className="text-muted-foreground hover:text-foreground shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* Global hint */}
      <motion.div variants={iV} className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/15">
        <Target className="w-4 h-4 text-primary shrink-0" />
        <p className="text-xs text-primary">Skills define <strong>business scenarios</strong> your agents can handle. Each scenario has a guidance document you can edit and actions you can toggle.</p>
      </motion.div>

      {/* Summary */}
      <motion.div variants={iV} className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{enabledCount} of {skills.length} skills enabled</p>
        <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5" onClick={() => setAddSkillOpen(true)}>
          <Target className="w-3.5 h-3.5" /> Add Skill
        </Button>
      </motion.div>

      {/* Add Skill Dialog */}
      <Dialog open={addSkillOpen} onOpenChange={setAddSkillOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base">Add Skill</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <button
              onClick={() => { setAddSkillOpen(false); toast.info("All available template skills are already shown in your list."); }}
              className="w-full flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/20 transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Target className="w-4.5 h-4.5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium group-hover:text-primary transition-colors">Choose from templates</p>
                <p className="text-xs text-muted-foreground mt-0.5">Select from pre-built skills designed for common support scenarios.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground mt-2.5 shrink-0 group-hover:text-primary transition-colors" />
            </button>

            <div className="w-full flex items-start gap-3 p-4 rounded-lg border border-dashed border-primary/30 bg-gradient-to-r from-primary/[0.03] to-violet-50/50 text-left relative overflow-hidden">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="w-4.5 h-4.5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Import from SOP</p>
                  <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20">Coming Soon</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Upload your team's standard operating procedures and let AI automatically generate skills, guidance, and actions.</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Upload className="w-3 h-3" /> Upload SOP documents
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Sparkles className="w-3 h-3" /> AI-powered extraction
                  </div>
                </div>
                {!notified ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 text-xs h-7 gap-1.5"
                    onClick={() => { setNotified(true); toast.success("We'll notify you when this feature is available."); }}
                  >
                    <Bell className="w-3 h-3" /> Notify me when available
                  </Button>
                ) : (
                  <p className="mt-3 text-xs text-primary flex items-center gap-1.5">
                    <Check className="w-3 h-3" /> You'll be notified when this feature launches.
                  </p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Skill Cards */}
      <motion.div variants={iV} className="space-y-3">
        {skills.map(skill => {
          const Icon = skill.icon;
          const totalActions = skill.scenarios.reduce((sum, sc) => sum + sc.actions.length, 0);
          const enabledActions = skill.scenarios.reduce((sum, sc) => sum + sc.actions.filter(a => a.enabled).length, 0);
          const writeEnabled = skill.scenarios.reduce((sum, sc) => sum + sc.actions.filter(a => a.type === "write" && a.enabled).length, 0);
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
                      <MessageSquare className="w-3 h-3" /> {skill.scenarios.length} scenarios
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Zap className="w-3 h-3" /> {enabledActions}/{totalActions} actions
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
