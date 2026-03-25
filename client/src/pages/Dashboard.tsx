/**
 * Dashboard: Global overview with key metrics, alerts, and action items
 * Absorbs monitoring features from old Watchtower
 */
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Bot,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Zap,
  Mail,
  MessageCircle,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const kpiData = [
  { label: "Total Conversations", value: "1,103", trend: "+12%", trendUp: true, icon: MessageSquare },
  { label: "AI Resolution Rate", value: "89.3%", trend: "+2.1%", trendUp: true, icon: CheckCircle2 },
  { label: "Avg CSAT Score", value: "4.5", trend: "+0.2", trendUp: true, icon: TrendingUp },
  { label: "Avg Response Time", value: "1.2s", trend: "-0.3s", trendUp: true, icon: Clock },
];

const ticketData = [
  { date: "Mon", resolved: 145, escalated: 12 },
  { date: "Tue", resolved: 168, escalated: 8 },
  { date: "Wed", resolved: 152, escalated: 15 },
  { date: "Thu", resolved: 189, escalated: 11 },
  { date: "Fri", resolved: 201, escalated: 9 },
  { date: "Sat", resolved: 98, escalated: 5 },
  { date: "Sun", resolved: 87, escalated: 3 },
];

const csatData = [
  { hour: "00:00", score: 4.2 },
  { hour: "04:00", score: 4.5 },
  { hour: "08:00", score: 4.1 },
  { hour: "12:00", score: 4.6 },
  { hour: "16:00", score: 4.3 },
  { hour: "20:00", score: 4.7 },
  { hour: "Now", score: 4.5 },
];

const alerts = [
  { type: "warning" as const, message: "Agent Beta CSAT dropped below 4.0 in the last hour", time: "5 min ago", action: "Review Agent", link: "/agents/beta" },
  { type: "conflict" as const, message: "Knowledge conflict: VIP return policy vs standard return policy", time: "22 min ago", action: "Resolve", link: "/knowledge" },
  { type: "info" as const, message: "Agent Alpha processed 847 tickets today — new daily record", time: "1 hour ago", action: "View", link: "/agents/alpha" },
];

const actionItems = [
  { label: "Review 3 escalated conversations", link: "/conversations", priority: "high" as const },
  { label: "Resolve 1 knowledge conflict", link: "/knowledge", priority: "medium" as const },
  { label: "Agent Beta pending channel setup (Instagram DM)", link: "/agents/beta", priority: "low" as const },
];

const agentStatus = [
  { name: "Agent Alpha", id: "alpha", mode: "Production", tickets: 847, csat: 4.6, resolution: 91.2, avatar: "https://d2xsxph8kpxj0f.cloudfront.net/310519663446549828/ZnnRRhGjRupXpf5q3zCYHR/agent-avatar-1-5Cg5ZwWmEXaFkczkGxLsLd.webp" },
  { name: "Agent Beta", id: "beta", mode: "Training", tickets: 256, csat: 4.2, resolution: 84.5, avatar: "https://d2xsxph8kpxj0f.cloudfront.net/310519663446549828/ZnnRRhGjRupXpf5q3zCYHR/agent-avatar-2-MogZTfSmY2RosF8fVB5Z8c.webp" },
];

const channelBreakdown = [
  { channel: "Live Chat", icon: MessageCircle, color: "text-teal-500", bg: "bg-teal-50", count: 523, pct: 47 },
  { channel: "Email", icon: Mail, color: "text-blue-500", bg: "bg-blue-50", count: 412, pct: 37 },
  { channel: "Social DM", icon: Users, color: "text-pink-500", bg: "bg-pink-50", count: 168, pct: 16 },
];

const topTopics = [
  { topic: "WISMO", count: 342, pct: 31 },
  { topic: "Refund", count: 276, pct: 25 },
  { topic: "Return", count: 198, pct: 18 },
  { topic: "Cancellation", count: 154, pct: 14 },
  { topic: "Other", count: 133, pct: 12 },
];

export default function Dashboard() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-6 space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of your AI support operations</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 gap-1.5 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            5 Live Conversations
          </Badge>
          <span className="text-xs text-muted-foreground">Last updated: just now</span>
        </div>
      </motion.div>

      {/* KPI Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.label} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className="w-4 h-4 text-muted-foreground" />
                <div className={cn("flex items-center gap-0.5 text-xs font-medium", kpi.trendUp ? "text-teal-600" : "text-red-500")}>
                  {kpi.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {kpi.trend}
                </div>
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Alerts + Action Items */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Alerts
              </CardTitle>
              <Badge variant="secondary" className="text-[9px]">{alerts.length} active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert, i) => (
              <div key={i} className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                alert.type === "warning" ? "bg-amber-50/50 border-amber-200" :
                alert.type === "conflict" ? "bg-red-50/50 border-red-200" :
                "bg-blue-50/50 border-blue-200"
              )}>
                <div className="flex items-center gap-3 flex-1">
                  <div className={cn("w-2 h-2 rounded-full shrink-0",
                    alert.type === "warning" ? "bg-amber-500" :
                    alert.type === "conflict" ? "bg-red-500" : "bg-blue-500"
                  )} />
                  <div>
                    <p className="text-sm">{alert.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{alert.time}</p>
                  </div>
                </div>
                <Link href={alert.link}>
                  <Button size="sm" variant="ghost" className="text-xs shrink-0">{alert.action}</Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-teal-500" /> Next Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {actionItems.map((item, i) => (
              <Link key={i} href={item.link}>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                  <div className={cn("w-2 h-2 rounded-full shrink-0",
                    item.priority === "high" ? "bg-red-500" :
                    item.priority === "medium" ? "bg-amber-500" : "bg-blue-400"
                  )} />
                  <p className="text-sm flex-1">{item.label}</p>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ticketData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.006 80)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="oklch(0.65 0.02 260)" />
                <YAxis tick={{ fontSize: 12 }} stroke="oklch(0.65 0.02 260)" />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid oklch(0.91 0.006 80)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "12px" }} />
                <Bar dataKey="resolved" fill="oklch(0.56 0.11 175)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="escalated" fill="oklch(0.80 0.15 80)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">CSAT Trend (Today)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={csatData}>
                <defs>
                  <linearGradient id="csatGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.56 0.11 175)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="oklch(0.56 0.11 175)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.006 80)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="oklch(0.65 0.02 260)" />
                <YAxis domain={[3.5, 5]} tick={{ fontSize: 11 }} stroke="oklch(0.65 0.02 260)" />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid oklch(0.91 0.006 80)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "12px" }} />
                <Area type="monotone" dataKey="score" stroke="oklch(0.56 0.11 175)" fill="url(#csatGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom Row: Agent Status + Channel Breakdown + Topics */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Agent Team</CardTitle>
              <Link href="/agents"><Button size="sm" variant="link" className="text-xs h-auto p-0">View all</Button></Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {agentStatus.map((a) => (
              <Link key={a.id} href={`/agents/${a.id}`}>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <img src={a.avatar} alt={a.name} className="w-9 h-9 rounded-full object-cover" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{a.name}</p>
                      <Badge variant="outline" className={cn("text-[9px]",
                        a.mode === "Production" ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-amber-50 text-amber-700 border-amber-200"
                      )}>{a.mode}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-muted-foreground">{a.tickets} tickets</span>
                      <span className="text-[10px] text-muted-foreground">CSAT {a.csat}</span>
                      <span className="text-[10px] text-muted-foreground">{a.resolution}% resolved</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Channel Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {channelBreakdown.map((ch) => (
              <div key={ch.channel} className="flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", ch.bg)}>
                  <ch.icon className={cn("w-4 h-4", ch.color)} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{ch.channel}</span>
                    <span className="text-xs text-muted-foreground">{ch.count} ({ch.pct}%)</span>
                  </div>
                  <Progress value={ch.pct} className="h-1.5" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top Topics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topTopics.map((t) => (
              <div key={t.topic}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{t.topic}</span>
                  <span className="text-xs text-muted-foreground">{t.count} ({t.pct}%)</span>
                </div>
                <Progress value={t.pct} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
