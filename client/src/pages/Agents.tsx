/**
 * Agents — Default tab for AI Support module
 * Top: Overview metrics + What's Next checklist
 * Bottom: Agent cards grid
 * No Cold Start — always shows agent list
 */
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Bot, Plus, MessageCircle, Mail, Instagram,
  ArrowRight, Users, Gauge, SmilePlus, CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

function ChannelIcon({ type, className }: { type: string; className?: string }) {
  if (type === "email") return <Mail className={className} />;
  if (type === "social") return <Instagram className={className} />;
  return <MessageCircle className={className} />;
}

const cV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const iV = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

export default function Agents() {
  const liveCount = agents.filter(a => a.status === "live").length;
  const liveAgents = agents.filter(a => a.status === "live");

  return (
    <motion.div variants={cV} initial="hidden" animate="visible" className="p-6 max-w-[960px] space-y-6">
      {/* ── Overview Metrics ── */}
      <motion.div variants={iV}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Active Agents */}
          <Card className="hover:shadow-md hover:border-primary/20 transition-all cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground font-medium">Active Agents</p>
              </div>
              <p className="text-2xl font-semibold leading-none mb-2">{liveCount}</p>
              <div className="space-y-1">
                {liveAgents.map(a => (
                  <div key={a.id} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">{a.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <MetricCard icon={Users} label="Sessions" value="847" sub="Last 7 days" change="+8%" />
          <MetricCard icon={Gauge} label="Service Scope" value="78%" sub="AI handled vs total" change="+5%" />
          <MetricCard icon={SmilePlus} label="Sentiment" value="+0.3" sub="CSAT change (30d)" />
        </div>

        {/* Performance link */}
        <div className="flex justify-end mt-2">
          <Link href="/performance/analytics">
            <span className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 cursor-pointer transition-colors">
              View Agent Performance <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        </div>
      </motion.div>

      {/* ── What's Next ── */}
      <motion.div variants={iV} className="space-y-4">
        {/* Optimize Agent */}
        <div>
          <p className="text-sm font-semibold mb-2">Optimize Agent</p>
          <Card>
            <CardContent className="p-5 space-y-0.5">
              <CheckItem
                label="Sync all orders"
                desc="Give your agent full order history for accurate responses"
                href="/seel/integrations"
                status="Partial sync"
              />
              <CheckItem
                label="Enrich knowledge base"
                desc="More articles help your agent resolve a wider range of inquiries"
                href="/playbook"
                status="3 articles"
              />
              <CheckItem
                label="Activate skills"
                desc="Enable capabilities like returns, exchanges, and tracking"
                href="/playbook/skills"
                status="2 skills enabled"
              />
            </CardContent>
          </Card>
        </div>

        {/* Scale to more channels */}
        <div>
          <p className="text-sm font-semibold mb-2">Scale to more channels</p>
          <Card>
            <CardContent className="p-5">
              <Link href="/agents/new">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                  <div className="w-8 h-8 rounded-lg border-2 border-dashed border-muted-foreground/15 flex items-center justify-center shrink-0 group-hover:border-primary/30 transition-colors">
                    <Plus className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">Hire another agent</p>
                    <p className="text-xs text-muted-foreground">Expand to Email, Social, or additional Live Chat channels</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/20 group-hover:text-primary/60 transition-colors shrink-0" />
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* ── Agent List ── */}
      <motion.div variants={iV}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Your Agents</p>
          <Link href="/agents/new">
            <Button size="sm" className="gap-1.5 text-xs h-8">
              <Plus className="w-3.5 h-3.5" /> Hire Agent
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {agents.map((agent) => {
            const sc = statusCfg[agent.status];
            const isLive = agent.status === "live";
            const channelColors: Record<string, string> = {
              chat: "text-primary bg-primary/10",
              email: "text-blue-600 bg-blue-50",
              social: "text-pink-600 bg-pink-50",
            };
            const cc = channelColors[agent.channelType] || channelColors.chat;

            return (
              <Link key={agent.id} href={`/agents/${agent.id}`}>
                <Card className="shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group h-full">
                  <CardContent className="p-4 flex flex-col h-full">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", cc)}>
                        <ChannelIcon type={agent.channelType} className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold group-hover:text-primary transition-colors truncate">{agent.name}</p>
                        <p className="text-[11px] text-muted-foreground">{agent.channel} · {agent.integration}</p>
                      </div>
                      <Badge variant="outline" className={cn("text-[9px] shrink-0 font-medium", sc.color)}>{sc.label}</Badge>
                    </div>

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
            );
          })}

          {/* Hire New Agent Card */}
          <Link href="/agents/new">
            <Card className="shadow-sm border-dashed hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group h-full">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full min-h-[140px]">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-2 group-hover:bg-primary/10 transition-colors">
                  <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">Hire New Agent</p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">Email, Social, or Live Chat</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Shared Components ── */

function MetricCard({ icon: Icon, label, value, sub, change }: {
  icon: React.ElementType; label: string; value: string; sub: string; change?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
        </div>
        <div className="flex items-baseline gap-1.5">
          <p className="text-2xl font-semibold leading-none">{value}</p>
          {change && <span className="text-xs text-primary font-medium">{change}</span>}
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5">{sub}</p>
      </CardContent>
    </Card>
  );
}

function CheckItem({ done, label, desc, status, href }: {
  done?: boolean; label: string; desc?: string; status?: string; href?: string;
}) {
  const inner = (
    <div className={cn(
      "flex items-start gap-3 p-2.5 rounded-lg transition-colors",
      !done && href ? "hover:bg-muted/50 cursor-pointer group" : ""
    )}>
      <div className={cn(
        "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
        done ? "bg-primary" : "border-2 border-muted-foreground/20"
      )}>
        {done && <CheckCircle2 className="w-3 h-3 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <p className={cn(
            "text-sm leading-tight",
            done ? "text-muted-foreground" : "font-medium group-hover:text-primary transition-colors"
          )}>{label}</p>
          {status && <span className="text-[11px] text-muted-foreground leading-tight shrink-0">{status}</span>}
        </div>
        {desc && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>}
      </div>
      {!done && href && <ArrowRight className="w-4 h-4 text-muted-foreground/20 group-hover:text-primary/60 transition-colors shrink-0 mt-0.5" />}
    </div>
  );
  if (!done && href) return <Link href={href}>{inner}</Link>;
  return inner;
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/40 rounded-lg px-2.5 py-1.5 text-center">
      <p className="text-xs font-semibold leading-none">{value}</p>
      <p className="text-[9px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
