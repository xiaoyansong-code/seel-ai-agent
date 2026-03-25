/**
 * AgentDetail — Config-focused Agent page
 *
 * Design decisions:
 * - Overview: Compact 5-metric summary + Conversational Management + "View in Performance" deep-link
 * - Configuration: Skills toggle + Channel settings + Guardrails — all in one tab
 * - Simulator: Single Test + Batch Test (unchanged from before)
 * - No Conversations tab (removed duplication — user goes to Performance > Conversations)
 * - Production Edit Safeguard: Live agents show AlertDialog on Save with A/B test hint
 */
import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft, MessageSquare, BarChart3, CheckCircle2,
  Send, Zap, BookOpen, Mail, MessageCircle, Bot,
  Target, Power, Eye, Play, Instagram,
  ExternalLink, Plus, X,
  Loader2, Package, Shield, ShoppingCart,
  Lock, Settings, Globe, RefreshCw, AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ── Types ── */
type AgentStatus = "setting-up" | "ready-to-test" | "live" | "paused";

interface Skill {
  id: string;
  name: string;
  desc: string;
  enabled: boolean;
  isDefault?: boolean;
  conversations?: number;
  successRate?: number;
}

interface AgentData {
  name: string;
  slug: string;
  status: AgentStatus;
  channel: { type: string; label: string; provider: string; integration: string };
  skills: Skill[];
  csat: number;
  resolutionRate: number;
  avgResponseTime: string;
  sessionsToday: number;
  escalationRate: number;
  auditLog: { time: string; action: string; ticket: string; detail: string; status: string }[];
}

const allSkills: Skill[] = [
  { id: "s1", name: "Post-purchase Claims", desc: "Refund requests, damaged items, missing orders", enabled: true, isDefault: true },
  { id: "s2", name: "Where Is My Order (WISMO)", desc: "Order tracking, shipping updates, delivery inquiries", enabled: true, isDefault: true },
  { id: "s3", name: "Order Changes", desc: "Cancellations, address changes, item swaps", enabled: false },
  { id: "s4", name: "Returns & Exchanges", desc: "Returns, labels, exchanges", enabled: false },
  { id: "s5", name: "Subscription Management", desc: "Pause, resume, upgrade, cancel subscriptions", enabled: false },
  { id: "s6", name: "Product Inquiry", desc: "Product questions, recommendations", enabled: false },
];

const agentsDb: Record<string, AgentData> = {
  "rc-chat": {
    name: "RC Live Chat Agent", slug: "RC Live Chat Agent",
    status: "live",
    channel: { type: "chat", label: "Live Chat", provider: "RC Widget", integration: "RC Widget" },
    skills: [
      { id: "s1", name: "Post-purchase Claims", desc: "Refund requests", enabled: true, isDefault: true, conversations: 276, successRate: 94.2 },
      { id: "s2", name: "Where Is My Order (WISMO)", desc: "Order tracking", enabled: true, isDefault: true, conversations: 342, successRate: 97.1 },
      { id: "s3", name: "Order Changes", desc: "Cancellations", enabled: true, conversations: 154, successRate: 88.5 },
    ],
    csat: 4.6, resolutionRate: 91.2, avgResponseTime: "1.1s", sessionsToday: 847, escalationRate: 8.8,
    auditLog: [
      { time: "14:35", action: "reply", ticket: "C-1001", detail: "Sent tracking info for order #8834", status: "success" },
      { time: "14:34", action: "check_order", ticket: "C-1001", detail: "Fetched order #8834 details", status: "success" },
      { time: "14:33", action: "refund", ticket: "C-1002", detail: "Partial refund $45 processed", status: "success" },
      { time: "14:30", action: "refund", ticket: "C-1003", detail: "Refund $120 blocked by guardrail", status: "blocked" },
      { time: "14:28", action: "escalate", ticket: "C-1004", detail: "Escalated — order >14 days late", status: "escalated" },
    ],
  },
  "email-agent": {
    name: "Email Support Agent", slug: "Email Support Agent",
    status: "setting-up",
    channel: { type: "email", label: "Email", provider: "Zendesk", integration: "Zendesk Email" },
    skills: [
      { id: "s1", name: "Post-purchase Claims", desc: "Refund requests, damaged items, missing orders", enabled: true, isDefault: true },
      { id: "s2", name: "Where Is My Order (WISMO)", desc: "Order tracking, shipping updates, delivery inquiries", enabled: true, isDefault: true },
    ],
    csat: 0, resolutionRate: 0, avgResponseTime: "—", sessionsToday: 0, escalationRate: 0,
    auditLog: [],
  },
};

const defaultAgent = agentsDb["rc-chat"];

export default function AgentDetail() {
  const params = useParams<{ id: string }>();
  const agent = agentsDb[params.id || "rc-chat"] || defaultAgent;
  const [, navigate] = useLocation();

  const ChannelIcon = agent.channel.type === "email" ? Mail : agent.channel.type === "social" ? Instagram : MessageCircle;
  const channelColor = agent.channel.type === "email" ? "text-blue-500" : agent.channel.type === "social" ? "text-pink-500" : "text-primary";

  const statusLabel: Record<AgentStatus, { text: string; color: string; dot: string }> = {
    "setting-up": { text: "Setting Up", color: "text-amber-700 bg-amber-50 border-amber-200", dot: "bg-amber-400" },
    "ready-to-test": { text: "Ready to Test", color: "text-blue-700 bg-blue-50 border-blue-200", dot: "bg-blue-400" },
    "live": { text: "Live", color: "text-primary bg-primary/10 border-primary/20", dot: "bg-primary" },
    "paused": { text: "Paused", color: "text-gray-600 bg-gray-50 border-gray-200", dot: "bg-gray-400" },
  };
  const sl = statusLabel[agent.status];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 lg:p-8 max-w-[960px] space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/agents"><Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center",
              agent.channel.type === "email" ? "bg-blue-50" : agent.channel.type === "social" ? "bg-pink-50" : "bg-primary/10"
            )}>
              <ChannelIcon className={cn("w-5 h-5", channelColor)} />
            </div>
            <span className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card", sl.dot)} />
          </div>
          <div>
            <h1 className="text-base font-semibold">{agent.name}</h1>
            <p className="text-xs text-muted-foreground">{agent.channel.label} · {agent.channel.integration}</p>
          </div>
        </div>
        <Badge variant="outline" className={cn("text-[10px] font-medium", sl.color)}>{sl.text}</Badge>
      </div>

      {agent.status === "setting-up" && <SettingUpView agent={agent} />}
      {agent.status === "ready-to-test" && <ReadyToTestView agent={agent} />}
      {(agent.status === "live" || agent.status === "paused") && <LiveView agent={agent} navigate={navigate} />}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════ */
/* ── Setting Up View — Flat config page, no wizard ──    */
/* ═══════════════════════════════════════════════════════ */
function SettingUpView({ agent }: { agent: AgentData }) {
  const [zdConnected, setZdConnected] = useState(false);
  const [zdSubdomain, setZdSubdomain] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [deployMode, setDeployMode] = useState("shadow");
  const [escalationGroup, setEscalationGroup] = useState("tier-2-support");
  const [webhookStatus, setWebhookStatus] = useState<"waiting" | "connected" | "testing">("waiting");
  const [skills, setSkills] = useState<Skill[]>(agent.skills);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [triggerGuideOpen, setTriggerGuideOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);

  const handleConnectZendesk = () => {
    if (!zdSubdomain.trim()) return;
    setConnecting(true);
    setTimeout(() => { setConnecting(false); setZdConnected(true); toast.success(`Connected to ${zdSubdomain}.zendesk.com`); }, 1200);
  };

  const handleAddSkill = (skill: Skill) => {
    if (skills.find(s => s.id === skill.id)) return;
    setSkills(prev => [...prev, { ...skill, enabled: true }]);
    toast.success(`${skill.name} added`);
  };

  const availableToAdd = allSkills.filter(s => !skills.find(existing => existing.id === s.id));

  return (
    <div className="space-y-8">
      {/* ═══ Integration ═══ */}
      <section>
        <h2 className="text-base font-semibold mb-4">Integration</h2>
        <div className="space-y-5">
          <div>
            <h3 className="text-xs font-medium mb-2">Connect {agent.channel.integration}</h3>
            {!zdConnected ? (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center"><Mail className="w-4 h-4 text-blue-500" /></div>
                    <div><p className="text-sm font-medium">{agent.channel.integration}</p><p className="text-[11px] text-muted-foreground">Connect your {agent.channel.integration} account to enable AI support</p></div>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1"><Label className="text-xs">Subdomain</Label><Input placeholder="your-company" value={zdSubdomain} onChange={e => setZdSubdomain(e.target.value)} className="mt-1" /></div>
                    <Button onClick={handleConnectZendesk} disabled={connecting || !zdSubdomain.trim()} className="gap-1.5">{connecting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting...</> : "Connect"}</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-primary" /></div>
                    <div className="flex-1"><p className="text-sm font-medium">{zdSubdomain}.zendesk.com</p><p className="text-[11px] text-muted-foreground">Connected successfully</p></div>
                    <Badge variant="outline" className="text-[9px] text-primary border-primary/20">Connected</Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Webhook / Trigger */}
          <div>
            <h3 className="text-xs font-medium mb-2">Webhook & Trigger Setup</h3>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full", webhookStatus === "connected" ? "bg-primary" : "bg-amber-400 animate-pulse")} />
                  <p className="text-xs">{webhookStatus === "connected" ? "Webhook connected and receiving events" : "Waiting for webhook connection..."}</p>
                  <Button variant="outline" size="sm" className="ml-auto text-xs gap-1" onClick={() => { setWebhookStatus("testing"); setTimeout(() => { setWebhookStatus("connected"); toast.success("Webhook verified"); }, 800); }}>
                    <RefreshCw className="w-3 h-3" /> Test
                  </Button>
                </div>
                <div className="p-2.5 rounded bg-muted/50 border">
                  <p className="text-[10px] font-mono text-muted-foreground break-all">https://api.seel.com/webhooks/ai-support/zendesk/{agent.channel.integration.toLowerCase().replace(/\s/g, "-")}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setTriggerGuideOpen(true)}>
                  <BookOpen className="w-3 h-3" /> View Trigger Setup Guide
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ═══ Skills ═══ */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Skills</h2>
          <Button variant="outline" size="sm" className="text-xs gap-1 h-7" onClick={() => setShowAddSkill(true)}>
            <Plus className="w-3 h-3" /> Add Skill
          </Button>
        </div>
        <div className="space-y-2">
          {skills.map(skill => (
            <div key={skill.id} className={cn("flex items-center gap-3 p-3 rounded-lg border", skill.enabled ? "border-border bg-card" : "border-border/50 bg-muted/10 opacity-60")}>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", skill.id === "s1" ? "bg-blue-50" : skill.id === "s2" ? "bg-primary/10" : "bg-amber-50")}>
                {skill.id === "s1" ? <Package className="w-4 h-4 text-blue-600" /> : skill.id === "s2" ? <Shield className="w-4 h-4 text-primary" /> : <ShoppingCart className="w-4 h-4 text-amber-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{skill.name}</p>
                <p className="text-[10px] text-muted-foreground">{skill.desc}</p>
              </div>
              <Switch checked={skill.enabled} onCheckedChange={() => {
                setSkills(prev => prev.map(s => s.id === skill.id ? { ...s, enabled: !s.enabled } : s));
              }} />
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Deployment Mode ═══ */}
      <section>
        <h2 className="text-base font-semibold mb-3">Deployment Mode</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "shadow", label: "Shadow Mode", desc: "Agent drafts responses for human review before sending", icon: Eye },
            { value: "autopilot", label: "Autopilot", desc: "Agent handles conversations autonomously", icon: Bot },
          ].map(opt => (
            <button key={opt.value} onClick={() => setDeployMode(opt.value)} className={cn(
              "text-left p-3 rounded-lg border transition-all",
              deployMode === opt.value ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-border/80"
            )}>
              <div className="flex items-center gap-2 mb-1">
                <opt.icon className={cn("w-4 h-4", deployMode === opt.value ? "text-primary" : "text-muted-foreground")} />
                <span className="text-xs font-medium">{opt.label}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ═══ Escalation ═══ */}
      <section>
        <h2 className="text-base font-semibold mb-3">Escalation</h2>
        <Card>
          <CardContent className="p-4 space-y-3">
            <div><Label className="text-xs">Escalation Group</Label>
              <Select value={escalationGroup} onValueChange={setEscalationGroup}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tier-2-support">Tier 2 Support</SelectItem>
                  <SelectItem value="senior-agents">Senior Agents</SelectItem>
                  <SelectItem value="team-lead">Team Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Bottom actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => setTestOpen(true)}>
          <MessageSquare className="w-3 h-3" /> Test Agent
        </Button>
        <Button size="sm" className="text-xs gap-1" onClick={() => toast.success("Configuration saved. Agent is ready to test.")}>
          <CheckCircle2 className="w-3 h-3" /> Save & Mark Ready
        </Button>
      </div>

      {/* Add Skill Dialog */}
      <Dialog open={showAddSkill} onOpenChange={setShowAddSkill}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-sm">Add Skill</DialogTitle>
            <DialogDescription className="text-xs">Enable additional skills for this agent</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {availableToAdd.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">All available skills are already added</p>
            ) : availableToAdd.map(skill => (
              <button key={skill.id} onClick={() => { handleAddSkill(skill); setShowAddSkill(false); }} className="w-full text-left p-3 rounded-lg border hover:border-primary/30 hover:bg-primary/5 transition-all">
                <p className="text-xs font-medium">{skill.name}</p>
                <p className="text-[10px] text-muted-foreground">{skill.desc}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Trigger Guide Dialog */}
      <Dialog open={triggerGuideOpen} onOpenChange={setTriggerGuideOpen}>
        <DialogContent className="max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-sm">Trigger Setup Guide</DialogTitle>
            <DialogDescription className="text-xs">Configure your {agent.channel.integration} to forward tickets to Seel AI</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {[
              { step: 1, title: "Create a Trigger", desc: `In ${agent.channel.integration}, go to Admin > Business Rules > Triggers` },
              { step: 2, title: "Set Conditions", desc: "Ticket is Created, Channel is Email/Chat" },
              { step: 3, title: "Add Action", desc: "Notify target → Active webhook → Select Seel AI webhook" },
            ].map(s => (
              <div key={s.step} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><span className="text-[10px] font-bold text-primary">{s.step}</span></div>
                <div><p className="text-xs font-medium">{s.title}</p><p className="text-[10px] text-muted-foreground">{s.desc}</p></div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Drawer */}
      <Sheet open={testOpen} onOpenChange={setTestOpen}>
        <SheetContent className="sm:max-w-[420px] p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b"><SheetTitle className="text-sm">Test Agent</SheetTitle></SheetHeader>
          <TestPanel agentName={agent.name} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* ── Test Panel (reusable) ── */
/* ═══════════════════════════════════════════ */
function TestPanel({ agentName }: { agentName: string }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "customer" | "agent"; text: string; time: string }[]>([
    { role: "customer", text: "Hi, I ordered a pair of shoes last week and they arrived damaged. I'd like a refund please.", time: "Test" },
    { role: "agent", text: "I'm sorry to hear about the damaged shoes. I can see your order #4521 — a pair of Classic Sneakers for $89. I'll process a full refund for you right away. You should see the refund in 3-5 business days. Is there anything else I can help with?", time: "Test" },
  ]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: "customer", text: input, time: "Now" }]);
    setInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "agent", text: "Understood. I've noted your instruction and will apply it to future interactions.", time: "Now" }]);
    }, 800);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === "customer" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[80%] rounded-xl px-3 py-2", msg.role === "customer" ? "bg-muted" : "bg-primary/10 border border-primary/15")}>
              <p className="text-[10px] font-medium text-muted-foreground mb-0.5">{msg.role === "customer" ? "Test Customer" : agentName}</p>
              <p className="text-xs leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 p-3 border-t">
        <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} placeholder="Type as a customer..." className="text-xs h-8" />
        <Button size="sm" onClick={handleSend} className="h-8 px-3"><Send className="w-3.5 h-3.5" /></Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* ── Ready to Test View ── */
/* ═══════════════════════════════════════════ */
function ReadyToTestView({ agent }: { agent: AgentData }) {
  const [testOpen, setTestOpen] = useState(false);
  const [deploying, setDeploying] = useState(false);

  const handleDeploy = () => {
    setDeploying(true);
    setTimeout(() => { toast.success(`${agent.name} is now Live!`); setDeploying(false); }, 1200);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-blue-600" />
          <p className="text-xs text-blue-800">Setup complete. Test your agent before going live.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => setTestOpen(true)}>
            <MessageSquare className="w-3 h-3" /> Test
          </Button>
          <Button size="sm" className="text-xs gap-1" onClick={handleDeploy} disabled={deploying}>
            {deploying ? "Deploying..." : <><Play className="w-3 h-3" /> Deploy Live</>}
          </Button>
        </div>
      </div>

      <Sheet open={testOpen} onOpenChange={setTestOpen}>
        <SheetContent className="sm:max-w-[420px] p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b"><SheetTitle className="text-sm">Test Agent</SheetTitle></SheetHeader>
          <TestPanel agentName={agent.name} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* ── Live View — Overview + Configuration + Simulator ── */
/* ═══════════════════════════════════════════ */
function LiveView({ agent, navigate }: { agent: AgentData; navigate: (to: string) => void }) {
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
      setMessages(prev => [...prev, { role: "agent" as const, text: "Understood. I've noted your instruction and will apply it to future interactions.", time: "Now" }]);
    }, 1000);
  };

  const agentFilterParam = encodeURIComponent(agent.name);

  return (
    <div className="space-y-4">
      {agent.status === "paused" && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
          <div className="flex items-center gap-2">
            <Power className="w-4 h-4 text-gray-500" />
            <p className="text-xs text-gray-600">Agent is paused. No new conversations will be assigned.</p>
          </div>
          <Button size="sm" className="text-xs gap-1" onClick={() => { setAgentEnabled(true); toast.success("Agent resumed"); }}>
            <Play className="w-3 h-3" /> Resume
          </Button>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Label className="text-xs text-muted-foreground">{agentEnabled ? "Active" : "Paused"}</Label>
        <Switch checked={agentEnabled} onCheckedChange={(v) => { setAgentEnabled(v); toast.success(v ? "Agent activated" : "Agent paused"); }} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview" className="gap-1 text-xs"><BarChart3 className="w-3 h-3" /> Overview</TabsTrigger>
          <TabsTrigger value="configuration" className="gap-1 text-xs"><Settings className="w-3 h-3" /> Configuration</TabsTrigger>
          <TabsTrigger value="simulator" className="gap-1 text-xs"><Bot className="w-3 h-3" /> Simulator</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="mt-3 space-y-3">
          {/* Compact metrics */}
          <div className="grid grid-cols-5 gap-2">
            <Metric label="Sessions" value={String(agent.sessionsToday)} trend="+12%" />
            <Metric label="Resolution" value={`${agent.resolutionRate}%`} trend="+2.3%" />
            <Metric label="CSAT" value={String(agent.csat)} trend="+0.1" />
            <Metric label="Response" value={agent.avgResponseTime} trend="-0.2s" />
            <Metric label="Escalation" value={`${agent.escalationRate}%`} trend="-1.2%" />
          </div>

          {/* Performance deep-links */}
          <Card className="bg-primary/[0.02] border-primary/10">
            <CardContent className="p-3">
              <p className="text-[11px] text-muted-foreground mb-2">Dive deeper into this agent's performance:</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5 h-7"
                  onClick={() => navigate(`/performance?agent=${agentFilterParam}`)}
                >
                  <BarChart3 className="w-3 h-3" /> Performance Overview
                  <ExternalLink className="w-2.5 h-2.5 text-muted-foreground" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5 h-7"
                  onClick={() => navigate(`/performance/conversations?agent=${agentFilterParam}`)}
                >
                  <MessageSquare className="w-3 h-3" /> View Conversations
                  <ExternalLink className="w-2.5 h-2.5 text-muted-foreground" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Conversational Management + Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-1 px-4 pt-3"><CardTitle className="text-xs font-semibold">Conversational Management</CardTitle></CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="h-[220px] flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-2 mb-2 pr-1">
                    {messages.map((msg, i) => (
                      <div key={i} className={cn("flex", msg.role === "manager" ? "justify-end" : "justify-start")}>
                        <div className={cn("max-w-[80%] rounded-xl px-3 py-2", msg.role === "manager" ? "bg-primary text-white" : "bg-muted")}>
                          <p className="text-xs leading-relaxed">{msg.text}</p>
                          <p className={cn("text-[9px] mt-0.5", msg.role === "manager" ? "text-white/60" : "text-muted-foreground")}>{msg.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Instruct your agent..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} className="text-xs h-8" />
                    <Button onClick={handleSend} size="icon" className="h-8 w-8 shrink-0"><Send className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-1 px-4 pt-3"><CardTitle className="text-xs font-semibold">Recent Activity</CardTitle></CardHeader>
              <CardContent className="px-4 pb-3 space-y-1">
                {agent.auditLog.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 p-1.5 rounded hover:bg-muted/30">
                    <div className={cn("w-1.5 h-1.5 rounded-full mt-1 shrink-0",
                      log.status === "success" ? "bg-primary" : log.status === "blocked" ? "bg-red-500" : "bg-amber-500"
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

        {/* ── Configuration Tab ── */}
        <TabsContent value="configuration" className="mt-3">
          <ConfigurationTab agent={agent} />
        </TabsContent>

        {/* ── Simulator Tab ── */}
        <TabsContent value="simulator" className="mt-3">
          <SimulatorPanel agentName={agent.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* ── Configuration Tab — Skills + Channel + Guardrails ── */
/* Production Edit Safeguard: AlertDialog on Save          */
/* ═══════════════════════════════════════════ */
function ConfigurationTab({ agent }: { agent: AgentData }) {
  const [skills, setSkills] = useState<Skill[]>(agent.skills);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // Channel config state
  const [deployMode, setDeployMode] = useState("autopilot");
  const [escalationGroup, setEscalationGroup] = useState("tier-2-support");
  const [welcomeMsg, setWelcomeMsg] = useState("Hi there! I'm your support assistant. How can I help you today?");
  const [maxRefund, setMaxRefund] = useState([50]);

  const isLive = agent.status === "live";
  const availableToAdd = allSkills.filter(s => !skills.find(existing => existing.id === s.id));

  const markChanged = () => { if (!hasChanges) setHasChanges(true); };

  const handleSave = () => {
    if (isLive) {
      setSaveDialogOpen(true);
    } else {
      toast.success("Configuration saved");
      setHasChanges(false);
    }
  };

  const handleConfirmSave = () => {
    toast.success("Configuration saved. Changes are now live.");
    setHasChanges(false);
    setSaveDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Live warning banner */}
      {isLive && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
          <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <p className="text-[11px] text-amber-800">This agent is live in production. Changes will take effect immediately after saving.</p>
        </div>
      )}

      {/* ── Skills Section ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold">Skills</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Toggle which skills this agent can use. Skills are globally managed in <Link href="/playbook/skills"><span className="text-primary underline cursor-pointer">Playbook</span></Link>.</p>
          </div>
          <Button variant="outline" size="sm" className="text-xs gap-1 h-7" onClick={() => setShowAddSkill(true)}>
            <Plus className="w-3 h-3" /> Add
          </Button>
        </div>
        <div className="space-y-2">
          {skills.map(skill => (
            <div key={skill.id} className={cn("flex items-center gap-3 p-3 rounded-lg border transition-all", skill.enabled ? "border-border bg-card" : "border-border/50 bg-muted/10 opacity-60")}>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", skill.id === "s1" ? "bg-blue-50" : skill.id === "s2" ? "bg-primary/10" : "bg-amber-50")}>
                {skill.id === "s1" ? <Package className="w-4 h-4 text-blue-600" /> : skill.id === "s2" ? <Shield className="w-4 h-4 text-primary" /> : <ShoppingCart className="w-4 h-4 text-amber-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{skill.name}</p>
                {skill.conversations !== undefined && (
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{skill.conversations} conversations</span>
                    <span className="text-[10px] text-muted-foreground">{skill.successRate}% success</span>
                  </div>
                )}
              </div>
              <Switch checked={skill.enabled} onCheckedChange={() => {
                setSkills(prev => prev.map(s => s.id === skill.id ? { ...s, enabled: !s.enabled } : s));
                markChanged();
              }} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Channel Settings ── */}
      <section>
        <h3 className="text-sm font-semibold mb-3">Channel Settings</h3>
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", agent.channel.type === "email" ? "bg-blue-50" : "bg-primary/10")}>
                {agent.channel.type === "email" ? <Mail className="w-4 h-4 text-blue-500" /> : <MessageCircle className="w-4 h-4 text-primary" />}
              </div>
              <div>
                <p className="text-sm font-semibold">{agent.channel.label}</p>
                <p className="text-[11px] text-muted-foreground">via {agent.channel.integration}</p>
              </div>
              <Badge variant="outline" className="ml-auto text-[9px] text-primary border-primary/20">Connected</Badge>
            </div>

            <div className="space-y-3 pt-3 border-t">
              <div>
                <Label className="text-xs">Deployment Mode</Label>
                <Select value={deployMode} onValueChange={(v) => { setDeployMode(v); markChanged(); }}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="autopilot">Autopilot — Fully autonomous</SelectItem>
                    <SelectItem value="shadow">Shadow — Drafts for human review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {agent.channel.type === "chat" && (
                <div>
                  <Label className="text-xs">Welcome Message</Label>
                  <Textarea value={welcomeMsg} onChange={e => { setWelcomeMsg(e.target.value); markChanged(); }} rows={2} className="mt-1" />
                </div>
              )}
              <div>
                <Label className="text-xs">Escalation Group</Label>
                <Select value={escalationGroup} onValueChange={(v) => { setEscalationGroup(v); markChanged(); }}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tier-2-support">Tier 2 Support</SelectItem>
                    <SelectItem value="senior-agents">Senior Agents</SelectItem>
                    <SelectItem value="team-lead">Team Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Guardrails ── */}
      <section>
        <h3 className="text-sm font-semibold mb-3">Guardrails</h3>
        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs">Max Auto-Refund Amount</Label>
                <span className="text-xs font-semibold">${maxRefund[0]}</span>
              </div>
              <Slider value={maxRefund} onValueChange={(v) => { setMaxRefund(v); markChanged(); }} min={0} max={200} step={5} />
              <p className="text-[10px] text-muted-foreground mt-1">Refunds above this amount will require human approval</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Save bar */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-4 flex items-center justify-between p-3 rounded-lg bg-card border shadow-lg"
        >
          <p className="text-xs text-muted-foreground">You have unsaved changes</p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setHasChanges(false); toast("Changes discarded"); }}>Discard</Button>
            <Button size="sm" className="text-xs gap-1" onClick={handleSave}>
              {isLive && <AlertTriangle className="w-3 h-3" />}
              Save Changes
            </Button>
          </div>
        </motion.div>
      )}

      {/* Add Skill Dialog */}
      <Dialog open={showAddSkill} onOpenChange={setShowAddSkill}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-sm">Add Skill</DialogTitle>
            <DialogDescription className="text-xs">Enable additional skills for this agent</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {availableToAdd.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">All available skills are already added</p>
            ) : availableToAdd.map(skill => (
              <button key={skill.id} onClick={() => { setSkills(prev => [...prev, { ...skill, enabled: true }]); setShowAddSkill(false); markChanged(); toast.success(`${skill.name} added`); }} className="w-full text-left p-3 rounded-lg border hover:border-primary/30 hover:bg-primary/5 transition-all">
                <p className="text-xs font-medium">{skill.name}</p>
                <p className="text-[10px] text-muted-foreground">{skill.desc}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Production Save Confirmation */}
      <AlertDialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Save Changes to Live Agent?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs space-y-2">
              <p>This agent is currently handling live customer conversations. Your changes will take effect immediately.</p>
              <div className="p-2.5 rounded-md bg-blue-50 border border-blue-200 mt-2">
                <p className="text-[11px] text-blue-800 font-medium flex items-center gap-1.5">
                  <Eye className="w-3 h-3" /> A/B Testing — Coming Soon
                </p>
                <p className="text-[10px] text-blue-700 mt-0.5">Soon you'll be able to test configuration changes on a subset of conversations before rolling out to all traffic.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction className="text-xs" onClick={handleConfirmSave}>Save & Apply Now</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* ── Simulator Panel ── */
/* ═══════════════════════════════════════════ */
function SimulatorPanel({ agentName }: { agentName: string }) {
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [singleInput, setSingleInput] = useState("");
  const [singleMessages, setSingleMessages] = useState<{ role: "customer" | "agent"; text: string; time: string; action?: string; reasoning?: string }[]>([]);
  const [singleRunning, setSingleRunning] = useState(false);
  const [batchResults, setBatchResults] = useState<{ id: number; input: string; intent: string; result: string; response: string; time: string; status: "pass" | "fail" | "warn" }[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);

  const sampleBatchCases = [
    "Where is my order #1234?",
    "I want to cancel order #5678",
    "My package arrived damaged, I need a refund",
    "Can I change my shipping address?",
    "I haven't received my refund after 2 weeks",
    "What's your return policy?",
    "I want to exchange my item for a different size",
    "My order is showing delivered but I never got it",
  ];

  const handleSingleSend = () => {
    if (!singleInput.trim()) return;
    const userMsg = singleInput;
    setSingleMessages(prev => [...prev, { role: "customer", text: userMsg, time: "Now" }]);
    setSingleInput("");
    setSingleRunning(true);

    setTimeout(() => {
      const lowerInput = userMsg.toLowerCase();
      let resp;
      if (lowerInput.includes("where") || lowerInput.includes("track") || lowerInput.includes("shipping")) {
        resp = { text: "I found your order! It's currently in transit with FedEx, tracking number FX-9876543. Expected delivery is in 2 business days.", action: "get_order_status → send_tracking_link", reasoning: "The customer is asking about their order status. I looked up the order and found it's in transit with FedEx. I'll provide the tracking number and expected delivery date." };
      } else if (lowerInput.includes("cancel")) {
        resp = { text: "I've processed the cancellation for your order. A full refund has been initiated and you should see it within 3-5 business days.", action: "get_order_status → cancel_order → process_refund", reasoning: "The customer wants to cancel their order. I checked that it hasn't shipped yet, so cancellation is possible. I'll process both the cancellation and automatic refund." };
      } else if (lowerInput.includes("damage") || lowerInput.includes("refund") || lowerInput.includes("broken")) {
        resp = { text: "I'm sorry about the damaged item. Your order is covered by Seel Protection. I've initiated a full refund to your original payment method.", action: "get_order_status → check_protection → process_refund", reasoning: "The customer reports a damaged item. I checked and the order has active Seel Protection within the claim window. Per policy, I can auto-approve a full refund for damaged items." };
      } else if (lowerInput.includes("address") || lowerInput.includes("change")) {
        resp = { text: "I've updated your shipping address. Since the order hasn't shipped yet, the new address will be used for delivery.", action: "get_order_status → update_shipping_address", reasoning: "The customer wants to change their shipping address. I verified the order is still in processing (not shipped), so the address can be updated safely." };
      } else {
        resp = { text: "I understand your concern. Let me look into that for you right away. I've checked your account and I can help resolve this.", action: "get_order_status", reasoning: "General inquiry detected. I'll retrieve the customer's context and provide a helpful response while asking for more details if needed." };
      }
      setSingleMessages(prev => [...prev, { role: "agent", text: resp.text, time: "Now", action: resp.action, reasoning: resp.reasoning }]);
      setSingleRunning(false);
    }, 1200);
  };

  const handleBatchRun = () => {
    setBatchRunning(true);
    setBatchResults([]);
    const mockResults = sampleBatchCases.map((input, i) => {
      const intents = ["Order Tracking", "Order Cancellation", "Seel Protection", "Order Changes", "Return Inquiry", "General Inquiry", "Returns & Exchanges", "Order Tracking"];
      const results = ["Resolved", "Resolved", "Resolved", "Resolved", "Escalated", "Resolved", "Resolved", "Resolved"];
      const statuses: ("pass" | "fail" | "warn")[] = ["pass", "pass", "pass", "pass", "warn", "pass", "pass", "pass"];
      const responses = ["Your order is in transit with FedEx. ETA: 2 days.", "Order cancelled. Full refund of $89 initiated.", "Seel Protection claim approved. Refund of $45.99 processed.", "Shipping address updated successfully.", "Escalated to Tier 2 — refund SLA exceeded.", "Our return policy allows returns within 30 days.", "Exchange initiated. New item will ship within 2 days.", "Order shows delivered. Investigating with carrier."];
      const times = ["0.8s", "1.2s", "1.4s", "0.9s", "2.1s", "0.6s", "1.1s", "1.5s"];
      return { id: i + 1, input, intent: intents[i], result: results[i], response: responses[i], time: times[i], status: statuses[i] };
    });
    mockResults.forEach((result, i) => {
      setTimeout(() => {
        setBatchResults(prev => [...prev, result]);
        if (i === mockResults.length - 1) setBatchRunning(false);
      }, 300 * (i + 1));
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button variant={mode === "single" ? "default" : "outline"} size="sm" className="text-xs gap-1 h-7" onClick={() => setMode("single")}>
          <MessageSquare className="w-3 h-3" /> Single Test
        </Button>
        <Button variant={mode === "batch" ? "default" : "outline"} size="sm" className="text-xs gap-1 h-7" onClick={() => setMode("batch")}>
          <Zap className="w-3 h-3" /> Batch Test
        </Button>
      </div>

      {mode === "single" ? (
        <Card>
          <CardContent className="p-0">
            <div className="h-[320px] flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {singleMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <Bot className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">Type a customer message to test how {agentName} responds</p>
                    <div className="flex flex-wrap gap-1.5 mt-3 max-w-[400px] justify-center">
                      {["Where is my order #1234?", "I want a refund", "Cancel my order"].map((q) => (
                        <button key={q} onClick={() => setSingleInput(q)} className="text-[10px] px-2.5 py-1 rounded-full border border-border hover:bg-muted/50 text-muted-foreground transition-colors">{q}</button>
                      ))}
                    </div>
                  </div>
                )}
                {singleMessages.map((msg, i) => (
                  <div key={i} className={cn("flex", msg.role === "customer" ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[80%] rounded-xl px-3 py-2", msg.role === "customer" ? "bg-muted" : "bg-primary/10 border border-primary/15")}>
                      <p className="text-[10px] font-medium text-muted-foreground mb-0.5">{msg.role === "customer" ? "Test Customer" : agentName}</p>
                      {msg.action && (
                        <div className="flex items-center gap-1 mb-1">
                          <Badge variant="secondary" className="text-[8px] gap-0.5 font-mono px-1.5 py-0"><Zap className="w-2 h-2" />{msg.action}</Badge>
                        </div>
                      )}
                      <p className="text-xs leading-relaxed">{msg.text}</p>
                      {msg.reasoning && (
                        <div className="mt-2 pt-2 border-t border-primary/10">
                          <p className="text-[9px] font-medium text-muted-foreground flex items-center gap-1"><Eye className="w-2.5 h-2.5" /> Agent Thinking</p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">{msg.reasoning}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {singleRunning && (
                  <div className="flex justify-start">
                    <div className="bg-primary/10 border border-primary/15 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin text-primary" /><span className="text-[10px] text-muted-foreground">Thinking...</span></div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 p-3 border-t">
                <Input value={singleInput} onChange={e => setSingleInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSingleSend()} placeholder="Type as a customer..." className="text-xs h-8" disabled={singleRunning} />
                <Button size="sm" onClick={handleSingleSend} className="h-8 px-3" disabled={singleRunning || !singleInput.trim()}><Send className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold">Batch Test Suite</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Run {sampleBatchCases.length} predefined test cases against {agentName}</p>
              </div>
              <Button size="sm" className="text-xs gap-1 h-7" onClick={handleBatchRun} disabled={batchRunning}>
                {batchRunning ? <><Loader2 className="w-3 h-3 animate-spin" /> Running...</> : <><Play className="w-3 h-3" /> Run All</>}
              </Button>
            </div>

            {batchResults.length > 0 && (
              <div className="mb-3 flex items-center gap-3">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary" /><span className="text-[10px] font-medium">{batchResults.filter(r => r.status === "pass").length} Passed</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-[10px] font-medium">{batchResults.filter(r => r.status === "warn").length} Warning</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-400" /><span className="text-[10px] font-medium">{batchResults.filter(r => r.status === "fail").length} Failed</span></div>
                <span className="text-[10px] text-muted-foreground ml-auto">{batchResults.length}/{sampleBatchCases.length} completed</span>
              </div>
            )}

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/30 border-b">
                    <th className="text-[10px] font-semibold text-muted-foreground text-left px-3 py-2 w-8">#</th>
                    <th className="text-[10px] font-semibold text-muted-foreground text-left px-3 py-2">Input</th>
                    <th className="text-[10px] font-semibold text-muted-foreground text-left px-3 py-2 w-[100px]">Intent</th>
                    <th className="text-[10px] font-semibold text-muted-foreground text-left px-3 py-2 w-[80px]">Result</th>
                    <th className="text-[10px] font-semibold text-muted-foreground text-right px-3 py-2 w-[50px]">Time</th>
                    <th className="text-[10px] font-semibold text-muted-foreground text-center px-3 py-2 w-[50px]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleBatchCases.map((testCase, i) => {
                    const result = batchResults.find(r => r.id === i + 1);
                    return (
                      <tr key={i} className={cn("border-b last:border-b-0 transition-colors", result ? "bg-card" : "bg-muted/10")}>
                        <td className="text-[10px] text-muted-foreground px-3 py-2">{i + 1}</td>
                        <td className="px-3 py-2">
                          <p className="text-[11px] truncate max-w-[250px]">{testCase}</p>
                          {result && <p className="text-[9px] text-muted-foreground truncate max-w-[250px] mt-0.5">{result.response}</p>}
                        </td>
                        <td className="px-3 py-2">{result ? <Badge variant="secondary" className="text-[8px]">{result.intent}</Badge> : <span className="text-[10px] text-muted-foreground">—</span>}</td>
                        <td className="px-3 py-2">{result ? <span className="text-[10px]">{result.result}</span> : <span className="text-[10px] text-muted-foreground">—</span>}</td>
                        <td className="text-right px-3 py-2">{result ? <span className="text-[10px] text-muted-foreground">{result.time}</span> : <span className="text-[10px] text-muted-foreground">—</span>}</td>
                        <td className="text-center px-3 py-2">
                          {result ? (
                            <div className={cn("w-4 h-4 rounded-full mx-auto flex items-center justify-center", result.status === "pass" ? "bg-primary/10" : result.status === "warn" ? "bg-amber-50" : "bg-red-50")}>
                              <div className={cn("w-1.5 h-1.5 rounded-full", result.status === "pass" ? "bg-primary" : result.status === "warn" ? "bg-amber-400" : "bg-red-400")} />
                            </div>
                          ) : <div className="w-4 h-4 rounded-full mx-auto bg-muted/50" />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ── Shared small components ── */
function Metric({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <Card><CardContent className="p-2.5">
      <p className="text-[9px] text-muted-foreground">{label}</p>
      <div className="flex items-end justify-between mt-0.5">
        <p className="text-lg font-bold leading-none">{value}</p>
        <span className="text-[9px] text-primary font-medium">{trend}</span>
      </div>
    </CardContent></Card>
  );
}
