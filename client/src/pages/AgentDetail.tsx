/**
 * AgentDetail V7 — Status-aware Agent profile
 * Renders different views based on agent status:
 *   - Setting Up: Setup checklist with progress
 *   - Ready to Test: Test console + deploy CTA
 *   - Live: Full dashboard with tabs (Overview / Skills / Channel / Conversations)
 *   - Paused: Same as Live but with resume CTA
 */
import { useState } from "react";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft, MessageSquare, BarChart3, Clock, CheckCircle2,
  Send, Zap, BookOpen, Mail, MessageCircle, Bot,
  Target, Power, Eye, Play, CircleDot, Instagram,
  AlertCircle, ExternalLink, Shield, Pencil, Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ── Agent data ── */
type AgentStatus = "setting-up" | "ready-to-test" | "live" | "paused";

interface AgentData {
  name: string; status: AgentStatus; tone: string; language: string;
  channel: { type: string; label: string; provider: string; integration: string };
  setupSteps: { id: string; label: string; done: boolean; desc: string }[];
  csat: number; resolutionRate: number; avgResponseTime: string; sessionsToday: number; escalationRate: number;
  skills: { name: string; status: string; conversations: number; successRate: number }[];
  recentConversations: { id: string; customer: string; topic: string; sentiment: string; status: string; time: string; summary: string }[];
  auditLog: { time: string; action: string; ticket: string; detail: string; status: string }[];
}

const agentsDb: Record<string, AgentData> = {
  "rc-chat": {
    name: "RC Live Chat Agent", status: "live", tone: "Friendly", language: "English",
    channel: { type: "chat", label: "Live Chat", provider: "RC Widget", integration: "RC Widget" },
    setupSteps: [
      { id: "channel", label: "Connect channel", done: true, desc: "RC Widget connected" },
      { id: "identity", label: "Set agent identity", done: true, desc: "Name, tone, language configured" },
      { id: "knowledge", label: "Add knowledge", done: true, desc: "12 articles added" },
      { id: "skills", label: "Enable skills", done: true, desc: "3 skills active" },
    ],
    csat: 4.6, resolutionRate: 91.2, avgResponseTime: "1.1s", sessionsToday: 847, escalationRate: 8.8,
    skills: [
      { name: "Refund Processing", status: "active", conversations: 276, successRate: 94.2 },
      { name: "WISMO", status: "active", conversations: 342, successRate: 97.1 },
      { name: "Order Changes", status: "active", conversations: 154, successRate: 88.5 },
    ],
    recentConversations: [
      { id: "C-1001", customer: "Sarah Johnson", topic: "WISMO", sentiment: "positive", status: "resolved", time: "14:33", summary: "Provided tracking info for order #8834" },
      { id: "C-1002", customer: "Mike Chen", topic: "Refund", sentiment: "neutral", status: "active", time: "14:30", summary: "Processing partial refund for damaged item" },
      { id: "C-1003", customer: "Emma Davis", topic: "Order Change", sentiment: "positive", status: "resolved", time: "14:28", summary: "Updated shipping address before dispatch" },
      { id: "C-1004", customer: "James Wilson", topic: "WISMO", sentiment: "negative", status: "escalated", time: "14:25", summary: "Order delayed — escalated to human" },
    ],
    auditLog: [
      { time: "14:35", action: "reply", ticket: "C-1001", detail: "Sent tracking info for order #8834", status: "success" },
      { time: "14:34", action: "check_order", ticket: "C-1001", detail: "Fetched order #8834 details", status: "success" },
      { time: "14:33", action: "refund", ticket: "C-1002", detail: "Partial refund $45 processed", status: "success" },
      { time: "14:30", action: "refund", ticket: "C-1003", detail: "Refund $120 blocked by guardrail", status: "blocked" },
      { time: "14:28", action: "escalate", ticket: "C-1004", detail: "Escalated — order >14 days late", status: "escalated" },
    ],
  },
  "email-agent": {
    name: "Email Support Agent", status: "setting-up", tone: "Professional", language: "English",
    channel: { type: "email", label: "Email", provider: "Zendesk", integration: "Zendesk Email" },
    setupSteps: [
      { id: "channel", label: "Connect Zendesk Email", done: true, desc: "Connected to acme.zendesk.com" },
      { id: "identity", label: "Set agent identity", done: true, desc: "Name and tone configured" },
      { id: "knowledge", label: "Add knowledge articles", done: false, desc: "Add at least 3 articles to your knowledge base" },
      { id: "skills", label: "Enable skills", done: false, desc: "Enable at least 1 skill for this agent" },
    ],
    csat: 0, resolutionRate: 0, avgResponseTime: "—", sessionsToday: 0, escalationRate: 0,
    skills: [],
    recentConversations: [],
    auditLog: [],
  },
};

const defaultAgent = agentsDb["rc-chat"];

/* ── Test messages ── */
const testMessages = [
  { role: "customer" as const, text: "Hi, I ordered a pair of shoes last week and they arrived damaged. I'd like a refund please.", time: "Test" },
  { role: "agent" as const, text: "I'm sorry to hear about the damaged shoes. I can see your order #4521 — a pair of Classic Sneakers for $89. I'll process a full refund for you right away. You should see the refund in 3-5 business days. Is there anything else I can help with?", time: "Test" },
];

export default function AgentDetail() {
  const params = useParams<{ id: string }>();
  const agent = agentsDb[params.id || "rc-chat"] || defaultAgent;

  const ChannelIcon = agent.channel.type === "email" ? Mail : agent.channel.type === "social" ? Instagram : MessageCircle;
  const channelColor = agent.channel.type === "email" ? "text-blue-500" : agent.channel.type === "social" ? "text-pink-500" : "text-teal-500";

  const statusLabel: Record<AgentStatus, { text: string; color: string; dot: string }> = {
    "setting-up": { text: "Setting Up", color: "text-amber-700 bg-amber-50 border-amber-200", dot: "bg-amber-400" },
    "ready-to-test": { text: "Ready to Test", color: "text-blue-700 bg-blue-50 border-blue-200", dot: "bg-blue-400" },
    "live": { text: "Live", color: "text-teal-700 bg-teal-50 border-teal-200", dot: "bg-teal-500" },
    "paused": { text: "Paused", color: "text-gray-600 bg-gray-50 border-gray-200", dot: "bg-gray-400" },
  };
  const sl = statusLabel[agent.status];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/agents"><Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center",
              agent.channel.type === "email" ? "bg-blue-50" : agent.channel.type === "social" ? "bg-pink-50" : "bg-teal-50"
            )}>
              <ChannelIcon className={cn("w-5 h-5", channelColor)} />
            </div>
            <span className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card", sl.dot)} />
          </div>
          <div>
            <h1 className="text-base font-semibold">{agent.name}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{agent.channel.label}</span>
              <span>·</span>
              <span>{agent.channel.integration}</span>
              <span>·</span>
              <span>{agent.tone}</span>
            </div>
          </div>
        </div>
        <Badge variant="outline" className={cn("text-[10px] font-medium", sl.color)}>{sl.text}</Badge>
      </div>

      {/* Status-based content */}
      {agent.status === "setting-up" && <SettingUpView agent={agent} />}
      {agent.status === "ready-to-test" && <ReadyToTestView agent={agent} />}
      {(agent.status === "live" || agent.status === "paused") && <LiveView agent={agent} />}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/* ── Setting Up View ── */
/* ═══════════════════════════════════════════ */
function SettingUpView({ agent }: { agent: AgentData }) {
  const doneCount = agent.setupSteps.filter(s => s.done).length;
  const total = agent.setupSteps.length;
  const nextStep = agent.setupSteps.find(s => !s.done);

  return (
    <div className="space-y-4">
      {/* Progress */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold">Setup Progress</p>
              <p className="text-xs text-muted-foreground">{doneCount} of {total} steps completed</p>
            </div>
            <span className="text-sm font-bold text-amber-600">{Math.round((doneCount / total) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-4">
            <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${(doneCount / total) * 100}%` }} />
          </div>

          <div className="space-y-1.5">
            {agent.setupSteps.map((step, i) => {
              const isNext = step === nextStep;
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-lg transition-all",
                    isNext ? "bg-amber-50 border border-amber-200" : step.done ? "opacity-70" : ""
                  )}
                >
                  <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                    step.done ? "bg-teal-500" : isNext ? "bg-amber-400" : "bg-muted"
                  )}>
                    {step.done ? <CheckCircle2 className="w-3 h-3 text-white" /> :
                      <span className="text-[10px] font-semibold text-white">{i + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-medium", step.done && "line-through text-muted-foreground")}>{step.label}</p>
                    <p className="text-[10px] text-muted-foreground">{step.desc}</p>
                  </div>
                  {isNext && (
                    <Button size="sm" className="text-[11px] h-7 bg-amber-500 hover:bg-amber-600 gap-1" onClick={() => {
                      if (step.id === "knowledge") { window.location.href = "/knowledge"; }
                      else if (step.id === "skills") { window.location.href = "/knowledge"; }
                      else { toast.info("Feature coming soon"); }
                    }}>
                      <ArrowLeft className="w-3 h-3 rotate-180" /> Start
                    </Button>
                  )}
                  {step.done && <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Agent Identity Summary */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Agent Identity</p>
            <Button variant="ghost" size="sm" className="text-[11px] h-7 gap-1" onClick={() => toast.info("Edit identity coming soon")}>
              <Pencil className="w-3 h-3" /> Edit
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InfoRow icon={Bot} label="Name" value={agent.name} />
            <InfoRow icon={ChannelIcon(agent.channel.type)} label="Channel" value={`${agent.channel.label} via ${agent.channel.integration}`} />
            <InfoRow icon={Zap} label="Tone" value={agent.tone} />
            <InfoRow icon={Globe} label="Language" value={agent.language} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ChannelIcon(type: string) {
  if (type === "email") return Mail;
  if (type === "social") return Instagram;
  return MessageCircle;
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Bot; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
      <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-xs font-medium">{value}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* ── Ready to Test View ── */
/* ═══════════════════════════════════════════ */
function ReadyToTestView({ agent }: { agent: AgentData }) {
  const [testInput, setTestInput] = useState("");
  const [messages, setMessages] = useState(testMessages);
  const [deploying, setDeploying] = useState(false);

  const handleSend = () => {
    if (!testInput.trim()) return;
    setMessages(prev => [...prev, { role: "customer" as const, text: testInput, time: "Test" }]);
    setTestInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: "agent" as const,
        text: "Thank you for reaching out. Let me look into that for you. I can see the details of your order and I'll help resolve this right away.",
        time: "Test",
      }]);
    }, 1000);
  };

  const handleDeploy = () => {
    setDeploying(true);
    setTimeout(() => {
      toast.success(`${agent.name} is now Live!`);
      setDeploying(false);
    }, 1200);
  };

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-blue-600" />
          <div>
            <p className="text-xs font-semibold text-blue-800">Ready to Test</p>
            <p className="text-[10px] text-blue-600">All setup steps completed. Test your agent before going live.</p>
          </div>
        </div>
        <Button size="sm" className="text-xs bg-teal-600 hover:bg-teal-700 gap-1" onClick={handleDeploy} disabled={deploying}>
          {deploying ? "Deploying..." : <><Play className="w-3 h-3" /> Deploy Live</>}
        </Button>
      </div>

      {/* Test Console */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <p className="text-sm font-semibold mb-1">Test Console</p>
          <p className="text-[11px] text-muted-foreground mb-3">Send test messages to see how your agent responds.</p>

          <div className="border rounded-lg overflow-hidden">
            <div className="h-[280px] overflow-y-auto p-3 space-y-2.5 bg-muted/10">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === "customer" ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[75%] rounded-xl px-3 py-2",
                    msg.role === "customer" ? "bg-muted" : "bg-teal-50 border border-teal-100"
                  )}>
                    <p className="text-[10px] font-medium text-muted-foreground mb-0.5">{msg.role === "customer" ? "Test Customer" : agent.name}</p>
                    <p className="text-xs leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 p-2 border-t bg-background">
              <Input
                value={testInput}
                onChange={e => setTestInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="Type a test message as a customer..."
                className="text-xs h-8"
              />
              <Button size="sm" onClick={handleSend} className="bg-teal-600 hover:bg-teal-700 h-8 px-3">
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Summary */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <p className="text-sm font-semibold mb-2">Configuration Summary</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded bg-muted/30"><span className="text-muted-foreground">Channel:</span> <span className="font-medium">{agent.channel.label} via {agent.channel.integration}</span></div>
            <div className="p-2 rounded bg-muted/30"><span className="text-muted-foreground">Tone:</span> <span className="font-medium">{agent.tone}</span></div>
            <div className="p-2 rounded bg-muted/30"><span className="text-muted-foreground">Language:</span> <span className="font-medium">{agent.language}</span></div>
            <div className="p-2 rounded bg-muted/30"><span className="text-muted-foreground">Skills:</span> <span className="font-medium">{agent.skills.length} active</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* ── Live View (also used for Paused) ── */
/* ═══════════════════════════════════════════ */
function LiveView({ agent }: { agent: AgentData }) {
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "manager" as const, text: "Why did you give that customer a direct refund just now?", time: "2:34 PM" },
    { role: "agent" as const, text: "The customer's order total was $32, below the $50 auto-refund threshold. Additionally, the customer waited over 48 hours, so I processed the refund per the escalation policy.", time: "2:34 PM" },
  ]);
  const [agentEnabled, setAgentEnabled] = useState(agent.status === "live");

  const handleSend = () => {
    if (!chatInput.trim()) return;
    setMessages(prev => [...prev, { role: "manager" as const, text: chatInput, time: "Now" }]);
    setChatInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: "agent" as const,
        text: "Understood. I've noted your instruction and will apply it to future interactions.",
        time: "Now",
      }]);
    }, 1000);
  };

  return (
    <div className="space-y-4">
      {/* Paused banner */}
      {agent.status === "paused" && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
          <div className="flex items-center gap-2">
            <Power className="w-4 h-4 text-gray-500" />
            <p className="text-xs text-gray-600">Agent is paused. No new conversations will be assigned.</p>
          </div>
          <Button size="sm" className="text-xs bg-teal-600 hover:bg-teal-700 gap-1" onClick={() => { setAgentEnabled(true); toast.success("Agent resumed"); }}>
            <Play className="w-3 h-3" /> Resume
          </Button>
        </div>
      )}

      {/* Toggle */}
      <div className="flex items-center justify-end gap-2">
        <Label className="text-xs text-muted-foreground">{agentEnabled ? "Active" : "Paused"}</Label>
        <Switch checked={agentEnabled} onCheckedChange={(v) => { setAgentEnabled(v); toast.success(v ? "Agent activated" : "Agent paused"); }} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview" className="gap-1 text-xs"><BarChart3 className="w-3 h-3" /> Overview</TabsTrigger>
          <TabsTrigger value="skills" className="gap-1 text-xs"><Target className="w-3 h-3" /> Skills</TabsTrigger>
          <TabsTrigger value="channel" className="gap-1 text-xs"><Mail className="w-3 h-3" /> Channel</TabsTrigger>
          <TabsTrigger value="conversations" className="gap-1 text-xs"><MessageSquare className="w-3 h-3" /> Conversations</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-3 space-y-3">
          <div className="grid grid-cols-5 gap-2">
            <Metric label="Sessions" value={String(agent.sessionsToday)} trend="+12%" />
            <Metric label="Resolution" value={`${agent.resolutionRate}%`} trend="+2.3%" />
            <Metric label="CSAT" value={String(agent.csat)} trend="+0.1" />
            <Metric label="Response" value={agent.avgResponseTime} trend="-0.2s" />
            <Metric label="Escalation" value={`${agent.escalationRate}%`} trend="-1.2%" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Chat */}
            <Card className="lg:col-span-2 shadow-sm">
              <CardHeader className="pb-1 px-4 pt-3">
                <CardTitle className="text-xs font-semibold">Conversational Management</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="h-[220px] flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-2 mb-2 pr-1">
                    {messages.map((msg, i) => (
                      <div key={i} className={cn("flex", msg.role === "manager" ? "justify-end" : "justify-start")}>
                        <div className={cn("max-w-[80%] rounded-xl px-3 py-2",
                          msg.role === "manager" ? "bg-teal-600 text-white" : "bg-muted"
                        )}>
                          <p className="text-xs leading-relaxed">{msg.text}</p>
                          <p className={cn("text-[9px] mt-0.5", msg.role === "manager" ? "text-teal-200" : "text-muted-foreground")}>{msg.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Instruct your agent..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} className="text-xs h-8" />
                    <Button onClick={handleSend} size="icon" className="bg-teal-600 hover:bg-teal-700 h-8 w-8 shrink-0"><Send className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity */}
            <Card className="shadow-sm">
              <CardHeader className="pb-1 px-4 pt-3"><CardTitle className="text-xs font-semibold">Recent Activity</CardTitle></CardHeader>
              <CardContent className="px-4 pb-3 space-y-1">
                {agent.auditLog.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 p-1.5 rounded hover:bg-muted/30">
                    <div className={cn("w-1.5 h-1.5 rounded-full mt-1 shrink-0",
                      log.status === "success" ? "bg-teal-500" : log.status === "blocked" ? "bg-red-500" : "bg-amber-500"
                    )} />
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium truncate">{log.detail}</p>
                      <p className="text-[9px] text-muted-foreground">{log.time} · {log.ticket}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Skills */}
        <TabsContent value="skills" className="mt-3 space-y-3">
          <div className="p-2.5 rounded-lg bg-violet-50/50 border border-violet-200/60 flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-violet-600 shrink-0" />
            <p className="text-[11px] text-violet-700">Skills are globally shared. Manage in <Link href="/knowledge"><span className="underline font-medium cursor-pointer">Knowledge</span></Link>.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {agent.skills.map(skill => (
              <Card key={skill.name} className="shadow-sm">
                <CardContent className="p-3">
                  <p className="text-xs font-semibold mb-2">{skill.name}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-1.5 rounded bg-muted/30 text-center">
                      <p className="text-xs font-bold">{skill.conversations}</p>
                      <p className="text-[9px] text-muted-foreground">Convos</p>
                    </div>
                    <div className="p-1.5 rounded bg-muted/30 text-center">
                      <p className="text-xs font-bold">{skill.successRate}%</p>
                      <p className="text-[9px] text-muted-foreground">Success</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Channel */}
        <TabsContent value="channel" className="mt-3">
          <Card className="shadow-sm">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center",
                  agent.channel.type === "email" ? "bg-blue-50" : "bg-teal-50"
                )}>
                  {agent.channel.type === "email" ? <Mail className="w-4 h-4 text-blue-500" /> : <MessageCircle className="w-4 h-4 text-teal-500" />}
                </div>
                <div>
                  <p className="text-sm font-semibold">{agent.channel.label}</p>
                  <p className="text-[11px] text-muted-foreground">via {agent.channel.integration}</p>
                </div>
                <Badge variant="outline" className="ml-auto text-[9px] text-teal-600 border-teal-200">Connected</Badge>
              </div>

              {agent.channel.type === "chat" && (
                <div className="space-y-3 pt-3 border-t">
                  <div><Label className="text-xs">Welcome Message</Label><Textarea defaultValue="Hi there! How can I help you today?" rows={2} className="mt-1" /></div>
                  <div className="flex items-center justify-between"><div><Label className="text-xs">Typing Indicator</Label></div><Switch defaultChecked /></div>
                </div>
              )}
              {agent.channel.type === "email" && (
                <div className="space-y-3 pt-3 border-t">
                  <div><Label className="text-xs">Email Signature</Label><Textarea defaultValue={"Best regards,\nSeel Support Team"} rows={2} className="mt-1" /></div>
                  <div><Label className="text-xs">Reply-to Address</Label><Input defaultValue="support@seel.com" className="mt-1" /></div>
                </div>
              )}
              <div className="flex justify-end"><Button size="sm" className="text-xs bg-teal-600 hover:bg-teal-700" onClick={() => toast.success("Saved")}>Save</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversations */}
        <TabsContent value="conversations" className="mt-3 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <StatBox label="Active" value={String(agent.recentConversations.filter(c => c.status === "active").length)} color="text-teal-600" />
            <StatBox label="Resolved" value={String(agent.recentConversations.filter(c => c.status === "resolved").length)} color="text-blue-600" />
            <StatBox label="Escalated" value={String(agent.recentConversations.filter(c => c.status === "escalated").length)} color="text-amber-600" />
          </div>
          <div className="space-y-1.5">
            {agent.recentConversations.map(conv => (
              <Card key={conv.id} className="shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => toast.info("Conversation detail coming soon")}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={cn("w-1.5 h-1.5 rounded-full shrink-0",
                    conv.status === "active" ? "bg-teal-500 animate-pulse" : conv.status === "resolved" ? "bg-blue-400" : "bg-amber-500"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium">{conv.customer}</p>
                      <Badge variant="outline" className="text-[8px]">{conv.topic}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{conv.summary}</p>
                  </div>
                  <span className="text-[9px] text-muted-foreground shrink-0">{conv.time}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Metric({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <Card className="shadow-sm"><CardContent className="p-2.5">
      <p className="text-[9px] text-muted-foreground">{label}</p>
      <div className="flex items-end justify-between mt-0.5">
        <p className="text-lg font-bold leading-none">{value}</p>
        <span className="text-[9px] text-teal-600 font-medium">{trend}</span>
      </div>
    </CardContent></Card>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Card className="shadow-sm"><CardContent className="p-2.5 text-center">
      <p className={cn("text-lg font-bold", color)}>{value}</p>
      <p className="text-[9px] text-muted-foreground">{label}</p>
    </CardContent></Card>
  );
}
