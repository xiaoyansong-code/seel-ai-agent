/**
 * Dashboard — V7 Production MVP
 * Design: Active Agents merged into metrics row. Improve + Scale combined into "What's Next".
 * Improve items: short title + muted status, visually distinct.
 */
import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Bot, Plus, ArrowRight, CheckCircle2,
  Mail, Instagram, MessageCircle,
  BookOpen, Target, Shield, Package, Settings2,
  BarChart3, Users, Gauge, SmilePlus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const cV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.03 } } };
const iV = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

export default function Dashboard() {
  const [hasAgents, setHasAgents] = useState(true);

  return (
    <motion.div variants={cV} initial="hidden" animate="visible" className="p-6 max-w-4xl space-y-5">
      <motion.div variants={iV} className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Overview</h1>
        <button
          onClick={() => setHasAgents(!hasAgents)}
          className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground border border-dashed border-muted-foreground/15 rounded px-2 py-0.5"
        >
          Demo: {hasAgents ? "Has Agent" : "Cold Start"}
        </button>
      </motion.div>
      {hasAgents ? <HasAgentState /> : <ColdStartState />}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* ── Cold Start ── */
/* ═══════════════════════════════════════════════════════════ */
function ColdStartState() {
  return (
    <motion.div variants={cV} initial="hidden" animate="visible" className="space-y-4">
      <motion.div variants={iV}>
        <Card className="shadow-sm">
          <CardContent className="p-6 text-center">
            <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center mx-auto mb-3">
              <Bot className="w-5.5 h-5.5 text-teal-600" />
            </div>
            <h2 className="text-base font-semibold mb-1">Deploy your first AI Agent</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
              Set up an AI agent to handle customer conversations. Takes less than 5 minutes.
            </p>
            <Link href="/agents/new">
              <Button className="bg-teal-600 hover:bg-teal-700 gap-1.5 text-sm">
                <Plus className="w-4 h-4" /> Hire Agent
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
      <motion.div variants={iV}>
        <Card className="shadow-sm">
          <CardContent className="p-4 space-y-0.5">
            <p className="text-xs font-medium text-muted-foreground mb-2">Setup checklist</p>
            <CheckItem done label="Account created" />
            <CheckItem done label="Order system connected" note="Partial sync — full sync recommended" noteHref="/settings" />
            <CheckItem label="Hire your first AI Agent" href="/agents/new" />
            <CheckItem label="Add knowledge base articles" href="/knowledge" />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* ── Has Agent(s) ── */
/* ═══════════════════════════════════════════════════════════ */
function HasAgentState() {
  return (
    <motion.div variants={cV} initial="hidden" animate="visible" className="space-y-5">
      {/* ── Metrics Row: 3 metrics + Active Agents card ── */}
      <motion.div variants={iV} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Active Agents — first card */}
        <Link href="/agents">
          <Card className="shadow-sm hover:shadow-md hover:border-teal-200 transition-all cursor-pointer h-full">
            <CardContent className="p-3 flex flex-col justify-between h-full">
              <div className="flex items-center gap-2 mb-1.5">
                <Bot className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground font-medium">Active Agents</p>
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-xl font-semibold leading-none">1</p>
                <span className="text-[10px] text-muted-foreground">of 2</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-4 h-4 rounded-full bg-teal-50 flex items-center justify-center">
                  <MessageCircle className="w-2.5 h-2.5 text-teal-600" />
                </div>
                <span className="text-[10px] text-muted-foreground truncate">RC Live Chat</span>
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <MetricCard icon={Users} label="Sessions" value="847" sub="Last 7 days" change="+8%" />
        <MetricCard icon={Gauge} label="Service Scope" value="78%" sub="AI handled vs total" change="+5%" />
        <MetricCard icon={SmilePlus} label="Sentiment" value="+0.3" sub="CSAT change (30d)" />
      </motion.div>

      {/* ── What's Next — single section combining Improve + Scale ── */}
      <motion.div variants={iV}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">What's next</p>
          <Link href="/analytics">
            <span className="text-[11px] text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 cursor-pointer">
              <BarChart3 className="w-3 h-3" /> Analytics <ArrowRight className="w-2.5 h-2.5" />
            </span>
          </Link>
        </div>
        <Card className="shadow-sm">
          <CardContent className="p-2">
            {/* Improve items */}
            <div className="px-2 pt-1.5 pb-1">
              <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-0.5">Improve</p>
            </div>
            <ImproveItem
              icon={Package}
              title="Sync all orders"
              status="Partial sync"
              progress={40}
              href="/settings"
            />
            <ImproveItem
              icon={BookOpen}
              title="Enrich knowledge base"
              status="3 of 20+ articles"
              progress={15}
              href="/knowledge"
            />
            <ImproveItem
              icon={Target}
              title="Activate skills"
              status="2 of 8 enabled"
              progress={25}
              href="/knowledge"
            />
            <ImproveItem
              icon={Shield}
              title="Configure guardrails"
              status="Not configured"
              progress={0}
              href="/settings"
            />
            <ImproveItem
              icon={Settings2}
              title="Fine-tune personality"
              status="Default"
              progress={0}
              href="/agents/rc-chat"
            />

            {/* Divider */}
            <div className="mx-2 my-1 border-t border-border/50" />

            {/* Scale item */}
            <div className="px-2 pt-1.5 pb-1">
              <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-0.5">Scale</p>
            </div>
            <Link href="/agents/new">
              <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer group">
                <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0 group-hover:bg-teal-50 transition-colors">
                  <Plus className="w-3.5 h-3.5 text-muted-foreground group-hover:text-teal-600 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium group-hover:text-teal-700 transition-colors">Hire another agent</p>
                  <p className="text-[11px] text-muted-foreground">Email, Social Messaging, or Live Chat</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex -space-x-1">
                    <div className="w-4.5 h-4.5 rounded-full bg-blue-50 flex items-center justify-center border border-white"><Mail className="w-2.5 h-2.5 text-blue-500" /></div>
                    <div className="w-4.5 h-4.5 rounded-full bg-pink-50 flex items-center justify-center border border-white"><Instagram className="w-2.5 h-2.5 text-pink-500" /></div>
                  </div>
                  <ArrowRight className="w-3 h-3 text-muted-foreground/20 group-hover:text-teal-500 transition-colors" />
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* ── Shared Components ── */

function MetricCard({ icon: Icon, label, value, sub, change }: {
  icon: React.ElementType; label: string; value: string; sub: string; change?: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
        </div>
        <div className="flex items-baseline gap-1.5">
          <p className="text-xl font-semibold leading-none">{value}</p>
          {change && <span className="text-[10px] text-teal-600 font-medium">{change}</span>}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

function ImproveItem({ icon: Icon, title, status, progress, href }: {
  icon: React.ElementType; title: string; status: string; progress: number; href: string;
}) {
  return (
    <Link href={href}>
      <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer group">
        <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium group-hover:text-teal-700 transition-colors leading-tight">{title}</p>
          <p className="text-[11px] text-muted-foreground leading-tight">{status}</p>
        </div>
        {progress > 0 && progress < 100 && (
          <div className="w-14 shrink-0">
            <Progress value={progress} className="h-1" />
          </div>
        )}
        <ArrowRight className="w-3 h-3 text-muted-foreground/20 group-hover:text-teal-500 transition-colors shrink-0" />
      </div>
    </Link>
  );
}

function CheckItem({ done, label, note, noteHref, href }: {
  done?: boolean; label: string; note?: string; noteHref?: string; href?: string;
}) {
  const inner = (
    <div className={cn(
      "flex items-center gap-3 p-2 rounded-lg transition-colors",
      !done && href ? "hover:bg-muted/40 cursor-pointer" : ""
    )}>
      <div className={cn(
        "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
        done ? "bg-teal-500" : "border-2 border-muted-foreground/20"
      )}>
        {done && <CheckCircle2 className="w-3 h-3 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm", done ? "text-muted-foreground" : "font-medium")}>{label}</p>
        {note && (
          noteHref ? (
            <Link href={noteHref}>
              <span className="text-[11px] text-amber-600 hover:underline">{note}</span>
            </Link>
          ) : (
            <p className="text-[11px] text-muted-foreground">{note}</p>
          )
        )}
      </div>
      {!done && href && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/20 shrink-0" />}
    </div>
  );
  if (!done && href) return <Link href={href}>{inner}</Link>;
  return inner;
}
