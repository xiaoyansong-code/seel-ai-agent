/**
 * Agents V7 — Card-based layout with Cold Start state
 * Each agent is a card showing status, channel, key metrics.
 * Cold Start: prominent CTA to deploy first agent.
 */
import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Bot, Plus, MessageCircle, Mail, Instagram,
  ArrowRight, Settings2, FlaskConical, Circle, Pause,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AgentStatus = "setting-up" | "ready-to-test" | "live" | "paused";

const statusCfg: Record<AgentStatus, { label: string; color: string; dot: string }> = {
  "setting-up": { label: "Setting Up", color: "text-amber-700 bg-amber-50 border-amber-200", dot: "bg-amber-400" },
  "ready-to-test": { label: "Ready to Test", color: "text-blue-700 bg-blue-50 border-blue-200", dot: "bg-blue-400" },
  "live": { label: "Live", color: "text-teal-700 bg-teal-50 border-teal-200", dot: "bg-teal-500" },
  "paused": { label: "Paused", color: "text-gray-600 bg-gray-50 border-gray-200", dot: "bg-gray-400" },
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
    setupSteps: { done: 1, total: 4, next: "Connect Zendesk" },
  },
];

function ChannelIcon({ type, className }: { type: string; className?: string }) {
  if (type === "email") return <Mail className={className} />;
  if (type === "social") return <Instagram className={className} />;
  return <MessageCircle className={className} />;
}

const cV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const iV = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

export default function Agents() {
  const [hasAgents, setHasAgents] = useState(true);
  const liveCount = agents.filter(a => a.status === "live").length;

  return (
    <motion.div variants={cV} initial="hidden" animate="visible" className="p-6 max-w-4xl space-y-4">
      <motion.div variants={iV} className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Agents</h1>
          {hasAgents && <p className="text-sm text-muted-foreground mt-0.5">{agents.length} agents · {liveCount} live</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHasAgents(!hasAgents)}
            className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground border border-dashed border-muted-foreground/15 rounded px-2 py-0.5"
          >
            Demo: {hasAgents ? "Has Agents" : "Cold Start"}
          </button>
          {hasAgents && (
            <Link href="/agents/new">
              <Button size="sm" className="gap-1.5 text-xs bg-teal-600 hover:bg-teal-700">
                <Plus className="w-3.5 h-3.5" /> Hire Agent
              </Button>
            </Link>
          )}
        </div>
      </motion.div>

      {hasAgents ? <AgentCards /> : <ColdStart />}
    </motion.div>
  );
}

/* ── Cold Start ── */
function ColdStart() {
  return (
    <motion.div variants={iV}>
      <Card className="shadow-sm">
        <CardContent className="py-12 px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
            <Bot className="w-7 h-7 text-teal-600" />
          </div>
          <h2 className="text-base font-semibold mb-1.5">Hire your first AI Agent</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
            Deploy an AI agent to a channel and start automating customer support. Choose Email, Live Chat, or Social Messaging.
          </p>
          <Link href="/agents/new">
            <Button className="bg-teal-600 hover:bg-teal-700 gap-2 text-sm px-6">
              <Plus className="w-4 h-4" /> Hire Agent
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ── Agent Cards Grid ── */
function AgentCards() {
  return (
    <motion.div variants={cV} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {agents.map((agent) => {
        const sc = statusCfg[agent.status];
        const isLive = agent.status === "live";
        const channelColors: Record<string, string> = {
          chat: "text-teal-600 bg-teal-50",
          email: "text-blue-600 bg-blue-50",
          social: "text-pink-600 bg-pink-50",
        };
        const cc = channelColors[agent.channelType] || channelColors.chat;

        return (
          <motion.div key={agent.id} variants={iV}>
            <Link href={`/agents/${agent.id}`}>
              <Card className="shadow-sm hover:shadow-md hover:border-teal-200/60 transition-all cursor-pointer group h-full">
                <CardContent className="p-4 flex flex-col h-full">
                  {/* Header: icon + name + status */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", cc)}>
                      <ChannelIcon type={agent.channelType} className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold group-hover:text-teal-700 transition-colors truncate">{agent.name}</p>
                      <p className="text-[11px] text-muted-foreground">{agent.channel} · {agent.integration}</p>
                    </div>
                    <Badge variant="outline" className={cn("text-[9px] shrink-0 font-medium", sc.color)}>{sc.label}</Badge>
                  </div>

                  {/* Body: metrics or setup progress */}
                  {isLive ? (
                    <div className="grid grid-cols-3 gap-2 mt-auto">
                      <MiniMetric label="Sessions" value={String(agent.sessions)} />
                      <MiniMetric label="Resolution" value={`${agent.resolution}%`} />
                      <MiniMetric label="CSAT" value={String(agent.csat)} />
                    </div>
                  ) : agent.setupSteps ? (
                    <div className="mt-auto">
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <span className="text-muted-foreground">{agent.setupSteps.done} of {agent.setupSteps.total} steps</span>
                        <span className="text-amber-600 font-medium">Next: {agent.setupSteps.next}</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${(agent.setupSteps.done / agent.setupSteps.total) * 100}%` }} />
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        );
      })}

      {/* Hire New Agent Card */}
      <motion.div variants={iV}>
        <Link href="/agents/new">
          <Card className="shadow-sm border-dashed hover:border-teal-300 hover:bg-teal-50/20 transition-all cursor-pointer group h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full min-h-[140px]">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-2 group-hover:bg-teal-100 transition-colors">
                <Plus className="w-5 h-5 text-muted-foreground group-hover:text-teal-600 transition-colors" />
              </div>
              <p className="text-sm font-medium text-muted-foreground group-hover:text-teal-700 transition-colors">Hire New Agent</p>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">Email, Social, or Live Chat</p>
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    </motion.div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/40 rounded-lg px-2.5 py-1.5 text-center">
      <p className="text-xs font-semibold leading-none">{value}</p>
      <p className="text-[9px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
