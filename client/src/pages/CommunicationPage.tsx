/* ──────────────────────────────────────────────────────────
   AI Support → Communication tab.
   Left panel: Team Lead (fixed) + Reps section.
   Right area: conversation with selected entity.
   - Team Lead: Feishu-style topic cards with reply previews + full thread panel
   - Rep: Onboarding greeting (scenarios + mode) → Escalation feed + Profile panel
   ──────────────────────────────────────────────────────────── */

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Send, Check, X, Reply, Bot, List, Plus,
  ArrowRight, ChevronDown, ChevronUp, MessageCircle,
  AlertTriangle, ExternalLink, Pencil, Upload,
  FileText, Sparkles, CheckCircle2, Link2, Eye,
  Rocket, Power, HelpCircle, Settings, Zap, User,
  AlertCircleIcon, Globe, UserPlus, Clock, BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  TOPICS, ESCALATION_TICKETS, ACTION_PERMISSIONS, AGENT_IDENTITY, AGENT_MODE,
  PERFORMANCE_SUMMARY,
  type Topic, type EscalationTicket, type EscalationStatus,
  type ActionPermission, type AgentIdentity, type AgentMode,
  type PerformanceMetric,
} from "@/lib/mock-data";

// ══════════════════════════════════════════════════════════
// ── SHARED TYPES & HELPERS ──────────────────────────────
// ══════════════════════════════════════════════════════════

interface RuleProposal {
  type: "new" | "update";
  ruleName: string;
  observation: string;
  proposal: string;
  ruleChange: string;
  ruleBefore?: string;
  sourceTickets: { id: string; label: string }[];
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDateGroup(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date("2026-03-27T10:00:00Z");
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today.getTime() - msgDate.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date("2026-03-27T10:00:00Z");
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function renderMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.trim() === "") return <div key={i} className="h-1.5" />;
    if (line.startsWith("- ")) {
      return (
        <div key={i} className="flex gap-1.5 ml-1">
          <span className="text-muted-foreground mt-0.5">·</span>
          <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>") }} />
        </div>
      );
    }
    if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.+)/);
      if (match) {
        return (
          <div key={i} className="flex gap-1.5 ml-1">
            <span className="text-muted-foreground shrink-0">{match[1]}.</span>
            <span dangerouslySetInnerHTML={{ __html: match[2].replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>") }} />
          </div>
        );
      }
    }
    if (line.startsWith("> ")) {
      return (
        <div key={i} className="border-l-2 border-muted-foreground/20 pl-2.5 ml-1 my-1">
          <span className="italic text-muted-foreground" dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>") }} />
        </div>
      );
    }
    return <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>") }} />;
  });
}

// ── Build RuleProposal from Topic ──

function buildRuleProposal(topic: Topic): RuleProposal | undefined {
  if (topic.proposedRule) {
    return {
      type: "new",
      ruleName: topic.proposedRule.category + " — " + topic.title,
      observation: topic.messages[0]?.content.split("\n").filter(l => !l.startsWith("> ") && !l.includes("Proposed rule:") && !l.includes("Should I adopt")).join("\n").trim() || topic.preview,
      proposal: topic.proposedRule.text,
      ruleChange: topic.proposedRule.text,
      sourceTickets: topic.proposedRule.evidence.map((e, i) => {
        const ticketMatch = e.match(/#(\d+)/);
        return { id: ticketMatch ? ticketMatch[1] : `src-${i}`, label: e };
      }),
    };
  }
  if (topic.type === "escalation_review" && topic.id === "t-3") {
    return {
      type: "update",
      ruleName: "Damaged Item Handling",
      observation: "I escalated ticket #4412 because the customer reported a damaged ceramic vase but didn't provide a photo. You processed a replacement immediately without asking for a photo. The order was $34.99.",
      proposal: "Skip photo requirements for low-value items to reduce customer friction.",
      ruleBefore: "Require photo evidence for all damage claims regardless of order value.",
      ruleChange: "For damage claims on items under $80, process replacement or refund without photo. For items $80+, still request photo.",
      sourceTickets: [{ id: "4412", label: "Ticket #4412 — damaged ceramic vase, no photo required" }],
    };
  }
  if (topic.id === "t-7") {
    return {
      type: "update",
      ruleName: "Return Shipping Cost",
      observation: "You denied my approval request on ticket #4498. I wanted to charge the customer $8.95 return shipping for a defective item.",
      proposal: "Differentiate return shipping cost between defective items and change-of-mind returns.",
      ruleBefore: "Customer pays $8.95 return shipping fee for all returns.",
      ruleChange: "Defective/wrong items → free return shipping (we pay). Change of mind → customer pays ($8.95 deducted from refund).",
      sourceTickets: [{ id: "4498", label: "Ticket #4498 — denied approval for defective item shipping charge" }],
    };
  }
  return undefined;
}

// ══════════════════════════════════════════════════════════
// ── SMALL SHARED COMPONENTS ─────────────────────────────
// ══════════════════════════════════════════════════════════

function Tip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground/50 hover:text-muted-foreground cursor-help transition-colors">
          <HelpCircle className="w-3 h-3" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[260px] text-[12px] leading-relaxed bg-foreground text-background">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

// ══════════════════════════════════════════════════════════
// ── PROPOSED RULE CARD (structured) ─────────────────────
// ══════════════════════════════════════════════════════════

function ProposedRuleCard({
  proposal,
  hasActions,
  topicId,
  onAction,
}: {
  proposal: RuleProposal;
  hasActions: boolean;
  topicId: string;
  onAction?: (topicId: string, action: string) => void;
}) {
  const [showFullChange, setShowFullChange] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-white overflow-hidden">
      {/* Header */}
      <div className="px-3.5 py-2 bg-muted/30 border-b border-border/50 flex items-center gap-2">
        <div className={cn("w-1.5 h-1.5 rounded-full", proposal.type === "new" ? "bg-emerald-400" : "bg-amber-400")} />
        <span className="text-[11.5px] font-semibold text-foreground flex-1 truncate">
          {proposal.type === "new" ? "Proposed New Rule" : "Proposed Rule Update"}: {proposal.ruleName}
        </span>
        <Badge variant="secondary" className="h-4 text-[8px] px-1.5 shrink-0">
          {proposal.type === "new" ? "NEW" : "UPDATE"}
        </Badge>
      </div>

      <div className="px-3.5 py-2.5 space-y-3">
        {/* Observation */}
        <div>
          <p className="text-[9.5px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Observation</p>
          <p className="text-[11.5px] text-foreground leading-relaxed">{proposal.observation}</p>
        </div>

        {/* Proposal rationale */}
        <div>
          <p className="text-[9.5px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Proposal</p>
          <p className="text-[11.5px] text-foreground leading-relaxed">{proposal.proposal}</p>
        </div>

        {/* Rule Change */}
        <div>
          <p className="text-[9.5px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Rule Change</p>
          <div className="rounded-md bg-muted/20 border border-border/40 px-3 py-2 space-y-1.5">
            {proposal.ruleBefore && (
              <div className="flex gap-2">
                <span className="text-[10px] font-medium text-red-400 w-12 shrink-0 mt-0.5">Before</span>
                <p className="text-[11px] text-muted-foreground line-through leading-relaxed">{proposal.ruleBefore}</p>
              </div>
            )}
            <div className="flex gap-2">
              <span className="text-[10px] font-medium text-emerald-500 w-12 shrink-0 mt-0.5">{proposal.ruleBefore ? "After" : "Rule"}</span>
              <p className="text-[11px] text-foreground leading-relaxed">
                {proposal.ruleChange.length > 200 && !showFullChange
                  ? proposal.ruleChange.slice(0, 200) + "..."
                  : proposal.ruleChange}
              </p>
            </div>
            {proposal.ruleChange.length > 200 && (
              <button
                onClick={() => setShowFullChange(!showFullChange)}
                className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
              >
                {showFullChange ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show full change</>}
              </button>
            )}
          </div>
        </div>

        {/* Source tickets — shown as links */}
        {proposal.sourceTickets.length > 0 && (
          <div>
            <p className="text-[9.5px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Source</p>
            <div className="space-y-0.5">
              {proposal.sourceTickets.map((src) => (
                <a
                  key={src.id}
                  href={`https://coastalliving.zendesk.com/agent/tickets/${src.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10.5px] text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  {src.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {hasActions && onAction && (
        <div className="px-3.5 py-2 border-t border-border/50 bg-muted/10 flex items-center gap-1.5">
          <button
            onClick={() => onAction(topicId, "accept")}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[10.5px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <Check className="w-3 h-3" /> Accept
          </button>
          <button
            onClick={() => onAction(topicId, "reject")}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[10.5px] font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          >
            <X className="w-3 h-3" /> Reject
          </button>
          <button
            onClick={() => onAction(topicId, "reply")}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[10.5px] font-medium text-muted-foreground hover:bg-accent transition-colors ml-auto"
          >
            <Reply className="w-3 h-3" /> Reply
          </button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── TOPIC CARD (Feishu-style grouped) ───────────────────
// ══════════════════════════════════════════════════════════

function TopicCard({
  topic,
  onOpenThread,
  onAction,
}: {
  topic: Topic;
  onOpenThread: (topicId: string) => void;
  onAction: (topicId: string, action: string) => void;
}) {
  const isResolved = topic.status === "resolved";
  const ruleProposal = buildRuleProposal(topic);
  const hasActions = !isResolved && topic.status !== "read" && ruleProposal !== undefined;
  const msgs = topic.messages;
  const replyCount = msgs.length;

  // Build reply preview: first 2 + last 3 (if many), or all if few
  const hiddenCount = Math.max(0, replyCount - 5);
  const previewReplies = useMemo(() => {
    if (replyCount <= 5) return msgs;
    return [...msgs.slice(0, 2), ...msgs.slice(-3)];
  }, [msgs, replyCount]);

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden hover:border-border/80 transition-colors">
      {/* Topic header — first message as the topic body */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
            <span className="text-[11px]">👔</span>
          </div>
          <span className="text-[11px] font-semibold text-foreground">Alex (Team Lead)</span>
          <span className="text-[9px] text-muted-foreground/50">{formatRelativeTime(topic.createdAt)}</span>
          <div className="flex-1" />
          <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", isResolved ? "bg-emerald-400" : "bg-amber-400")} />
        </div>

        {/* First message content */}
        {msgs[0] && (
          <div className="text-[12px] leading-relaxed text-foreground ml-8">
            {ruleProposal ? (
              <ProposedRuleCard
                proposal={ruleProposal}
                hasActions={hasActions}
                topicId={topic.id}
                onAction={onAction}
              />
            ) : (
              <div className="rounded-lg bg-muted/20 px-3 py-2">
                <div className="line-clamp-4 whitespace-pre-wrap">
                  {renderMarkdown(msgs[0].content)}
                </div>
                {msgs[0].content.split("\n").length > 4 && (
                  <button
                    onClick={() => onOpenThread(topic.id)}
                    className="text-[10px] text-primary hover:underline mt-1"
                  >
                    Read more
                  </button>
                )}
                {/* Actions for non-rule topics that have message actions */}
                {!isResolved && msgs[0].actions && msgs[0].actions.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/30">
                    {msgs[0].actions.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => onAction(topic.id, action.type)}
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors",
                          action.type === "accept" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" :
                          action.type === "reject" ? "bg-red-50 text-red-600 hover:bg-red-100" :
                          "text-muted-foreground hover:bg-accent"
                        )}
                      >
                        {action.type === "accept" && <Check className="w-3 h-3" />}
                        {action.type === "reject" && <X className="w-3 h-3" />}
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reply previews — Feishu-style */}
      {replyCount > 1 && (
        <div className="px-4 pb-3 ml-8">
          {hiddenCount > 0 && (
            <button
              onClick={() => onOpenThread(topic.id)}
              className="text-[10px] text-primary hover:underline mb-1.5 flex items-center gap-0.5"
            >
              View {hiddenCount} earlier {hiddenCount === 1 ? "reply" : "replies"}
            </button>
          )}
          <div className="space-y-1">
            {previewReplies.slice(1).map((msg) => (
              <div key={msg.id} className="flex items-start gap-1.5">
                {msg.sender === "ai" ? (
                  <div className="w-4 h-4 rounded-full bg-teal-50 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[7px]">👔</span>
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[7px] font-medium text-primary">JC</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-medium text-foreground mr-1">
                    {msg.sender === "ai" ? "Alex" : "You"}
                  </span>
                  <span className="text-[10px] text-muted-foreground line-clamp-1">
                    {msg.content.replace(/\*\*/g, "").replace(/\n/g, " ").slice(0, 100)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Reply to topic link */}
          <button
            onClick={() => onOpenThread(topic.id)}
            className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground hover:text-primary transition-colors"
          >
            <MessageCircle className="w-3 h-3" /> Reply to topic
          </button>
        </div>
      )}

      {/* Single-message topic: show reply link */}
      {replyCount === 1 && (
        <div className="px-4 pb-3 ml-8">
          <button
            onClick={() => onOpenThread(topic.id)}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
          >
            <MessageCircle className="w-3 h-3" /> Reply to topic
          </button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── FULL THREAD PANEL (right side) ──────────────────────
// ══════════════════════════════════════════════════════════

interface ThreadReply {
  id: string;
  sender: "ai" | "manager";
  content: string;
  timestamp: string;
}

function FullThreadPanel({
  topic,
  onClose,
  onAction,
}: {
  topic: Topic;
  onClose: () => void;
  onAction: (topicId: string, action: string) => void;
}) {
  const [input, setInput] = useState("");
  const [extraReplies, setExtraReplies] = useState<ThreadReply[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const isResolved = topic.status === "resolved";
  const ruleProposal = buildRuleProposal(topic);
  const hasActions = !isResolved && topic.status !== "read" && ruleProposal !== undefined;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [extraReplies.length]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newReply: ThreadReply = {
      id: `tr-${Date.now()}`,
      sender: "manager",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    setExtraReplies((prev) => [...prev, newReply]);
    setInput("");
    setTimeout(() => {
      setExtraReplies((prev) => [
        ...prev,
        {
          id: `tr-ai-${Date.now()}`,
          sender: "ai",
          content: "Got it. I'll take that into account and update the rule accordingly. Let me revise the proposal.",
          timestamp: new Date().toISOString(),
        },
      ]);
    }, 1500);
  };

  return (
    <div className="w-[380px] border-l border-border bg-white flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-10 border-b border-border shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <MessageCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-[12px] font-semibold text-foreground truncate">{topic.title}</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors shrink-0">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Status bar */}
      <div className="px-4 py-1.5 border-b border-border/50 bg-muted/10 flex items-center gap-2">
        <div className={cn("w-1.5 h-1.5 rounded-full", isResolved ? "bg-emerald-400" : "bg-amber-400")} />
        <span className="text-[10px] text-muted-foreground">{isResolved ? "Resolved" : "Waiting for your response"}</span>
        <span className="text-[10px] text-muted-foreground/50 ml-auto">{topic.messages.length + extraReplies.length} messages</span>
      </div>

      {/* Full conversation */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-3 space-y-3">
          {topic.messages.map((msg, idx) => (
            <div key={msg.id} className={cn("flex gap-2", msg.sender === "manager" && "flex-row-reverse")}>
              {msg.sender === "ai" ? (
                <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px]">👔</span>
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[9px] font-medium text-primary">JC</span>
                </div>
              )}
              <div className={cn("max-w-[85%] min-w-0", msg.sender === "manager" && "text-right")}>
                <div className={cn("flex items-center gap-1.5 mb-0.5", msg.sender === "manager" && "justify-end")}>
                  <span className="text-[10px] font-medium text-foreground">{msg.sender === "ai" ? "Alex" : "You"}</span>
                  <span className="text-[9px] text-muted-foreground/50">{formatTime(msg.timestamp)}</span>
                </div>
                <div className={cn(
                  "rounded-xl px-3 py-2 inline-block text-left",
                  msg.sender === "ai" ? "bg-muted/40 text-foreground rounded-tl-sm" : "bg-primary/6 text-foreground rounded-tr-sm"
                )}>
                  <div className="text-[12px] leading-relaxed whitespace-pre-wrap">
                    {renderMarkdown(msg.content)}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Rule proposal card in thread */}
          {ruleProposal && (
            <div className="ml-8">
              <ProposedRuleCard
                proposal={ruleProposal}
                hasActions={hasActions}
                topicId={topic.id}
                onAction={onAction}
              />
            </div>
          )}

          {/* Extra replies */}
          {extraReplies.map((reply) => (
            <div key={reply.id} className={cn("flex gap-2", reply.sender === "manager" && "flex-row-reverse")}>
              {reply.sender === "ai" ? (
                <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px]">👔</span>
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[9px] font-medium text-primary">JC</span>
                </div>
              )}
              <div className={cn("max-w-[85%] min-w-0", reply.sender === "manager" && "text-right")}>
                <div className={cn("flex items-center gap-1.5 mb-0.5", reply.sender === "manager" && "justify-end")}>
                  <span className="text-[10px] font-medium text-foreground">{reply.sender === "ai" ? "Alex" : "You"}</span>
                  <span className="text-[9px] text-muted-foreground/50">just now</span>
                </div>
                <div className={cn(
                  "rounded-xl px-3 py-2 inline-block text-left",
                  reply.sender === "ai" ? "bg-muted/40 text-foreground rounded-tl-sm" : "bg-primary/6 text-foreground rounded-tr-sm"
                )}>
                  <p className="text-[12px] leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                </div>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      {/* Reply input */}
      <div className="px-4 py-2.5 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Reply to this topic..."
            className="flex-1 text-[11px] bg-muted/30 border border-border rounded-md px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-primary/30"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-1.5 rounded-md text-primary hover:bg-primary/8 transition-colors disabled:opacity-30"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── TOPICS LIST PANEL (right side) ──────────────────────
// ══════════════════════════════════════════════════════════

function TopicsPanel({
  topics,
  onSelectTopic,
  onClose,
}: {
  topics: Topic[];
  onSelectTopic: (id: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"waiting" | "done">("waiting");
  const waiting = topics.filter((t) => t.status !== "resolved");
  const done = topics.filter((t) => t.status === "resolved");
  const list = tab === "waiting" ? waiting : done;

  return (
    <div className="w-[280px] border-l border-border bg-white flex flex-col h-full shrink-0">
      <div className="flex items-center justify-between px-4 h-10 border-b border-border shrink-0">
        <span className="text-[12px] font-semibold text-foreground">Topics</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
      <div className="flex px-4 pt-2 gap-1">
        <button
          onClick={() => setTab("waiting")}
          className={cn("px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors",
            tab === "waiting" ? "bg-amber-50 text-amber-700" : "text-muted-foreground hover:bg-accent")}
        >
          Open ({waiting.length})
        </button>
        <button
          onClick={() => setTab("done")}
          className={cn("px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors",
            tab === "done" ? "bg-emerald-50 text-emerald-700" : "text-muted-foreground hover:bg-accent")}
        >
          Resolved ({done.length})
        </button>
      </div>
      <ScrollArea className="flex-1 px-3 pt-2">
        <div className="space-y-0.5 pb-4">
          {list.map((topic) => (
            <button
              key={topic.id}
              onClick={() => onSelectTopic(topic.id)}
              className="w-full text-left px-2.5 py-2 rounded-md hover:bg-accent/50 transition-colors"
            >
              <p className="text-[11.5px] font-medium text-foreground truncate">{topic.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] text-muted-foreground">{formatRelativeTime(topic.updatedAt)}</span>
                <span className="text-[9px] text-muted-foreground">{topic.messages.length} msgs</span>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── SETUP TAB ───────────────────────────────────────────
// ══════════════════════════════════════════════════════════

type SetupPhase = "greeting" | "upload" | "processing" | "rules_review" | "conflicts" | "done";

interface SetupMsg {
  id: string;
  sender: "ai" | "manager";
  content: string;
  widget?: "upload" | "rules_preview" | "conflict" | "hire_cta";
}

function SetupTab({ onHireRep }: { onHireRep: () => void }) {
  const [phase, setPhase] = useState<SetupPhase>("greeting");
  const [messages, setMessages] = useState<SetupMsg[]>([]);
  const [conflictIdx, setConflictIdx] = useState(0);
  const [showAllRules, setShowAllRules] = useState(false);
  const [showHireDialog, setShowHireDialog] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const addMsg = useCallback((sender: "ai" | "manager", content: string, widget?: SetupMsg["widget"]) => {
    setMessages((prev) => [...prev, {
      id: `sm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender,
      content,
      widget,
    }]);
  }, []);

  // Initial greeting
  useEffect(() => {
    if (messages.length > 0) return;
    setTimeout(() => {
      addMsg("ai", "Welcome to Support Workforce! I'm Alex, your Team Lead. I manage your support reps so you don't have to deal with the details.\n\nYour Zendesk and Shopify are connected. I need two things from you before we can get your first rep on the floor.");
    }, 300);
    setTimeout(() => {
      addMsg("ai", "**First — your training docs.**\n\nUpload the same playbooks, refund policies, and escalation rules you'd hand a new hire. I'll read them, extract the rules, and flag anything that's unclear.", "upload");
      setPhase("upload");
    }, 1200);
  }, []);

  const handleUpload = (isDemo: boolean) => {
    addMsg("manager", isDemo ? "Try with Seel Return Guidelines" : "Uploaded: return-policy.pdf, refund-sop.docx");
    setPhase("processing");
    setTimeout(() => {
      addMsg("ai", isDemo
        ? "Got it — I'm reading through the Seel Return Guidelines now..."
        : "Got it — I'm reading through your documents now...\n\n**Note:** For your own documents, processing typically takes 30-60 minutes. I'll notify you when it's done. Feel free to come back later.\n\nFor this demo, I'll speed things up so you can see the full flow.");
    }, 500);
    setTimeout(() => {
      addMsg("ai", "Done! I extracted **7 rules** from your documents:\n\n1. Standard Return & Refund\n2. Damaged / Wrong Item Handling\n3. Return Shipping Cost\n4. International Returns\n5. Order Cancellation Policy\n6. Exchange Process\n7. Warranty Claims", "rules_preview");
      setPhase("rules_review");
    }, 2500);
  };

  const handleConfirmRules = () => {
    addMsg("manager", "Looks good, continue");
    setTimeout(() => {
      addMsg("ai", "I found **1 conflict** in your documents that I need your help to clarify. Let me walk you through it.", "conflict");
      setPhase("conflicts");
    }, 800);
  };

  const handleDismissConflict = () => {
    addMsg("manager", "Dismiss — I'll handle this later");
    setTimeout(() => {
      addMsg("ai", "No problem, I'll skip this for now. You can always clarify it later in the Playbook.\n\nYour playbook is set up! All 7 rules are ready to go.");
    }, 500);
    setTimeout(() => {
      addMsg("ai", "**Second — let's hire your first support rep.**\n\nI'll start them on WISMO — order status, cancellations for unshipped orders, and address changes. Highest volume, lowest risk. Once they prove themselves, we expand their scope.\n\nI've pre-configured a rep based on your docs. Review the profile and hit Hire:", "hire_cta");
      setPhase("done");
    }, 1500);
  };

  const handleHireFromDialog = (name: string) => {
    setShowHireDialog(false);
    addMsg("manager", `Hired ${name} as WISMO Specialist`);
    setTimeout(() => {
      addMsg("ai", `${name} is on the team! Head over to their conversation to complete onboarding — they'll walk you through a few scenarios to make sure they understand your policies.`);
      onHireRep();
    }, 800);
  };

  const demoRules = [
    "Standard Return & Refund",
    "Damaged / Wrong Item Handling",
    "Return Shipping Cost",
    "International Returns",
    "Order Cancellation Policy",
    "Exchange Process",
    "Warranty Claims",
  ];

  return (
    <>
      <ScrollArea className="flex-1">
        <div className="max-w-[620px] mx-auto px-5 py-6 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-2.5", msg.sender === "manager" && "flex-row-reverse")}>
              {msg.sender === "ai" && (
                <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[11px]">👔</span>
                </div>
              )}
              <div className={cn("max-w-[85%] min-w-0", msg.sender === "manager" && "text-right")}>
                <div className={cn("flex items-center gap-1.5 mb-0.5", msg.sender === "manager" && "justify-end")}>
                  <span className="text-[10px] font-medium text-foreground">{msg.sender === "ai" ? "Alex (Team Lead)" : "You"}</span>
                  <span className="text-[9px] text-muted-foreground/50">just now</span>
                </div>
                <div className={cn(
                  "rounded-xl px-3 py-2 inline-block text-left",
                  msg.sender === "ai" ? "bg-muted/40 text-foreground rounded-tl-sm" : "bg-primary/6 text-foreground rounded-tr-sm"
                )}>
                  <div className="text-[12.5px] leading-relaxed whitespace-pre-wrap">
                    {renderMarkdown(msg.content)}
                  </div>
                </div>

                {/* Upload widget */}
                {msg.widget === "upload" && phase === "upload" && (
                  <div className="mt-3 space-y-3">
                    <div
                      onClick={() => handleUpload(false)}
                      className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/2 transition-all"
                    >
                      <Upload className="w-5 h-5 text-muted-foreground/40 mx-auto mb-1.5" />
                      <p className="text-[11.5px] font-medium text-foreground">Drop files here or click to upload</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">PDF, DOCX, TXT — up to 10 files</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[9px] text-muted-foreground">or paste a URL</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2 border border-border rounded-md px-2.5 py-1.5 bg-white">
                        <Globe className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                        <input
                          placeholder="https://help.example.com/policies"
                          className="flex-1 text-[11px] bg-transparent outline-none placeholder:text-muted-foreground/40"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                              handleUpload(false);
                            }
                          }}
                        />
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-[10px] shrink-0" onClick={() => handleUpload(false)}>
                        Import
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center">
                      Don't have files handy?{" "}
                      <button onClick={() => handleUpload(true)} className="text-primary hover:underline font-medium">
                        Try with Seel Return Guidelines
                      </button>
                    </p>
                  </div>
                )}

                {/* Rules preview */}
                {msg.widget === "rules_preview" && phase === "rules_review" && (
                  <div className="mt-3 space-y-2">
                    <div className="rounded-lg border border-border bg-white overflow-hidden">
                      {(showAllRules ? demoRules : demoRules.slice(0, 5)).map((rule, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 border-b border-border/30 last:border-b-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="text-[11.5px] text-foreground">{rule}</span>
                        </div>
                      ))}
                      {!showAllRules && demoRules.length > 5 && (
                        <button
                          onClick={() => setShowAllRules(true)}
                          className="w-full px-3 py-2 text-[10.5px] text-primary hover:bg-accent/30 transition-colors text-center"
                        >
                          Show {demoRules.length - 5} more rules
                        </button>
                      )}
                    </div>
                    <Button size="sm" className="h-7 text-[11px]" onClick={handleConfirmRules}>
                      Looks good, continue
                    </Button>
                  </div>
                )}

                {/* Conflict */}
                {msg.widget === "conflict" && phase === "conflicts" && (
                  <div className="mt-3">
                    <div className="rounded-lg border border-amber-200/60 bg-amber-50/30 overflow-hidden">
                      <div className="px-3 py-2 border-b border-amber-200/40 flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[11px] font-semibold text-foreground">Conflict: Return Window Duration</span>
                      </div>
                      <div className="px-3 py-2.5 space-y-2">
                        <p className="text-[11px] text-foreground leading-relaxed">
                          Your <strong>Return Policy</strong> says 30-day return window, but your <strong>Customer FAQ</strong> mentions 45 days for loyalty members. Which should I follow?
                        </p>
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            onClick={handleDismissConflict}
                            className="px-3 py-1.5 rounded-md text-[10.5px] font-medium text-muted-foreground hover:bg-accent transition-colors"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hire CTA */}
                {msg.widget === "hire_cta" && phase === "done" && (
                  <div className="mt-3 flex justify-end">
                    <Button
                      onClick={() => setShowHireDialog(true)}
                      className="h-9 text-[12px] px-5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
                    >
                      Review & Hire Support Rep <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      {/* Hire Rep Dialog */}
      <HireRepDialog
        open={showHireDialog}
        onOpenChange={setShowHireDialog}
        onHire={handleHireFromDialog}
      />
    </>
  );
}

// ══════════════════════════════════════════════════════════
// ── HIRE REP DIALOG ─────────────────────────────────────
// ══════════════════════════════════════════════════════════

function HireRepDialog({
  open,
  onOpenChange,
  onHire,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onHire: (name: string) => void;
}) {
  const [name, setName] = useState("Ava");
  const [personality, setPersonality] = useState("warm");
  const [language, setLanguage] = useState("en-gb");

  const actionCategories = useMemo(() => {
    const cats = new Map<string, ActionPermission[]>();
    ACTION_PERMISSIONS.forEach((ap) => {
      if (!cats.has(ap.category)) cats.set(ap.category, []);
      cats.get(ap.category)!.push(ap);
    });
    return cats;
  }, []);

  const wismoActions = ["ap-2", "ap-4", "ap-6", "ap-9", "ap-10"];
  const [enabledActions, setEnabledActions] = useState<Set<string>>(new Set(wismoActions));

  const toggleAction = (id: string) => {
    setEnabledActions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[16px]">Hire Support Rep</DialogTitle>
          <DialogDescription className="text-[12px]">
            Pre-configured based on your training docs. Review and confirm.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-3">
          {/* Name */}
          <div>
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-8 text-[12px]" />
          </div>

          {/* Personality */}
          <div>
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Personality</Label>
            <Select value={personality} onValueChange={setPersonality}>
              <SelectTrigger className="mt-1 h-8 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="warm">Warm & Professional</SelectItem>
                <SelectItem value="formal">Formal & Precise</SelectItem>
                <SelectItem value="casual">Casual & Friendly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Language */}
          <div>
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="mt-1 h-8 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-gb">English (British)</SelectItem>
                <SelectItem value="en-us">English (American)</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Allowed Actions — grouped by category with guardrails */}
          <div>
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Allowed Actions</Label>
            <div className="mt-2 space-y-3">
              {Array.from(actionCategories.entries()).map(([cat, actions]) => (
                <div key={cat}>
                  <p className="text-[10px] font-medium text-muted-foreground mb-1">{cat}</p>
                  <div className="space-y-1">
                    {actions.map((action) => {
                      const enabled = enabledActions.has(action.id);
                      return (
                        <div key={action.id}>
                          <label className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/30 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={() => toggleAction(action.id)}
                              className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary/30"
                            />
                            <span className={cn("text-[11px]", enabled ? "text-foreground" : "text-muted-foreground")}>
                              {action.name}
                            </span>
                          </label>
                          {/* Guardrails */}
                          {enabled && action.guardrails && action.guardrails.length > 0 && (
                            <div className="ml-7 mt-0.5 mb-1 space-y-0.5">
                              {action.guardrails.map((g) => (
                                <div key={g.id} className="flex items-center gap-1.5 text-[9.5px] text-muted-foreground">
                                  <div className="w-1 h-1 rounded-full bg-amber-400" />
                                  <span>{g.label}{g.value !== undefined ? `: ${g.value}${g.unit || ""}` : ""}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Button onClick={() => onHire(name)} className="w-full h-10 text-[13px] bg-teal-600 hover:bg-teal-700">
            Hire
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════
// ── REP ONBOARDING CONVERSATION ─────────────────────────
// ══════════════════════════════════════════════════════════

interface RepMsg {
  id: string;
  sender: "rep" | "manager";
  content: string;
  choices?: { label: string; value: string }[];
}

type RepOBPhase = "greeting" | "scenario_1" | "scenario_2" | "scenario_3" | "mode_select" | "done";

function RepOnboarding({
  repName,
  onComplete,
}: {
  repName: string;
  onComplete: (mode: AgentMode) => void;
}) {
  const [phase, setPhase] = useState<RepOBPhase>("greeting");
  const [messages, setMessages] = useState<RepMsg[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const addMsg = useCallback((sender: "rep" | "manager", content: string, extra?: Partial<RepMsg>) => {
    setMessages((prev) => [...prev, {
      id: `rm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender,
      content,
      ...extra,
    }]);
  }, []);

  // Initial greeting
  useEffect(() => {
    if (messages.length > 0) return;
    setTimeout(() => {
      addMsg("rep", `Hi! I'm ${repName}. Alex brought me up to speed on your docs — I've studied your playbook, refund policy, and escalation rules.\n\nBefore I start handling real tickets, let me show you how I'd handle three scenarios. You tell me if I'm on the right track.`);
    }, 300);
    setTimeout(() => {
      addMsg("rep", `**Scenario 1 — "Where is my order?"**\n\nCustomer writes: *"Where is my order #DBH-29174? It's been a week and I haven't received anything."*\n\nHere's what I'd do:\n1. Look up **#DBH-29174** in Shopify\n2. I see it's **shipped** via Royal Mail, tracking RM29174UK, expected Mar 25\n3. I'd reply:\n\n> *Hi Emma! Your order #DBH-29174 shipped via Royal Mail (tracking: RM29174UK) and is expected to arrive by March 25th. You can track it here: [link]. Let me know if you need anything else!*\n\nThis is read-only — I'm just looking up info and replying. Does this look right?`, {
        choices: [
          { label: "That's right", value: "approve" },
          { label: "Needs adjustment", value: "adjust" },
        ],
      });
      setPhase("scenario_1");
    }, 1200);
  }, []);

  const handleChoice = (value: string) => {
    if (phase === "scenario_1") {
      addMsg("manager", value === "approve" ? "That's right" : "Needs adjustment");
      setTimeout(() => {
        addMsg("rep", `**Scenario 2 — "I want a refund"**\n\nCustomer writes: *"I received my ceramic vase yesterday and it's smaller than I expected. I'd like a refund."*\n\nHere's what I'd do:\n1. Check order — delivered 1 day ago, within return window\n2. Item is $42.99, change-of-mind return\n3. I'd reply and initiate the return:\n\n> *Hi! I'm sorry the vase wasn't what you expected. I've started a return for you — you'll receive a prepaid shipping label via email shortly. Once we receive the item, your refund of $34.04 ($42.99 minus $8.95 return shipping) will be processed within 3-5 business days.*\n\nI have permission to send replies, so I'd handle this end-to-end. Look good?`, {
          choices: [
            { label: "That's right", value: "approve" },
            { label: "Needs adjustment", value: "adjust" },
          ],
        });
        setPhase("scenario_2");
      }, 800);
    } else if (phase === "scenario_2") {
      addMsg("manager", value === "approve" ? "That's right" : "Needs adjustment");
      setTimeout(() => {
        addMsg("rep", `**Scenario 3 — Escalation**\n\nCustomer writes: *"This is the THIRD time I'm contacting you about this. I want to speak to a manager RIGHT NOW."*\n\nHere's what I'd do:\n1. Detect strong frustration + explicit request for manager\n2. I'd **escalate immediately**\n3. I'd reply:\n\n> *I completely understand your frustration, and I'm sorry for the repeated issues. I'm connecting you with a manager right now who can help resolve this directly.*\n\nThen I'd assign the ticket to you with an internal note summarizing the situation.\n\nDoes this feel right?`, {
          choices: [
            { label: "That's right", value: "approve" },
            { label: "Needs adjustment", value: "adjust" },
          ],
        });
        setPhase("scenario_3");
      }, 800);
    } else if (phase === "scenario_3") {
      addMsg("manager", value === "approve" ? "That's right" : "Needs adjustment");
      setTimeout(() => {
        addMsg("rep", `Great — I'm confident I understand your policies.\n\nOne last question. How do you want me to work?\n\n**Training mode** — I draft my responses and actions, but I check with you before anything goes out to the customer. Good if you want to review my work for a while.\n\n**Production mode** — I handle tickets on my own. You can review everything after the fact. Good if you trust the sanity check and want me working immediately.`, {
          choices: [
            { label: "Training — check with me first", value: "training" },
            { label: "Production — handle it yourself", value: "production" },
          ],
        });
        setPhase("mode_select");
      }, 800);
    } else if (phase === "mode_select") {
      const mode = value === "training" ? "training" : "production";
      const modeLabel = mode === "training" ? "Training" : "Production";
      addMsg("manager", value === "training" ? "Training — check with me first" : "Production — handle it yourself");
      setTimeout(() => {
        addMsg("rep", `I'm live in **${modeLabel} mode**. I'll start picking up WISMO, cancellation, and address change tickets now.\n\n**Here's when I'll reach out to you:**\n- When a customer asks something I don't have a rule for\n- When I need to escalate (angry customer, high-value order, explicit manager request)\n- When I spot a pattern that might need a new rule\n\nYou can always check my work in the escalation feed below. Let's go!`);
        setPhase("done");
        onComplete(mode as AgentMode);
      }, 800);
    }
  };

  const initials = getInitials(repName);

  return (
    <ScrollArea className="flex-1">
      <div className="max-w-[620px] mx-auto px-5 py-6 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex gap-2.5", msg.sender === "manager" && "flex-row-reverse")}>
            {msg.sender === "rep" && (
              <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[9px] font-semibold text-white">{initials}</span>
              </div>
            )}
            <div className={cn("max-w-[85%] min-w-0", msg.sender === "manager" && "text-right")}>
              <div className={cn("flex items-center gap-1.5 mb-0.5", msg.sender === "manager" && "justify-end")}>
                <span className="text-[10px] font-medium text-foreground">{msg.sender === "rep" ? repName : "You"}</span>
                <span className="text-[9px] text-muted-foreground/50">just now</span>
              </div>
              <div className={cn(
                "rounded-xl px-3 py-2 inline-block text-left",
                msg.sender === "rep" ? "bg-muted/40 text-foreground rounded-tl-sm" : "bg-primary/6 text-foreground rounded-tr-sm"
              )}>
                <div className="text-[12.5px] leading-relaxed whitespace-pre-wrap">
                  {renderMarkdown(msg.content)}
                </div>
              </div>
              {msg.choices && (
                <div className="flex flex-wrap gap-1.5 mt-2 ml-0.5">
                  {msg.choices.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => handleChoice(c.value)}
                      className="px-4 py-2 rounded-lg text-[12px] font-medium border border-violet-200 text-violet-700 hover:bg-violet-50 transition-colors"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </ScrollArea>
  );
}

// ══════════════════════════════════════════════════════════
// ── REP PROFILE PANEL (default: view mode) ──────────────
// ══════════════════════════════════════════════════════════

interface ConfigHistoryEntry {
  id: string;
  hash: string;
  description: string;
  author: string;
  timestamp: string;
}

const CONFIG_HISTORY: ConfigHistoryEntry[] = [
  {
    id: "ch-1",
    hash: "0413d17",
    description: "Ava onboarded — WISMO Specialist, Training mode",
    author: "Team Lead (Alex)",
    timestamp: "2026-03-29T13:14:00Z",
  },
];

function RepProfilePanel({
  repName,
  repMode,
  onClose,
  onNavigatePerformance,
}: {
  repName: string;
  repMode: AgentMode;
  onClose: () => void;
  onNavigatePerformance: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const initials = getInitials(repName);

  const detailRows = [
    { label: "Role", value: "L1 — WISMO Specialist" },
    { label: "Strategy", value: "Conservative" },
    { label: "Refund Cap", value: "£100" },
    { label: "Personality", value: "Warm & Professional" },
    { label: "Language", value: "English (British)" },
    { label: "Started", value: "Mar 29, 2026" },
  ];

  const perfRows = [
    { label: "Tickets", value: "0 total / 0 today" },
    { label: "Resolution", value: "0%" },
    { label: "CSAT", value: "0" },
    { label: "Avg Response", value: "—" },
    { label: "Escalation", value: "0%" },
    { label: "Cost/Ticket", value: "—" },
  ];

  return (
    <div className="w-[300px] border-l border-border bg-white flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-10 border-b border-border shrink-0">
        <span className="text-[12px] font-semibold text-foreground">{repName}</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-5">
          {/* Avatar + mode badge */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-violet-500 flex items-center justify-center">
              <span className="text-[18px] font-semibold text-white">{initials}</span>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-foreground">{repName}</p>
              <Badge variant="outline" className={cn(
                "text-[9px] px-1.5 h-4 mt-0.5 font-medium border",
                repMode === "training" ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"
              )}>
                {repMode === "training" ? "TRAINING" : "PRODUCTION"}
              </Badge>
            </div>
          </div>

          {/* Details */}
          <div>
            <p className="text-[9.5px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Details</p>
            <div className="space-y-0">
              {detailRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-b-0">
                  <span className="text-[11px] text-muted-foreground">{row.label}</span>
                  <span className="text-[11px] font-medium text-foreground">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Performance */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9.5px] font-semibold text-muted-foreground uppercase tracking-wider">Performance</p>
              <button
                onClick={onNavigatePerformance}
                className="text-[9px] text-primary hover:underline flex items-center gap-0.5"
              >
                <BarChart3 className="w-3 h-3" /> View more
              </button>
            </div>
            <div className="space-y-0">
              {perfRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-b-0">
                  <span className="text-[11px] text-muted-foreground">{row.label}</span>
                  <span className="text-[11px] font-medium text-foreground">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Config History */}
          <div>
            <p className="text-[9.5px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Config History ({CONFIG_HISTORY.length})
            </p>
            <div className="space-y-2">
              {CONFIG_HISTORY.map((entry) => (
                <div key={entry.id} className="flex items-start gap-2">
                  <Badge variant="outline" className="text-[8px] px-1.5 h-4 font-mono shrink-0 mt-0.5 bg-amber-50 text-amber-700 border-amber-200">
                    {entry.hash}
                  </Badge>
                  <div className="min-w-0">
                    <p className="text-[10.5px] text-foreground leading-snug">{entry.description}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      {entry.author} · {new Date(entry.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}, {new Date(entry.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Edit button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full h-7 text-[10.5px]"
            onClick={() => {
              setIsEditing(true);
              toast.info("Edit mode — feature coming soon");
            }}
          >
            <Pencil className="w-3 h-3 mr-1" /> Edit Profile
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── MAIN PAGE COMPONENT ─────────────────────────────────
// ══════════════════════════════════════════════════════════

type SelectedEntity = { type: "team_lead" } | { type: "rep"; id: string; name: string };

export default function CommunicationPage() {
  const [, navigate] = useLocation();

  // Welcome dialog — first visit only
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem("seel_ai_welcome_seen");
  });

  // Selected entity in left panel
  const [selected, setSelected] = useState<SelectedEntity>({ type: "team_lead" });

  // Team Lead conversation state
  const [activeTab, setActiveTab] = useState<"conversations" | "setup">("conversations");
  const [showTopics, setShowTopics] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  // Rep state
  const [repHired, setRepHired] = useState(false);
  const [repName, setRepName] = useState("Ava");
  const [showRepProfile, setShowRepProfile] = useState(false);
  const [repOnboarded, setRepOnboarded] = useState(false);
  const [repMode, setRepMode] = useState<AgentMode>("training");
  const [escalationStatuses, setEscalationStatuses] = useState<Record<string, EscalationStatus>>(() => {
    const map: Record<string, EscalationStatus> = {};
    ESCALATION_TICKETS.forEach((t) => { map[t.id] = t.status; });
    return map;
  });

  // Integration status
  const zendeskConnected = false;

  // Topics sorted by date (newest first for list view)
  const sortedTopics = useMemo(() =>
    [...TOPICS].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    []
  );

  // Topics grouped by date for the main feed (oldest first within each day)
  const topicsByDate = useMemo(() => {
    const groups: { date: string; topics: Topic[] }[] = [];
    const sorted = [...TOPICS].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    let currentDate = "";
    for (const topic of sorted) {
      const dateKey = new Date(topic.createdAt).toISOString().split("T")[0];
      if (dateKey !== currentDate) {
        currentDate = dateKey;
        groups.push({ date: topic.createdAt, topics: [topic] });
      } else {
        groups[groups.length - 1].topics.push(topic);
      }
    }
    return groups;
  }, []);

  const waitingCount = TOPICS.filter((t) => t.status !== "resolved" && t.proposedRule?.status === "pending").length;

  // Escalation counts
  const needsAttentionCount = useMemo(() =>
    ESCALATION_TICKETS.filter((t) => escalationStatuses[t.id] === "needs_attention").length,
    [escalationStatuses]
  );

  const selectedThread = selectedThreadId ? TOPICS.find(t => t.id === selectedThreadId) : null;

  const handleCloseWelcome = () => {
    localStorage.setItem("seel_ai_welcome_seen", "1");
    setShowWelcome(false);
  };

  const handleAction = (topicId: string, action: string) => {
    if (action === "reply") {
      setSelectedThreadId(topicId);
      setShowTopics(false);
    } else {
      toast.success(action === "accept" ? "Rule accepted" : "Rule rejected");
    }
  };

  const handleOpenThread = (topicId: string) => {
    setSelectedThreadId(topicId);
    setShowTopics(false);
  };

  const handleHireRep = () => {
    setRepHired(true);
    setRepName("Ava");
    setSelected({ type: "rep", id: "rep-1", name: "Ava" });
    toast.success("Your first AI Rep is on the team!");
  };

  const handleRepOnboardComplete = (mode: AgentMode) => {
    setRepOnboarded(true);
    setRepMode(mode);
  };

  // Escalation tickets sorted by time (chronological)
  const escalationTicketsSorted = useMemo(() =>
    [...ESCALATION_TICKETS]
      .map((t) => ({ ...t, status: escalationStatuses[t.id] || t.status }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [escalationStatuses]
  );

  const repInitials = getInitials(repName);

  const statusTagColor = (status: EscalationStatus) => {
    if (status === "needs_attention") return "bg-red-50 text-red-600 border-red-200";
    if (status === "in_progress") return "bg-amber-50 text-amber-600 border-amber-200";
    return "bg-emerald-50 text-emerald-600 border-emerald-200";
  };

  const statusTagLabel = (status: EscalationStatus) => {
    if (status === "needs_attention") return "Needs attention";
    if (status === "in_progress") return "In progress";
    return "Resolved";
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col h-full">
        {/* ── Welcome Dialog ── */}
        <Dialog open={showWelcome} onOpenChange={(open) => { if (!open) handleCloseWelcome(); }}>
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle className="text-[16px]">Welcome to AI Support</DialogTitle>
              <DialogDescription className="text-[13px] leading-relaxed mt-2">
                Automate customer service with an AI-powered Rep that follows your rules.
                We currently support <strong>Shopify + Zendesk</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2 space-y-2">
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                If you use Zendesk, you can get started right away. For other helpdesks,{" "}
                <a href="mailto:support@seel.com" className="text-primary hover:underline">talk to us</a> — we're expanding platform support soon.
              </p>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleCloseWelcome} className="h-8 text-[12px]">
                Get Started
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Yellow Banner (Integration not set up) ── */}
        {!zendeskConnected && (
          <div className="px-5 py-2 bg-amber-50/80 border-b border-amber-100 flex items-center gap-3">
            <div className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
            <p className="text-[11.5px] text-amber-700 flex-1">
              Zendesk not connected — <button onClick={() => navigate("/integrations")} className="font-medium underline underline-offset-2 hover:text-amber-900">set up integration</button> to go live.
            </p>
          </div>
        )}

        {/* ── Main content area ── */}
        <div className="flex flex-1 min-h-0">
          {/* ── Left Panel: Narrow avatar bar ── */}
          <div className="w-[56px] shrink-0 border-r border-border bg-[#fafbfc] flex flex-col items-center py-3 gap-1">
            {/* Team Lead */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => { setSelected({ type: "team_lead" }); setShowRepProfile(false); }}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-all relative",
                    selected.type === "team_lead"
                      ? "bg-teal-100 ring-2 ring-teal-400 ring-offset-1"
                      : "bg-teal-50 hover:bg-teal-100"
                  )}
                >
                  <span className="text-[14px]">👔</span>
                  {waitingCount > 0 && selected.type !== "team_lead" && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-medium">
                      {waitingCount}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-[11px]">
                <p className="font-medium">Alex — Team Lead</p>
                <p className="text-muted-foreground text-[10px]">Manages your reps and playbook</p>
              </TooltipContent>
            </Tooltip>

            {/* Divider + Reps label */}
            <div className="w-6 h-px bg-border my-1" />
            <p className="text-[8px] font-semibold text-muted-foreground/40 uppercase tracking-widest">Reps</p>

            {/* Rep */}
            {repHired ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => { setSelected({ type: "rep", id: "rep-1", name: repName }); setShowRepProfile(false); }}
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center transition-all relative",
                      selected.type === "rep"
                        ? "bg-violet-500 ring-2 ring-violet-400 ring-offset-1"
                        : "bg-violet-100 hover:bg-violet-200"
                    )}
                  >
                    <span className={cn(
                      "text-[11px] font-semibold",
                      selected.type === "rep" ? "text-white" : "text-violet-600"
                    )}>
                      {repInitials}
                    </span>
                    {needsAttentionCount > 0 && selected.type !== "rep" && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-medium">
                        {needsAttentionCount}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-[11px]">
                  <p className="font-medium">{repName} — AI Rep</p>
                  <p className="text-muted-foreground text-[10px]">Working · Handling tickets</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-9 h-9 rounded-full border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5 text-muted-foreground/30" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-[11px]">
                  <p>No reps yet</p>
                  <p className="text-muted-foreground text-[10px]">Talk to Alex to set up your Playbook first</p>
                </TooltipContent>
              </Tooltip>
            )}

            <div className="flex-1" />
          </div>

          {/* ── Right Content Area ── */}
          <div className="flex-1 flex flex-col min-w-0">
            {selected.type === "team_lead" ? (
              /* ── Team Lead View ── */
              <>
                {/* Header with Team Lead info */}
                <div className="flex items-center justify-between px-5 h-10 border-b border-border shrink-0 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px]">👔</span>
                      <span className="text-[13px] font-semibold text-foreground">Alex</span>
                      <span className="text-[11px] text-muted-foreground">Team Lead</span>
                    </div>
                    <div className="h-4 w-px bg-border" />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setActiveTab("conversations"); setSelectedThreadId(null); }}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
                          activeTab === "conversations"
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                      >
                        Conversations
                      </button>
                      <button
                        onClick={() => setActiveTab("setup")}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
                          activeTab === "setup"
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                      >
                        Setup
                      </button>
                    </div>
                  </div>

                  {activeTab === "conversations" && (
                    <button
                      onClick={() => { setShowTopics(!showTopics); setSelectedThreadId(null); }}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 h-7 rounded-md text-[11px] transition-colors relative",
                        showTopics ? "bg-primary/8 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      <List className="w-3.5 h-3.5" /> Topics
                      {waitingCount > 0 && !showTopics && (
                        <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-medium ml-0.5">
                          {waitingCount}
                        </span>
                      )}
                    </button>
                  )}
                </div>

                {/* Tab content */}
                {activeTab === "conversations" ? (
                  <div className="flex flex-1 min-h-0">
                    {/* Main feed: Feishu-style topic cards */}
                    <div className="flex-1 flex flex-col min-w-0">
                      <ScrollArea className="flex-1">
                        <div className="max-w-[680px] mx-auto px-5 py-4 space-y-3">
                          {topicsByDate.map((group, gi) => (
                            <div key={gi}>
                              <div className="flex items-center gap-3 my-4">
                                <div className="flex-1 h-px bg-border" />
                                <span className="text-[10px] font-medium text-muted-foreground px-2">
                                  {formatDateGroup(group.date)}
                                </span>
                                <div className="flex-1 h-px bg-border" />
                              </div>

                              <div className="space-y-3">
                                {group.topics.map((topic) => (
                                  <TopicCard
                                    key={topic.id}
                                    topic={topic}
                                    onOpenThread={handleOpenThread}
                                    onAction={handleAction}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      {/* No direct input — encourage topic-level replies */}
                      <div className="px-5 py-2.5 border-t border-border bg-muted/5">
                        <p className="text-[10.5px] text-muted-foreground text-center">
                          Click <MessageCircle className="w-3 h-3 inline-block mx-0.5" /> <strong>Reply to topic</strong> on any card above to respond within the thread.
                        </p>
                      </div>
                    </div>

                    {/* Side panels */}
                    {selectedThread && (
                      <FullThreadPanel
                        topic={selectedThread}
                        onClose={() => setSelectedThreadId(null)}
                        onAction={handleAction}
                      />
                    )}

                    {showTopics && !selectedThread && (
                      <TopicsPanel
                        topics={sortedTopics}
                        onSelectTopic={(id) => { handleOpenThread(id); setShowTopics(false); }}
                        onClose={() => setShowTopics(false)}
                      />
                    )}
                  </div>
                ) : (
                  <SetupTab onHireRep={handleHireRep} />
                )}
              </>
            ) : selected.type === "rep" && !repHired ? (
              /* ── Rep not hired yet — guide to Team Lead ── */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-[300px]">
                  <div className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center mx-auto mb-3">
                    <UserPlus className="w-5 h-5 text-muted-foreground/40" />
                  </div>
                  <p className="text-[13px] font-medium text-foreground">No Rep hired yet</p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    Talk to Alex (your Team Lead) to set up your Playbook first, then hire your first AI Rep.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 h-7 text-[11px]"
                    onClick={() => { setSelected({ type: "team_lead" }); setActiveTab("setup"); }}
                  >
                    <ArrowRight className="w-3 h-3 mr-1" /> Go to Setup
                  </Button>
                </div>
              </div>
            ) : (
              /* ── Rep View ── */
              <div className="flex flex-1 min-h-0">
                <div className="flex-1 flex flex-col min-w-0">
                  {/* Rep header */}
                  <div className="flex items-center justify-between px-5 h-10 border-b border-border shrink-0 bg-white">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-semibold text-white">{repInitials}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-foreground">{repName}</span>
                        <span className="text-[11px] text-muted-foreground">L1 — WISMO Specialist · {repOnboarded ? (repMode === "training" ? "Training" : "Production") : "Onboarding"} · Started Mar 29, 2026</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowRepProfile(!showRepProfile)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 h-7 rounded-md text-[11px] font-medium transition-colors",
                        showRepProfile ? "bg-primary/8 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      <User className="w-3.5 h-3.5" /> Profile
                    </button>
                  </div>

                  {/* Rep content: onboarding or escalation feed */}
                  {!repOnboarded ? (
                    <RepOnboarding repName={repName} onComplete={handleRepOnboardComplete} />
                  ) : (
                    <ScrollArea className="flex-1">
                      <div className="max-w-[640px] mx-auto px-5 py-4 space-y-3">
                        {escalationTicketsSorted.map((ticket) => (
                          <div key={ticket.id} className="flex gap-2.5">
                            {/* Rep avatar */}
                            <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-[9px] font-semibold text-white">{repInitials}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[10px] font-medium text-foreground">{repName}</span>
                                <span className="text-[9px] text-muted-foreground/50">{formatRelativeTime(ticket.createdAt)}</span>
                              </div>
                              {/* Escalation card */}
                              <div className="rounded-xl bg-muted/40 px-3 py-2.5 rounded-tl-sm">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[12px] font-medium text-foreground">
                                      #{ticket.zendeskTicketId} · {ticket.subject}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{ticket.reason}</p>
                                  </div>
                                  <Badge variant="outline" className={cn("text-[8px] px-1.5 h-4 shrink-0 font-medium border", statusTagColor(ticket.status))}>
                                    {statusTagLabel(ticket.status)}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
                                  <a
                                    href={ticket.zendeskUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
                                  >
                                    <ExternalLink className="w-3 h-3" /> Open in Zendesk
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {escalationTicketsSorted.length === 0 && (
                          <div className="text-center py-16">
                            <CheckCircle2 className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
                            <p className="text-[13px] font-medium text-muted-foreground">All clear</p>
                            <p className="text-[11px] text-muted-foreground/60 mt-0.5">No escalated tickets right now</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </div>

                {/* Rep Profile Panel */}
                {showRepProfile && (
                  <RepProfilePanel
                    repName={repName}
                    repMode={repMode}
                    onClose={() => setShowRepProfile(false)}
                    onNavigatePerformance={() => navigate("/performance")}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
