/**
 * Dashboard: Two switchable views — "By Agent" vs "By Task"
 * Tone: "Your AI team is already creating value — here's how to level up"
 * Existing state: RC Live Chat Agent is live and performing
 */
import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Bot, BookOpen, Zap, Shield, Plus, CheckCircle2, ArrowRight,
  TrendingUp, TrendingDown, Clock, MessageSquare, MessageCircle,
  Mail, Instagram, Sparkles, Target, Users, BarChart3, Star,
  ArrowUpRight, Layers, ListChecks,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from "recharts";
import { cn } from "@/lib/utils";

/* ── Data ── */
const rcAgent = {
  id: "rc-chat", name: "RC Live Chat Agent", channel: "Live Chat",
  status: "active", ticketsToday: 847, csat: 4.6, resolutionRate: 91.2,
  avgResponse: "1.1s", ticketsWeek: 5284, savedHours: 132,
};

const ticketData = [
  { date: "Mon", resolved: 145, escalated: 12 }, { date: "Tue", resolved: 168, escalated: 8 },
  { date: "Wed", resolved: 152, escalated: 15 }, { date: "Thu", resolved: 189, escalated: 11 },
  { date: "Fri", resolved: 201, escalated: 9 }, { date: "Sat", resolved: 98, escalated: 5 },
  { date: "Sun", resolved: 87, escalated: 3 },
];
const csatData = [
  { hour: "00:00", score: 4.2 }, { hour: "04:00", score: 4.5 }, { hour: "08:00", score: 4.1 },
  { hour: "12:00", score: 4.6 }, { hour: "16:00", score: 4.3 }, { hour: "20:00", score: 4.7 }, { hour: "Now", score: 4.5 },
];

const improveActions = [
  { id: "knowledge", title: "Enrich Knowledge Base", desc: "Add more policies and FAQs to improve answer accuracy", icon: BookOpen, color: "text-teal-600", bg: "bg-teal-50", href: "/knowledge", impact: "High", effort: "Low" },
  { id: "skills", title: "Activate More Skills", desc: "Enable skills like Order Changes and Cancellation handling", icon: Target, color: "text-violet-600", bg: "bg-violet-50", href: "/knowledge", impact: "High", effort: "Medium" },
  { id: "conversations", title: "Review Conversations", desc: "QA recent conversations and coach your agent", icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50", href: "/conversations", impact: "Medium", effort: "Low" },
  { id: "guardrails", title: "Tune Guardrails", desc: "Adjust escalation rules and safety thresholds", icon: Shield, color: "text-red-600", bg: "bg-red-50", href: "/settings", impact: "Medium", effort: "Low" },
];

const scaleActions = [
  { id: "email", title: "Hire Email Agent", desc: "Handle email tickets from Zendesk or Gorgias", icon: Mail, color: "text-blue-500", bg: "bg-blue-50", channel: "Email" },
  { id: "social", title: "Hire Social Agent", desc: "Manage DMs from Instagram, Facebook, Twitter", icon: Instagram, color: "text-pink-500", bg: "bg-pink-50", channel: "Social Media" },
];

const emailSteps = [
  { label: "Connect ticketing system", done: true },
  { label: "Choose Email channel", done: false },
  { label: "Name your agent", done: false },
  { label: "Deploy (Shadow or Production)", done: false },
];

const containerV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemV = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function Dashboard() {
  const [view, setView] = useState<"agent" | "task">("agent");

  return (
    <motion.div variants={containerV} initial="hidden" animate="visible" className="p-6 space-y-6">
      {/* ── Hero: Your AI Team is Live ── */}
      <motion.div variants={itemV}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Your AI team is live and creating value. Here's the overview.</p>
          </div>
          <Link href="/agents/new">
            <Button className="gap-2 bg-teal-600 hover:bg-teal-700 text-xs h-8">
              <Plus className="w-3.5 h-3.5" /> Hire Agent
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* ── Impact Summary ── */}
      <motion.div variants={itemV} className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="shadow-sm lg:col-span-1 border-teal-200/60 bg-gradient-to-br from-teal-50/60 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-teal-600 font-medium">Active Agents</p>
                <p className="text-xl font-bold text-teal-700">1</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[9px] bg-teal-50 text-teal-700 border-teal-200 gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" /> RC Live Chat
            </Badge>
          </CardContent>
        </Card>
        {[
          { label: "Conversations Today", value: "847", trend: "+12%", up: true, icon: MessageSquare },
          { label: "Resolution Rate", value: "91.2%", trend: "+2.3%", up: true, icon: CheckCircle2 },
          { label: "CSAT Score", value: "4.6/5", trend: "+0.1", up: true, icon: Star },
          { label: "Hours Saved (Week)", value: "132h", trend: "+18h", up: true, icon: Clock },
        ].map((kpi) => (
          <Card key={kpi.label} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1.5">
                <kpi.icon className="w-4 h-4 text-muted-foreground" />
                <span className={cn("flex items-center gap-0.5 text-[10px] font-medium", kpi.up ? "text-teal-600" : "text-red-500")}>
                  {kpi.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{kpi.trend}
                </span>
              </div>
              <p className="text-xl font-bold">{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* ── View Toggle ── */}
      <motion.div variants={itemV} className="flex items-center gap-2">
        <p className="text-sm font-semibold text-muted-foreground mr-2">What's Next</p>
        <div className="flex bg-muted rounded-lg p-0.5">
          <button
            onClick={() => setView("agent")}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              view === "agent" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="w-3.5 h-3.5" /> By Agent
          </button>
          <button
            onClick={() => setView("task")}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              view === "task" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ListChecks className="w-3.5 h-3.5" /> By Task
          </button>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════ */}
      {/* ── VERSION A: By Agent ── */}
      {/* ══════════════════════════════════════════════════ */}
      {view === "agent" && (
        <motion.div key="agent-view" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-6">

          {/* Agent 1: RC Live Chat — Live & Performing */}
          <Card className="shadow-sm border-teal-200/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-teal-600" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card bg-teal-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm font-bold">{rcAgent.name}</CardTitle>
                      <Badge variant="outline" className="text-[9px] bg-teal-50 text-teal-700 border-teal-200">Live</Badge>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <MessageCircle className="w-3 h-3 text-teal-500" />
                      <span className="text-xs text-muted-foreground">{rcAgent.channel} · Production</span>
                    </div>
                  </div>
                </div>
                <Link href={`/agents/${rcAgent.id}`}>
                  <Button variant="outline" size="sm" className="text-xs gap-1 h-7">View Detail <ArrowUpRight className="w-3 h-3" /></Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mini KPIs */}
              <div className="grid grid-cols-4 gap-3">
                <MiniKPI label="Today" value={String(rcAgent.ticketsToday)} sub="conversations" />
                <MiniKPI label="Resolution" value={`${rcAgent.resolutionRate}%`} sub="auto-resolved" />
                <MiniKPI label="CSAT" value={String(rcAgent.csat)} sub="out of 5" />
                <MiniKPI label="Avg Response" value={rcAgent.avgResponse} sub="first reply" />
              </div>

              {/* Improve this Agent */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Improve this Agent
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {improveActions.map((action) => (
                    <Link key={action.id} href={action.href}>
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-teal-200 hover:bg-teal-50/20 transition-all group cursor-pointer">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", action.bg)}>
                          <action.icon className={cn("w-4 h-4", action.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold group-hover:text-teal-700 transition-colors">{action.title}</p>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{action.desc}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-teal-500 transition-colors shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scale: Hire New Agents */}
          <Card className="shadow-sm border-dashed border-blue-200/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold">Scale to New Channels</CardTitle>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Expand your AI team to handle Email, Social Media, and more.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scaleActions.map((sa) => (
                  <div key={sa.id} className="p-4 rounded-xl border border-border hover:border-blue-200 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", sa.bg)}>
                        <sa.icon className={cn("w-5 h-5", sa.color)} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{sa.title}</p>
                        <p className="text-[10px] text-muted-foreground">{sa.desc}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5 mb-3">
                      {emailSteps.map((step, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className={cn("w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                            step.done ? "bg-teal-500" : "border border-muted-foreground/30"
                          )}>
                            {step.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <span className={cn("text-[11px]", step.done ? "text-muted-foreground line-through" : "text-foreground")}>{step.label}</span>
                        </div>
                      ))}
                    </div>
                    <Link href="/agents/new">
                      <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-xs gap-1">
                        <Plus className="w-3 h-3" /> Start Setup <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* ── VERSION B: By Task ── */}
      {/* ══════════════════════════════════════════════════ */}
      {view === "task" && (
        <motion.div key="task-view" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Left: Improve */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Improve</CardTitle>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Make your existing agents smarter and more reliable</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {improveActions.map((action) => (
                  <Link key={action.id} href={action.href}>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-amber-200 hover:bg-amber-50/20 transition-all group cursor-pointer">
                      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", action.bg)}>
                        <action.icon className={cn("w-4.5 h-4.5", action.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold group-hover:text-amber-700 transition-colors">{action.title}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{action.desc}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="secondary" className="text-[9px] gap-1">
                            <TrendingUp className="w-2.5 h-2.5" /> Impact: {action.impact}
                          </Badge>
                          <Badge variant="outline" className="text-[9px]">Effort: {action.effort}</Badge>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-amber-500 transition-colors shrink-0" />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Right: Scale */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Scale</CardTitle>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Expand your AI team to cover more channels</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {scaleActions.map((sa) => (
                  <div key={sa.id} className="p-4 rounded-xl border border-border hover:border-blue-200 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", sa.bg)}>
                        <sa.icon className={cn("w-4.5 h-4.5", sa.color)} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{sa.title}</p>
                        <p className="text-[10px] text-muted-foreground">{sa.desc}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5 mb-3">
                      {emailSteps.map((step, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className={cn("w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                            step.done ? "bg-teal-500" : "border border-muted-foreground/30"
                          )}>
                            {step.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <span className={cn("text-[11px]", step.done ? "text-muted-foreground line-through" : "text-foreground")}>{step.label}</span>
                        </div>
                      ))}
                    </div>
                    <Link href="/agents/new">
                      <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-xs gap-1">
                        <Plus className="w-3 h-3" /> Start Setup <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                ))}

                {/* Connect more systems */}
                <Link href="/settings">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-muted-foreground/20 hover:border-blue-200 transition-all group cursor-pointer">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-muted-foreground group-hover:text-blue-700 transition-colors">Connect More Systems</p>
                      <p className="text-[10px] text-muted-foreground">Add Gorgias, Freshdesk, Shopify, or other integrations</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-blue-500 transition-colors shrink-0" />
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* ── Charts (shared) ── */}
      <motion.div variants={itemV} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Conversation Volume (7 Days)</CardTitle>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-teal-500" /> Resolved</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Escalated</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ticketData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.006 80)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="oklch(0.65 0.02 260)" />
                <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.65 0.02 260)" />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid oklch(0.91 0.006 80)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "12px" }} />
                <Bar dataKey="resolved" fill="oklch(0.56 0.11 175)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="escalated" fill="oklch(0.80 0.15 80)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">CSAT Trend (Today)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={csatData}>
                <defs>
                  <linearGradient id="csatG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.56 0.11 175)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="oklch(0.56 0.11 175)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.006 80)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="oklch(0.65 0.02 260)" />
                <YAxis domain={[3.5, 5]} tick={{ fontSize: 10 }} stroke="oklch(0.65 0.02 260)" />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid oklch(0.91 0.006 80)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "12px" }} />
                <Area type="monotone" dataKey="score" stroke="oklch(0.56 0.11 175)" fill="url(#csatG)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function MiniKPI({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="p-3 rounded-lg bg-muted/30 text-center">
      <p className="text-lg font-bold leading-none">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}
