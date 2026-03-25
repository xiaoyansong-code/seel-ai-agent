/**
 * Conversations: Unified conversation management
 * Tab 1: Live — real-time active conversations with intervention capability
 * Tab 2: History — completed conversations with review and QA
 * Replaces old Tickets + Watchtower pages
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Search,
  User,
  Bot,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Flag,
  ExternalLink,
  Radio,
  History,
  Mail,
  MessageCircle,
  Instagram,
  Hand,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ── Live Conversations ── */
const liveConversations = [
  {
    id: "C-1001",
    customer: "Sarah Johnson",
    agent: "Agent Alpha",
    channel: "live_chat" as const,
    topic: "WISMO",
    sentiment: 0.8,
    duration: "2:34",
    status: "active" as const,
    lastMessage: "Your package is in transit, expected March 27th.",
    messages: [
      { role: "customer" as const, text: "Hi, I placed an order 3 days ago and haven't received any shipping updates. Order #8834.", time: "14:32" },
      { role: "agent" as const, text: "Hello Sarah! Let me check the status of your order #8834 right away.", time: "14:32", action: "get_order_status" },
      { role: "agent" as const, text: "I found your order. It's currently in transit with FedEx. Tracking number: FX-2847391. The estimated delivery is March 27th.", time: "14:33" },
      { role: "customer" as const, text: "Oh great, thank you! That's very helpful.", time: "14:33" },
    ],
  },
  {
    id: "C-1002",
    customer: "Mike Chen",
    agent: "Agent Alpha",
    channel: "email" as const,
    topic: "Refund",
    sentiment: 0.3,
    duration: "5:12",
    status: "active" as const,
    lastMessage: "I've initiated a store credit of $45.99 for your order.",
    messages: [
      { role: "customer" as const, text: "I want a refund for order #7721. The product arrived damaged.", time: "14:28" },
      { role: "agent" as const, text: "I'm sorry to hear about the damage. Let me look into this for you right away.", time: "14:28", action: "get_order_status" },
      { role: "agent" as const, text: "I can see your order #7721. Since the item arrived damaged, I've initiated a store credit of $45.99. Would you prefer a cash refund instead?", time: "14:30", action: "process_refund" },
    ],
  },
  {
    id: "C-1003",
    customer: "Emily Davis",
    agent: "Agent Beta",
    channel: "social" as const,
    topic: "Return",
    sentiment: -0.4,
    duration: "8:45",
    status: "warning" as const,
    lastMessage: "I understand your frustration. Let me escalate this to our team lead.",
    messages: [
      { role: "customer" as const, text: "This is the THIRD time I'm asking about my return. Nobody is helping me!", time: "14:20" },
      { role: "agent" as const, text: "I sincerely apologize for the inconvenience, Emily. Let me review your return request right away.", time: "14:20" },
      { role: "agent" as const, text: "I can see your return for order #6655 was initiated but not yet processed. I understand your frustration. Let me escalate this to our team lead for immediate resolution.", time: "14:22", action: "escalate_to_human" },
    ],
  },
  {
    id: "C-1004",
    customer: "James Wilson",
    agent: "Agent Alpha",
    channel: "live_chat" as const,
    topic: "Shipping",
    sentiment: 0.6,
    duration: "1:20",
    status: "active" as const,
    lastMessage: "Your shipping address has been updated successfully.",
    messages: [
      { role: "customer" as const, text: "Can I change my shipping address for order #9012?", time: "14:35" },
      { role: "agent" as const, text: "Of course! I can update that for you. What's the new address?", time: "14:35" },
    ],
  },
  {
    id: "C-1005",
    customer: "Lisa Park",
    agent: "Agent Beta",
    channel: "email" as const,
    topic: "Cancellation",
    sentiment: -0.1,
    duration: "3:55",
    status: "active" as const,
    lastMessage: "Your order has been cancelled and refund initiated.",
    messages: [
      { role: "customer" as const, text: "Please cancel my order #8890. I found a better deal elsewhere.", time: "14:25" },
      { role: "agent" as const, text: "I understand. Let me process the cancellation for order #8890.", time: "14:25", action: "cancel_order" },
    ],
  },
];

/* ── History Conversations ── */
const historyConversations = [
  {
    id: "C-0998",
    customer: "Tom Baker",
    agent: "Agent Alpha",
    channel: "live_chat" as const,
    topic: "WISMO",
    sentiment: 0.9,
    duration: "1:45",
    status: "resolved" as const,
    csat: 5,
    resolvedAt: "Today 13:20",
    messages: [
      { role: "customer" as const, text: "Where is my order #7788?", time: "13:18" },
      { role: "agent" as const, text: "Your order is out for delivery today! Tracking: FX-1234567", time: "13:19", action: "get_order_status" },
      { role: "customer" as const, text: "Perfect, thanks!", time: "13:20" },
    ],
  },
  {
    id: "C-0997",
    customer: "Anna Lee",
    agent: "Agent Alpha",
    channel: "email" as const,
    topic: "Refund",
    sentiment: 0.5,
    duration: "4:30",
    status: "resolved" as const,
    csat: 4,
    resolvedAt: "Today 12:45",
    messages: [
      { role: "customer" as const, text: "I'd like a refund for order #6543. The color doesn't match the photo.", time: "12:40" },
      { role: "agent" as const, text: "I'm sorry about the color mismatch. I've processed a full refund of $32.00 to your original payment method.", time: "12:43", action: "process_refund" },
      { role: "customer" as const, text: "Thank you for the quick resolution.", time: "12:45" },
    ],
  },
  {
    id: "C-0995",
    customer: "Robert Kim",
    agent: "Agent Beta",
    channel: "social" as const,
    topic: "Return",
    sentiment: -0.3,
    duration: "12:20",
    status: "escalated" as const,
    csat: 2,
    resolvedAt: "Today 11:30",
    messages: [
      { role: "customer" as const, text: "I've been waiting 2 weeks for my return to be processed!", time: "11:18" },
      { role: "agent" as const, text: "I apologize for the delay. Let me check on this immediately.", time: "11:18" },
      { role: "agent" as const, text: "I'm escalating this to our returns team for priority processing.", time: "11:25", action: "escalate_to_human" },
    ],
  },
];

type ConvItem = typeof liveConversations[0] | (typeof historyConversations[0]);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export default function Conversations() {
  const [activeTab, setActiveTab] = useState("live");
  const [selectedConv, setSelectedConv] = useState<ConvItem>(liveConversations[0]);

  const currentList = activeTab === "live" ? liveConversations : historyConversations;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 pb-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Conversations</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Monitor live conversations and review completed interactions</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 gap-1.5 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            {liveConversations.length} Live
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-3">
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelectedConv(v === "live" ? liveConversations[0] : historyConversations[0]); }}>
          <TabsList className="bg-muted">
            <TabsTrigger value="live" className="gap-1.5">
              <Radio className="w-3.5 h-3.5" /> Live
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <History className="w-3.5 h-3.5" /> History
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Split View */}
      <div className="flex-1 flex mt-3 overflow-hidden border-t border-border">
        {/* Conversation List */}
        <div className="w-[320px] border-r border-border overflow-y-auto custom-scrollbar">
          {currentList.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConv(conv)}
              className={cn(
                "w-full text-left px-4 py-3.5 border-b border-border hover:bg-muted/50 transition-colors",
                selectedConv.id === conv.id && "bg-teal-50/50 border-l-2 border-l-teal-500"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono text-muted-foreground">{conv.id}</span>
                  <ChannelIcon channel={conv.channel} />
                </div>
                <span className="text-[10px] text-muted-foreground">{conv.duration}</span>
              </div>
              <p className="text-sm font-medium">{conv.customer}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="secondary" className="text-[9px]">{conv.topic}</Badge>
                <ConvStatusBadge status={conv.status} />
                <SentimentDot score={conv.sentiment} />
                <span className="text-[10px] text-muted-foreground ml-auto">{conv.agent}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Conversation Detail */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Detail Header */}
          <div className="px-5 py-3 border-b border-border bg-card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{selectedConv.customer}</span>
                  <ChannelIcon channel={selectedConv.channel} />
                  <Badge variant="secondary" className="text-[9px]">{selectedConv.topic}</Badge>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">{selectedConv.agent}</span>
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <span className="text-[10px] text-muted-foreground">Duration: {selectedConv.duration}</span>
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <span className="text-[10px] text-muted-foreground">Sentiment: </span>
                  <SentimentDot score={selectedConv.sentiment} showLabel />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === "live" && (
                <Button size="sm" variant="outline" className="gap-1.5 text-xs text-amber-700 border-amber-200 hover:bg-amber-50" onClick={() => toast("Takeover initiated — you are now in control of this conversation")}>
                  <Hand className="w-3 h-3" /> Take Over
                </Button>
              )}
              <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => toast("Flagged for review")}>
                <Flag className="w-3 h-3" /> Flag
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-3">
            {selectedConv.messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "customer" ? "justify-start" : "justify-end"}`}>
                <div className={cn(
                  "max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                  msg.role === "customer"
                    ? "bg-muted text-foreground rounded-bl-md"
                    : "bg-teal-600 text-white rounded-br-md"
                )}>
                  {"action" in msg && (msg as any).action && (
                    <div className="flex items-center gap-1.5 text-[10px] mb-1.5 pb-1.5 border-b border-teal-500 text-teal-200">
                      <CheckCircle2 className="w-3 h-3" />
                      Action: {(msg as any).action}
                    </div>
                  )}
                  <p>{msg.text}</p>
                  <p className={cn(
                    "text-[10px] mt-1",
                    msg.role === "customer" ? "text-muted-foreground" : "text-teal-200"
                  )}>
                    {msg.role === "customer" ? selectedConv.customer : selectedConv.agent} · {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* QA Actions (History only) */}
          {activeTab === "history" && "csat" in selectedConv && (
            <div className="px-5 py-3 border-t border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">CSAT:</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className={cn("text-sm", s <= (selectedConv as any).csat ? "text-amber-400" : "text-gray-200")}>★</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Resolved:</span>
                  <span className="text-xs font-medium">{(selectedConv as any).resolvedAt}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" className="gap-1 text-xs h-7" onClick={() => toast.success("Marked as good example")}>
                  <ThumbsUp className="w-3 h-3" /> Good
                </Button>
                <Button size="sm" variant="ghost" className="gap-1 text-xs h-7" onClick={() => toast("Marked for coaching")}>
                  <ThumbsDown className="w-3 h-3" /> Needs Coaching
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ChannelIcon({ channel }: { channel: string }) {
  const icons: Record<string, { icon: typeof Mail; label: string; className: string }> = {
    email: { icon: Mail, label: "Email", className: "text-blue-500" },
    live_chat: { icon: MessageCircle, label: "Live Chat", className: "text-teal-500" },
    social: { icon: Instagram, label: "Social", className: "text-pink-500" },
  };
  const c = icons[channel] || icons.live_chat;
  const Icon = c.icon;
  return (
    <div className="flex items-center gap-0.5" title={c.label}>
      <Icon className={cn("w-3 h-3", c.className)} />
    </div>
  );
}

function ConvStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    active: { label: "Active", className: "bg-teal-50 text-teal-700 border-teal-200" },
    warning: { label: "Warning", className: "bg-amber-50 text-amber-700 border-amber-200" },
    resolved: { label: "Resolved", className: "bg-teal-50 text-teal-700 border-teal-200" },
    escalated: { label: "Escalated", className: "bg-red-50 text-red-700 border-red-200" },
  };
  const c = config[status] || config.active;
  return <Badge variant="outline" className={`text-[9px] ${c.className}`}>{c.label}</Badge>;
}

function SentimentDot({ score, showLabel = false }: { score: number; showLabel?: boolean }) {
  const color = score > 0.5 ? "bg-teal-500" : score > 0 ? "bg-amber-400" : "bg-red-400";
  const label = score > 0.5 ? "Positive" : score > 0 ? "Neutral" : "Negative";
  return (
    <div className="flex items-center gap-1">
      <span className={cn("w-1.5 h-1.5 rounded-full", color)} />
      {showLabel && <span className="text-[10px] text-muted-foreground">{label} ({score.toFixed(1)})</span>}
    </div>
  );
}
