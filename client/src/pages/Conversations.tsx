/**
 * Performance > Conversations
 *
 * Redesign v3:
 * - Conversation Detail: Agent consecutive replies grouped → one Reasoning per group
 * - Left side: "View Reasoning" button at end of each agent reply group
 * - Right side: shows ONE Reasoning at a time (selected from left)
 * - Reasoning Trace: Intent Detection → Skill Matched → Agent Thinking → Actions → Knowledge → Guardrails
 * - No Turn labels on both sides — just click to navigate
 * - Bad Case feedback on agent reply groups
 */
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearch } from "wouter";
import {
  Search, ArrowLeft, ChevronDown,
  MessageSquare, CheckCircle2, ArrowUpRight,
  Clock, Bot, User, Zap, Brain, BookOpen,
  Eye, Flag, MessageCircleWarning,
  Mail, MessageCircle, Instagram,
  X, Target, Shield, Crosshair,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ── Types ── */
interface ReasoningTrace {
  intentDetected: string;         // e.g., "Order Tracking (WISMO)"
  skillMatched: string;           // e.g., "Where Is My Order (WISMO)"
  skillConfidence: string;        // e.g., "High (0.96)"
  thinking: string;               // Natural language reasoning
  actions: string[];              // Actions executed
  knowledgeUsed?: string;         // Knowledge article referenced
  guardrailsChecked?: string;     // Guardrail result
}

interface ConversationRow {
  id: string;
  orderId: string;
  subject: string;
  customer: string;
  intent: string;
  result: "Resolved" | "Escalated" | "Pending";
  approach: string;
  turns: number;
  sentimentStart: "positive" | "neutral" | "negative";
  sentimentEnd: "positive" | "neutral" | "negative";
  agent: string;
  duration: string;
  actionsExecuted: string[];
  channel: "email" | "live_chat" | "social";
  timestamp: string;
  messages: { role: "customer" | "agent"; text: string; time: string }[];
  reasoningTraces: ReasoningTrace[];  // One per agent reply GROUP
}

/* ── Mock Data ── */
const conversations: ConversationRow[] = [
  {
    id: "C-1001", orderId: "#ORD-8834", subject: "Where is my order?", customer: "Sarah Johnson",
    intent: "Order Tracking", result: "Resolved", approach: "Autopilot", turns: 3,
    sentimentStart: "neutral", sentimentEnd: "positive",
    agent: "RC Live Chat Agent", duration: "1m 12s",
    actionsExecuted: ["get_order_status", "send_tracking_link"], channel: "live_chat", timestamp: "Today 14:33",
    messages: [
      { role: "customer", text: "Hi, I placed an order 3 days ago and haven't received any shipping updates. Order #8834.", time: "14:32" },
      { role: "agent", text: "Hello Sarah! Let me check the status of your order #8834 right away.", time: "14:32" },
      { role: "agent", text: "I found your order. It's currently in transit with FedEx. Tracking number: FX-2847391. The estimated delivery is March 27th. Here's your tracking link: https://track.fedex.com/FX-2847391", time: "14:33" },
      { role: "customer", text: "Oh great, thank you! That's very helpful.", time: "14:33" },
    ],
    reasoningTraces: [
      {
        intentDetected: "Order Tracking (WISMO)",
        skillMatched: "Where Is My Order (WISMO)",
        skillConfidence: "High (0.96)",
        thinking: "The customer is asking about their order status — this is a standard WISMO request. I'll look up order #8834 to get the current shipping status. The order is in transit with FedEx and on schedule. I should provide the tracking number and a direct tracking link so the customer can monitor it themselves. This should fully resolve their question.",
        actions: [
          "get_order_status → Order #8834: In Transit, FedEx, ETA Mar 27",
          "send_tracking_link → Generated FedEx tracking URL for FX-2847391",
        ],
        knowledgeUsed: "Shipping FAQ — How to track your order",
        guardrailsChecked: "Passed — No sensitive data exposed, response within policy",
      },
    ],
  },
  {
    id: "C-1002", orderId: "#ORD-7721", subject: "Damaged item — want refund", customer: "Mike Chen",
    intent: "Seel Protection Claim", result: "Resolved", approach: "Autopilot", turns: 4,
    sentimentStart: "negative", sentimentEnd: "positive",
    agent: "RC Live Chat Agent", duration: "2m 45s",
    actionsExecuted: ["get_order_status", "check_protection_eligibility", "process_refund"], channel: "live_chat", timestamp: "Today 14:30",
    messages: [
      { role: "customer", text: "I want a refund for order #7721. The product arrived damaged.", time: "14:28" },
      { role: "agent", text: "I'm sorry to hear about the damage, Mike. Let me look into this for you right away.", time: "14:28" },
      { role: "agent", text: "I can see your order #7721 is covered by Seel Protection. Since the item arrived damaged, I've initiated a full refund of $45.99 to your original payment method. You should see it within 3-5 business days.", time: "14:30" },
      { role: "customer", text: "That was fast! Thank you so much.", time: "14:30" },
    ],
    reasoningTraces: [
      {
        intentDetected: "Refund Request — Damaged Item",
        skillMatched: "Post-purchase Claims (Seel Protection)",
        skillConfidence: "High (0.94)",
        thinking: "The customer reports a damaged item and wants a refund. I need to first check the order details and whether it's covered by Seel Protection. Good news — this order has Seel Protection and is within the 30-day claim window (delivered Mar 20, 27 days remaining). Per our policy, damaged items with active protection qualify for an automatic full refund. I'll process it now and let the customer know the timeline.",
        actions: [
          "get_order_status → Order #7721: Delivered Mar 20, Seel Protected",
          "check_protection_eligibility → Eligible (within 30-day window, damage claim)",
          "process_refund → $45.99 refund initiated to original payment",
        ],
        guardrailsChecked: "Passed — Refund amount $45.99 within auto-approve limit ($50)",
      },
    ],
  },
  {
    id: "C-1003", orderId: "#ORD-6655", subject: "Return not processed after 2 weeks", customer: "Emily Davis",
    intent: "Return Inquiry", result: "Escalated", approach: "Autopilot", turns: 3,
    sentimentStart: "negative", sentimentEnd: "negative",
    agent: "RC Live Chat Agent", duration: "3m 20s",
    actionsExecuted: ["get_order_status", "escalate_to_human"], channel: "social", timestamp: "Today 14:22",
    messages: [
      { role: "customer", text: "This is the THIRD time I'm asking about my return. Nobody is helping me!", time: "14:20" },
      { role: "agent", text: "I sincerely apologize for the inconvenience, Emily. Let me review your return request right away.", time: "14:20" },
      { role: "agent", text: "I can see your return for order #6655 was initiated but not yet processed. I understand your frustration. I'm escalating this to our team lead for immediate resolution.", time: "14:22" },
    ],
    reasoningTraces: [
      {
        intentDetected: "Return Status Inquiry — Repeat Contact (3rd)",
        skillMatched: "Returns & Exchanges",
        skillConfidence: "Medium (0.82) — Escalation likely needed",
        thinking: "The customer is clearly frustrated — this is their third contact about the same issue. I need to acknowledge their frustration first, then quickly look up the return status. The return has been pending for 18 days, which far exceeds our 7-day SLA. Combined with the customer's negative sentiment and this being a repeat contact, I should escalate this immediately rather than try to handle it myself. This needs human intervention from a team lead.",
        actions: [
          "get_order_status → Return initiated Mar 8, not yet processed (18 days pending, SLA: 7 days)",
          "escalate_to_human → Escalated to Tier 2 Support (Priority: High, Reason: SLA breach + repeat contact)",
        ],
        knowledgeUsed: "Returns Policy — Processing times and escalation procedures",
        guardrailsChecked: "Triggered — Escalation rule: Repeat contact (3+) with unresolved issue",
      },
    ],
  },
  {
    id: "C-1004", orderId: "#ORD-9012", subject: "Change shipping address", customer: "James Wilson",
    intent: "Order Changes", result: "Resolved", approach: "Shadow", turns: 3,
    sentimentStart: "neutral", sentimentEnd: "positive",
    agent: "Email Support Agent", duration: "4m 10s",
    actionsExecuted: ["get_order_status", "update_shipping_address"], channel: "email", timestamp: "Today 13:45",
    messages: [
      { role: "customer", text: "Can I change my shipping address for order #9012? I moved to 456 Oak Ave, Portland OR 97201.", time: "13:40" },
      { role: "agent", text: "Of course, James! I've updated the shipping address for order #9012 to 456 Oak Ave, Portland OR 97201. The package hasn't shipped yet, so the change will apply.", time: "13:44" },
      { role: "customer", text: "Perfect, thanks!", time: "13:45" },
    ],
    reasoningTraces: [
      {
        intentDetected: "Shipping Address Change",
        skillMatched: "Order Changes",
        skillConfidence: "High (0.95)",
        thinking: "The customer wants to update their shipping address. I need to first check if the order has already shipped — if it has, I can't change the address. The order is still in Processing and hasn't shipped yet, so I can safely update the address to the new one provided.",
        actions: [
          "get_order_status → Order #9012: Processing, not yet shipped",
          "update_shipping_address → Updated from 123 Main St, Seattle WA to 456 Oak Ave, Portland OR 97201",
        ],
        guardrailsChecked: "Passed — Address change allowed for unshipped orders",
      },
    ],
  },
  {
    id: "C-1005", orderId: "#ORD-8890", subject: "Cancel my order", customer: "Lisa Park",
    intent: "Order Cancellation", result: "Resolved", approach: "Autopilot", turns: 3,
    sentimentStart: "neutral", sentimentEnd: "positive",
    agent: "RC Live Chat Agent", duration: "1m 30s",
    actionsExecuted: ["get_order_status", "cancel_order", "process_refund"], channel: "live_chat", timestamp: "Today 12:50",
    messages: [
      { role: "customer", text: "Please cancel my order #8890. I found a better deal elsewhere.", time: "12:48" },
      { role: "agent", text: "I understand, Lisa. Let me process the cancellation for order #8890.", time: "12:48" },
      { role: "agent", text: "Your order #8890 has been cancelled and a full refund of $78.00 has been initiated. You'll see it in 3-5 business days.", time: "12:50" },
      { role: "customer", text: "Thanks for the quick help!", time: "12:50" },
    ],
    reasoningTraces: [
      {
        intentDetected: "Order Cancellation",
        skillMatched: "Order Changes (Cancellation)",
        skillConfidence: "High (0.97)",
        thinking: "The customer wants to cancel their order. I need to check if it's still in a cancellable state (not yet shipped). The order hasn't shipped yet, so cancellation is straightforward. Per our policy, cancelled orders receive an automatic full refund. I'll process both the cancellation and refund together and confirm the timeline.",
        actions: [
          "get_order_status → Order #8890: Processing, not shipped",
          "cancel_order → Order #8890 cancelled",
          "process_refund → $78.00 refund initiated (3-5 business days)",
        ],
        guardrailsChecked: "Passed — Refund amount $78.00 within auto-approve limit",
      },
    ],
  },
  {
    id: "C-1006", orderId: "#ORD-7788", subject: "Order delivery status", customer: "Tom Baker",
    intent: "Order Tracking", result: "Resolved", approach: "Autopilot", turns: 2,
    sentimentStart: "neutral", sentimentEnd: "positive",
    agent: "RC Live Chat Agent", duration: "0m 45s",
    actionsExecuted: ["get_order_status"], channel: "live_chat", timestamp: "Today 11:20",
    messages: [
      { role: "customer", text: "Where is my order #7788?", time: "11:18" },
      { role: "agent", text: "Your order is out for delivery today! Tracking: FX-1234567. You should receive it by end of day.", time: "11:19" },
      { role: "customer", text: "Perfect, thanks!", time: "11:20" },
    ],
    reasoningTraces: [
      {
        intentDetected: "Order Tracking (WISMO)",
        skillMatched: "Where Is My Order (WISMO)",
        skillConfidence: "High (0.98)",
        thinking: "Simple WISMO request. The order is already out for delivery today, which is great news. I'll share the tracking number and the expected delivery window right away — no need for additional steps.",
        actions: ["get_order_status → Order #7788: Out for delivery today, FedEx FX-1234567"],
        guardrailsChecked: "Passed — Standard tracking response",
      },
    ],
  },
];

const agentList = Array.from(new Set(conversations.map(c => c.agent)));

/* ── Helpers ── */
const resultConfig: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  Resolved: { color: "text-primary bg-primary/10 border-primary/20", icon: CheckCircle2 },
  Escalated: { color: "text-amber-700 bg-amber-50 border-amber-200", icon: ArrowUpRight },
  Pending: { color: "text-blue-700 bg-blue-50 border-blue-200", icon: Clock },
};

const channelIcons: Record<string, { icon: typeof Mail; color: string }> = {
  email: { icon: Mail, color: "text-blue-500" },
  live_chat: { icon: MessageCircle, color: "text-primary" },
  social: { icon: Instagram, color: "text-pink-500" },
};

function SentimentArc({ start, end }: { start: string; end: string }) {
  const colorMap: Record<string, { text: string; bg: string; label: string }> = {
    positive: { text: "text-primary", bg: "bg-primary", label: "Positive" },
    neutral: { text: "text-amber-600", bg: "bg-amber-400", label: "Neutral" },
    negative: { text: "text-red-500", bg: "bg-red-400", label: "Negative" },
  };
  const s = colorMap[start] || colorMap.neutral;
  const e = colorMap[end] || colorMap.neutral;
  const improved = (start === "negative" && end !== "negative") || (start === "neutral" && end === "positive");
  const worsened = (start === "positive" && end !== "positive") || (start === "neutral" && end === "negative");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1 cursor-default">
          <div className={cn("w-2 h-2 rounded-full", s.bg)} />
          <svg width="12" height="8" viewBox="0 0 12 8" className={cn(improved ? "text-primary" : worsened ? "text-red-400" : "text-muted-foreground/40")}>
            <path d="M0 4h8m0 0L6 2m2 2L6 6" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className={cn("w-2 h-2 rounded-full", e.bg)} />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-[10px]">
        <span className={s.text}>{s.label}</span> → <span className={e.text}>{e.label}</span>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Group consecutive agent messages into reply groups.
 * Each group maps to one ReasoningTrace.
 */
interface MessageGroup {
  type: "customer" | "agent-group";
  messages: { role: "customer" | "agent"; text: string; time: string }[];
  reasoningIndex: number; // index into reasoningTraces (only for agent-group)
}

function groupMessages(msgs: ConversationRow["messages"]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  let agentGroupIdx = 0;

  for (let i = 0; i < msgs.length; i++) {
    const msg = msgs[i];
    if (msg.role === "customer") {
      groups.push({ type: "customer", messages: [msg], reasoningIndex: -1 });
    } else {
      // Start or continue agent group
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.type === "agent-group") {
        // Continue existing agent group
        lastGroup.messages.push(msg);
      } else {
        // Start new agent group
        groups.push({ type: "agent-group", messages: [msg], reasoningIndex: agentGroupIdx });
        agentGroupIdx++;
      }
    }
  }
  return groups;
}

const cV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.03 } } };
const iV = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

export default function Conversations() {
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const agentFromUrl = urlParams.get("agent") || "all";

  const [selectedConv, setSelectedConv] = useState<ConversationRow | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [resultFilter, setResultFilter] = useState("all");
  const [intentFilter, setIntentFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState(agentFromUrl);

  useEffect(() => {
    if (agentFromUrl !== "all") setAgentFilter(agentFromUrl);
  }, [agentFromUrl]);

  const filtered = useMemo(() => conversations.filter(c => {
    if (resultFilter !== "all" && c.result !== resultFilter) return false;
    if (intentFilter !== "all" && c.intent !== intentFilter) return false;
    if (agentFilter !== "all" && c.agent !== agentFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return c.customer.toLowerCase().includes(q) || c.orderId.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q);
    }
    return true;
  }), [resultFilter, intentFilter, agentFilter, searchQuery]);

  if (selectedConv) {
    return <ConversationDetail conv={selectedConv} onBack={() => setSelectedConv(null)} />;
  }

  return (
    <motion.div variants={cV} initial="hidden" animate="visible" className="p-6 max-w-[1200px] space-y-4">
      {/* Header */}
      <motion.div variants={iV} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Conversations</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Review individual conversations, agent decisions, and reasoning traces</p>
        </div>
        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
          {filtered.length} of {conversations.length}
        </Badge>
      </motion.div>

      {/* Filters */}
      <motion.div variants={iV} className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-[260px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search customer, order, subject..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>
        {agentList.length > 1 && (
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="w-[170px] h-8 text-xs">
              <SelectValue placeholder="Agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agentList.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={resultFilter} onValueChange={setResultFilter}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue placeholder="Result" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Results</SelectItem>
            <SelectItem value="Resolved">Resolved</SelectItem>
            <SelectItem value="Escalated">Escalated</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={intentFilter} onValueChange={setIntentFilter}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue placeholder="Intent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Intents</SelectItem>
            <SelectItem value="Order Tracking">Order Tracking</SelectItem>
            <SelectItem value="Seel Protection Claim">Seel Protection</SelectItem>
            <SelectItem value="Order Cancellation">Order Cancellation</SelectItem>
            <SelectItem value="Order Changes">Order Changes</SelectItem>
            <SelectItem value="Return Inquiry">Return Inquiry</SelectItem>
          </SelectContent>
        </Select>
        {(agentFilter !== "all" || resultFilter !== "all" || intentFilter !== "all") && (
          <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={() => { setAgentFilter("all"); setResultFilter("all"); setIntentFilter("all"); }}>
            Clear filters
          </Button>
        )}
      </motion.div>

      {/* Data Table */}
      <motion.div variants={iV}>
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] font-semibold text-muted-foreground w-[80px] pl-4">Order</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground">Subject</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground">Intent</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground">Result</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground text-center">Turns</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground">Sentiment</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground">Agent</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground text-right pr-4">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((conv) => {
                  const rc = resultConfig[conv.result];
                  const ch = channelIcons[conv.channel];
                  const ChIcon = ch.icon;
                  return (
                    <TableRow key={conv.id} className="cursor-pointer group" onClick={() => setSelectedConv(conv)}>
                      <TableCell className="py-2.5 pl-4">
                        <div className="flex items-center gap-1.5">
                          <ChIcon className={cn("w-3 h-3", ch.color)} />
                          <span className="text-[11px] font-mono text-muted-foreground">{conv.orderId}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div>
                          <p className="text-xs font-medium group-hover:text-primary transition-colors truncate max-w-[200px]">{conv.subject}</p>
                          <p className="text-[10px] text-muted-foreground">{conv.customer} · {conv.timestamp}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge variant="secondary" className="text-[9px] font-medium">{conv.intent}</Badge>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge variant="outline" className={cn("text-[9px] font-medium gap-1", rc.color)}>
                          <rc.icon className="w-2.5 h-2.5" />
                          {conv.result}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5 text-center">
                        <span className="text-[11px] font-medium">{conv.turns}</span>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <SentimentArc start={conv.sentimentStart} end={conv.sentimentEnd} />
                      </TableCell>
                      <TableCell className="py-2.5">
                        <span className="text-[10px] text-muted-foreground truncate max-w-[100px] block">{conv.agent}</span>
                      </TableCell>
                      <TableCell className="py-2.5 text-right pr-4">
                        <span className="text-[11px] text-muted-foreground">{conv.duration}</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="text-xs text-muted-foreground">No conversations match the current filters</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* ── Conversation Detail Page                                */
/* Left: Chat History with grouped agent replies              */
/* Right: Single Reasoning panel (selected from left)         */
/* ═══════════════════════════════════════════════════════════ */
function ConversationDetail({ conv, onBack }: { conv: ConversationRow; onBack: () => void }) {
  const [activeReasoning, setActiveReasoning] = useState<number | null>(null);
  const [feedbackGroup, setFeedbackGroup] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const rc = resultConfig[conv.result];
  const ch = channelIcons[conv.channel];
  const ChIcon = ch.icon;

  const messageGroups = useMemo(() => groupMessages(conv.messages), [conv.messages]);

  const handleSubmitFeedback = (groupIdx: number) => {
    // Content is optional — submitting without text just marks the reply as "needs review"
    toast.success(feedbackText.trim()
      ? "Feedback submitted — this will help improve agent behavior"
      : "Marked for review — you can add details later"
    );
    setFeedbackText("");
    setFeedbackGroup(null);
  };

  const currentTrace = activeReasoning !== null && activeReasoning < conv.reasoningTraces.length
    ? conv.reasoningTraces[activeReasoning]
    : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-[1100px] space-y-5">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold">{conv.subject}</h1>
            <Badge variant="outline" className={cn("text-[9px] font-medium gap-1", rc.color)}>
              <rc.icon className="w-2.5 h-2.5" />
              {conv.result}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{conv.id} · {conv.customer} · {conv.timestamp}</p>
        </div>
      </div>

      {/* Meta Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5">
        <MetaCard label="Order" value={conv.orderId} />
        <MetaCard label="Intent" value={conv.intent} />
        <MetaCard label="Agent" value={conv.agent} />
        <MetaCard label="Approach" value={conv.approach} />
        <MetaCard label="Duration" value={conv.duration} />
        <MetaCard label="Sentiment" value={`${capitalize(conv.sentimentStart)} → ${capitalize(conv.sentimentEnd)}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* ── Chat History (left, 3 cols) ── */}
        <div className="lg:col-span-3">
          <Card className="shadow-sm">
            <CardHeader className="pb-2 px-4 pt-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                <CardTitle className="text-xs font-semibold">Chat History</CardTitle>
                <div className="flex items-center gap-1 ml-auto">
                  <ChIcon className={cn("w-3 h-3", ch.color)} />
                  <span className="text-[10px] text-muted-foreground capitalize">{conv.channel.replace("_", " ")}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-1">
              {messageGroups.map((group, gIdx) => {
                if (group.type === "customer") {
                  const msg = group.messages[0];
                  return (
                    <div key={gIdx} className="flex gap-2.5 px-2 py-2 -mx-2 rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[11px] font-medium">{conv.customer}</span>
                          <span className="text-[9px] text-muted-foreground">{msg.time}</span>
                        </div>
                        <p className="text-xs leading-relaxed text-foreground/80">{msg.text}</p>
                      </div>
                    </div>
                  );
                }

                // Agent reply group
                const isActive = activeReasoning === group.reasoningIndex;
                return (
                  <div
                    key={gIdx}
                    className={cn(
                      "px-2 py-2 -mx-2 rounded-lg transition-all border",
                      isActive ? "bg-primary/[0.03] border-primary/15" : "border-transparent"
                    )}
                  >
                    {group.messages.map((msg, mIdx) => (
                      <div key={mIdx} className="flex gap-2.5 mb-1.5 last:mb-0">
                        {mIdx === 0 ? (
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Bot className="w-3 h-3 text-primary" />
                          </div>
                        ) : (
                          <div className="w-6 shrink-0" /> /* spacer for alignment */
                        )}
                        <div className="flex-1 min-w-0">
                          {mIdx === 0 && (
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[11px] font-medium">{conv.agent}</span>
                              <span className="text-[9px] text-muted-foreground">{msg.time}</span>
                            </div>
                          )}
                          <p className="text-xs leading-relaxed text-foreground/80">{msg.text}</p>
                        </div>
                      </div>
                    ))}

                    {/* View Reasoning button + Bad Case feedback */}
                    <div className="flex items-center gap-3 mt-2 ml-8">
                      <button
                        onClick={() => setActiveReasoning(isActive ? null : group.reasoningIndex)}
                        className={cn(
                          "flex items-center gap-1 text-[10px] px-2 py-1 rounded-md transition-all",
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                        )}
                      >
                        <Eye className="w-3 h-3" />
                        {isActive ? "Viewing Reasoning" : "View Reasoning"}
                      </button>

                      {feedbackGroup === group.reasoningIndex ? (
                        <div className="flex-1 space-y-1.5 p-2.5 rounded-md bg-amber-50/50 border border-amber-200/50">
                          <div className="flex items-center gap-1.5 mb-1">
                            <MessageCircleWarning className="w-3 h-3 text-amber-600" />
                            <span className="text-[10px] font-medium text-amber-800">Flag this reply for review</span>
                            <button onClick={() => setFeedbackGroup(null)} className="ml-auto"><X className="w-3 h-3 text-muted-foreground" /></button>
                          </div>
                          <Textarea
                            placeholder="Optional: describe what could be improved..."
                            value={feedbackText}
                            onChange={e => setFeedbackText(e.target.value)}
                            rows={2}
                            className="text-xs resize-none bg-white"
                          />
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] text-muted-foreground">Details are optional</span>
                            <div className="flex gap-1.5">
                              <Button variant="ghost" size="sm" className="text-[10px] h-6" onClick={() => setFeedbackGroup(null)}>Cancel</Button>
                              <Button size="sm" className="text-[10px] h-6" onClick={() => handleSubmitFeedback(group.reasoningIndex)}>
                                <Flag className="w-2.5 h-2.5 mr-1" />
                                {feedbackText.trim() ? "Submit Feedback" : "Flag for Review"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setFeedbackGroup(group.reasoningIndex); setFeedbackText(""); }}
                            className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-amber-600 transition-colors px-1.5 py-0.5 rounded hover:bg-amber-50"
                          >
                            <Flag className="w-2.5 h-2.5" />
                            <span>Flag reply</span>
                          </button>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="flex items-center gap-1 text-[10px] text-muted-foreground/40 cursor-default px-1.5 py-0.5">
                                <MessageCircleWarning className="w-2.5 h-2.5" />
                                <span>Instruct Agent</span>
                                <Badge variant="secondary" className="text-[7px] px-1 py-0 ml-0.5">Soon</Badge>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-[10px] max-w-[200px]">
                              Coming soon: directly instruct the agent on how to handle similar situations in the future
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* ── Reasoning Panel (right, 2 cols) — shows ONE at a time ── */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm sticky top-6">
            <CardHeader className="pb-2 px-4 pt-3">
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                <CardTitle className="text-xs font-semibold">Agent Reasoning</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <AnimatePresence mode="wait">
                {currentTrace ? (
                  <motion.div
                    key={activeReasoning}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-3"
                  >
                    {/* Step 1: Intent Detection */}
                    <ReasoningStep
                      icon={<Crosshair className="w-3 h-3 text-indigo-600" />}
                      label="Intent Detected"
                      labelColor="text-indigo-800"
                    >
                      <p className="text-[11px] text-foreground/70">{currentTrace.intentDetected}</p>
                    </ReasoningStep>

                    {/* Step 2: Skill Matched */}
                    <ReasoningStep
                      icon={<Target className="w-3 h-3 text-violet-600" />}
                      label="Skill Matched"
                      labelColor="text-violet-800"
                    >
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] text-foreground/70">{currentTrace.skillMatched}</p>
                        <Badge variant="secondary" className="text-[8px] px-1 py-0">{currentTrace.skillConfidence}</Badge>
                      </div>
                    </ReasoningStep>

                    {/* Step 3: Agent Thinking */}
                    <ReasoningStep
                      icon={<Brain className="w-3 h-3 text-blue-600" />}
                      label="Agent Thinking"
                      labelColor="text-blue-800"
                    >
                      <p className="text-[11px] leading-relaxed text-foreground/70">{currentTrace.thinking}</p>
                    </ReasoningStep>

                    {/* Step 4: Actions */}
                    {currentTrace.actions.length > 0 && (
                      <ReasoningStep
                        icon={<Zap className="w-3 h-3 text-orange-600" />}
                        label="Actions Executed"
                        labelColor="text-orange-800"
                      >
                        <div className="space-y-0.5">
                          {currentTrace.actions.map((action, ai) => (
                            <p key={ai} className="text-[10px] text-foreground/60 font-mono">{action}</p>
                          ))}
                        </div>
                      </ReasoningStep>
                    )}

                    {/* Step 5: Knowledge Referenced */}
                    {currentTrace.knowledgeUsed && (
                      <ReasoningStep
                        icon={<BookOpen className="w-3 h-3 text-amber-600" />}
                        label="Knowledge Referenced"
                        labelColor="text-amber-800"
                      >
                        <p className="text-[10px] text-foreground/60">{currentTrace.knowledgeUsed}</p>
                      </ReasoningStep>
                    )}

                    {/* Step 6: Guardrails Checked */}
                    {currentTrace.guardrailsChecked && (
                      <ReasoningStep
                        icon={<Shield className="w-3 h-3 text-emerald-600" />}
                        label="Guardrails"
                        labelColor="text-emerald-800"
                      >
                        <p className="text-[10px] text-foreground/60">{currentTrace.guardrailsChecked}</p>
                      </ReasoningStep>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <Eye className="w-8 h-8 text-muted-foreground/20 mb-2" />
                    <p className="text-xs text-muted-foreground">Click "View Reasoning" on an agent reply to see the full reasoning process</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Reasoning Step Component ── */
function ReasoningStep({
  icon, label, labelColor, children,
}: {
  icon: React.ReactNode;
  label: string;
  labelColor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative pl-5">
      {/* Vertical connector line */}
      <div className="absolute left-[5px] top-5 bottom-0 w-px bg-border/50" />
      <div className="absolute left-0 top-0.5">{icon}</div>
      <div>
        <span className={cn("text-[10px] font-semibold", labelColor)}>{label}</span>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/40 rounded-lg px-3 py-2 border border-border/50">
      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-xs font-semibold mt-0.5 truncate">{value}</p>
    </div>
  );
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
