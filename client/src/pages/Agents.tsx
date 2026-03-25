/**
 * Agents: Virtual employee team management
 * Includes per-Agent creation wizard (Onboarding flow)
 * Shows agent cards with associations: Channels, Knowledge, Actions
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Bot,
  Plus,
  MoreVertical,
  TrendingUp,
  Clock,
  CheckCircle2,
  Zap,
  Pause,
  Play,
  Trash2,
  Settings,
  MessageSquare,
  BarChart3,
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  X,
  Shield,
  Globe,
  BookOpen,
  Mail,
  MessageCircle,
  Instagram,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const agents = [
  {
    id: "alpha",
    name: "Agent Alpha",
    avatar: "https://d2xsxph8kpxj0f.cloudfront.net/310519663446549828/ZnnRRhGjRupXpf5q3zCYHR/agent-avatar-1-5Cg5ZwWmEXaFkczkGxLsLd.webp",
    mode: "Production" as const,
    status: "active" as const,
    strategy: "Conservative",
    ticketsToday: 847,
    resolutionRate: 91.2,
    avgResponseTime: "1.1s",
    csat: 4.6,
    trafficShare: 70,
    channels: ["Live Chat", "Email"],
    knowledge: 3,
    actions: 5,
  },
  {
    id: "beta",
    name: "Agent Beta",
    avatar: "https://d2xsxph8kpxj0f.cloudfront.net/310519663446549828/ZnnRRhGjRupXpf5q3zCYHR/agent-avatar-2-MogZTfSmY2RosF8fVB5Z8c.webp",
    mode: "Training" as const,
    status: "training" as const,
    strategy: "Aggressive",
    ticketsToday: 256,
    resolutionRate: 84.5,
    avgResponseTime: "1.4s",
    csat: 4.2,
    trafficShare: 30,
    channels: ["Email"],
    knowledge: 2,
    actions: 3,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export default function Agents() {
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [agentName, setAgentName] = useState("");
  const [strategy, setStrategy] = useState("balanced");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedKnowledge, setSelectedKnowledge] = useState<string[]>([]);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);

  const toggleChannel = (ch: string) => setSelectedChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  const toggleKnowledge = (k: string) => setSelectedKnowledge(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]);
  const toggleAction = (a: string) => setSelectedActions(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const resetWizard = () => {
    setShowWizard(false);
    setWizardStep(1);
    setAgentName("");
    setStrategy("balanced");
    setSelectedChannels([]);
    setSelectedKnowledge([]);
    setSelectedActions([]);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-6 space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your AI support team</p>
        </div>
        <Button className="gap-2 bg-teal-600 hover:bg-teal-700" onClick={() => setShowWizard(true)}>
          <Plus className="w-4 h-4" /> Hire New Agent
        </Button>
      </motion.div>

      {/* Summary Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat icon={<Bot className="w-4 h-4" />} label="Total Agents" value="2" />
        <MiniStat icon={<Play className="w-4 h-4" />} label="In Production" value="1" />
        <MiniStat icon={<Zap className="w-4 h-4" />} label="In Training" value="1" />
        <MiniStat icon={<CheckCircle2 className="w-4 h-4" />} label="Avg Resolution" value="87.9%" />
      </motion.div>

      {/* Agent Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </motion.div>

      {/* ── Create Agent Wizard ── */}
      <AnimatePresence>
        {showWizard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) resetWizard(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-card rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden"
            >
              {/* Wizard Header */}
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Hire New Agent</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Step {wizardStep} of 4: {["Basic Info", "Channels", "Knowledge & Rules", "Test & Launch"][wizardStep - 1]}
                  </p>
                </div>
                <button onClick={resetWizard} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step Indicator */}
              <div className="px-6 pt-4 flex items-center gap-2">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center gap-2 flex-1">
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                      step < wizardStep ? "bg-teal-500 text-white" :
                      step === wizardStep ? "bg-teal-100 text-teal-700 ring-2 ring-teal-500" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {step < wizardStep ? <CheckCircle2 className="w-4 h-4" /> : step}
                    </div>
                    {step < 4 && <div className={cn("flex-1 h-0.5 rounded-full", step < wizardStep ? "bg-teal-500" : "bg-muted")} />}
                  </div>
                ))}
              </div>

              {/* Step Content */}
              <div className="px-6 py-5 overflow-y-auto max-h-[50vh] custom-scrollbar">
                {wizardStep === 1 && (
                  <div className="space-y-5">
                    <div>
                      <Label className="text-sm font-medium">Agent Name</Label>
                      <input
                        type="text"
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                        placeholder="e.g., Agent Gamma"
                        className="w-full mt-1.5 px-4 py-2.5 bg-muted rounded-lg text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Strategy</Label>
                      <p className="text-xs text-muted-foreground mb-3">How aggressively should this agent handle requests?</p>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: "conservative", label: "Conservative", desc: "Always escalate uncertain cases" },
                          { id: "balanced", label: "Balanced", desc: "Smart escalation based on confidence" },
                          { id: "aggressive", label: "Aggressive", desc: "Handle most cases autonomously" },
                        ].map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setStrategy(s.id)}
                            className={cn(
                              "p-3 rounded-lg border text-left transition-all",
                              strategy === s.id ? "border-teal-500 bg-teal-50 ring-1 ring-teal-500" : "border-border hover:border-teal-200"
                            )}
                          >
                            <p className="text-sm font-medium">{s.label}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">{s.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Select channels this agent will handle. Each channel has independent response settings.</p>
                    {[
                      { id: "live_chat", icon: MessageCircle, label: "Live Chat", desc: "Instant responses, conversational tone, rich text", color: "text-teal-500", bg: "bg-teal-50", time: "Instant (<3s)" },
                      { id: "email", icon: Mail, label: "Email", desc: "Detailed responses, professional tone, HTML templates", color: "text-blue-500", bg: "bg-blue-50", time: "Within 4 hours" },
                      { id: "social", icon: Instagram, label: "Social DM (Instagram)", desc: "Brief responses, casual tone, emoji allowed", color: "text-pink-500", bg: "bg-pink-50", time: "Within 1 hour" },
                    ].map((ch) => (
                      <button
                        key={ch.id}
                        onClick={() => toggleChannel(ch.id)}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-lg border text-left transition-all",
                          selectedChannels.includes(ch.id) ? "border-teal-500 bg-teal-50/30 ring-1 ring-teal-500" : "border-border hover:border-teal-200"
                        )}
                      >
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", ch.bg)}>
                          <ch.icon className={cn("w-5 h-5", ch.color)} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{ch.label}</p>
                          <p className="text-[10px] text-muted-foreground">{ch.desc}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Response time: {ch.time}</p>
                        </div>
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                          selectedChannels.includes(ch.id) ? "border-teal-500 bg-teal-500" : "border-border"
                        )}>
                          {selectedChannels.includes(ch.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    ))}
                    <p className="text-[10px] text-muted-foreground">
                      Channels are connected through your Ticketing System (Gorgias/Zendesk). The agent handles all incoming tickets from selected channels.
                    </p>
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="space-y-5">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-4 h-4 text-teal-600" />
                        <Label className="text-sm font-medium">Knowledge Articles</Label>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">Select knowledge this agent can reference</p>
                      {["Refund & Return Policy", "Shipping & Delivery FAQ", "Product Care Instructions", "VIP Customer Program Details"].map((k) => (
                        <button
                          key={k}
                          onClick={() => toggleKnowledge(k)}
                          className={cn(
                            "w-full flex items-center justify-between p-3 rounded-lg border mb-2 text-left transition-all",
                            selectedKnowledge.includes(k) ? "border-teal-500 bg-teal-50/30" : "border-border hover:border-teal-200"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                            <span className="text-sm">{k}</span>
                          </div>
                          <Switch checked={selectedKnowledge.includes(k)} />
                        </button>
                      ))}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <Label className="text-sm font-medium">Action Rules</Label>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">Select rules with embedded guardrails</p>
                      {[
                        { name: "Auto-Refund for Small Orders", guardrail: "Cap: $5,000/day" },
                        { name: "Negative Sentiment Escalation", guardrail: "Immediate" },
                        { name: "WISMO Auto-Response", guardrail: "None" },
                        { name: "PII Access Block", guardrail: "Hard block" },
                      ].map((a) => (
                        <button
                          key={a.name}
                          onClick={() => toggleAction(a.name)}
                          className={cn(
                            "w-full flex items-center justify-between p-3 rounded-lg border mb-2 text-left transition-all",
                            selectedActions.includes(a.name) ? "border-amber-400 bg-amber-50/30" : "border-border hover:border-amber-200"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                            <div>
                              <span className="text-sm">{a.name}</span>
                              <span className="text-[10px] text-muted-foreground ml-2">
                                <Shield className="w-2.5 h-2.5 inline" /> {a.guardrail}
                              </span>
                            </div>
                          </div>
                          <Switch checked={selectedActions.includes(a.name)} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {wizardStep === 4 && (
                  <div className="space-y-5">
                    <div className="p-4 rounded-lg bg-teal-50 border border-teal-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-teal-600" />
                        <h4 className="text-sm font-semibold text-teal-800">Agent Summary</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-teal-600 text-xs">Name:</span> <span className="font-medium">{agentName || "Unnamed"}</span></div>
                        <div><span className="text-teal-600 text-xs">Strategy:</span> <span className="font-medium capitalize">{strategy}</span></div>
                        <div><span className="text-teal-600 text-xs">Channels:</span> <span className="font-medium">{selectedChannels.length > 0 ? selectedChannels.join(", ") : "None"}</span></div>
                        <div><span className="text-teal-600 text-xs">Knowledge:</span> <span className="font-medium">{selectedKnowledge.length} articles</span></div>
                        <div><span className="text-teal-600 text-xs">Actions:</span> <span className="font-medium">{selectedActions.length} rules</span></div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Launch Mode</Label>
                      <p className="text-xs text-muted-foreground mb-3">Choose how this agent starts handling conversations</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-lg border border-border hover:border-teal-200 transition-all cursor-pointer" onClick={() => toast("Shadow mode selected")}>
                          <div className="flex items-center gap-2 mb-1">
                            <Shield className="w-4 h-4 text-amber-500" />
                            <p className="text-sm font-semibold">Shadow Mode</p>
                          </div>
                          <p className="text-[10px] text-muted-foreground">Drafts responses for your review. Doesn't send automatically.</p>
                        </div>
                        <div className="p-4 rounded-lg border border-teal-500 bg-teal-50/30 ring-1 ring-teal-500 cursor-pointer">
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-4 h-4 text-teal-600" />
                            <p className="text-sm font-semibold">Live Mode</p>
                          </div>
                          <p className="text-[10px] text-muted-foreground">Handles conversations autonomously per action rules.</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-muted">
                      <h4 className="text-sm font-medium mb-2">Quick Test</h4>
                      <p className="text-xs text-muted-foreground mb-3">Send a test message to verify your agent's behavior</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g., Where is my order #1234?"
                          className="flex-1 px-3 py-2 bg-background rounded-lg text-sm border border-border focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                        />
                        <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => toast("Test message sent — agent responded successfully!")}>
                          Test
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Wizard Footer */}
              <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => wizardStep > 1 ? setWizardStep(wizardStep - 1) : resetWizard()}>
                  {wizardStep > 1 ? <><ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back</> : "Cancel"}
                </Button>
                <Button
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-700"
                  onClick={() => {
                    if (wizardStep < 4) {
                      setWizardStep(wizardStep + 1);
                    } else {
                      toast.success(`${agentName || "New Agent"} has been created!`);
                      resetWizard();
                    }
                  }}
                >
                  {wizardStep < 4 ? <>Next <ArrowRight className="w-3.5 h-3.5 ml-1" /></> : <>Launch Agent <Sparkles className="w-3.5 h-3.5 ml-1" /></>}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AgentCard({ agent }: { agent: typeof agents[0] }) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-all group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={agent.avatar} alt={agent.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-background" />
              <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${agent.status === "active" ? "bg-teal-500" : "bg-amber-400"}`} />
            </div>
            <div>
              <Link href={`/agents/${agent.id}`} className="text-base font-bold hover:text-primary transition-colors">
                {agent.name}
              </Link>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className={cn("text-[10px]",
                  agent.mode === "Production" ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-amber-50 text-amber-700 border-amber-200"
                )}>{agent.mode}</Badge>
                <span className="text-xs text-muted-foreground">{agent.strategy} · {agent.trafficShare}% traffic</span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toast("Opening agent config...")}><Settings className="w-4 h-4 mr-2" /> Configure</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast("Opening chat...")}><MessageSquare className="w-4 h-4 mr-2" /> Chat with Agent</DropdownMenuItem>
              <DropdownMenuSeparator />
              {agent.mode === "Training" ? (
                <DropdownMenuItem onClick={() => toast("Promoting...")}><ArrowUpRight className="w-4 h-4 mr-2" /> Promote to Production</DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => toast("Pausing...")}><Pause className="w-4 h-4 mr-2" /> Pause Agent</DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-destructive" onClick={() => toast("Retire agent")}><Trash2 className="w-4 h-4 mr-2" /> Retire Agent</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div className="p-2 rounded-lg bg-muted/50 text-center">
            <p className="text-lg font-bold">{agent.resolutionRate}%</p>
            <p className="text-[10px] text-muted-foreground">Resolution</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50 text-center">
            <p className="text-lg font-bold">{agent.csat}</p>
            <p className="text-[10px] text-muted-foreground">CSAT</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50 text-center">
            <p className="text-lg font-bold">{agent.avgResponseTime}</p>
            <p className="text-[10px] text-muted-foreground">Avg Response</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50 text-center">
            <p className="text-lg font-bold">{agent.ticketsToday}</p>
            <p className="text-[10px] text-muted-foreground">Today</p>
          </div>
        </div>

        {/* Associations */}
        <div className="flex items-center gap-4 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Globe className="w-3 h-3" />
            {agent.channels.join(", ")}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BookOpen className="w-3 h-3" />
            {agent.knowledge} Knowledge
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Zap className="w-3 h-3" />
            {agent.actions} Actions
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
      <div className="p-2 rounded-lg bg-teal-50 text-teal-600">{icon}</div>
      <div>
        <p className="text-lg font-bold leading-none">{value}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}
