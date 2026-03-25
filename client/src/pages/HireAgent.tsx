/**
 * Hire Agent V7 — Single page, compact, guided progressive disclosure
 * Sections: Channel → Integration (with connection UX) → Agent Identity
 * Agent Identity includes: Name, Personality/Tone, Language
 * Creates agent in "Setting Up" status → navigates to Agent Detail
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Bot, CheckCircle2, Mail, MessageCircle,
  Instagram, AlertCircle, Loader2, ExternalLink,
  Globe, Mic,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ── Types & Data ── */
type ChannelType = "email" | "live-chat" | "social-messaging";

const channels: { id: ChannelType; label: string; icon: typeof Mail; desc: string }[] = [
  { id: "email", label: "Email", icon: Mail, desc: "Email tickets via ticketing system" },
  { id: "live-chat", label: "Live Chat", icon: MessageCircle, desc: "Real-time chat on your site" },
  { id: "social-messaging", label: "Social Messaging", icon: Instagram, desc: "Instagram, Facebook, WhatsApp" },
];

type Integration = {
  id: string; label: string; provider: string; available: boolean;
  connected: boolean; requiresAuth: boolean; comingSoon?: boolean;
};

const integrationMap: Record<ChannelType, Integration[]> = {
  email: [
    { id: "zendesk-email", label: "Zendesk Email", provider: "Zendesk", available: true, connected: false, requiresAuth: true },
    { id: "gorgias-email", label: "Gorgias Email", provider: "Gorgias", available: false, connected: false, requiresAuth: true, comingSoon: true },
  ],
  "live-chat": [
    { id: "rc-widget", label: "RC Widget", provider: "Seel", available: true, connected: true, requiresAuth: false },
    { id: "webchat-sdk", label: "WebChat SDK", provider: "Seel", available: false, connected: false, requiresAuth: false, comingSoon: true },
  ],
  "social-messaging": [
    { id: "zendesk-messaging", label: "Zendesk Messaging", provider: "Zendesk", available: true, connected: false, requiresAuth: true },
  ],
};

const defaultNames: Record<ChannelType, string> = {
  email: "Email Support Agent",
  "live-chat": "Live Chat Agent",
  "social-messaging": "Social Media Agent",
};

const tones = [
  { id: "professional", label: "Professional", desc: "Formal and precise" },
  { id: "friendly", label: "Friendly", desc: "Warm and approachable" },
  { id: "concise", label: "Concise", desc: "Brief and to the point" },
];

const languages = ["English", "Spanish", "French", "German", "Chinese", "Japanese"];

export default function HireAgent() {
  const [, navigate] = useLocation();

  const [channel, setChannel] = useState<ChannelType | "">("");
  const [integrationId, setIntegrationId] = useState("");
  const [integrationDone, setIntegrationDone] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [tone, setTone] = useState("professional");
  const [lang, setLang] = useState("English");
  const [creating, setCreating] = useState(false);

  // Zendesk connection flow state
  const [showZdConnect, setShowZdConnect] = useState(false);
  const [zdSubdomain, setZdSubdomain] = useState("");
  const [zdConnecting, setZdConnecting] = useState(false);
  const [zdConnected, setZdConnected] = useState(false);

  const integrations = channel ? integrationMap[channel] : [];
  const selIntg = integrations.find(i => i.id === integrationId);
  const intgReady = selIntg?.available && (selIntg.connected || zdConnected || !selIntg.requiresAuth);

  const handleChannelSelect = (id: ChannelType) => {
    setChannel(id);
    setIntegrationId("");
    setIntegrationDone(false);
    setAgentName("");
    setShowZdConnect(false);
    setZdConnected(false);
    const avail = integrationMap[id].filter(i => i.available);
    if (avail.length === 1) setIntegrationId(avail[0].id);
  };

  const handleConfirmIntegration = () => {
    if (!intgReady) return;
    setIntegrationDone(true);
    if (!agentName && channel) setAgentName(defaultNames[channel as ChannelType] || "");
  };

  const handleZdConnect = () => {
    if (!zdSubdomain.trim()) return;
    setZdConnecting(true);
    setTimeout(() => {
      setZdConnecting(false);
      setZdConnected(true);
      setShowZdConnect(false);
      toast.success("Zendesk connected successfully");
    }, 1200);
  };

  const handleCreate = () => {
    if (!agentName.trim()) return;
    setCreating(true);
    setTimeout(() => {
      toast.success(`${agentName} created`);
      navigate("/agents/email-agent");
    }, 800);
  };

  const canCreate = integrationDone && agentName.trim().length > 0;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Link href="/agents">
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 -ml-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Agents
        </Button>
      </Link>

      <div className="mb-5">
        <h1 className="text-lg font-semibold tracking-tight">Hire a New Agent</h1>
        <p className="text-sm text-muted-foreground mt-0.5">You can fine-tune all settings after creation.</p>
      </div>

      <div className="space-y-3">
        {/* ═══ Section 1: Channel ═══ */}
        <Section num={1} title="Channel" done={!!channel}>
          <div className="grid grid-cols-3 gap-2">
            {channels.map(ch => {
              const sel = channel === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => handleChannelSelect(ch.id)}
                  className={cn(
                    "text-left p-2.5 rounded-lg border transition-all",
                    sel ? "border-foreground bg-muted/30" : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <ch.icon className={cn("w-4 h-4 mb-1", sel ? "text-teal-600" : "text-muted-foreground")} />
                  <p className="text-xs font-medium leading-tight">{ch.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{ch.desc}</p>
                </button>
              );
            })}
          </div>
        </Section>

        {/* ═══ Section 2: Integration ═══ */}
        <AnimatePresence>
          {channel && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }}>
              <Section num={2} title="Integration" done={integrationDone}>
                {!integrationDone ? (
                  <div className="space-y-2">
                    {integrations.map(intg => {
                      const sel = integrationId === intg.id;
                      const isConnected = intg.connected || (sel && zdConnected);
                      return (
                        <button
                          key={intg.id}
                          onClick={() => { if (!intg.comingSoon) { setIntegrationId(intg.id); setShowZdConnect(false); setZdConnected(false); } }}
                          disabled={!!intg.comingSoon}
                          className={cn(
                            "w-full text-left p-2.5 rounded-lg border transition-all flex items-center gap-2.5",
                            intg.comingSoon ? "opacity-40 cursor-not-allowed" :
                            sel ? "border-foreground bg-muted/30" : "border-border hover:border-muted-foreground/30"
                          )}
                        >
                          <div className={cn("w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0",
                            sel ? "bg-teal-50 text-teal-700" : "bg-muted text-muted-foreground"
                          )}>
                            {intg.provider.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium">{intg.label}</span>
                              {intg.comingSoon && <Badge variant="secondary" className="text-[8px] px-1 py-0">Soon</Badge>}
                              {isConnected && !intg.comingSoon && <span className="text-[9px] text-teal-600 font-medium">Connected</span>}
                            </div>
                          </div>
                          {sel && !intg.comingSoon && <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                        </button>
                      );
                    })}

                    {/* Zendesk Connection Panel */}
                    {selIntg?.requiresAuth && !selIntg.connected && !zdConnected && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 space-y-2.5">
                        {!showZdConnect ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                              <span className="text-xs text-muted-foreground">{selIntg.provider} not connected</span>
                            </div>
                            <Button size="sm" variant="outline" className="text-[11px] h-7 gap-1" onClick={() => setShowZdConnect(true)}>
                              <ExternalLink className="w-3 h-3" /> Connect
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs font-medium">Connect to {selIntg.provider}</p>
                            <div>
                              <label className="text-[11px] text-muted-foreground mb-1 block">Subdomain</label>
                              <div className="flex items-center gap-2">
                                <Input
                                  value={zdSubdomain}
                                  onChange={e => setZdSubdomain(e.target.value)}
                                  placeholder="your-company"
                                  className="h-8 text-xs flex-1"
                                />
                                <span className="text-xs text-muted-foreground">.zendesk.com</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" className="text-[11px] h-7 bg-teal-600 hover:bg-teal-700 gap-1" onClick={handleZdConnect} disabled={!zdSubdomain.trim() || zdConnecting}>
                                {zdConnecting ? <><Loader2 className="w-3 h-3 animate-spin" /> Connecting...</> : "Authorize with Zendesk"}
                              </Button>
                              <Button size="sm" variant="ghost" className="text-[11px] h-7" onClick={() => setShowZdConnect(false)}>Cancel</Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground">You'll be redirected to Zendesk to authorize access.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Zendesk just connected */}
                    {zdConnected && selIntg?.requiresAuth && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{selIntg.provider} connected as <strong>{zdSubdomain}.zendesk.com</strong></span>
                      </div>
                    )}

                    {integrationId && intgReady && (
                      <Button size="sm" onClick={handleConfirmIntegration} className="text-xs bg-teal-600 hover:bg-teal-700 mt-1">
                        Continue
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-teal-50 flex items-center justify-center text-[9px] font-bold text-teal-700">
                        {selIntg?.provider.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium">{selIntg?.label}</span>
                      <span className="text-[9px] text-teal-600">Connected</span>
                    </div>
                    <button onClick={() => setIntegrationDone(false)} className="text-[11px] text-muted-foreground hover:text-foreground">Change</button>
                  </div>
                )}
              </Section>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ Section 3: Agent Identity ═══ */}
        <AnimatePresence>
          {integrationDone && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }}>
              <Section num={3} title="Agent Identity" done={false}>
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="text-xs font-medium mb-1 block">Name</label>
                    <Input
                      value={agentName}
                      onChange={e => setAgentName(e.target.value)}
                      placeholder={channel ? defaultNames[channel as ChannelType] : "Agent name"}
                      className="max-w-xs h-8 text-sm"
                    />
                  </div>

                  {/* Tone */}
                  <div>
                    <label className="text-xs font-medium mb-1.5 block">Voice & Tone</label>
                    <div className="flex gap-2">
                      {tones.map(t => (
                        <button
                          key={t.id}
                          onClick={() => setTone(t.id)}
                          className={cn(
                            "px-3 py-1.5 rounded-md border text-xs transition-all",
                            tone === t.id ? "border-foreground bg-muted/40 font-medium" : "border-border hover:border-muted-foreground/30"
                          )}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{tones.find(t => t.id === tone)?.desc}</p>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="text-xs font-medium mb-1.5 block flex items-center gap-1"><Globe className="w-3 h-3" /> Primary Language</label>
                    <div className="flex flex-wrap gap-1.5">
                      {languages.map(l => (
                        <button
                          key={l}
                          onClick={() => setLang(l)}
                          className={cn(
                            "px-2.5 py-1 rounded-md border text-[11px] transition-all",
                            lang === l ? "border-foreground bg-muted/40 font-medium" : "border-border hover:border-muted-foreground/30"
                          )}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Summary + Create */}
                  <div className="pt-2 border-t border-border/50">
                    <div className="grid grid-cols-[72px_1fr] gap-y-1 text-xs mb-3">
                      <span className="text-muted-foreground">Channel</span>
                      <span className="font-medium">{channels.find(c => c.id === channel)?.label}</span>
                      <span className="text-muted-foreground">Integration</span>
                      <span className="font-medium">{selIntg?.label}</span>
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{agentName || "—"}</span>
                      <span className="text-muted-foreground">Tone</span>
                      <span className="font-medium capitalize">{tone}</span>
                      <span className="text-muted-foreground">Language</span>
                      <span className="font-medium">{lang}</span>
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Setting Up</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-3">
                      Agent will be created in <strong>Setting Up</strong> status. Complete remaining steps in Agent Detail to start testing.
                    </p>
                    <Button onClick={handleCreate} disabled={!canCreate || creating} className="bg-teal-600 hover:bg-teal-700 gap-1.5 text-sm">
                      {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Bot className="w-4 h-4" /> Create Agent</>}
                    </Button>
                  </div>
                </div>
              </Section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Section wrapper ── */
function Section({ num, title, done, children }: {
  num: number; title: string; done: boolean; children: React.ReactNode;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-center gap-2.5 mb-2">
          <div className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0",
            done ? "bg-teal-500 text-white" : "bg-muted text-muted-foreground"
          )}>
            {done ? <CheckCircle2 className="w-3 h-3" /> : num}
          </div>
          <p className="text-sm font-semibold">{title}</p>
        </div>
        <div className="ml-7.5">{children}</div>
      </CardContent>
    </Card>
  );
}
