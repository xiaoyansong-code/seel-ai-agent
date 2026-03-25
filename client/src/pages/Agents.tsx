/**
 * Agents — Default tab for AI Support module
 * V3: Messaging & Scale guidance
 * - Page header with context message
 * - Live Agent status banner (confidence builder)
 * - "Expand to more channels" guidance replacing cold "Create New Agent"
 * - Improved UX writing throughout
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Plus, MessageCircle, Mail, Instagram,
  ArrowRight, CheckCircle2, Lightbulb,
  Bot, Loader2, AlertCircle, ArrowUpRight,
  Zap, TrendingUp, Clock, Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type AgentStatus = "setting-up" | "ready-to-test" | "live" | "paused";

const statusCfg: Record<AgentStatus, { label: string; color: string }> = {
  "setting-up": { label: "Setting Up", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "ready-to-test": { label: "Ready to Test", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "live": { label: "Live", color: "text-primary bg-primary/10 border-primary/20" },
  "paused": { label: "Paused", color: "text-gray-600 bg-gray-50 border-gray-200" },
};

const agents = [
  {
    id: "rc-chat", name: "RC Live Chat Agent", channel: "Live Chat", channelType: "chat",
    integration: "RC Widget", status: "live" as AgentStatus,
    sessions: 847, csat: 4.6, resolution: 91.2,
    setupSteps: null as null | { done: number; total: number; next: string },
  },
  {
    id: "email-agent", name: "Email Support Agent", channel: "Email", channelType: "email",
    integration: "Zendesk Email", status: "setting-up" as AgentStatus,
    sessions: 0, csat: 0, resolution: 0,
    setupSteps: { done: 1, total: 3, next: "Connect Zendesk" },
  },
];

const opportunities = [
  {
    id: "sync-orders",
    label: "Sync all orders",
    desc: "Give your agent full order history for accurate responses",
    status: "Partial sync",
    statusColor: "text-amber-700 bg-amber-50 border-amber-200",
    href: "/seel/integrations",
    done: false,
  },
  {
    id: "enrich-kb",
    label: "Enrich knowledge base",
    desc: "More articles help your agent resolve a wider range of inquiries",
    status: "3 articles",
    statusColor: "text-blue-700 bg-blue-50 border-blue-200",
    href: "/playbook",
    done: false,
  },
  {
    id: "activate-skills",
    label: "Activate skills",
    desc: "Enable capabilities like returns, exchanges, and tracking",
    status: "2 of 6 enabled",
    statusColor: "text-amber-700 bg-amber-50 border-amber-200",
    href: "/playbook/skills",
    done: false,
  },
];

/* ── Channel selection for Create Agent dialog ── */
type ChannelType = "email" | "live-chat" | "social-messaging";

const channels: { id: ChannelType; label: string; icon: typeof Mail; desc: string; integration: string; comingSoonAlt?: string }[] = [
  { id: "email", label: "Email", icon: Mail, desc: "Email tickets via ticketing system", integration: "Zendesk Email", comingSoonAlt: "Gorgias Email" },
  { id: "live-chat", label: "Live Chat", icon: MessageCircle, desc: "Real-time chat on your site", integration: "RC Widget" },
  { id: "social-messaging", label: "Social Messaging", icon: Instagram, desc: "Instagram, Facebook, WhatsApp", integration: "Zendesk Messaging" },
];

const defaultNames: Record<ChannelType, string> = {
  email: "Email Support Agent",
  "live-chat": "Live Chat Agent",
  "social-messaging": "Social Media Agent",
};

/* ── Channels not yet covered by any agent ── */
const coveredChannels = new Set(agents.map(a => a.channelType));
const expandableChannels = [
  { id: "email" as ChannelType, label: "Email", icon: Mail, desc: "Resolve tickets from Zendesk, Gorgias, or Freshdesk", color: "bg-blue-50 text-blue-600", covered: coveredChannels.has("email") },
  { id: "live-chat" as ChannelType, label: "Live Chat", icon: MessageCircle, desc: "Real-time support on your website", color: "bg-primary/10 text-primary", covered: coveredChannels.has("chat") },
  { id: "social-messaging" as ChannelType, label: "Social", icon: Instagram, desc: "Instagram, Facebook, WhatsApp", color: "bg-pink-50 text-pink-600", covered: coveredChannels.has("social") },
];

function ChannelIcon({ type, className }: { type: string; className?: string }) {
  if (type === "email") return <Mail className={className} />;
  if (type === "social") return <Instagram className={className} />;
  return <MessageCircle className={className} />;
}

const cV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const iV = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

export default function Agents() {
  const [, navigate] = useLocation();
  const [createOpen, setCreateOpen] = useState(false);
  const [channel, setChannel] = useState<ChannelType | "">("");
  const [agentName, setAgentName] = useState("");
  const [creating, setCreating] = useState(false);

  const liveAgents = agents.filter(a => a.status === "live");
  const hasLiveAgent = liveAgents.length > 0;

  const handleChannelSelect = (id: ChannelType) => {
    setChannel(id);
    setAgentName(defaultNames[id]);
  };

  const handleCreate = () => {
    if (!agentName.trim() || !channel) return;
    setCreating(true);
    setTimeout(() => {
      toast.success(`${agentName} created — let's set it up`);
      setCreating(false);
      setCreateOpen(false);
      navigate("/agents/email-agent");
    }, 800);
  };

  const handleOpenCreate = (preselect?: ChannelType) => {
    if (preselect) {
      setChannel(preselect);
      setAgentName(defaultNames[preselect]);
    } else {
      setChannel("");
      setAgentName("");
    }
    setCreating(false);
    setCreateOpen(true);
  };

  return (
    <motion.div variants={cV} initial="hidden" animate="visible" className="p-6 max-w-[960px] space-y-6">

      {/* ── Page Header ── */}
      <motion.div variants={iV}>
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">AI Agents</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Manage your AI support agents across channels. Each agent handles customer conversations autonomously based on your configured skills and guardrails.
          </p>
        </div>
      </motion.div>

      {/* ── Live Agent Status Banner ── */}
      {hasLiveAgent && (
        <motion.div variants={iV}>
          <div className="rounded-xl bg-primary/[0.04] border border-primary/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium">
                  Your AI agent handled <span className="text-primary font-semibold">847 conversations</span> this week
                </p>
                <div className="flex items-center gap-4 mt-0.5">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-primary" /> 91.2% resolution rate
                  </span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground" /> 1.1s avg response
                  </span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> 4.6 CSAT
                  </span>
                </div>
              </div>
              <Link href="/performance/overview">
                <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary hover:text-primary">
                  View Performance <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Agent Cards ── */}
      <motion.div variants={iV}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Your Agents</h2>
          <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 text-muted-foreground" onClick={() => handleOpenCreate()}>
            <Plus className="w-3 h-3" /> New Agent
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {agents.map((agent) => {
            const sc = statusCfg[agent.status];
            const isLive = agent.status === "live";
            const isSettingUp = agent.status === "setting-up";
            const channelColors: Record<string, string> = {
              chat: "text-primary bg-primary/10",
              email: "text-blue-600 bg-blue-50",
              social: "text-pink-600 bg-pink-50",
            };
            const cc = channelColors[agent.channelType] || channelColors.chat;

            return (
              <motion.div key={agent.id} variants={iV}>
                <Link href={`/agents/${agent.id}`}>
                  <Card className="shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group h-full">
                    <CardContent className="p-4 flex flex-col h-full">
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", cc)}>
                          <ChannelIcon type={agent.channelType} className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold group-hover:text-primary transition-colors truncate">{agent.name}</p>
                          <p className="text-[11px] text-muted-foreground">{agent.channel} · {agent.integration}</p>
                        </div>
                        <Badge variant="outline" className={cn("text-[9px] shrink-0 font-medium", sc.color)}>{sc.label}</Badge>
                      </div>

                      {/* Live agent: metrics */}
                      {isLive && (
                        <div className="grid grid-cols-3 gap-2 mt-auto">
                          {[
                            { value: agent.sessions, label: "Sessions (7d)" },
                            { value: `${agent.resolution}%`, label: "Resolution" },
                            { value: agent.csat, label: "CSAT" },
                          ].map((m, i) => (
                            <div key={i} className="bg-primary/[0.04] rounded-lg px-2.5 py-2 text-center">
                              <p className="text-base font-bold leading-none">{m.value}</p>
                              <p className="text-[9px] text-muted-foreground mt-1">{m.label}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Setting up: next step CTA */}
                      {isSettingUp && agent.setupSteps && (
                        <div className="mt-auto space-y-2.5">
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50/70 border border-amber-100">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-medium text-amber-800">Next: {agent.setupSteps.next}</p>
                              <p className="text-[10px] text-amber-600/80">Step {agent.setupSteps.done} of {agent.setupSteps.total} completed</p>
                            </div>
                            <ArrowUpRight className="w-3.5 h-3.5 text-amber-500 shrink-0 group-hover:text-amber-700 transition-colors" />
                          </div>
                          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${(agent.setupSteps.done / agent.setupSteps.total) * 100}%` }} />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Expand to More Channels ── */}
      {expandableChannels.some(ch => !ch.covered) && (
        <motion.div variants={iV}>
          <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <h2 className="text-sm font-semibold">Expand to more channels</h2>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">
              Your AI agent's skills and knowledge carry over — set up a new channel in under 5 minutes.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {expandableChannels.filter(ch => !ch.covered).map(ch => (
                <button
                  key={ch.id}
                  onClick={() => handleOpenCreate(ch.id)}
                  className="text-left p-3 rounded-lg border border-border/60 bg-card hover:border-primary/30 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={cn("w-7 h-7 rounded-md flex items-center justify-center", ch.color)}>
                      <ch.icon className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xs font-medium group-hover:text-primary transition-colors">{ch.label}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{ch.desc}</p>
                  <p className="text-[10px] text-primary mt-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    Set up now <ArrowRight className="w-2.5 h-2.5" />
                  </p>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Opportunities ── */}
      <motion.div variants={iV}>
        <div className="rounded-xl bg-muted/40 border border-border/60 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <p className="text-sm font-semibold">Opportunities</p>
          </div>
          <div className="space-y-0.5">
            {opportunities.map((item) => (
              <Link key={item.id} href={item.href}>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background/80 transition-colors cursor-pointer group">
                  <div className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                    item.done ? "bg-primary" : "border-[1.5px] border-muted-foreground/20"
                  )}>
                    {item.done && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        "text-[13px] leading-tight",
                        item.done ? "text-muted-foreground line-through" : "text-foreground font-medium"
                      )}>
                        {item.label}
                      </p>
                      <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 font-medium", item.statusColor)}>
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/15 group-hover:text-primary/50 transition-colors shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Create Agent Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>Create New Agent</DialogTitle>
            <DialogDescription>Choose a channel and name your agent. Your existing skills and knowledge base will be available automatically.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Channel Selection */}
            <div>
              <label className="text-sm font-medium mb-2.5 block">Channel</label>
              <div className="grid grid-cols-3 gap-2.5">
                {channels.map(ch => {
                  const selected = channel === ch.id;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => handleChannelSelect(ch.id)}
                      className={cn(
                        "text-left p-3.5 rounded-lg border transition-all",
                        selected ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-muted-foreground/30"
                      )}
                    >
                      <ch.icon className={cn("w-4.5 h-4.5 mb-1.5", selected ? "text-primary" : "text-muted-foreground")} />
                      <p className="text-[13px] font-medium leading-tight">{ch.label}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{ch.desc}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1.5">{ch.integration}</p>
                      {ch.comingSoonAlt && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[9px] text-muted-foreground/50">{ch.comingSoonAlt}</span>
                          <Badge variant="secondary" className="text-[7px] px-1 py-0">Soon</Badge>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Agent Name */}
            {channel && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
                <label className="text-sm font-medium mb-1.5 block">Agent Name</label>
                <Input
                  value={agentName}
                  onChange={e => setAgentName(e.target.value)}
                  placeholder={channel ? defaultNames[channel] : "Agent name"}
                  className="h-9 text-sm"
                />
                <p className="text-[11px] text-muted-foreground mt-1">You can change this later in agent settings.</p>
              </motion.div>
            )}

            {/* Create Button */}
            {channel && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15, delay: 0.05 }}>
                <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground">
                    Agent will start in <strong>Setting Up</strong> mode. Takes about 5 minutes.
                  </p>
                  <Button onClick={handleCreate} disabled={!agentName.trim() || creating} className="gap-1.5">
                    {creating ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating...</>
                    ) : (
                      <><Bot className="w-3.5 h-3.5" /> Create Agent</>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
