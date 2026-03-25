/**
 * Agents: Team management page
 * - Agent list with 1:1 Channel binding
 * - "Hire Agent" links to /agents/new (independent page, not dialog)
 * Entity: Agent 1:1 Channel, references global Knowledge, uses global Skills
 */
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Bot, Plus, MessageCircle, Mail, Instagram, Play,
  CheckCircle2, BarChart3, Sparkles, ArrowUpRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ── Agents data ── */
const agents = [
  {
    id: "rc-chat", name: "RC Live Chat Agent", channelLabel: "Live Chat", channelType: "chat",
    provider: "RC Widget", status: "active" as const, mode: "Production" as const,
    ticketsToday: 847, csat: 4.6, resolution: 91.2, avgResponse: "1.1s",
    skills: ["Refund Processing", "WISMO", "Order Changes"],
  },
];

function ChannelIcon({ type, className }: { type: string; className?: string }) {
  if (type === "email") return <Mail className={className} />;
  if (type === "social") return <Instagram className={className} />;
  return <MessageCircle className={className} />;
}

const containerV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemV = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function Agents() {
  return (
    <motion.div variants={containerV} initial="hidden" animate="visible" className="p-6 space-y-6">
      {/* Header */}
      <motion.div variants={itemV} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your AI support team. Each agent is deployed to one channel.</p>
        </div>
        <Link href="/agents/new">
          <Button className="gap-2 bg-teal-600 hover:bg-teal-700"><Plus className="w-4 h-4" /> Hire Agent</Button>
        </Link>
      </motion.div>

      {/* Summary Stats */}
      <motion.div variants={itemV} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat icon={<Bot className="w-4 h-4" />} label="Total Agents" value={String(agents.length)} />
        <MiniStat icon={<Play className="w-4 h-4" />} label="In Production" value={String(agents.filter(a => a.mode === "Production").length)} />
        <MiniStat icon={<BarChart3 className="w-4 h-4" />} label="Avg Resolution" value={`${(agents.reduce((s, a) => s + a.resolution, 0) / agents.length).toFixed(1)}%`} />
        <MiniStat icon={<CheckCircle2 className="w-4 h-4" />} label="Avg CSAT" value={`${(agents.reduce((s, a) => s + a.csat, 0) / agents.length).toFixed(1)}`} />
      </motion.div>

      {/* Guidance card */}
      {agents.length <= 1 && (
        <motion.div variants={itemV}>
          <Card className="shadow-sm border-blue-200/60 bg-blue-50/30">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Your team has {agents.length} agent</p>
                <p className="text-xs text-muted-foreground mt-0.5">Hire more agents to cover Email, Social Media, and other channels. Each agent specializes in one channel.</p>
              </div>
              <Link href="/agents/new">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs gap-1 shrink-0"><Plus className="w-3 h-3" /> Hire Agent</Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Agent Cards */}
      <motion.div variants={itemV} className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <Link key={agent.id} href={`/agents/${agent.id}`}>
            <Card className="shadow-sm hover:shadow-md transition-all hover:border-teal-200 group h-full">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center">
                        <Bot className="w-6 h-6 text-teal-600" />
                      </div>
                      <span className={cn("absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card", agent.status === "active" ? "bg-teal-500" : "bg-gray-300")} />
                    </div>
                    <div>
                      <p className="text-sm font-bold group-hover:text-teal-700 transition-colors">{agent.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <ChannelIcon type={agent.channelType} className={cn("w-3 h-3", agent.channelType === "email" ? "text-blue-500" : agent.channelType === "social" ? "text-pink-500" : "text-teal-500")} />
                        <span className="text-xs text-muted-foreground">{agent.channelLabel} · {agent.provider}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("text-[9px]", agent.mode === "Production" ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-amber-50 text-amber-700 border-amber-200")}>{agent.mode}</Badge>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-teal-500 transition-colors" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <MetricCell label="Today" value={String(agent.ticketsToday)} />
                  <MetricCell label="CSAT" value={String(agent.csat)} />
                  <MetricCell label="Resolution" value={`${agent.resolution}%`} />
                  <MetricCell label="Resp" value={agent.avgResponse} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {agent.skills.map(s => <Badge key={s} variant="secondary" className="text-[9px] font-normal">{s}</Badge>)}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {/* Add Agent Card */}
        <Link href="/agents/new">
          <Card className="shadow-sm border-dashed border-2 border-muted-foreground/20 hover:border-teal-300 hover:bg-teal-50/20 transition-all cursor-pointer group h-full">
            <CardContent className="p-5 flex flex-col items-center justify-center h-full min-h-[200px] text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3 group-hover:bg-teal-100 transition-colors">
                <Plus className="w-6 h-6 text-muted-foreground group-hover:text-teal-600 transition-colors" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground group-hover:text-teal-700 transition-colors">Hire New Agent</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Deploy to Email, Social, or Chat</p>
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    </motion.div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">{icon}</div>
        <div>
          <p className="text-lg font-bold leading-none">{value}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-2 rounded-lg bg-muted/30">
      <p className="text-sm font-bold leading-none">{value}</p>
      <p className="text-[9px] text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
