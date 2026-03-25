/**
 * Performance > Overview
 *
 * Features:
 * - Core metric cards (5)
 * - Skill-dimension performance table
 * - Agent Breakdown table
 * - By Agent filter (reads ?agent= from URL for deep-link from Agent Detail)
 *   - Only shown when 2+ agents exist
 *   - Filters all data when an agent is selected
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useSearch } from "wouter";
import {
  TrendingUp, TrendingDown, Minus,
  MessageSquare, CheckCircle2, Clock, ArrowUpRight,
  Target, Shield, Package, ShoppingCart, HelpCircle,
  Calendar, Bot,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/* ── Mock Data — per-agent variants ── */
interface MetricSet {
  totalSessions: { value: string; change: string };
  resolutionRate: { value: string; change: string };
  avgHandlingTime: { value: string; change: string };
  escalationRate: { value: string; change: string };
  csatScore: { value: string; change: string };
}

interface SkillRow {
  id: string;
  name: string;
  icon: typeof Package;
  iconColor: string;
  tickets: number;
  resolutionRate: number;
  avgHandlingTime: string;
  escalationRate: number;
  csat: number;
  trend: "up" | "down" | "flat";
}

interface AgentRow {
  name: string;
  sessions: number;
  resolution: number;
  csat: number;
}

// All agents combined
const allMetrics: MetricSet = {
  totalSessions: { value: "2,847", change: "+12.3%" },
  resolutionRate: { value: "91.2%", change: "+2.1%" },
  avgHandlingTime: { value: "1m 24s", change: "-18s" },
  escalationRate: { value: "8.8%", change: "-1.2%" },
  csatScore: { value: "4.6", change: "+0.1" },
};

// Per-agent metrics
const agentMetrics: Record<string, MetricSet> = {
  "RC Live Chat Agent": {
    totalSessions: { value: "2,134", change: "+14.1%" },
    resolutionRate: { value: "92.4%", change: "+2.5%" },
    avgHandlingTime: { value: "1m 08s", change: "-22s" },
    escalationRate: { value: "7.6%", change: "-1.5%" },
    csatScore: { value: "4.7", change: "+0.2" },
  },
  "Email Support Agent": {
    totalSessions: { value: "713", change: "+8.2%" },
    resolutionRate: { value: "87.8%", change: "+1.3%" },
    avgHandlingTime: { value: "3m 52s", change: "-45s" },
    escalationRate: { value: "12.2%", change: "-0.8%" },
    csatScore: { value: "4.4", change: "+0.1" },
  },
};

const allSkillPerformance: SkillRow[] = [
  { id: "s1", name: "Order Tracking (WISMO)", icon: Package, iconColor: "text-blue-600 bg-blue-50", tickets: 1243, resolutionRate: 97.1, avgHandlingTime: "0m 52s", escalationRate: 2.9, csat: 4.8, trend: "up" },
  { id: "s2", name: "Seel Protection Claims", icon: Shield, iconColor: "text-primary bg-primary/10", tickets: 876, resolutionRate: 94.2, avgHandlingTime: "1m 38s", escalationRate: 5.8, csat: 4.6, trend: "up" },
  { id: "s3", name: "Order Cancellation", icon: ShoppingCart, iconColor: "text-amber-600 bg-amber-50", tickets: 428, resolutionRate: 88.5, avgHandlingTime: "2m 15s", escalationRate: 11.5, csat: 4.3, trend: "down" },
  { id: "s4", name: "General Inquiry", icon: HelpCircle, iconColor: "text-gray-600 bg-gray-100", tickets: 300, resolutionRate: 82.0, avgHandlingTime: "1m 50s", escalationRate: 18.0, csat: 4.1, trend: "flat" },
];

// Per-agent skill data (simplified — in production this would be server-filtered)
const agentSkillPerformance: Record<string, SkillRow[]> = {
  "RC Live Chat Agent": [
    { id: "s1", name: "Order Tracking (WISMO)", icon: Package, iconColor: "text-blue-600 bg-blue-50", tickets: 987, resolutionRate: 97.8, avgHandlingTime: "0m 48s", escalationRate: 2.2, csat: 4.9, trend: "up" },
    { id: "s2", name: "Seel Protection Claims", icon: Shield, iconColor: "text-primary bg-primary/10", tickets: 724, resolutionRate: 95.1, avgHandlingTime: "1m 32s", escalationRate: 4.9, csat: 4.7, trend: "up" },
    { id: "s3", name: "Order Cancellation", icon: ShoppingCart, iconColor: "text-amber-600 bg-amber-50", tickets: 312, resolutionRate: 90.2, avgHandlingTime: "2m 05s", escalationRate: 9.8, csat: 4.4, trend: "flat" },
    { id: "s4", name: "General Inquiry", icon: HelpCircle, iconColor: "text-gray-600 bg-gray-100", tickets: 111, resolutionRate: 84.0, avgHandlingTime: "1m 40s", escalationRate: 16.0, csat: 4.2, trend: "flat" },
  ],
  "Email Support Agent": [
    { id: "s1", name: "Order Tracking (WISMO)", icon: Package, iconColor: "text-blue-600 bg-blue-50", tickets: 256, resolutionRate: 94.5, avgHandlingTime: "3m 10s", escalationRate: 5.5, csat: 4.5, trend: "up" },
    { id: "s2", name: "Seel Protection Claims", icon: Shield, iconColor: "text-primary bg-primary/10", tickets: 152, resolutionRate: 90.1, avgHandlingTime: "4m 20s", escalationRate: 9.9, csat: 4.3, trend: "flat" },
    { id: "s3", name: "Order Cancellation", icon: ShoppingCart, iconColor: "text-amber-600 bg-amber-50", tickets: 116, resolutionRate: 83.6, avgHandlingTime: "5m 05s", escalationRate: 16.4, csat: 4.0, trend: "down" },
    { id: "s4", name: "General Inquiry", icon: HelpCircle, iconColor: "text-gray-600 bg-gray-100", tickets: 189, resolutionRate: 80.4, avgHandlingTime: "3m 50s", escalationRate: 19.6, csat: 3.9, trend: "down" },
  ],
};

const agentBreakdown: AgentRow[] = [
  { name: "RC Live Chat Agent", sessions: 2134, resolution: 92.4, csat: 4.7 },
  { name: "Email Support Agent", sessions: 713, resolution: 87.8, csat: 4.4 },
];

const agentNames = agentBreakdown.map(a => a.name);
const hasMultipleAgents = agentNames.length >= 2;

const trendIcon = (t: "up" | "down" | "flat") => {
  if (t === "up") return <TrendingUp className="w-3 h-3 text-primary" />;
  if (t === "down") return <TrendingDown className="w-3 h-3 text-red-500" />;
  return <Minus className="w-3 h-3 text-muted-foreground" />;
};

const cV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const iV = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

export default function PerformanceOverview() {
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const agentFromUrl = urlParams.get("agent") || "all";

  const [timeRange, setTimeRange] = useState("7d");
  const [agentFilter, setAgentFilter] = useState(agentFromUrl);

  // Derive filtered data
  const metrics = useMemo(() => {
    if (agentFilter === "all") return allMetrics;
    return agentMetrics[agentFilter] || allMetrics;
  }, [agentFilter]);

  const skillData = useMemo(() => {
    if (agentFilter === "all") return allSkillPerformance;
    return agentSkillPerformance[agentFilter] || allSkillPerformance;
  }, [agentFilter]);

  const metricCards = [
    { label: "Total Sessions", value: metrics.totalSessions.value, change: metrics.totalSessions.change, icon: MessageSquare, description: "vs previous 7 days" },
    { label: "Resolution Rate", value: metrics.resolutionRate.value, change: metrics.resolutionRate.change, icon: CheckCircle2, description: "auto-resolved without escalation" },
    { label: "Avg. Handling Time", value: metrics.avgHandlingTime.value, change: metrics.avgHandlingTime.change, icon: Clock, description: "from first message to resolution" },
    { label: "Escalation Rate", value: metrics.escalationRate.value, change: metrics.escalationRate.change, icon: ArrowUpRight, description: "transferred to human agent" },
    { label: "CSAT Score", value: metrics.csatScore.value, change: metrics.csatScore.change, icon: Target, description: "average customer satisfaction" },
  ];

  return (
    <motion.div variants={cV} initial="hidden" animate="visible" className="p-6 max-w-[1100px] space-y-6">
      {/* Header */}
      <motion.div variants={iV} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Performance</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Monitor AI agent performance across all skills and conversations</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Agent Filter — only shown when 2+ agents */}
          {hasMultipleAgents && (
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <Bot className="w-3 h-3 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="All Agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agentNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <Calendar className="w-3 h-3 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Active filter indicator */}
      {agentFilter !== "all" && (
        <motion.div variants={iV} className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] gap-1">
            <Bot className="w-2.5 h-2.5" />
            Filtered: {agentFilter}
          </Badge>
          <Button variant="ghost" size="sm" className="text-[10px] h-6 text-muted-foreground" onClick={() => setAgentFilter("all")}>
            Clear filter
          </Button>
        </motion.div>
      )}

      {/* ── Core Metrics ── */}
      <motion.div variants={iV}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {metricCards.map((metric) => (
            <Card key={metric.label} className="shadow-sm">
              <CardContent className="p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/[0.06] flex items-center justify-center">
                    <metric.icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-2.5 h-2.5 text-primary" />
                    <span className="text-[10px] font-medium text-primary">{metric.change}</span>
                  </div>
                </div>
                <p className="text-xl font-bold leading-none">{metric.value}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{metric.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* ── Skill Performance Table ── */}
      <motion.div variants={iV}>
        <Card className="shadow-sm">
          <CardHeader className="pb-2 px-5 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Performance by Skill</CardTitle>
              <Badge variant="secondary" className="text-[10px]">{skillData.length} skills active</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] font-semibold text-muted-foreground w-[240px]">Skill</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground text-right">Tickets</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground text-right">Resolution Rate</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground text-right">Avg. Handling Time</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground text-right">Escalation Rate</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground text-right">CSAT</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground text-center w-[60px]">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skillData.map((skill) => (
                  <TableRow key={skill.id} className="group cursor-pointer">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", skill.iconColor)}>
                          <skill.icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-medium group-hover:text-primary transition-colors">{skill.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-xs font-semibold">{skill.tickets.toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className={cn("text-xs font-semibold", skill.resolutionRate >= 95 ? "text-primary" : skill.resolutionRate >= 90 ? "text-foreground" : "text-amber-600")}>
                          {skill.resolutionRate}%
                        </span>
                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", skill.resolutionRate >= 95 ? "bg-primary" : skill.resolutionRate >= 90 ? "bg-blue-400" : "bg-amber-400")}
                            style={{ width: `${skill.resolutionRate}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-xs text-muted-foreground">{skill.avgHandlingTime}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn("text-xs font-medium", skill.escalationRate > 10 ? "text-amber-600" : "text-muted-foreground")}>
                        {skill.escalationRate}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-xs font-semibold">{skill.csat}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {trendIcon(skill.trend)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Agent Breakdown — only when viewing all agents ── */}
      {agentFilter === "all" && hasMultipleAgents && (
        <motion.div variants={iV}>
          <Card className="shadow-sm">
            <CardHeader className="pb-2 px-5 pt-4">
              <CardTitle className="text-sm font-semibold">Agent Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[11px] font-semibold text-muted-foreground">Agent</TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground text-right">Sessions</TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground text-right">Resolution Rate</TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground text-right">CSAT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agentBreakdown.map((agent) => (
                    <TableRow
                      key={agent.name}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => setAgentFilter(agent.name)}
                    >
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <Bot className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium hover:text-primary transition-colors">{agent.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs font-semibold">{agent.sessions.toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs font-semibold">{agent.resolution}%</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs font-semibold">{agent.csat}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
