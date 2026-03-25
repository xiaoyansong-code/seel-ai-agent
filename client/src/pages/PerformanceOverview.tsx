/**
 * Performance > Overview
 * Core metric cards + Skill-dimension performance table
 * Rows = Skills, Columns = ticket count, resolution rate, avg handling time, escalation rate
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Minus,
  MessageSquare, CheckCircle2, Clock, ArrowUpRight,
  Target, Shield, Package, ShoppingCart, HelpCircle,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/* ── Mock Data ── */
const coreMetrics = [
  {
    label: "Total Sessions",
    value: "2,847",
    change: "+12.3%",
    trend: "up" as const,
    icon: MessageSquare,
    description: "vs previous 7 days",
  },
  {
    label: "Resolution Rate",
    value: "91.2%",
    change: "+2.1%",
    trend: "up" as const,
    icon: CheckCircle2,
    description: "auto-resolved without escalation",
  },
  {
    label: "Avg. Handling Time",
    value: "1m 24s",
    change: "-18s",
    trend: "up" as const,
    icon: Clock,
    description: "from first message to resolution",
  },
  {
    label: "Escalation Rate",
    value: "8.8%",
    change: "-1.2%",
    trend: "up" as const,
    icon: ArrowUpRight,
    description: "transferred to human agent",
  },
  {
    label: "CSAT Score",
    value: "4.6",
    change: "+0.1",
    trend: "up" as const,
    icon: Target,
    description: "average customer satisfaction",
  },
];

const skillPerformance = [
  {
    id: "s1",
    name: "Order Tracking (WISMO)",
    icon: Package,
    iconColor: "text-blue-600 bg-blue-50",
    tickets: 1243,
    resolutionRate: 97.1,
    avgHandlingTime: "0m 52s",
    escalationRate: 2.9,
    csat: 4.8,
    trend: "up" as const,
  },
  {
    id: "s2",
    name: "Seel Protection Claims",
    icon: Shield,
    iconColor: "text-primary bg-primary/10",
    tickets: 876,
    resolutionRate: 94.2,
    avgHandlingTime: "1m 38s",
    escalationRate: 5.8,
    csat: 4.6,
    trend: "up" as const,
  },
  {
    id: "s3",
    name: "Order Cancellation",
    icon: ShoppingCart,
    iconColor: "text-amber-600 bg-amber-50",
    tickets: 428,
    resolutionRate: 88.5,
    avgHandlingTime: "2m 15s",
    escalationRate: 11.5,
    csat: 4.3,
    trend: "down" as const,
  },
  {
    id: "s4",
    name: "General Inquiry",
    icon: HelpCircle,
    iconColor: "text-gray-600 bg-gray-100",
    tickets: 300,
    resolutionRate: 82.0,
    avgHandlingTime: "1m 50s",
    escalationRate: 18.0,
    csat: 4.1,
    trend: "flat" as const,
  },
];

const agentBreakdown = [
  { name: "RC Live Chat Agent", sessions: 2134, resolution: 92.4, csat: 4.7 },
  { name: "Email Support Agent", sessions: 713, resolution: 87.8, csat: 4.4 },
];

const trendIcon = (t: "up" | "down" | "flat") => {
  if (t === "up") return <TrendingUp className="w-3 h-3 text-primary" />;
  if (t === "down") return <TrendingDown className="w-3 h-3 text-red-500" />;
  return <Minus className="w-3 h-3 text-muted-foreground" />;
};

const cV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const iV = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

export default function PerformanceOverview() {
  const [timeRange, setTimeRange] = useState("7d");

  return (
    <motion.div variants={cV} initial="hidden" animate="visible" className="p-6 max-w-[1100px] space-y-6">
      {/* Header */}
      <motion.div variants={iV} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Performance</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Monitor AI agent performance across all skills and conversations</p>
        </div>
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
      </motion.div>

      {/* ── Core Metrics ── */}
      <motion.div variants={iV}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {coreMetrics.map((metric) => (
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
              <Badge variant="secondary" className="text-[10px]">{skillPerformance.length} skills active</Badge>
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
                {skillPerformance.map((skill) => (
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

      {/* ── Agent Breakdown ── */}
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
                  <TableRow key={agent.name}>
                    <TableCell className="py-3">
                      <span className="text-xs font-medium">{agent.name}</span>
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
    </motion.div>
  );
}
