/**
 * Hire Agent — Independent full-page 3-step wizard
 * Step 1: Choose Channel (connect ticketing system + select channel type)
 * Step 2: Name & Deploy (name, deploy mode)
 * Step 3: Done (confirmation + next steps)
 * Non-essential config (personality, signature, skills) deferred to Agent Detail
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Bot, CheckCircle2, Mail, MessageCircle,
  Instagram, Phone, Globe, Zap, Shield, ExternalLink, Sparkles,
  BookOpen, Target, Settings2, ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ── Types ── */
type ChannelType = "email" | "social" | "voice" | "web-chat";
type TicketingSystem = "zendesk" | "gorgias" | "freshdesk" | "intercom" | "";
type DeployMode = "shadow" | "production";

const channels: { id: ChannelType; label: string; desc: string; icon: typeof Mail; color: string; bg: string }[] = [
  { id: "email", label: "Email", desc: "Handle email tickets with thoughtful, detailed responses", icon: Mail, color: "text-blue-600", bg: "bg-blue-50" },
  { id: "social", label: "Social Media", desc: "Quick replies on Instagram, Facebook, Twitter DMs", icon: Instagram, color: "text-pink-600", bg: "bg-pink-50" },
  { id: "voice", label: "Voice (Coming Soon)", desc: "Phone support with real-time voice AI", icon: Phone, color: "text-gray-400", bg: "bg-gray-50" },
  { id: "web-chat", label: "Web Chat (Coming Soon)", desc: "Embedded chat widget on your website", icon: Globe, color: "text-gray-400", bg: "bg-gray-50" },
];

const ticketingSystems: { id: TicketingSystem; label: string; connected: boolean }[] = [
  { id: "zendesk", label: "Zendesk", connected: true },
  { id: "gorgias", label: "Gorgias", connected: false },
  { id: "freshdesk", label: "Freshdesk", connected: false },
  { id: "intercom", label: "Intercom", connected: false },
];

const steps = [
  { id: 1, label: "Channel" },
  { id: 2, label: "Name & Deploy" },
  { id: 3, label: "Done" },
];

export default function HireAgent() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [channel, setChannel] = useState<ChannelType | "">("");
  const [system, setSystem] = useState<TicketingSystem>("zendesk");
  const [agentName, setAgentName] = useState("");
  const [deployMode, setDeployMode] = useState<DeployMode>("shadow");

  const canProceedStep1 = channel === "email" || channel === "social";
  const canProceedStep2 = agentName.trim().length > 0;

  const handleNext = () => {
    if (step === 1 && canProceedStep1) setStep(2);
    else if (step === 2 && canProceedStep2) {
      setStep(3);
      toast.success(`${agentName} has been created!`);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const suggestedName = channel === "email" ? "Email Support Agent" : channel === "social" ? "Social Media Agent" : "";

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/agents">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Agents
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
            <Bot className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Hire a New Agent</h1>
            <p className="text-sm text-muted-foreground">Set up a new AI agent in just a few steps. You can fine-tune later.</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 my-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                step > s.id ? "bg-teal-100 text-teal-700" :
                step === s.id ? "bg-teal-600 text-white" :
                "bg-muted text-muted-foreground"
              )}>
                {step > s.id ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-4 text-center">{s.id}</span>}
                {s.label}
              </div>
              {i < steps.length - 1 && (
                <div className={cn("w-12 h-px", step > s.id ? "bg-teal-300" : "bg-border")} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {/* ── Step 1: Choose Channel ── */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <div className="space-y-6">
                {/* Ticketing System */}
                <div>
                  <h2 className="text-sm font-semibold mb-1">Ticketing System</h2>
                  <p className="text-xs text-muted-foreground mb-3">Your agent will connect to a ticketing system to receive and respond to tickets.</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {ticketingSystems.map((ts) => (
                      <button
                        key={ts.id}
                        onClick={() => { if (ts.connected) setSystem(ts.id); else toast.info("Connect this system in Settings → Integrations"); }}
                        className={cn(
                          "p-3 rounded-xl border text-left transition-all",
                          system === ts.id ? "border-teal-500 bg-teal-50/50 ring-1 ring-teal-500/20" :
                          ts.connected ? "border-border hover:border-teal-200" : "border-border opacity-50"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold">{ts.label}</span>
                          {ts.connected ? (
                            <Badge variant="outline" className="text-[9px] bg-teal-50 text-teal-700 border-teal-200">Connected</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px]">Not Connected</Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Channel Type */}
                <div>
                  <h2 className="text-sm font-semibold mb-1">Channel Type</h2>
                  <p className="text-xs text-muted-foreground mb-3">Choose which type of conversations this agent will handle.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {channels.map((ch) => {
                      const disabled = ch.id === "voice" || ch.id === "web-chat";
                      return (
                        <button
                          key={ch.id}
                          disabled={disabled}
                          onClick={() => setChannel(ch.id)}
                          className={cn(
                            "flex items-start gap-3 p-4 rounded-xl border text-left transition-all",
                            disabled ? "opacity-40 cursor-not-allowed" :
                            channel === ch.id ? "border-teal-500 bg-teal-50/50 ring-1 ring-teal-500/20" :
                            "border-border hover:border-teal-200 hover:bg-teal-50/10"
                          )}
                        >
                          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", ch.bg)}>
                            <ch.icon className={cn("w-5 h-5", ch.color)} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{ch.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{ch.desc}</p>
                            {ch.id === "email" && (
                              <div className="flex items-center gap-1 mt-2 text-[10px] text-blue-600">
                                <Zap className="w-3 h-3" /> Longer, detailed replies · Signature support · Thread context
                              </div>
                            )}
                            {ch.id === "social" && (
                              <div className="flex items-center gap-1 mt-2 text-[10px] text-pink-600">
                                <Zap className="w-3 h-3" /> Quick, concise replies · Emoji-friendly · Multi-platform
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Name & Deploy ── */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <div className="space-y-6">
                {/* Agent Name */}
                <div>
                  <h2 className="text-sm font-semibold mb-1">Agent Name</h2>
                  <p className="text-xs text-muted-foreground mb-3">Give your agent a recognizable name. You can change it later.</p>
                  <Input
                    placeholder={suggestedName || "e.g., Email Support Agent"}
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="max-w-md"
                  />
                  {!agentName && suggestedName && (
                    <button
                      onClick={() => setAgentName(suggestedName)}
                      className="text-xs text-teal-600 hover:text-teal-700 mt-1.5 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" /> Use suggested: "{suggestedName}"
                    </button>
                  )}
                </div>

                {/* Deploy Mode */}
                <div>
                  <h2 className="text-sm font-semibold mb-1">Deploy Mode</h2>
                  <p className="text-xs text-muted-foreground mb-3">Choose how the agent starts working. You can switch modes anytime.</p>
                  <RadioGroup value={deployMode} onValueChange={(v) => setDeployMode(v as DeployMode)} className="space-y-3">
                    <label className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                      deployMode === "shadow" ? "border-teal-500 bg-teal-50/50 ring-1 ring-teal-500/20" : "border-border hover:border-teal-200"
                    )}>
                      <RadioGroupItem value="shadow" className="mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">Shadow Mode</p>
                          <Badge className="text-[9px] bg-amber-100 text-amber-700 border-amber-200">Recommended</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Agent drafts responses but doesn't send them. You review and approve before going live.</p>
                      </div>
                    </label>
                    <label className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                      deployMode === "production" ? "border-teal-500 bg-teal-50/50 ring-1 ring-teal-500/20" : "border-border hover:border-teal-200"
                    )}>
                      <RadioGroupItem value="production" className="mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">Production Mode</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Agent responds to customers automatically. Best when you're confident in the setup.</p>
                      </div>
                    </label>
                  </RadioGroup>
                </div>

                {/* Summary */}
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Summary</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div><span className="text-muted-foreground">Channel:</span> <span className="font-medium capitalize">{channel}</span></div>
                      <div><span className="text-muted-foreground">System:</span> <span className="font-medium capitalize">{system}</span></div>
                      <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{agentName || "—"}</span></div>
                      <div><span className="text-muted-foreground">Mode:</span> <span className="font-medium capitalize">{deployMode}</span></div>
                    </div>
                  </CardContent>
                </Card>

                {/* What's deferred */}
                <div className="p-4 rounded-xl border border-dashed border-muted-foreground/20 bg-muted/10">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Settings2 className="w-3.5 h-3.5" /> You can configure these later in Agent Detail
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                    <span>• Personality & tone</span>
                    <span>• Custom instructions</span>
                    <span>• Email signature</span>
                    <span>• Escalation rules</span>
                    <span>• Skill selection</span>
                    <span>• Action-bound guardrails</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Done ── */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-teal-600" />
                </div>
                <h2 className="text-xl font-bold mb-1">{agentName} is Ready!</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Your new agent has been created in <span className="font-medium capitalize">{deployMode}</span> mode on the <span className="font-medium capitalize">{channel}</span> channel via <span className="font-medium capitalize">{system}</span>.
                </p>

                {/* Next Steps */}
                <div className="max-w-lg mx-auto text-left">
                  <p className="text-xs font-semibold text-muted-foreground mb-3">Recommended Next Steps</p>
                  <div className="space-y-2">
                    {[
                      { icon: BookOpen, label: "Enrich Knowledge Base", desc: "Add policies and FAQs so the agent can answer accurately", href: "/knowledge" },
                      { icon: Target, label: "Review Active Skills", desc: "Check which business scenarios the agent can handle", href: "/knowledge" },
                      { icon: Shield, label: "Set Guardrails", desc: "Configure safety rules and escalation thresholds", href: "/settings" },
                      { icon: Settings2, label: "Fine-tune Agent Settings", desc: "Adjust personality, tone, and channel-specific config", href: `/agents/${channel}-agent` },
                    ].map((ns) => (
                      <Link key={ns.label} href={ns.href}>
                        <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-teal-200 hover:bg-teal-50/10 transition-all group cursor-pointer">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <ns.icon className="w-4 h-4 text-muted-foreground group-hover:text-teal-600 transition-colors" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold group-hover:text-teal-700 transition-colors">{ns.label}</p>
                            <p className="text-[10px] text-muted-foreground">{ns.desc}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-teal-500 transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 mt-8">
                  <Link href="/agents">
                    <Button variant="outline" className="text-xs gap-1.5">
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Agents
                    </Button>
                  </Link>
                  <Link href={`/agents/${channel}-agent`}>
                    <Button className="text-xs gap-1.5 bg-teal-600 hover:bg-teal-700">
                      Go to Agent Detail <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        {step < 3 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <Button variant="ghost" onClick={handleBack} disabled={step === 1} className="text-xs gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              className="text-xs gap-1.5 bg-teal-600 hover:bg-teal-700"
            >
              {step === 2 ? "Create Agent" : "Next"} <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
