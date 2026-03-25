/**
 * AgentDetail: Complete agent profile — "Virtual Employee File"
 * Tabs: Overview / Knowledge & Actions / Channels / Configuration / Conversations
 * Shows full association between Agent ↔ Knowledge ↔ Actions ↔ Channels ↔ Guardrails
 */
import { useState } from "react";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MessageSquare,
  BarChart3,
  Shield,
  Clock,
  CheckCircle2,
  TrendingUp,
  Send,
  Sliders,
  FileText,
  Zap,
  BookOpen,
  Radio,
  Mail,
  MessageCircle,
  Instagram,
  Bot,
  Globe,
  AlertTriangle,
  Settings,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const agentData: Record<string, any> = {
  alpha: {
    name: "Agent Alpha",
    avatar: "https://d2xsxph8kpxj0f.cloudfront.net/310519663446549828/ZnnRRhGjRupXpf5q3zCYHR/agent-avatar-1-5Cg5ZwWmEXaFkczkGxLsLd.webp",
    mode: "Production",
    strategy: "Conservative",
    refundLimit: 50,
    csat: 4.6,
    resolutionRate: 91.2,
    avgResponseTime: "1.1s",
    ticketsToday: 847,
    trafficShare: 70,
    channels: [
      { type: "live_chat", name: "Live Chat", status: "active", responseTime: "Instant", tone: "Friendly, concise", config: "Rich text enabled, max 500 chars" },
      { type: "email", name: "Email", status: "active", responseTime: "< 4 hours", tone: "Professional, detailed", config: "HTML templates, signature block" },
    ],
    knowledge: [
      { id: "K-001", title: "Refund & Return Policy", status: "active" },
      { id: "K-002", title: "Shipping & Delivery FAQ", status: "active" },
      { id: "K-003", title: "Product Care Instructions", status: "active" },
    ],
    actions: [
      { id: "A-001", title: "Auto-Refund for Small Orders", guardrail: "Daily cap: $5,000", status: "active", triggered: 23 },
      { id: "A-002", title: "Negative Sentiment Escalation", guardrail: "Immediate escalation", status: "active", triggered: 15 },
      { id: "A-003", title: "High-Value Refund Escalation", guardrail: "Hard block >$100", status: "active", triggered: 8 },
      { id: "A-004", title: "WISMO Auto-Response", guardrail: "None", status: "active", triggered: 156 },
      { id: "A-006", title: "PII Access Block", guardrail: "Hard block", status: "active", triggered: 0 },
    ],
  },
  beta: {
    name: "Agent Beta",
    avatar: "https://d2xsxph8kpxj0f.cloudfront.net/310519663446549828/ZnnRRhGjRupXpf5q3zCYHR/agent-avatar-2-MogZTfSmY2RosF8fVB5Z8c.webp",
    mode: "Training",
    strategy: "Aggressive",
    refundLimit: 150,
    csat: 4.2,
    resolutionRate: 84.5,
    avgResponseTime: "1.4s",
    ticketsToday: 256,
    trafficShare: 30,
    channels: [
      { type: "email", name: "Email", status: "active", responseTime: "< 4 hours", tone: "Professional", config: "HTML templates" },
      { type: "social", name: "Instagram DM", status: "pending", responseTime: "< 1 hour", tone: "Casual, brief", config: "Max 300 chars, emoji allowed" },
    ],
    knowledge: [
      { id: "K-001", title: "Refund & Return Policy", status: "active" },
      { id: "K-002", title: "Shipping & Delivery FAQ", status: "active" },
    ],
    actions: [
      { id: "A-002", title: "Negative Sentiment Escalation", guardrail: "Immediate escalation", status: "active", triggered: 5 },
      { id: "A-004", title: "WISMO Auto-Response", guardrail: "None", status: "active", triggered: 48 },
      { id: "A-006", title: "PII Access Block", guardrail: "Hard block", status: "active", triggered: 0 },
    ],
  },
};

const chatMessages = [
  { role: "manager" as const, text: "Why did you give that customer a direct refund just now?", time: "2:34 PM" },
  { role: "agent" as const, text: "The customer's order total was $32, which is below the $50 auto-refund threshold set in the SOP. Additionally, the customer had been waiting for over 48 hours, so I processed the refund directly per the escalation policy.", time: "2:34 PM" },
  { role: "manager" as const, text: "Good. From now on, for VIP customers' refund requests, process them immediately regardless of amount. No need to escalate.", time: "2:35 PM" },
  { role: "agent" as const, text: "Understood. I've updated my handling policy: VIP customer refund requests will be prioritized and processed immediately without escalation review.", time: "2:35 PM" },
];

const recentConversations = [
  { id: "C-1001", customer: "Sarah Johnson", topic: "WISMO", channel: "live_chat", sentiment: 0.8, status: "resolved", time: "14:33" },
  { id: "C-1002", customer: "Mike Chen", topic: "Refund", channel: "email", sentiment: 0.3, status: "active", time: "14:30" },
  { id: "C-1004", customer: "James Wilson", topic: "Shipping", channel: "live_chat", sentiment: 0.6, status: "resolved", time: "14:36" },
];

const auditLog = [
  { time: "14:35:22", action: "reply_to_customer", ticket: "C-1001", detail: "Sent tracking info for order #8834", status: "success" },
  { time: "14:34:18", action: "get_order_status", ticket: "C-1001", detail: "Fetched Shopify order #8834 details", status: "success" },
  { time: "14:33:45", action: "cancel_order", ticket: "C-1002", detail: "Cancelled order #7721 via Shopify API", status: "success" },
  { time: "14:30:12", action: "process_refund", ticket: "C-1003", detail: "Refund $120 blocked by guardrail (limit: $100)", status: "blocked" },
  { time: "14:28:55", action: "escalate_to_human", ticket: "C-1003", detail: "Escalated to CX Manager — negative sentiment", status: "escalated" },
];

export default function AgentDetail() {
  const params = useParams<{ id: string }>();
  const agent = agentData[params.id || "alpha"] || agentData.alpha;
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState(chatMessages);
  const [refundLimit, setRefundLimit] = useState([agent.refundLimit]);
  const [trafficShare, setTrafficShare] = useState([agent.trafficShare]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages([...messages, { role: "manager", text: chatInput, time: "Now" }]);
    setChatInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: "agent",
        text: "Understood. I've noted your instruction and will apply it to future interactions. Would you like me to update the corresponding SOP entry as well?",
        time: "Now",
      }]);
    }, 1200);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <Link href="/agents">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <img src={agent.avatar} alt={agent.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-background" />
          <div>
            <h1 className="text-xl font-bold">{agent.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className={agent.mode === "Production" ? "bg-teal-50 text-teal-700 border-teal-200 text-[10px]" : "bg-amber-50 text-amber-700 border-amber-200 text-[10px]"}>
                {agent.mode}
              </Badge>
              <span className="text-xs text-muted-foreground">{agent.strategy} Strategy</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{agent.channels.length} Channels</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{agent.knowledge.length} Knowledge</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{agent.actions.length} Actions</span>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast("Shadow Mode toggle coming soon")}>
          <Shield className="w-3.5 h-3.5" />
          Shadow Mode
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-muted">
          <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> Overview</TabsTrigger>
          <TabsTrigger value="knowledge" className="gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Knowledge & Actions</TabsTrigger>
          <TabsTrigger value="channels" className="gap-1.5"><Globe className="w-3.5 h-3.5" /> Channels</TabsTrigger>
          <TabsTrigger value="config" className="gap-1.5"><Sliders className="w-3.5 h-3.5" /> Configuration</TabsTrigger>
          <TabsTrigger value="conversations" className="gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Conversations</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricBox label="Resolution Rate" value={`${agent.resolutionRate}%`} trend="+2.3%" />
            <MetricBox label="CSAT Score" value={`${agent.csat}`} trend="+0.1" />
            <MetricBox label="Avg Response" value={agent.avgResponseTime} trend="-0.2s" />
            <MetricBox label="Tickets Today" value={String(agent.ticketsToday)} trend="+12%" />
          </div>

          {/* Chat Management */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Conversational Management</CardTitle>
                <p className="text-xs text-muted-foreground">Train and instruct your agent through natural conversation</p>
              </CardHeader>
              <CardContent>
                <div className="h-[340px] flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4 custom-scrollbar pr-2">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "manager" ? "justify-end" : "justify-start"}`}>
                        <div className={cn(
                          "max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                          msg.role === "manager"
                            ? "bg-teal-600 text-white rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md"
                        )}>
                          <p>{msg.text}</p>
                          <p className={cn("text-[10px] mt-1", msg.role === "manager" ? "text-teal-200" : "text-muted-foreground")}>
                            {msg.role === "manager" ? "CX Manager" : agent.name} · {msg.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Instruct, question, or review your agent..."
                      className="flex-1 px-4 py-2.5 bg-muted rounded-lg text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <Button size="icon" className="bg-teal-600 hover:bg-teal-700 shrink-0" onClick={handleSendMessage}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Stats</h4>
                  <StatRow icon={<CheckCircle2 className="w-3.5 h-3.5" />} label="Resolution Rate" value={`${agent.resolutionRate}%`} />
                  <StatRow icon={<TrendingUp className="w-3.5 h-3.5" />} label="CSAT Score" value={`${agent.csat}/5.0`} />
                  <StatRow icon={<Clock className="w-3.5 h-3.5" />} label="Avg Response" value={agent.avgResponseTime} />
                  <StatRow icon={<Zap className="w-3.5 h-3.5" />} label="Tickets Today" value={String(agent.ticketsToday)} />
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Recent Instructions</h4>
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-lg bg-teal-50 text-xs">
                      <p className="text-teal-800">VIP refund requests: process immediately without escalation</p>
                      <p className="text-teal-600/70 text-[10px] mt-1">Updated 5 min ago</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-muted text-xs">
                      <p>Always address customers by first name</p>
                      <p className="text-muted-foreground text-[10px] mt-1">Updated 2 hours ago</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── Knowledge & Actions Tab ── */}
        <TabsContent value="knowledge" className="mt-4 space-y-4">
          {/* Knowledge Articles */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-teal-600" />
                  <CardTitle className="text-sm font-semibold">Knowledge Articles</CardTitle>
                  <Badge variant="secondary" className="text-[9px]">{agent.knowledge.length} assigned</Badge>
                </div>
                <Button size="sm" variant="outline" className="text-xs gap-1 h-7" onClick={() => toast("Assign knowledge article coming soon")}>
                  <Plus className="w-3 h-3" /> Assign
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Reference information this agent uses to answer customer questions</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {agent.knowledge.map((k: any) => (
                  <div key={k.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{k.title}</p>
                        <p className="text-[10px] text-muted-foreground">{k.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[9px] bg-teal-50 text-teal-700 border-teal-200">{k.status}</Badge>
                      <Link href="/knowledge">
                        <Button size="sm" variant="ghost" className="text-xs h-7">View</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Rules */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <CardTitle className="text-sm font-semibold">Action Rules</CardTitle>
                  <Badge variant="secondary" className="text-[9px]">{agent.actions.length} assigned</Badge>
                </div>
                <Button size="sm" variant="outline" className="text-xs gap-1 h-7" onClick={() => toast("Assign action rule coming soon")}>
                  <Plus className="w-3 h-3" /> Assign
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Executable rules that drive this agent's behavior, with embedded guardrails</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {agent.actions.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{a.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex items-center gap-1">
                            <Shield className="w-2.5 h-2.5 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">{a.guardrail}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">· Triggered {a.triggered}x</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[9px] bg-teal-50 text-teal-700 border-teal-200">{a.status}</Badge>
                      <Switch checked={a.status === "active"} onCheckedChange={() => toast("Action toggled")} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Channels Tab ── */}
        <TabsContent value="channels" className="mt-4 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">Channels this agent monitors and responds through. Each channel has independent response settings.</p>
            <Button size="sm" variant="outline" className="text-xs gap-1 h-7" onClick={() => toast("Add channel coming soon")}>
              <Plus className="w-3 h-3" /> Add Channel
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {agent.channels.map((ch: any) => (
              <Card key={ch.type} className={cn("shadow-sm", ch.status === "pending" && "border-amber-200")}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", 
                        ch.type === "live_chat" ? "bg-teal-50" : ch.type === "email" ? "bg-blue-50" : "bg-pink-50"
                      )}>
                        {ch.type === "live_chat" && <MessageCircle className="w-5 h-5 text-teal-600" />}
                        {ch.type === "email" && <Mail className="w-5 h-5 text-blue-600" />}
                        {ch.type === "social" && <Instagram className="w-5 h-5 text-pink-600" />}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{ch.name}</h3>
                        <Badge variant="outline" className={cn("text-[9px]",
                          ch.status === "active" ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-amber-50 text-amber-700 border-amber-200"
                        )}>
                          {ch.status === "active" ? "Active" : "Pending Setup"}
                        </Badge>
                      </div>
                    </div>
                    <Switch checked={ch.status === "active"} onCheckedChange={() => toast(`Channel ${ch.status === "active" ? "disabled" : "enabled"}`)} />
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2.5 rounded-lg bg-muted/50">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Response Time</p>
                        <p className="text-xs font-medium">{ch.responseTime}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-muted/50">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Tone</p>
                        <p className="text-xs font-medium">{ch.tone}</p>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-muted/50">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Channel Config</p>
                      <p className="text-xs">{ch.config}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Channel Behavior Differences */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Channel Behavior Matrix</CardTitle>
              <p className="text-xs text-muted-foreground">How this agent adapts its behavior across different channels</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-foreground">Attribute</th>
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-foreground">Live Chat</th>
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-foreground">Email</th>
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-foreground">Social DM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="px-5 py-2.5 text-xs font-medium">Response Time</td>
                      <td className="px-5 py-2.5 text-xs">Instant (&lt;3s)</td>
                      <td className="px-5 py-2.5 text-xs">Within 4 hours</td>
                      <td className="px-5 py-2.5 text-xs">Within 1 hour</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-2.5 text-xs font-medium">Message Length</td>
                      <td className="px-5 py-2.5 text-xs">Short, conversational</td>
                      <td className="px-5 py-2.5 text-xs">Detailed, structured</td>
                      <td className="px-5 py-2.5 text-xs">Brief, casual</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-2.5 text-xs font-medium">Tone</td>
                      <td className="px-5 py-2.5 text-xs">Friendly</td>
                      <td className="px-5 py-2.5 text-xs">Professional</td>
                      <td className="px-5 py-2.5 text-xs">Casual</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-2.5 text-xs font-medium">Formatting</td>
                      <td className="px-5 py-2.5 text-xs">Rich text, links</td>
                      <td className="px-5 py-2.5 text-xs">HTML, signature</td>
                      <td className="px-5 py-2.5 text-xs">Plain text, emoji</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-2.5 text-xs font-medium">Escalation</td>
                      <td className="px-5 py-2.5 text-xs">Transfer to live agent</td>
                      <td className="px-5 py-2.5 text-xs">CC human agent</td>
                      <td className="px-5 py-2.5 text-xs">Redirect to email</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Configuration Tab ── */}
        <TabsContent value="config" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Behavior Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm">Refund Limit</Label>
                    <span className="text-sm font-mono font-semibold">${refundLimit[0]}</span>
                  </div>
                  <Slider value={refundLimit} onValueChange={setRefundLimit} min={0} max={500} step={10} />
                  <p className="text-[10px] text-muted-foreground mt-1">Maximum auto-approved refund amount per ticket</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm">Traffic Share</Label>
                    <span className="text-sm font-mono font-semibold">{trafficShare[0]}%</span>
                  </div>
                  <Slider value={trafficShare} onValueChange={setTrafficShare} min={0} max={100} step={5} />
                  <p className="text-[10px] text-muted-foreground mt-1">Percentage of incoming tickets routed to this agent</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Store Credit First</Label>
                      <p className="text-[10px] text-muted-foreground">Offer store credit before cash refund</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Auto-Escalate on Negative Sentiment</Label>
                      <p className="text-[10px] text-muted-foreground">Transfer to human when customer is upset</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Proactive Follow-up</Label>
                      <p className="text-[10px] text-muted-foreground">Send follow-up message after resolution</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Permissions & Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { action: "Read Tickets", enabled: true, level: "L1" },
                  { action: "Reply to Customer", enabled: true, level: "L1" },
                  { action: "Cancel Order", enabled: true, level: "L1" },
                  { action: "Process Refund", enabled: agent.mode === "Production", level: "L2" },
                  { action: "Modify Order", enabled: true, level: "L1" },
                  { action: "Update Shipping Address", enabled: true, level: "L1" },
                  { action: "Apply Discount Code", enabled: false, level: "L2" },
                  { action: "Access Customer PII", enabled: false, level: "L3" },
                ].map((perm) => (
                  <div key={perm.action} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{perm.action}</span>
                      <Badge variant="outline" className="text-[9px]">{perm.level}</Badge>
                    </div>
                    <Switch checked={perm.enabled} onCheckedChange={() => toast(`Permission updated`)} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Conversations Tab ── */}
        <TabsContent value="conversations" className="mt-4 space-y-4">
          {/* Recent Conversations */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Recent Conversations</CardTitle>
                <Link href="/conversations">
                  <Button size="sm" variant="link" className="text-xs h-auto p-0">View all</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {recentConversations.map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-muted-foreground w-14">{c.id}</span>
                      <ChannelIconSmall channel={c.channel} />
                      <div>
                        <p className="text-sm font-medium">{c.customer}</p>
                        <p className="text-[10px] text-muted-foreground">{c.topic}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <SentimentDot score={c.sentiment} />
                      <Badge variant="outline" className={cn("text-[9px]",
                        c.status === "resolved" ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-blue-50 text-blue-700 border-blue-200"
                      )}>{c.status}</Badge>
                      <span className="text-[10px] text-muted-foreground">{c.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Audit Log */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Audit Log</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {auditLog.map((log, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3">
                    <span className="text-xs font-mono text-muted-foreground w-16">{log.time}</span>
                    <Badge variant="outline" className="text-[10px] font-mono w-36 justify-center">{log.action}</Badge>
                    <span className="text-xs text-muted-foreground w-14">{log.ticket}</span>
                    <span className="text-sm flex-1">{log.detail}</span>
                    <Badge variant="outline" className={cn("text-[10px]",
                      log.status === "success" ? "bg-teal-50 text-teal-700 border-teal-200" :
                      log.status === "blocked" ? "bg-red-50 text-red-700 border-red-200" :
                      "bg-amber-50 text-amber-700 border-amber-200"
                    )}>{log.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">{icon}<span className="text-xs">{label}</span></div>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function MetricBox({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        <p className="text-xs mt-1 text-teal-600">{trend} vs last week</p>
      </CardContent>
    </Card>
  );
}

function ChannelIconSmall({ channel }: { channel: string }) {
  if (channel === "live_chat") return <MessageCircle className="w-3.5 h-3.5 text-teal-500" />;
  if (channel === "email") return <Mail className="w-3.5 h-3.5 text-blue-500" />;
  return <Instagram className="w-3.5 h-3.5 text-pink-500" />;
}

function SentimentDot({ score }: { score: number }) {
  const color = score > 0.5 ? "bg-teal-500" : score > 0 ? "bg-amber-400" : "bg-red-400";
  return <span className={cn("w-2 h-2 rounded-full", color)} />;
}
