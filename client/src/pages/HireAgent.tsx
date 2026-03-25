/**
 * HireAgent V8 — Simplified creation: Channel + Name → Create
 * All other configuration happens post-creation in Agent Detail.
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft, Bot, Mail, MessageCircle, Instagram, Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ChannelType = "email" | "live-chat" | "social-messaging";

const channels: { id: ChannelType; label: string; icon: typeof Mail; desc: string; integration: string; comingSoonAlt?: string }[] = [
  { id: "email", label: "Email", icon: Mail, desc: "Email tickets via ticketing system", integration: "Zendesk Email", comingSoonAlt: "Gorgias Email" },
  { id: "live-chat", label: "Live Chat", icon: MessageCircle, desc: "Real-time chat on your site", integration: "RC Widget" },
  { id: "social-messaging", label: "Social Messaging", icon: Instagram, desc: "Instagram, Facebook, WhatsApp", integration: "Zendesk Messaging" },
];

const defaultNames: Record<ChannelType, string> = {
  email: "Email Support Agent",
  "live-chat": "Live Chat Agent",
  "social-messaging": "Social Media Agent",
};

// Simulated existing agents — in production this comes from API
const existingChannels: ChannelType[] = [];

export default function HireAgent() {
  const [, navigate] = useLocation();
  const [channel, setChannel] = useState<ChannelType | "">("");
  const [agentName, setAgentName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleChannelSelect = (id: ChannelType) => {
    if (existingChannels.includes(id)) return;
    setChannel(id);
    setAgentName(defaultNames[id]);
  };

  const handleCreate = () => {
    if (!agentName.trim() || !channel) return;
    setCreating(true);
    setTimeout(() => {
      toast.success(`${agentName} created — let's set it up`);
      navigate("/agents/email-agent");
    }, 800);
  };

  const canCreate = channel && agentName.trim().length > 0;

  return (
    <div className="p-6 lg:p-8 max-w-[640px]">
      <Link href="/agents">
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 -ml-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Agents
        </Button>
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Create New Agent</h1>
        <p className="text-sm text-muted-foreground mt-1">Choose a channel and name your agent. You can configure everything else after creation.</p>
      </div>

      <div className="space-y-6">
        {/* ── Channel Selection ── */}
        <div>
          <label className="text-sm font-medium mb-3 block">Channel</label>
          <div className="grid grid-cols-3 gap-3">
            {channels.map(ch => {
              const disabled = existingChannels.includes(ch.id);
              const selected = channel === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => handleChannelSelect(ch.id)}
                  disabled={disabled}
                  className={cn(
                    "text-left p-4 rounded-lg border transition-all",
                    disabled ? "opacity-40 cursor-not-allowed" :
                    selected ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <ch.icon className={cn("w-5 h-5 mb-2", selected ? "text-primary" : "text-muted-foreground")} />
                  <p className="text-sm font-medium leading-tight">{ch.label}</p>
                  <p className="text-xs text-muted-foreground leading-tight mt-1">{ch.desc}</p>
                  <p className="text-[11px] text-muted-foreground mt-2">{ch.integration}</p>
                  {ch.comingSoonAlt && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] text-muted-foreground/60">{ch.comingSoonAlt}</span>
                      <Badge variant="secondary" className="text-[8px] px-1 py-0">Soon</Badge>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Agent Name ── */}
        {channel && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <label className="text-sm font-medium mb-2 block">Agent Name</label>
            <Input
              value={agentName}
              onChange={e => setAgentName(e.target.value)}
              placeholder={channel ? defaultNames[channel] : "Agent name"}
              className="max-w-sm h-10 text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1.5">You can change this later in agent settings.</p>
          </motion.div>
        )}

        {/* ── Create Button ── */}
        {channel && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.05 }}>
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-4">
                Agent will be created in <strong>Setting Up</strong> status. You'll configure the integration and other details on the next page.
              </p>
              <Button onClick={handleCreate} disabled={!canCreate || creating} className="gap-2">
                {creating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                ) : (
                  <><Bot className="w-4 h-4" /> Create Agent</>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
