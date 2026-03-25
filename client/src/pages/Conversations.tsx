/**
 * Performance > Conversations
 * Standard data list (not chat bubbles) with:
 * - Columns: Order, Session Subject, Intent, Result, Approach, Turns, Sentiment Flow
 * - Plus: Agent, Duration, Actions executed
 * - Click row → Conversation Detail Page with Meta Info + Chat History + Reasoning Trace
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ArrowLeft, ChevronDown,
  MessageSquare, CheckCircle2, ArrowUpRight,
  Clock, Bot, User, Zap, Brain, BookOpen, Target,
  Send, Eye,
  Mail, MessageCircle, Instagram,
  ThumbsUp, ThumbsDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ── Types ── */
interface ConversationRow {
  id: string;
  orderId: string;
  subject: string;
  customer: string;
  intent: string;
  result: "Resolved" | "Escalated" | "Pending";
  approach: string;
  turns: number;
  sentimentFlow: ("positive" | "neutral" | "negative")[];
  agent: string;
  duration: string;
  actionsExecuted: string[];
  channel: "email" | "live_chat" | "social";
  timestamp: string;
  messages: { role: "customer" | "agent"; text: string; time: string; action?: string }[];
  reasoningTrace: ReasoningStep[];
}

interface ReasoningStep {
  type: "intent" | "skill" | "knowledge" | "action" | "response" | "escalation";
  label: string;
  detail: string;
  timestamp: string;
  metadata?: Record<string, string>;
}

/* ── Mock Data ── */
const conversations: ConversationRow[] = [
  {
    id: "C-1001",
    orderId: "#ORD-8834",
    subject: "Where is my order?",
    customer: "Sarah Johnson",
    intent: "Order Tracking",
    result: "Resolved",
    approach: "Autopilot",
    turns: 3,
    sentimentFlow: ["neutral", "neutral", "positive"],
    agent: "RC Live Chat Agent",
    duration: "1m 12s",
    actionsExecuted: ["get_order_status", "send_tracking_link"],
    channel: "live_chat",
    timestamp: "Today 14:33",
    messages: [
      { role: "customer", text: "Hi, I placed an order 3 days ago and haven't received any shipping updates. Order #8834.", time: "14:32" },
      { role: "agent", text: "Hello Sarah! Let me check the status of your order #8834 right away.", time: "14:32", action: "get_order_status" },
      { role: "agent", text: "I found your order. It's currently in transit with FedEx. Tracking number: FX-2847391. The estimated delivery is March 27th. Here's your tracking link: https://track.fedex.com/FX-2847391", time: "14:33", action: "send_tracking_link" },
      { role: "customer", text: "Oh great, thank you! That's very helpful.", time: "14:33" },
    ],
    reasoningTrace: [
      { type: "intent", label: "Intent Detected", detail: "Order Tracking (WISMO) — confidence 0.96", timestamp: "14:32:01", metadata: { "Raw input": "Where is my order #8834", "Top 3 intents": "WISMO (0.96), Order Status (0.82), Shipping Issue (0.34)" } },
      { type: "skill", label: "Skill Selected", detail: "Order Tracking (WISMO)", timestamp: "14:32:01", metadata: { "Skill ID": "s1", "Enabled": "Yes", "Priority": "1" } },
      { type: "knowledge", label: "Knowledge Retrieved", detail: "Shipping FAQ — 'How to track your order' (relevance: 0.91)", timestamp: "14:32:02", metadata: { "Source": "Knowledge Base", "Article": "Shipping FAQ", "Chunk": "Section 2: Tracking" } },
      { type: "action", label: "Action Called", detail: "get_order_status(order_id='8834') → Status: In Transit, Carrier: FedEx, ETA: Mar 27", timestamp: "14:32:03", metadata: { "API": "Shopify Orders API", "Response time": "340ms", "Order total": "$67.50" } },
      { type: "action", label: "Action Called", detail: "send_tracking_link(tracking='FX-2847391') → Link generated", timestamp: "14:32:04", metadata: { "Carrier": "FedEx", "Tracking URL": "https://track.fedex.com/FX-2847391" } },
      { type: "response", label: "Response Generated", detail: "Composed reply with order status, tracking number, ETA, and tracking link", timestamp: "14:32:05", metadata: { "Tone": "Friendly, informative", "Length": "42 words" } },
    ],
  },
  {
    id: "C-1002",
    orderId: "#ORD-7721",
    subject: "Damaged item — want refund",
    customer: "Mike Chen",
    intent: "Seel Protection Claim",
    result: "Resolved",
    approach: "Autopilot",
    turns: 4,
    sentimentFlow: ["negative", "negative", "neutral", "positive"],
    agent: "RC Live Chat Agent",
    duration: "2m 45s",
    actionsExecuted: ["get_order_status", "check_protection_eligibility", "process_refund"],
    channel: "live_chat",
    timestamp: "Today 14:30",
    messages: [
      { role: "customer", text: "I want a refund for order #7721. The product arrived damaged.", time: "14:28" },
      { role: "agent", text: "I'm sorry to hear about the damage, Mike. Let me look into this for you right away.", time: "14:28", action: "get_order_status" },
      { role: "agent", text: "I can see your order #7721 is covered by Seel Protection. Since the item arrived damaged, I've initiated a full refund of $45.99 to your original payment method. You should see it within 3-5 business days.", time: "14:30", action: "process_refund" },
      { role: "customer", text: "That was fast! Thank you so much.", time: "14:30" },
    ],
    reasoningTrace: [
      { type: "intent", label: "Intent Detected", detail: "Seel Protection Claim — confidence 0.93", timestamp: "14:28:01", metadata: { "Raw input": "Damaged item, want refund", "Keywords": "damaged, refund" } },
      { type: "skill", label: "Skill Selected", detail: "Seel Protection Claims", timestamp: "14:28:01" },
      { type: "action", label: "Action Called", detail: "get_order_status(order_id='7721') → Delivered, Seel Protected", timestamp: "14:28:02", metadata: { "Protection": "Active", "Order total": "$45.99" } },
      { type: "action", label: "Action Called", detail: "check_protection_eligibility(order_id='7721') → Eligible (within 30-day window)", timestamp: "14:28:03", metadata: { "Delivery date": "Mar 20", "Claim window": "30 days", "Remaining": "27 days" } },
      { type: "action", label: "Action Called", detail: "process_refund(order_id='7721', amount=$45.99, reason='damaged') → Refund initiated", timestamp: "14:29:01", metadata: { "Refund method": "Original payment", "Processing time": "3-5 business days" } },
      { type: "response", label: "Response Generated", detail: "Confirmed protection eligibility and refund processing with timeline", timestamp: "14:29:02" },
    ],
  },
  {
    id: "C-1003",
    orderId: "#ORD-6655",
    subject: "Return not processed after 2 weeks",
    customer: "Emily Davis",
    intent: "Return Inquiry",
    result: "Escalated",
    approach: "Autopilot",
    turns: 3,
    sentimentFlow: ["negative", "negative", "negative"],
    agent: "RC Live Chat Agent",
    duration: "3m 20s",
    actionsExecuted: ["get_order_status", "escalate_to_human"],
    channel: "social",
    timestamp: "Today 14:22",
    messages: [
      { role: "customer", text: "This is the THIRD time I'm asking about my return. Nobody is helping me!", time: "14:20" },
      { role: "agent", text: "I sincerely apologize for the inconvenience, Emily. Let me review your return request right away.", time: "14:20" },
      { role: "agent", text: "I can see your return for order #6655 was initiated but not yet processed. I understand your frustration. I'm escalating this to our team lead for immediate resolution.", time: "14:22", action: "escalate_to_human" },
    ],
    reasoningTrace: [
      { type: "intent", label: "Intent Detected", detail: "Return Inquiry — confidence 0.89", timestamp: "14:20:01" },
      { type: "skill", label: "Skill Selected", detail: "Order Cancellation (closest match)", timestamp: "14:20:01" },
      { type: "knowledge", label: "Knowledge Retrieved", detail: "Returns Policy — 'Processing times and escalation procedures'", timestamp: "14:20:02" },
      { type: "action", label: "Action Called", detail: "get_order_status(order_id='6655') → Return initiated Mar 8, not yet processed", timestamp: "14:20:03", metadata: { "Return initiated": "Mar 8", "Days pending": "18", "SLA": "7 days" } },
      { type: "escalation", label: "Escalation Triggered", detail: "Reason: Return SLA exceeded (18 days > 7 day SLA) + negative sentiment + repeat contact", timestamp: "14:21:01", metadata: { "Escalation group": "Tier 2 Support", "Priority": "High", "Reason codes": "SLA breach, repeat contact, negative sentiment" } },
    ],
  },
  {
    id: "C-1004",
    orderId: "#ORD-9012",
    subject: "Change shipping address",
    customer: "James Wilson",
    intent: "Order Changes",
    result: "Resolved",
    approach: "Shadow",
    turns: 3,
    sentimentFlow: ["neutral", "positive"],
    agent: "Email Support Agent",
    duration: "4m 10s",
    actionsExecuted: ["get_order_status", "update_shipping_address"],
    channel: "email",
    timestamp: "Today 13:45",
    messages: [
      { role: "customer", text: "Can I change my shipping address for order #9012? I moved to 456 Oak Ave, Portland OR 97201.", time: "13:40" },
      { role: "agent", text: "Of course, James! I've updated the shipping address for order #9012 to 456 Oak Ave, Portland OR 97201. The package hasn't shipped yet, so the change will apply.", time: "13:44", action: "update_shipping_address" },
      { role: "customer", text: "Perfect, thanks!", time: "13:45" },
    ],
    reasoningTrace: [
      { type: "intent", label: "Intent Detected", detail: "Order Changes — Address Update — confidence 0.94", timestamp: "13:40:01" },
      { type: "skill", label: "Skill Selected", detail: "Order Cancellation (Order Changes)", timestamp: "13:40:01" },
      { type: "action", label: "Action Called", detail: "get_order_status(order_id='9012') → Processing, not yet shipped", timestamp: "13:40:02", metadata: { "Status": "Processing", "Shipped": "No" } },
      { type: "action", label: "Action Called", detail: "update_shipping_address(order_id='9012', address='456 Oak Ave, Portland OR 97201') → Success", timestamp: "13:43:01", metadata: { "Previous address": "123 Main St, Seattle WA 98101", "New address": "456 Oak Ave, Portland OR 97201" } },
      { type: "response", label: "Response Generated", detail: "Confirmed address update with details", timestamp: "13:43:02" },
    ],
  },
  {
    id: "C-1005",
    orderId: "#ORD-8890",
    subject: "Cancel my order",
    customer: "Lisa Park",
    intent: "Order Cancellation",
    result: "Resolved",
    approach: "Autopilot",
    turns: 3,
    sentimentFlow: ["neutral", "neutral", "positive"],
    agent: "RC Live Chat Agent",
    duration: "1m 30s",
    actionsExecuted: ["get_order_status", "cancel_order", "process_refund"],
    channel: "live_chat",
    timestamp: "Today 12:50",
    messages: [
      { role: "customer", text: "Please cancel my order #8890. I found a better deal elsewhere.", time: "12:48" },
      { role: "agent", text: "I understand, Lisa. Let me process the cancellation for order #8890.", time: "12:48", action: "cancel_order" },
      { role: "agent", text: "Your order #8890 has been cancelled and a full refund of $78.00 has been initiated. You'll see it in 3-5 business days.", time: "12:50", action: "process_refund" },
      { role: "customer", text: "Thanks for the quick help!", time: "12:50" },
    ],
    reasoningTrace: [
      { type: "intent", label: "Intent Detected", detail: "Order Cancellation — confidence 0.97", timestamp: "12:48:01" },
      { type: "skill", label: "Skill Selected", detail: "Order Cancellation", timestamp: "12:48:01" },
      { type: "action", label: "Action Called", detail: "get_order_status(order_id='8890') → Processing, not shipped", timestamp: "12:48:02" },
      { type: "action", label: "Action Called", detail: "cancel_order(order_id='8890') → Cancelled", timestamp: "12:48:03" },
      { type: "action", label: "Action Called", detail: "process_refund(order_id='8890', amount=$78.00) → Refund initiated", timestamp: "12:49:01" },
      { type: "response", label: "Response Generated", detail: "Confirmed cancellation and refund with timeline", timestamp: "12:49:02" },
    ],
  },
  {
    id: "C-1006",
    orderId: "#ORD-7788",
    subject: "Order delivery status",
    customer: "Tom Baker",
    intent: "Order Tracking",
    result: "Resolved",
    approach: "Autopilot",
    turns: 2,
    sentimentFlow: ["neutral", "positive"],
    agent: "RC Live Chat Agent",
    duration: "0m 45s",
    actionsExecuted: ["get_order_status"],
    channel: "live_chat",
    timestamp: "Today 11:20",
    messages: [
      { role: "customer", text: "Where is my order #7788?", time: "11:18" },
      { role: "agent", text: "Your order is out for delivery today! Tracking: FX-1234567. You should receive it by end of day.", time: "11:19", action: "get_order_status" },
      { role: "customer", text: "Perfect, thanks!", time: "11:20" },
    ],
    reasoningTrace: [
      { type: "intent", label: "Intent Detected", detail: "Order Tracking (WISMO) — confidence 0.98", timestamp: "11:18:01" },
      { type: "skill", label: "Skill Selected", detail: "Order Tracking (WISMO)", timestamp: "11:18:01" },
      { type: "action", label: "Action Called", detail: "get_order_status(order_id='7788') → Out for delivery", timestamp: "11:18:02" },
      { type: "response", label: "Response Generated", detail: "Provided delivery status and tracking number", timestamp: "11:18:03" },
    ],
  },
];

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

function SentimentDots({ flow }: { flow: ("positive" | "neutral" | "negative")[] }) {
  const colors = { positive: "bg-primary", neutral: "bg-amber-400", negative: "bg-red-400" };
  return (
    <div className="flex items-center gap-0.5">
      {flow.map((s, i) => (
        <div key={i} className={cn("w-1.5 h-1.5 rounded-full", colors[s])} title={s} />
      ))}
    </div>
  );
}

const traceTypeConfig: Record<string, { icon: typeof Brain; color: string; bgColor: string }> = {
  intent: { icon: Brain, color: "text-blue-600", bgColor: "bg-blue-50" },
  skill: { icon: Target, color: "text-primary", bgColor: "bg-primary/10" },
  knowledge: { icon: BookOpen, color: "text-amber-600", bgColor: "bg-amber-50" },
  action: { icon: Zap, color: "text-orange-600", bgColor: "bg-orange-50" },
  response: { icon: Send, color: "text-primary", bgColor: "bg-primary/10" },
  escalation: { icon: ArrowUpRight, color: "text-red-600", bgColor: "bg-red-50" },
};

const cV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.03 } } };
const iV = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

export default function Conversations() {
  const [selectedConv, setSelectedConv] = useState<ConversationRow | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [resultFilter, setResultFilter] = useState("all");
  const [intentFilter, setIntentFilter] = useState("all");

  const filtered = conversations.filter(c => {
    if (resultFilter !== "all" && c.result !== resultFilter) return false;
    if (intentFilter !== "all" && c.intent !== intentFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return c.customer.toLowerCase().includes(q) || c.orderId.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q);
    }
    return true;
  });

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
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
            {conversations.length} total
          </Badge>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={iV} className="flex items-center gap-3">
        <div className="relative flex-1 max-w-[280px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by customer, order, or subject..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
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
                  <TableHead className="text-[11px] font-semibold text-muted-foreground">Approach</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground text-center">Turns</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground">Sentiment</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground">Agent</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground text-right">Duration</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((conv) => {
                  const rc = resultConfig[conv.result];
                  const ch = channelIcons[conv.channel];
                  const ChIcon = ch.icon;
                  return (
                    <TableRow
                      key={conv.id}
                      className="cursor-pointer group"
                      onClick={() => setSelectedConv(conv)}
                    >
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
                      <TableCell className="py-2.5">
                        <span className="text-[11px] text-muted-foreground">{conv.approach}</span>
                      </TableCell>
                      <TableCell className="py-2.5 text-center">
                        <span className="text-[11px] font-medium">{conv.turns}</span>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <SentimentDots flow={conv.sentimentFlow} />
                      </TableCell>
                      <TableCell className="py-2.5">
                        <span className="text-[10px] text-muted-foreground truncate max-w-[100px] block">{conv.agent}</span>
                      </TableCell>
                      <TableCell className="py-2.5 text-right">
                        <span className="text-[11px] text-muted-foreground">{conv.duration}</span>
                      </TableCell>
                      <TableCell className="py-2.5 text-right pr-4">
                        <span className="text-[11px] font-medium">{conv.actionsExecuted.length}</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* ── Conversation Detail Page ──                             */
/* Meta Info + Chat History + Reasoning Trace                 */
/* ═══════════════════════════════════════════════════════════ */
function ConversationDetail({ conv, onBack }: { conv: ConversationRow; onBack: () => void }) {
  const [expandedTrace, setExpandedTrace] = useState<number | null>(null);
  const rc = resultConfig[conv.result];
  const ch = channelIcons[conv.channel];
  const ChIcon = ch.icon;

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
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" onClick={() => toast.success("Marked as good example")}>
            <ThumbsUp className="w-3 h-3" /> Good
          </Button>
          <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" onClick={() => toast("Flagged for coaching")}>
            <ThumbsDown className="w-3 h-3" /> Needs Review
          </Button>
        </div>
      </div>

      {/* Meta Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5">
        <MetaCard label="Order" value={conv.orderId} />
        <MetaCard label="Intent" value={conv.intent} />
        <MetaCard label="Agent" value={conv.agent} />
        <MetaCard label="Approach" value={conv.approach} />
        <MetaCard label="Duration" value={conv.duration} />
        <MetaCard label="Turns" value={String(conv.turns)} />
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
            <CardContent className="px-4 pb-4 space-y-3">
              {conv.messages.map((msg, i) => (
                <div key={i} className="flex gap-2.5">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                    msg.role === "customer" ? "bg-muted" : "bg-primary/10"
                  )}>
                    {msg.role === "customer" ? <User className="w-3 h-3 text-muted-foreground" /> : <Bot className="w-3 h-3 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-medium">{msg.role === "customer" ? conv.customer : conv.agent}</span>
                      <span className="text-[9px] text-muted-foreground">{msg.time}</span>
                    </div>
                    {msg.action && (
                      <div className="flex items-center gap-1 mb-1">
                        <Badge variant="secondary" className="text-[8px] gap-0.5 font-mono px-1.5 py-0">
                          <Zap className="w-2 h-2" />
                          {msg.action}
                        </Badge>
                      </div>
                    )}
                    <p className="text-xs leading-relaxed text-foreground/80">{msg.text}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* ── Reasoning Trace (right, 2 cols) ── */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader className="pb-2 px-4 pt-3">
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                <CardTitle className="text-xs font-semibold">Reasoning Trace</CardTitle>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Step-by-step agent decision process</p>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

                <div className="space-y-0">
                  {conv.reasoningTrace.map((step, i) => {
                    const cfg = traceTypeConfig[step.type];
                    const StepIcon = cfg.icon;
                    const isExpanded = expandedTrace === i;

                    return (
                      <div key={i} className="relative">
                        <button
                          onClick={() => setExpandedTrace(isExpanded ? null : i)}
                          className="w-full text-left flex items-start gap-2.5 py-2 px-1 rounded-md hover:bg-muted/30 transition-colors group"
                        >
                          {/* Icon */}
                          <div className={cn("w-[22px] h-[22px] rounded-md flex items-center justify-center shrink-0 z-10", cfg.bgColor)}>
                            <StepIcon className={cn("w-3 h-3", cfg.color)} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-semibold">{step.label}</span>
                              <span className="text-[9px] text-muted-foreground">{step.timestamp}</span>
                              {step.metadata && (
                                <ChevronDown className={cn("w-2.5 h-2.5 text-muted-foreground/50 transition-transform ml-auto", isExpanded && "rotate-180")} />
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">{step.detail}</p>
                          </div>
                        </button>

                        {/* Expanded metadata */}
                        <AnimatePresence>
                          {isExpanded && step.metadata && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="overflow-hidden"
                            >
                              <div className="ml-[34px] mb-2 p-2.5 rounded-md bg-muted/40 border border-border/50">
                                {Object.entries(step.metadata).map(([key, value]) => (
                                  <div key={key} className="flex items-start gap-2 py-0.5">
                                    <span className="text-[9px] font-medium text-muted-foreground shrink-0 w-[80px]">{key}</span>
                                    <span className="text-[9px] text-foreground/70 font-mono break-all">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions Executed Summary */}
          <Card className="shadow-sm mt-3">
            <CardHeader className="pb-2 px-4 pt-3">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-muted-foreground" />
                <CardTitle className="text-xs font-semibold">Actions Executed</CardTitle>
                <Badge variant="secondary" className="text-[9px] ml-auto">{conv.actionsExecuted.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="flex flex-wrap gap-1.5">
                {conv.actionsExecuted.map((action, i) => (
                  <Badge key={i} variant="outline" className="text-[9px] font-mono gap-1">
                    <Zap className="w-2 h-2 text-orange-500" />
                    {action}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
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
