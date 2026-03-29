/* ────────────────────────────────────────────────────────────
   AI Support → Communication tab.
   Left panel: Team Lead (fixed) + Reps section.
   Right area: conversation with selected entity.
   - Team Lead: Topics (rule proposals, learning, performance) + Onboarding
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

interface RuleChange {
  type: "new" | "update";
  ruleName: string;
  before?: string;
  after: string;
  source?: string;
}

interface ChatMessage {
  id: string;
  sender: "ai" | "manager";
  content: string;
  timestamp: string;
  topicId: string;
  topicTitle: string;
  topicStatus: "waiting" | "done";
  ruleChange?: RuleChange;
  hasActions?: boolean;
  isTopicStart?: boolean;
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
          <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
        </div>
      );
    }
    if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.+)/);
      if (match) {
        return (
          <div key={i} className="flex gap-1.5 ml-1">
            <span className="text-muted-foreground shrink-0">{match[1]}.</span>
            <span dangerouslySetInnerHTML={{ __html: match[2].replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
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

// ── Build flat chat messages from TOPICS ────────────────────

function buildChatMessages(topics: Topic[]): ChatMessage[] {
  const messages: ChatMessage[] = [];

  for (const topic of topics) {
    const isResolved = topic.status === "resolved";
    const status: "waiting" | "done" = isResolved ? "done" : "waiting";

    let ruleChange: RuleChange | undefined;

    if (topic.proposedRule) {
      ruleChange = {
        type: "new",
        ruleName: topic.proposedRule.category + " — " + topic.title,
        after: topic.proposedRule.text,
        source: topic.proposedRule.evidence.join(" | "),
      };
    }

    if (topic.type === "escalation_review" && topic.id === "t-3") {
      ruleChange = {
        type: "update",
        ruleName: "Damaged Item Handling",
        before: "Require photo evidence for all damage claims regardless of order value.",
        after: "For damage claims on items under $80, process replacement or refund without photo. For items $80+, still request photo.",
        source: `Observed from ticket #${topic.sourceTicketId}`,
      };
    }

    if (topic.id === "t-7") {
      ruleChange = {
        type: "update",
        ruleName: "Return Shipping Cost",
        before: "Customer pays $8.95 return shipping fee for all returns.",
        after: "Defective/wrong items → free return shipping (we pay). Change of mind → customer pays ($8.95 deducted from refund).",
        source: "Learned from denied approval on ticket #4498",
      };
    }

    for (let i = 0; i < topic.messages.length; i++) {
      const msg = topic.messages[i];
      const isFirst = i === 0;

      if (msg.sender === "ai" && topic.proposedRule &&
        (msg.content.includes("Proposed rule:") || msg.content.includes("Should I adopt this rule?"))) {
        if (!isFirst) continue;
      }

      let content = msg.content;
      if (isFirst && ruleChange && topic.type !== "rule_update") {
        content = content.split("\n").filter(line =>
          !line.startsWith("> ") && !line.includes("Proposed rule:") && !line.includes("Proposed update:")
        ).join("\n").trim();
      }

      let msgRuleChange: RuleChange | undefined;
      if (topic.type === "rule_update" && msg.sender === "ai" && i === 1) {
        msgRuleChange = {
          type: "new",
          ruleName: topic.title,
          after: "Orders placed between March 15-31, 2026 have a 60-day return window (expires May 30, 2026). Applies to all customers.",
          source: "Manager directive",
        };
      } else if (isFirst && ruleChange && topic.type !== "rule_update") {
        msgRuleChange = ruleChange;
      }

      const hasActions = isFirst && msg.sender === "ai" && !isResolved &&
        topic.status !== "read" && topic.type !== "performance_report" &&
        ruleChange !== undefined;

      messages.push({
        id: msg.id,
        sender: msg.sender,
        content,
        timestamp: msg.timestamp,
        topicId: topic.id,
        topicTitle: topic.title,
        topicStatus: status,
        ruleChange: msgRuleChange,
        hasActions,
        isTopicStart: isFirst,
      });
    }
  }

  const topicGroups = new Map<string, ChatMessage[]>();
  for (const msg of messages) {
    if (!topicGroups.has(msg.topicId)) topicGroups.set(msg.topicId, []);
    topicGroups.get(msg.topicId)!.push(msg);
  }
  for (const group of Array.from(topicGroups.values())) {
    group.sort((a: ChatMessage, b: ChatMessage) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
  const sortedTopics = Array.from(topicGroups.entries()).sort(
    ([, a], [, b]) => new Date(a[0].timestamp).getTime() - new Date(b[0].timestamp).getTime()
  );
  return sortedTopics.flatMap(([, msgs]) => msgs);
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

function CollapsibleText({ text, maxLines = 4 }: { text: string; maxLines?: number }) {
  const [expanded, setExpanded] = useState(false);
  const lines = text.split("\n");
  const isLong = lines.length > maxLines;

  if (!isLong || expanded) {
    return (
      <div className="text-[12.5px] leading-relaxed whitespace-pre-wrap">
        {renderMarkdown(text)}
        {isLong && (
          <button onClick={() => setExpanded(false)} className="text-[10px] text-primary hover:underline mt-1 flex items-center gap-0.5">
            <ChevronUp className="w-3 h-3" /> Show less
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="text-[12.5px] leading-relaxed whitespace-pre-wrap">
      {renderMarkdown(lines.slice(0, maxLines).join("\n"))}
      <button onClick={() => setExpanded(true)} className="text-[10px] text-primary hover:underline mt-1 flex items-center gap-0.5">
        <ChevronDown className="w-3 h-3" /> Show more
      </button>
    </div>
  );
}

// ── Topic Label ──

function TopicLabel({ title, status }: { title: string; status: "waiting" | "done" }) {
  return (
    <div className="flex items-center gap-2 mb-1.5 mt-3">
      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", status === "waiting" ? "bg-amber-400" : "bg-emerald-400")} />
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide truncate">{title}</span>
    </div>
  );
}

// ── Rule Change Card ────────────────────────────────────

function RuleChangeCard({
  change,
  hasActions,
  onAction,
  topicId,
}: {
  change: RuleChange;
  hasActions: boolean;
  onAction?: (topicId: string, action: string) => void;
  topicId: string;
}) {
  return (
    <div className="mt-2 rounded-lg border border-border bg-white overflow-hidden">
      <div className="px-3 py-2 bg-muted/30 border-b border-border/50 flex items-center gap-2">
        <div className={cn("w-1.5 h-1.5 rounded-full", change.type === "new" ? "bg-emerald-400" : "bg-amber-400")} />
        <span className="text-[11px] font-semibold text-foreground">{change.ruleName}</span>
        <Badge variant="secondary" className="h-4 text-[8px] px-1.5 ml-auto">
          {change.type === "new" ? "NEW" : "UPDATE"}
        </Badge>
      </div>
      <div className="px-3 py-2 space-y-1.5">
        {change.before && (
          <div className="flex gap-2">
            <span className="text-[10px] font-medium text-red-400 w-10 shrink-0 mt-0.5">Before</span>
            <p className="text-[11px] text-muted-foreground line-through leading-relaxed">{change.before}</p>
          </div>
        )}
        <div className="flex gap-2">
          <span className="text-[10px] font-medium text-emerald-500 w-10 shrink-0 mt-0.5">{change.before ? "After" : "Rule"}</span>
          <p className="text-[11px] text-foreground leading-relaxed">{change.after}</p>
        </div>
        {change.source && (
          <p className="text-[9px] text-muted-foreground/60 mt-1">Source: {change.source}</p>
        )}
      </div>
      {hasActions && onAction && (
        <div className="px-3 py-2 border-t border-border/50 bg-muted/10 flex items-center gap-1.5">
          <button
            onClick={() => onAction(topicId, "accept")}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <Check className="w-3 h-3" /> Accept
          </button>
          <button
            onClick={() => onAction(topicId, "modify_accept")}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <Pencil className="w-3 h-3" /> Modify & Accept
          </button>
          <button
            onClick={() => onAction(topicId, "reject")}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium text-muted-foreground hover:bg-accent transition-colors ml-auto"
          >
            <X className="w-3 h-3" /> Reject
          </button>
        </div>
      )}
    </div>
  );
}

// ── Message Bubble ──────────────────────────────────────

function MessageBubble({
  msg,
  senderLabel,
  senderAvatar,
  onAction,
  onReply,
}: {
  msg: ChatMessage;
  senderLabel: string;
  senderAvatar?: React.ReactNode;
  onAction?: (topicId: string, action: string) => void;
  onReply?: (topicId: string) => void;
}) {
  return (
    <div className={cn("flex gap-2.5 group", msg.sender === "manager" && "flex-row-reverse")}>
      {msg.sender === "ai" && (
        senderAvatar || (
          <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-[11px]">👔</span>
          </div>
        )
      )}
      <div className={cn("max-w-[85%] min-w-0", msg.sender === "manager" && "text-right")}>
        <div className={cn("flex items-center gap-1.5 mb-0.5", msg.sender === "manager" && "justify-end")}>
          <span className="text-[10px] font-medium text-foreground">{msg.sender === "ai" ? senderLabel : "You"}</span>
          <span className="text-[9px] text-muted-foreground/50">{formatTime(msg.timestamp)}</span>
        </div>
        <div className={cn(
          "rounded-xl px-3 py-2 inline-block text-left",
          msg.sender === "ai" ? "bg-muted/40 text-foreground rounded-tl-sm" : "bg-primary/6 text-foreground rounded-tr-sm"
        )}>
          {msg.content && <CollapsibleText text={msg.content} maxLines={6} />}
          {msg.ruleChange && (
            <RuleChangeCard
              change={msg.ruleChange}
              hasActions={!!msg.hasActions}
              onAction={onAction}
              topicId={msg.topicId}
            />
          )}
        </div>
        {msg.sender === "ai" && onReply && (
          <button
            onClick={() => onReply(msg.topicId)}
            className="opacity-0 group-hover:opacity-100 mt-0.5 ml-0.5 text-[10px] text-muted-foreground hover:text-primary transition-all flex items-center gap-0.5"
          >
            <Reply className="w-3 h-3" /> Reply
          </button>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── TOPICS PANEL (right side for Team Lead) ─────────────
// ══════════════════════════════════════════════════════════

interface TopicItem {
  id: string;
  title: string;
  status: "waiting" | "done";
  timestamp: string;
  hasActions: boolean;
  replyCount: number;
}

function TopicsPanel({
  topics,
  onSelectTopic,
  onClose,
}: {
  topics: TopicItem[];
  onSelectTopic: (id: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"waiting" | "done">("waiting");
  const waiting = topics.filter((t) => t.status === "waiting");
  const done = topics.filter((t) => t.status === "done");
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
          Waiting ({waiting.length})
        </button>
        <button
          onClick={() => setTab("done")}
          className={cn("px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors",
            tab === "done" ? "bg-emerald-50 text-emerald-700" : "text-muted-foreground hover:bg-accent")}
        >
          Done ({done.length})
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
                <span className="text-[9px] text-muted-foreground">{formatRelativeTime(topic.timestamp)}</span>
                <span className="text-[9px] text-muted-foreground">{topic.replyCount} msgs</span>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── THREAD SIDE PANEL ───────────────────────────────────
// ══════════════════════════════════════════════════════════

interface ThreadReply {
  id: string;
  sender: "ai" | "manager";
  content: string;
  timestamp: string;
}

function ThreadSidePanel({
  topicId,
  topicTitle,
  contextMsg,
  onClose,
}: {
  topicId: string;
  topicTitle: string;
  contextMsg: string;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const [replies, setReplies] = useState<ThreadReply[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies.length]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newReply: ThreadReply = {
      id: `tr-${Date.now()}`,
      sender: "manager",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    setReplies((prev) => [...prev, newReply]);
    setInput("");
    setTimeout(() => {
      setReplies((prev) => [
        ...prev,
        {
          id: `tr-ai-${Date.now()}`,
          sender: "ai",
          content: `Got it. I'll update the rule accordingly.\n\n**Updated rule:** ${input.trim()}\n\nPlease confirm this is correct.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }, 1500);
  };

  return (
    <div className="w-[320px] border-l border-border bg-white flex flex-col h-full shrink-0">
      <div className="flex items-center justify-between px-4 h-10 border-b border-border shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <MessageCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-[12px] font-semibold text-foreground truncate">{topicTitle}</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors shrink-0">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="px-4 py-2 border-b border-border bg-muted/20">
        <p className="text-[10.5px] text-muted-foreground leading-relaxed line-clamp-2">
          {contextMsg.replace(/\*\*/g, "").slice(0, 150)}...
        </p>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="py-3 space-y-3">
          {replies.map((reply) => (
            <div key={reply.id} className={cn("flex gap-2", reply.sender === "manager" && "flex-row-reverse")}>
              {reply.sender === "ai" ? (
                <div className="w-5 h-5 rounded-full bg-teal-50 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[9px]">👔</span>
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[8px] font-medium text-white">JC</span>
                </div>
              )}
              <div className={cn("max-w-[85%]", reply.sender === "manager" && "text-right")}>
                <div className={cn(
                  "rounded-lg px-2.5 py-1.5 inline-block text-left",
                  reply.sender === "ai" ? "bg-muted/40" : "bg-primary/6"
                )}>
                  <p className="text-[11.5px] leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                </div>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      <div className="px-4 py-2.5 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your modification..."
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
  const [view, setView] = useState<"view" | "edit">("view");
  const [agentMode, setAgentMode] = useState<AgentMode>(repMode);
  const [permissions, setPermissions] = useState<ActionPermission[]>(ACTION_PERMISSIONS);
  const [identity, setIdentity] = useState<AgentIdentity>(AGENT_IDENTITY);

  const togglePermission = (id: string) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, permission: p.permission === "disabled" ? "autonomous" : "disabled" }
          : p
      )
    );
  };

  const grouped = useMemo(() => {
    return permissions.reduce<Record<string, ActionPermission[]>>((acc, p) => {
      (acc[p.category] = acc[p.category] || []).push(p);
      return acc;
    }, {});
  }, [permissions]);

  const modeLabel = agentMode === "training" ? "TRAINING" : agentMode === "production" ? "PRODUCTION" : "OFF";
  const modeColor = agentMode === "training" ? "bg-amber-100 text-amber-700" : agentMode === "production" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600";

  if (view === "view") {
    return (
      <div className="w-[340px] border-l border-border bg-white flex flex-col h-full shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-10 border-b border-border shrink-0">
          <span className="text-[12px] font-semibold text-foreground">Profile</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setView("edit")}
              className="px-2 py-1 rounded-md text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              Edit
            </button>
            <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-5">
            {/* Avatar + Name + Mode badge */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-violet-500 flex items-center justify-center shrink-0">
                <span className="text-[16px] font-semibold text-white">{getInitials(repName)}</span>
              </div>
              <div>
                <p className="text-[15px] font-semibold text-foreground">{repName}</p>
                <Badge className={cn("text-[9px] px-1.5 h-4 font-semibold border-0", modeColor)}>
                  {modeLabel}
                </Badge>
              </div>
            </div>

            {/* ── Details ── */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Details</p>
              <div className="space-y-2">
                {[
                  { label: "Role", value: "L1 — WISMO Specialist" },
                  { label: "Strategy", value: "Conservative" },
                  { label: "Refund Cap", value: "$150" },
                  { label: "Personality", value: identity.tone === "friendly" ? "Warm & Professional" : identity.tone === "professional" ? "Professional" : "Casual" },
                  { label: "Language", value: "English" },
                  { label: "Started", value: "Mar 29, 2026" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                    <span className="text-[12px] text-muted-foreground">{row.label}</span>
                    <span className="text-[12px] font-medium text-foreground">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Performance ── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Performance</p>
                <button
                  onClick={onNavigatePerformance}
                  className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                >
                  View more <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Tickets", value: "0 total / 0 today" },
                  { label: "Resolution", value: "0%" },
                  { label: "CSAT", value: "0" },
                  { label: "Avg Response", value: "—" },
                  { label: "Escalation", value: "0%" },
                  { label: "Cost/Ticket", value: "—" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                    <span className="text-[12px] text-muted-foreground">{row.label}</span>
                    <span className="text-[12px] font-medium text-foreground">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Config History ── */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Config History ({CONFIG_HISTORY.length})
              </p>
              <div className="space-y-2.5">
                {CONFIG_HISTORY.map((entry) => (
                  <div key={entry.id} className="flex gap-2.5">
                    <Badge variant="secondary" className="h-5 text-[9px] px-1.5 font-mono bg-violet-50 text-violet-600 border-violet-200 shrink-0 mt-0.5">
                      {entry.hash}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-foreground leading-snug">{entry.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {entry.author} · {new Date(entry.timestamp).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}, {new Date(entry.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  // ── Edit mode ──
  return (
    <div className="w-[380px] border-l border-border bg-white flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-10 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("view")}
            className="p-1 rounded hover:bg-accent transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground rotate-180" />
          </button>
          <span className="text-[12px] font-semibold text-foreground">Edit Profile</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { toast.success("Changes saved"); setView("view"); }}
            className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            Save
          </button>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* ── Mode ── */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Mode</p>
            <div className="flex gap-2">
              {([
                { mode: "production" as AgentMode, label: "Production", color: "emerald", desc: "Replies to customers" },
                { mode: "training" as AgentMode, label: "Training", color: "amber", desc: "Drafts as internal notes" },
                { mode: "off" as AgentMode, label: "Off", color: "zinc", desc: "Inactive" },
              ]).map(({ mode, label, color, desc }) => (
                <button
                  key={mode}
                  onClick={() => setAgentMode(mode)}
                  className={cn(
                    "flex-1 border rounded-md px-3 py-2 text-left transition-all",
                    agentMode === mode
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      color === "emerald" && "bg-emerald-400",
                      color === "amber" && "bg-amber-400",
                      color === "zinc" && "bg-zinc-400"
                    )} />
                    <span className="text-[11px] font-medium">{label}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ── Identity ── */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Identity</p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Label className="text-[10px] text-muted-foreground mb-0.5 block">Name</Label>
                  <Input
                    value={identity.name}
                    onChange={(e) => setIdentity({ ...identity, name: e.target.value })}
                    className="h-7 text-[12px]"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-[10px] text-muted-foreground mb-0.5 block">Tone</Label>
                  <Select value={identity.tone} onValueChange={(v) => setIdentity({ ...identity, tone: v as AgentIdentity["tone"] })}>
                    <SelectTrigger className="h-7 text-[12px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground mb-0.5 block">Greeting</Label>
                <Input
                  value={identity.greeting}
                  onChange={(e) => setIdentity({ ...identity, greeting: e.target.value })}
                  className="h-7 text-[12px]"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground mb-0.5 block">Signature</Label>
                <Input
                  value={identity.signature}
                  onChange={(e) => setIdentity({ ...identity, signature: e.target.value })}
                  className="h-7 text-[12px]"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-[10px] text-muted-foreground">Disclose AI identity</Label>
                <Switch
                  checked={identity.transparentAboutAI}
                  onCheckedChange={(checked) => setIdentity({ ...identity, transparentAboutAI: checked })}
                />
              </div>
            </div>
          </div>

          {/* ── Actions (grouped by category, with guardrails) ── */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Actions</p>
            {Object.entries(grouped).map(([category, actions]) => (
              <div key={category} className="mb-3 last:mb-0">
                <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wide mb-1.5">{category}</p>
                <div className="space-y-0 divide-y divide-border/30">
                  {actions.map((action) => {
                    const isOn = action.permission !== "disabled";
                    const enabledGuardrails = (action.guardrails || []).filter(g => g.enabled);
                    return (
                      <div key={action.id} className="py-2 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[12px] font-medium text-foreground">{action.name}</span>
                            <Tip text={action.description} />
                          </div>
                          <Switch
                            checked={isOn}
                            onCheckedChange={() => togglePermission(action.id)}
                          />
                        </div>
                        {isOn && enabledGuardrails.length > 0 && (
                          <div className="mt-1 ml-0.5 flex flex-wrap gap-x-3 gap-y-1">
                            {enabledGuardrails.map((g) => (
                              <div key={g.id} className="flex items-center gap-1">
                                <span className="text-[9px] text-amber-600 font-medium">Guardrail:</span>
                                <span className="text-[9px] text-muted-foreground">{g.label}</span>
                                {g.type === "number" && (
                                  <div className="flex items-center gap-0.5">
                                    <Input
                                      type="number"
                                      defaultValue={g.value}
                                      className="w-12 h-4 text-[9px] px-1"
                                    />
                                    {g.unit && <span className="text-[8px] text-muted-foreground">{g.unit}</span>}
                                  </div>
                                )}
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
      </ScrollArea>
    </div>
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
  const [repName, setRepName] = useState("Ava");
  const [personality, setPersonality] = useState<"professional" | "friendly" | "casual">("friendly");
  const [actions, setActions] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    ACTION_PERMISSIONS.forEach((a) => {
      map[a.id] = ["ap-2", "ap-4", "ap-6"].includes(a.id);
    });
    return map;
  });

  const grouped = useMemo(() => {
    return ACTION_PERMISSIONS.reduce<Record<string, ActionPermission[]>>((acc, p) => {
      (acc[p.category] = acc[p.category] || []).push(p);
      return acc;
    }, {});
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[85vh] overflow-y-auto p-0">
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-6 py-5 rounded-t-lg">
          <DialogTitle className="text-[18px] font-semibold text-white">Hire Support Rep</DialogTitle>
          <DialogDescription className="text-[13px] text-white/80 mt-1">
            Pre-configured based on your training docs. Review and confirm.
          </DialogDescription>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Name</Label>
            <Input
              value={repName}
              onChange={(e) => setRepName(e.target.value)}
              className="mt-1.5 h-9 text-[13px]"
            />
          </div>

          <div>
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Personality</Label>
            <Select value={personality} onValueChange={(v) => setPersonality(v as typeof personality)}>
              <SelectTrigger className="mt-1.5 h-9 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Warm & Professional</SelectItem>
                <SelectItem value="casual">Casual & Friendly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Allowed Actions</Label>
            <div className="mt-2 space-y-3">
              {Object.entries(grouped).map(([category, catActions]) => (
                <div key={category}>
                  <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wide mb-1">{category}</p>
                  <div className="space-y-0">
                    {catActions.map((action) => {
                      const checked = actions[action.id] || false;
                      return (
                        <label
                          key={action.id}
                          className={cn(
                            "flex items-center gap-2.5 py-1.5 cursor-pointer",
                            !checked && "opacity-60"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => setActions(prev => ({ ...prev, [action.id]: !prev[action.id] }))}
                            className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary/30"
                          />
                          <span className={cn("text-[12px]", checked ? "text-foreground font-medium" : "text-muted-foreground")}>
                            {action.name}
                          </span>
                          {!checked && <span className="text-[10px] text-muted-foreground/50 ml-auto">(not assigned)</span>}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pb-5">
          <Button
            className="w-full h-11 text-[14px] font-semibold bg-teal-600 hover:bg-teal-700"
            onClick={() => onHire(repName)}
          >
            Hire
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════
// ── SETUP TAB (Onboarding — Team Lead conversation) ─────
// ══════════════════════════════════════════════════════════

type OBPhase = "greeting" | "upload_doc" | "importing" | "processing_notice" | "conflict_1" | "conflict_2" | "conflict_3" | "playbook_done" | "done";

interface OnboardingMsg {
  id: string;
  sender: "ai" | "manager";
  content: string;
  choices?: { label: string; value: string; variant?: "primary" | "outline" }[];
  widget?: string;
  widgetData?: Record<string, unknown>;
}

interface ConflictItem {
  id: number;
  title: string;
  description: string;
  optionA: string;
  optionB: string;
  resolved: boolean;
  choice?: string;
}

const DEMO_CONFLICTS: ConflictItem[] = [
  {
    id: 1,
    title: "Return Window",
    description: 'Your return policy says "30-day return window" but the FAQ page says "28 calendar days from delivery."',
    optionA: "30 days from delivery",
    optionB: "28 calendar days",
    resolved: false,
  },
  {
    id: 2,
    title: "Refund Method",
    description: 'Policy doc says "refund to original payment method only" but your FAQ mentions store credit as an option.',
    optionA: "Original payment method only",
    optionB: "Original method or store credit",
    resolved: false,
  },
  {
    id: 3,
    title: "Return Shipping",
    description: 'Policy says "free returns" but the terms page says "customer pays $8.95 for return shipping."',
    optionA: "Free returns for all",
    optionB: "Free for defective, $8.95 for others",
    resolved: false,
  },
];

const DEMO_EXTRACTED_RULES = [
  "Standard Return & Refund",
  "Where Is My Order (WISMO)",
  "Damaged / Wrong Item",
  "Order Cancellation",
  "Return Shipping Cost",
  "International Returns",
  "VIP Customer Handling",
  "Product Warranty Claims",
  "Discount & Coupon Policy",
  "Escalation Triggers",
  "Shipping Delay Response",
  "Final Sale Items",
  "Exchange Process",
];

function SetupTab({ onHireRep }: { onHireRep: () => void }) {
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState<OBPhase>("greeting");
  const [messages, setMessages] = useState<OnboardingMsg[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictItem[]>(DEMO_CONFLICTS);
  const [currentConflictIdx, setCurrentConflictIdx] = useState(0);
  const [showAllRules, setShowAllRules] = useState(false);
  const [showHireDialog, setShowHireDialog] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, phase]);

  const makeObMsg = (
    sender: "ai" | "manager",
    content: string,
    extra?: Partial<OnboardingMsg>
  ): OnboardingMsg => ({
    id: `ob-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sender,
    content,
    ...extra,
  });

  const addAiMessages = useCallback((msgs: OnboardingMsg[], delay = 400) => {
    msgs.forEach((msg, i) => {
      setTimeout(() => {
        setMessages((prev) => [...prev, msg]);
      }, delay * (i + 1));
    });
  }, []);

  // ── Greeting ──
  useEffect(() => {
    if (messages.length === 0) {
      addAiMessages([
        makeObMsg("ai", "Welcome to Support Workforce! I'm Alex, your Team Lead. I manage your support reps so you don't have to deal with the details.\n\nYour Zendesk and Shopify are connected. I need two things from you before we can get your first rep on the floor."),
        makeObMsg("ai", "**First — your training docs.**\n\nUpload the same playbooks, refund policies, and escalation rules you'd hand a new hire. I'll read them, extract the rules, and flag anything that's unclear.", {
          widget: "upload_doc",
        }),
      ], 500);
    }
  }, []);

  const handleUpload = (isDemo: boolean) => {
    setMessages((prev) => [
      ...prev,
      makeObMsg("manager", isDemo ? "Try with Seel Return Guidelines" : "Uploaded: Return_Policy_v2.pdf"),
    ]);
    setPhase("importing");
    setImportProgress(0);
    addAiMessages([
      makeObMsg("ai", isDemo
        ? "Great choice! Let me analyze the **Seel Return Guidelines** and extract the rules..."
        : "Got it! Reading through your document now...\n\nThis is your first upload, so processing may take a while. I'll notify you when it's ready — feel free to come back in **30–60 minutes**.",
        { widget: "import_progress" }
      ),
    ]);
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;
    setMessages((prev) => [
      ...prev,
      makeObMsg("manager", `Shared link: ${urlInput.trim()}`),
    ]);
    setUrlInput("");
    setShowUrlInput(false);
    setPhase("importing");
    setImportProgress(0);
    addAiMessages([
      makeObMsg("ai", "Got it! Fetching and analyzing the page content...\n\nThis is your first upload, so processing may take a while. I'll notify you when it's ready — feel free to come back in **30–60 minutes**.", { widget: "import_progress" }),
    ]);
  };

  // ── Import progress simulation ──
  useEffect(() => {
    if (phase !== "importing") return;
    const interval = setInterval(() => {
      setImportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setPhase("processing_notice");
            addAiMessages([
              makeObMsg("ai", `Done! I extracted **${DEMO_EXTRACTED_RULES.length} rules** from your document:`, {
                widget: "parse_result",
              }),
              makeObMsg("ai", `I found **${DEMO_CONFLICTS.length} conflicts** that need your input. Let me walk you through each one.`, {
                widget: "conflict_queue",
              }),
            ], 600);
          }, 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 180);
    return () => clearInterval(interval);
  }, [phase]);

  const handleConflictDismiss = (conflictId: number) => {
    const updated = conflicts.map((c) =>
      c.id === conflictId ? { ...c, resolved: true, choice: "dismissed" } : c
    );
    setConflicts(updated);

    setMessages((prev) => [
      ...prev,
      makeObMsg("manager", "Dismiss — I'll decide later"),
    ]);

    const nextUnresolved = updated.findIndex((c) => !c.resolved);
    if (nextUnresolved === -1) {
      setPhase("playbook_done");
      addAiMessages([
        makeObMsg("ai", "Playbook is ready! You can revisit dismissed conflicts anytime in the **Playbook** tab."),
        makeObMsg("ai", "**Second — let's hire your first support rep.**\n\nI'll start them on WISMO — order status, cancellations for unshipped orders, and address changes. Highest volume, lowest risk. Once they prove themselves, we expand their scope.\n\nI've pre-configured a rep based on your docs. Review the profile and hit Hire:", {
          choices: [
            { label: "Review & Hire Support Rep →", value: "hire_rep", variant: "primary" },
          ],
        }),
      ]);
    } else {
      setCurrentConflictIdx(nextUnresolved);
      addAiMessages([
        makeObMsg("ai", "No problem, you can resolve it later. Next conflict:"),
      ]);
    }
  };

  const handleChoice = (value: string) => {
    if (value === "hire_rep") {
      setShowHireDialog(true);
    }
  };

  const handleHireFromDialog = (name: string) => {
    setShowHireDialog(false);
    setPhase("done");
    setMessages((prev) => [
      ...prev,
      makeObMsg("manager", `Hired ${name}!`),
    ]);
    addAiMessages([
      makeObMsg("ai", `**${name}** is now on the team! They'll start handling WISMO tickets right away. You can find them in the left panel under **Reps** — check their escalations and adjust their profile anytime.`),
    ]);
    onHireRep();
  };

  const renderWidget = (msg: OnboardingMsg) => {
    switch (msg.widget) {
      case "upload_doc":
        return (
          <div className="mt-2.5 space-y-2">
            <div
              onClick={() => handleUpload(false)}
              className="p-4 rounded-lg border border-dashed border-border bg-white hover:border-primary/40 hover:bg-primary/[0.02] transition-all cursor-pointer"
            >
              <div className="text-center">
                <Upload className="w-5 h-5 text-muted-foreground/40 mx-auto mb-1.5" />
                <p className="text-[12px] font-medium text-foreground">Drop your document here, or click to browse</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">PDF, DOCX, TXT, or paste a URL below</p>
              </div>
            </div>

            {showUrlInput ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 focus-within:ring-1 focus-within:ring-primary/30">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                  <input
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                    placeholder="https://your-store.com/return-policy"
                    className="flex-1 text-[12px] bg-transparent outline-none placeholder:text-muted-foreground/40"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleUrlSubmit}
                  disabled={!urlInput.trim()}
                  className="px-3 py-2 rounded-lg text-[11px] font-medium bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-40"
                >
                  Import
                </button>
                <button
                  onClick={() => { setShowUrlInput(false); setUrlInput(""); }}
                  className="p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowUrlInput(true)}
                  className="text-[11px] text-primary hover:underline flex items-center gap-1"
                >
                  <Link2 className="w-3 h-3" /> Or paste a webpage URL
                </button>
                <span className="text-muted-foreground/30">|</span>
                <button
                  onClick={() => handleUpload(true)}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  No doc handy? <span className="text-primary hover:underline">Try with Seel Return Guidelines</span>
                </button>
              </div>
            )}
          </div>
        );

      case "import_progress":
        return (
          <div className="mt-2 p-3 rounded-lg border border-border bg-white">
            <div className="flex items-center gap-2.5 mb-2">
              <Bot className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-[11px] text-muted-foreground">
                {importProgress < 30 && "Reading document..."}
                {importProgress >= 30 && importProgress < 60 && "Extracting business rules..."}
                {importProgress >= 60 && importProgress < 90 && "Cross-referencing with FAQ..."}
                {importProgress >= 90 && "Finalizing..."}
              </span>
            </div>
            <Progress value={Math.min(importProgress, 100)} className="h-1" />
          </div>
        );

      case "parse_result": {
        const visibleRules = showAllRules ? DEMO_EXTRACTED_RULES : DEMO_EXTRACTED_RULES.slice(0, 5);
        return (
          <div className="mt-2 p-3 rounded-lg border border-border bg-white">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[12px] font-medium">{DEMO_EXTRACTED_RULES.length} rules extracted</span>
            </div>
            <div className="space-y-0.5">
              {visibleRules.map((name, i) => (
                <div key={i} className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-muted/30">
                  <div className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-[11px] text-foreground">{name}</span>
                </div>
              ))}
            </div>
            {DEMO_EXTRACTED_RULES.length > 5 && (
              <button
                onClick={() => setShowAllRules(!showAllRules)}
                className="text-[10px] text-primary hover:underline mt-1.5 flex items-center gap-0.5"
              >
                {showAllRules ? (
                  <><ChevronUp className="w-3 h-3" /> Show less</>
                ) : (
                  <><ChevronDown className="w-3 h-3" /> Show all {DEMO_EXTRACTED_RULES.length} rules</>
                )}
              </button>
            )}
          </div>
        );
      }

      case "conflict_queue": {
        const current = conflicts[currentConflictIdx];
        if (!current || current.resolved) return null;
        const resolvedCount = conflicts.filter((c) => c.resolved).length;

        return (
          <div className="mt-2.5 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-muted-foreground">
                Conflict {resolvedCount + 1} of {conflicts.length}
              </span>
              <div className="flex-1 h-1 bg-muted/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/60 rounded-full transition-all"
                  style={{ width: `${(resolvedCount / conflicts.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="rounded-lg border border-amber-100/60 bg-amber-50/20 overflow-hidden">
              <div className="px-3.5 py-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-[12px] font-medium text-foreground">{current.title}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{current.description}</p>

                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-amber-100/40">
                  <button
                    onClick={() => handleConflictDismiss(current.id)}
                    className="px-3 py-1.5 rounded-md text-[11px] font-medium text-muted-foreground hover:bg-accent transition-colors"
                  >
                    Dismiss — I'll decide later
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

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
                </div>
                <div className={cn(
                  "rounded-xl px-3 py-2 inline-block text-left",
                  msg.sender === "ai" ? "bg-muted/40 text-foreground rounded-tl-sm" : "bg-primary/6 text-foreground rounded-tr-sm"
                )}>
                  {msg.content && <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />}
                  {msg.widget && renderWidget(msg)}
                </div>
                {msg.choices && (
                  <div className="flex flex-wrap gap-1.5 mt-2 ml-0.5">
                    {msg.choices.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => handleChoice(c.value)}
                        className={cn(
                          "px-4 py-2 rounded-lg text-[12px] font-medium transition-colors",
                          c.variant === "primary"
                            ? "bg-teal-600 text-white hover:bg-teal-700"
                            : "border border-border text-foreground hover:bg-accent"
                        )}
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

      <HireRepDialog
        open={showHireDialog}
        onOpenChange={setShowHireDialog}
        onHire={handleHireFromDialog}
      />
    </>
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
  const [inputValue, setInputValue] = useState("");
  const [extraMessages, setExtraMessages] = useState<ChatMessage[]>([]);
  const [showTopics, setShowTopics] = useState(false);
  const [threadPanel, setThreadPanel] = useState<{ topicId: string; topicTitle: string; contextMsg: string } | null>(null);

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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Build Team Lead messages
  const baseMessages = useMemo(() => buildChatMessages(TOPICS), []);
  const allMessages = useMemo(() => {
    const combined = [...baseMessages, ...extraMessages];
    combined.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return combined;
  }, [baseMessages, extraMessages]);

  // Topics list
  const topicsList = useMemo(() => {
    const topicMap = new Map<string, TopicItem>();
    for (const msg of allMessages) {
      if (!topicMap.has(msg.topicId)) {
        topicMap.set(msg.topicId, {
          id: msg.topicId,
          title: msg.topicTitle,
          status: msg.topicStatus,
          timestamp: msg.timestamp,
          hasActions: !!msg.hasActions,
          replyCount: 0,
        });
      }
      topicMap.get(msg.topicId)!.replyCount++;
      topicMap.get(msg.topicId)!.timestamp = msg.timestamp;
    }
    return Array.from(topicMap.values());
  }, [allMessages]);

  const waitingCount = topicsList.filter((t) => t.status === "waiting" && t.hasActions).length;

  // Escalation counts
  const needsAttentionCount = useMemo(() =>
    ESCALATION_TICKETS.filter((t) => escalationStatuses[t.id] === "needs_attention").length,
    [escalationStatuses]
  );

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = "";
    for (const msg of allMessages) {
      const dateKey = new Date(msg.timestamp).toISOString().split("T")[0];
      if (dateKey !== currentDate) {
        currentDate = dateKey;
        groups.push({ date: msg.timestamp, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    }
    return groups;
  }, [allMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    const topicId = `new-${Date.now()}`;
    const now = new Date().toISOString();

    const managerMsg: ChatMessage = {
      id: `cm-${Date.now()}`,
      sender: "manager",
      content: inputValue.trim(),
      timestamp: now,
      topicId,
      topicTitle: inputValue.trim().slice(0, 60),
      topicStatus: "waiting",
      isTopicStart: true,
    };

    setExtraMessages((prev) => [...prev, managerMsg]);
    setInputValue("");

    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: `cm-ai-${Date.now()}`,
        sender: "ai",
        content: "I understand. Let me update the rules to reflect this change.",
        timestamp: new Date().toISOString(),
        topicId,
        topicTitle: managerMsg.topicTitle,
        topicStatus: "waiting",
        ruleChange: {
          type: "new",
          ruleName: managerMsg.topicTitle,
          after: inputValue.trim(),
          source: "Manager directive",
        },
        hasActions: false,
      };
      setExtraMessages((prev) => [...prev, aiMsg]);
    }, 1500);
  };

  const handleAction = (topicId: string, action: string) => {
    if (action === "modify_accept") {
      const msgs = allMessages.filter((m) => m.topicId === topicId);
      const first = msgs[0];
      if (first) {
        setThreadPanel({ topicId, topicTitle: first.topicTitle, contextMsg: first.content });
        setShowTopics(false);
        toast.info("Edit the rule in the thread, then confirm.");
      }
    } else {
      toast.success(action === "accept" ? "Rule accepted" : "Rule rejected");
    }
  };

  const handleReply = (topicId: string) => {
    const msgs = allMessages.filter((m) => m.topicId === topicId);
    const first = msgs[0];
    if (first) {
      setThreadPanel({ topicId, topicTitle: first.topicTitle, contextMsg: first.content });
      setShowTopics(false);
    }
  };

  const handleSelectTopic = (topicId: string) => {
    const el = document.getElementById(`msg-${topicId}-start`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-primary/5");
      setTimeout(() => el.classList.remove("bg-primary/5"), 2000);
    }
  };

  const handleCloseWelcome = () => {
    localStorage.setItem("seel_ai_welcome_seen", "1");
    setShowWelcome(false);
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

  const shownTopics = new Set<string>();

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
                        onClick={() => setActiveTab("conversations")}
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
                      onClick={() => { setShowTopics(!showTopics); setThreadPanel(null); }}
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
                    <div className="flex-1 flex flex-col min-w-0">
                      <ScrollArea className="flex-1">
                        <div className="max-w-[640px] mx-auto px-5 py-4 space-y-3">
                          {groupedMessages.map((group, gi) => (
                            <div key={gi}>
                              <div className="flex items-center gap-3 my-4">
                                <div className="flex-1 h-px bg-border" />
                                <span className="text-[10px] font-medium text-muted-foreground px-2">
                                  {formatDateGroup(group.date)}
                                </span>
                                <div className="flex-1 h-px bg-border" />
                              </div>

                              <div className="space-y-3">
                                {group.messages.map((msg) => {
                                  const showTopicLabel = msg.isTopicStart && !shownTopics.has(msg.topicId);
                                  if (msg.isTopicStart) shownTopics.add(msg.topicId);

                                  return (
                                    <div key={msg.id} id={msg.isTopicStart ? `msg-${msg.topicId}-start` : undefined} className="transition-colors duration-500 rounded-lg">
                                      {showTopicLabel && (
                                        <TopicLabel title={msg.topicTitle} status={msg.topicStatus} />
                                      )}
                                      <MessageBubble
                                        msg={msg}
                                        senderLabel="Alex (Team Lead)"
                                        onAction={handleAction}
                                        onReply={handleReply}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>

                      {/* Input */}
                      <div className="px-5 py-3 border-t border-border bg-white">
                        <div className="max-w-[640px] mx-auto">
                          <div className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 focus-within:ring-1 focus-within:ring-primary/30 focus-within:border-primary/40 transition-all">
                            <input
                              value={inputValue}
                              onChange={(e) => setInputValue(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                              placeholder="Message Alex..."
                              className="flex-1 text-[12.5px] bg-transparent outline-none placeholder:text-muted-foreground/50"
                            />
                            <button
                              onClick={handleSendMessage}
                              disabled={!inputValue.trim()}
                              className="p-1.5 rounded-md text-primary hover:bg-primary/8 transition-colors disabled:opacity-30"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Side panels */}
                    {threadPanel && (
                      <ThreadSidePanel
                        topicId={threadPanel.topicId}
                        topicTitle={threadPanel.topicTitle}
                        contextMsg={threadPanel.contextMsg}
                        onClose={() => setThreadPanel(null)}
                      />
                    )}

                    {showTopics && !threadPanel && (
                      <TopicsPanel
                        topics={topicsList}
                        onSelectTopic={handleSelectTopic}
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
