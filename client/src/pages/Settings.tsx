/**
 * Settings: Platform configuration, integrations (with Zendesk detail), team, and Global Guardrails.
 * Zendesk detail: OAuth App auth, Trigger setup guide, Agent-level reply mode, single Escalation Group.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon, Plug, Users, Bell, Shield,
  Key, Mail, MessageSquare, CheckCircle2, Plus, AlertTriangle,
  Pencil, Trash2, Power, ChevronLeft, ExternalLink, BookOpen,
  RefreshCw, Clock, ArrowRight, Copy, Eye, EyeOff, Info,
  Zap, Link2, FileText, HelpCircle, Globe, Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ── Integration Data ── */
interface Integration {
  name: string;
  category: string;
  status: "connected" | "available" | "error";
  icon: string;
  description: string;
  hasDetail?: boolean;
}

const integrations: Integration[] = [
  { name: "Zendesk", category: "Ticketing", status: "connected", icon: "Z", description: "Customer support ticketing and live chat platform.", hasDetail: true },
  { name: "Shopify", category: "Ecommerce", status: "connected", icon: "S", description: "Ecommerce platform for order and product data.", hasDetail: true },
  { name: "Gorgias", category: "Ticketing", status: "available", icon: "G", description: "Helpdesk designed for ecommerce brands." },
  { name: "Freshdesk", category: "Ticketing", status: "available", icon: "F", description: "Cloud-based customer support software." },
  { name: "ShipStation", category: "Shipping", status: "available", icon: "SS", description: "Multi-carrier shipping and fulfillment." },
  { name: "Slack", category: "Notification", status: "available", icon: "Sl", description: "Team messaging and notification channel." },
];

const teamMembers = [
  { name: "CX Manager", email: "cx@seel.com", role: "Admin", status: "active" },
  { name: "Support Lead", email: "lead@seel.com", role: "Manager", status: "active" },
  { name: "QA Analyst", email: "qa@seel.com", role: "Viewer", status: "active" },
];

const globalGuardrails = [
  { id: "gg1", name: "Risk Word Escalation", desc: "Escalate to human when customer uses threatening, legal, or profanity language.", type: "escalation" as const, enabled: true, severity: "high" as const, triggers: ["lawsuit", "attorney", "BBB complaint", "profanity detected"] },
  { id: "gg2", name: "Brand Voice Enforcement", desc: "Ensure all agent responses follow brand tone guidelines. No slang, no excessive emoji, professional but warm.", type: "tone" as const, enabled: true, severity: "medium" as const, triggers: ["tone deviation detected"] },
  { id: "gg3", name: "PII Protection", desc: "Block any attempt to access, display, or share customer PII (SSN, full credit card, etc.).", type: "security" as const, enabled: true, severity: "critical" as const, triggers: ["PII access attempt"] },
  { id: "gg4", name: "Repeated Failure Escalation", desc: "Escalate if agent fails to resolve after 3 consecutive attempts in the same conversation.", type: "escalation" as const, enabled: true, severity: "medium" as const, triggers: ["3+ failed resolution attempts"] },
  { id: "gg5", name: "After-hours Auto-response", desc: "Outside business hours, inform customer of expected response time and offer self-service options.", type: "workflow" as const, enabled: false, severity: "low" as const, triggers: ["message received outside 9am-6pm PST"] },
];

const containerV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemV = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const severityColors: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-amber-100 text-amber-700 border-amber-200",
  medium: "bg-blue-100 text-blue-700 border-blue-200",
  low: "bg-gray-100 text-gray-600 border-gray-200",
};

const typeColors: Record<string, string> = {
  escalation: "bg-amber-50 text-amber-600",
  tone: "bg-violet-50 text-violet-600",
  security: "bg-red-50 text-red-600",
  workflow: "bg-primary/10 text-primary",
};

/* ── Zendesk Detail Component ── */
function ZendeskDetail({ onBack }: { onBack: () => void }) {
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [replyMode, setReplyMode] = useState("internal_note");
  const [escalationGroup, setEscalationGroup] = useState("tier-2-support");
  const [autoClose, setAutoClose] = useState(true);
  const [csat, setCsat] = useState(true);
  const [triggerGuideOpen, setTriggerGuideOpen] = useState(false);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Integrations
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center text-lg font-bold">Z</div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Zendesk</h2>
              <Badge variant="outline" className="text-[9px]">Ticketing</Badge>
              <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20 gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> Connected
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">Customer support ticketing and live chat platform</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5" onClick={() => toast.success("Connection test passed")}>
            <RefreshCw className="w-3 h-3" /> Test Connection
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5 text-destructive hover:text-destructive" onClick={() => toast.info("Disconnect flow coming soon")}>
            <Power className="w-3 h-3" /> Disconnect
          </Button>
        </div>
      </div>

      {/* Connection Info */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-primary" /> Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/15">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium">Authorized via Seel App (OAuth)</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Connected on Mar 15, 2026 by cx@seel.com</p>
            </div>
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => toast.info("Re-authorize flow coming soon")}>
              Re-authorize
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Zendesk Subdomain</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input className="text-sm h-8 font-mono" value="acme-store.zendesk.com" readOnly />
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { navigator.clipboard.writeText("acme-store.zendesk.com"); toast.success("Copied"); }}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Webhook Endpoint</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input className="text-sm h-8 font-mono" value="https://api.seel.com/webhooks/zendesk/acme" readOnly />
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { navigator.clipboard.writeText("https://api.seel.com/webhooks/zendesk/acme"); toast.success("Copied"); }}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Webhook Secret</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                className="text-sm h-8 font-mono flex-1"
                type={showWebhookSecret ? "text" : "password"}
                value="whsec_a1b2c3d4e5f6g7h8i9j0"
                readOnly
              />
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setShowWebhookSecret(!showWebhookSecret)}>
                {showWebhookSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { navigator.clipboard.writeText("whsec_a1b2c3d4e5f6g7h8i9j0"); toast.success("Copied"); }}>
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trigger Setup Guide */}
      <Card className="shadow-sm border-amber-200/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
              <Zap className="w-4.5 h-4.5 text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Zendesk Trigger Setup</h3>
                <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-600 border-amber-200">Required</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                To route tickets to Seel AI Agent, you need to create a Trigger in your Zendesk admin panel. This trigger sends ticket events to Seel's webhook endpoint.
              </p>
              <div className="flex items-center gap-3 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                  onClick={() => setTriggerGuideOpen(true)}
                >
                  <BookOpen className="w-3 h-3" /> View Setup Guide
                </Button>
                <a
                  href="https://support.zendesk.com/hc/en-us/articles/203662246-Creating-triggers-for-automatic-ticket-updates-and-notifications"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" /> Zendesk Trigger Docs
                </a>
              </div>
              <div className="mt-3 p-2.5 rounded-md bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <CheckCircle2 className="w-3 h-3 text-primary" />
                  <span className="text-[11px] font-medium">Trigger Status</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Last webhook received: <span className="font-mono text-foreground">2 minutes ago</span> — Trigger appears to be configured correctly.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Reply Configuration */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-primary" /> Reply Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 border border-border/50">
            <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <p className="text-[11px] text-muted-foreground">These settings apply to all agents connected to Zendesk. Each agent uses the same reply mode and escalation group.</p>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Label className="text-sm">Reply Mode</Label>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-3 h-3 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-[280px]">
                  How the AI agent posts responses in Zendesk tickets. "Public reply" is visible to the customer. "Internal note" is only visible to your support team (recommended for initial rollout).
                </TooltipContent>
              </Tooltip>
            </div>
            <Select value={replyMode} onValueChange={(v) => { setReplyMode(v); toast.success("Reply mode updated"); }}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public_reply">
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-primary" />
                    <div>
                      <span className="text-sm">Public Reply</span>
                      <span className="text-[10px] text-muted-foreground ml-2">Visible to customer</span>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="internal_note">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    <div>
                      <span className="text-sm">Internal Note</span>
                      <span className="text-[10px] text-muted-foreground ml-2">Team only — recommended for rollout</span>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {replyMode === "internal_note" && (
              <p className="text-[11px] text-amber-600 mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Internal note mode: human agents review AI drafts before sending to customers.
              </p>
            )}
            {replyMode === "public_reply" && (
              <p className="text-[11px] text-primary mt-1.5 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Public reply mode: AI responses are sent directly to customers. Ensure guardrails are properly configured.
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Label className="text-sm">Escalation Group</Label>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-3 h-3 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-[280px]">
                  The Zendesk group that receives escalated tickets when the AI agent cannot resolve an issue. Tickets are reassigned to this group with an internal note explaining the escalation reason.
                </TooltipContent>
              </Tooltip>
            </div>
            <Select value={escalationGroup} onValueChange={(v) => { setEscalationGroup(v); toast.success("Escalation group updated"); }}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tier-2-support">Tier 2 Support</SelectItem>
                <SelectItem value="senior-agents">Senior Agents</SelectItem>
                <SelectItem value="cx-managers">CX Managers</SelectItem>
                <SelectItem value="billing-team">Billing Team</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Groups are synced from your Zendesk account. <button className="text-primary hover:underline" onClick={() => toast.success("Groups refreshed from Zendesk")}>Refresh groups</button>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Ticket Handling Options */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <SettingsIcon className="w-3.5 h-3.5 text-primary" /> Ticket Handling
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted"><CheckCircle2 className="w-4 h-4 text-muted-foreground" /></div>
              <div>
                <Label className="text-sm">Auto-close resolved tickets</Label>
                <p className="text-[10px] text-muted-foreground">Automatically set ticket status to "Solved" after successful resolution.</p>
              </div>
            </div>
            <Switch checked={autoClose} onCheckedChange={(v) => { setAutoClose(v); toast.success(v ? "Auto-close enabled" : "Auto-close disabled"); }} />
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted"><MessageSquare className="w-4 h-4 text-muted-foreground" /></div>
              <div>
                <Label className="text-sm">CSAT survey after resolution</Label>
                <p className="text-[10px] text-muted-foreground">Send a satisfaction survey to the customer after the ticket is resolved.</p>
              </div>
            </div>
            <Switch checked={csat} onCheckedChange={(v) => { setCsat(v); toast.success(v ? "CSAT survey enabled" : "CSAT survey disabled"); }} />
          </div>
        </CardContent>
      </Card>

      {/* Permissions Summary */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-primary" /> App Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {[
              { scope: "tickets:read", desc: "Read ticket details and comments" },
              { scope: "tickets:write", desc: "Add comments and update ticket fields" },
              { scope: "users:read", desc: "Read requester and assignee info" },
              { scope: "groups:read", desc: "List available groups for escalation" },
              { scope: "organizations:read", desc: "Read organization data" },
              { scope: "webhooks:write", desc: "Receive real-time ticket events" },
            ].map(p => (
              <div key={p.scope} className="flex items-start gap-2 p-2 rounded-md bg-muted/15">
                <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-mono font-medium">{p.scope}</p>
                  <p className="text-[10px] text-muted-foreground">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" /> Last synced: 2 minutes ago
        </p>
        <Button className="bg-primary hover:bg-primary/90 gap-1.5" onClick={() => toast.success("Zendesk configuration saved")}>
          Save Configuration
        </Button>
      </div>

      {/* ── Trigger Setup Guide Dialog ── */}
      <Dialog open={triggerGuideOpen} onOpenChange={setTriggerGuideOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Zendesk Trigger Setup Guide
            </DialogTitle>
            <DialogDescription>
              Follow these steps to configure a Zendesk Trigger that routes tickets to Seel AI Agent.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            {/* Step 1 */}
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">1</div>
              <div>
                <p className="text-sm font-semibold">Open Zendesk Admin Center</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Navigate to <span className="font-mono bg-muted px-1 rounded">Admin Center &gt; Objects and rules &gt; Business rules &gt; Triggers</span>
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">2</div>
              <div>
                <p className="text-sm font-semibold">Create a New Trigger</p>
                <p className="text-xs text-muted-foreground mt-1">Click "Add trigger" and configure the following:</p>
                <div className="mt-2 p-3 rounded-lg bg-muted/20 border border-border/50 space-y-2">
                  <div>
                    <p className="text-[11px] font-medium">Trigger Name</p>
                    <p className="text-xs font-mono bg-muted px-2 py-1 rounded mt-0.5">Seel AI Agent - Route New Tickets</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium">Conditions (Meet ALL)</p>
                    <ul className="text-xs text-muted-foreground mt-1 space-y-0.5 ml-3 list-disc">
                      <li>Ticket: Status is New</li>
                      <li>Ticket: Channel is Email (or your preferred channels)</li>
                      <li>Ticket: Tags does not contain <span className="font-mono bg-muted px-1 rounded">seel_skip</span></li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium">Actions</p>
                    <ul className="text-xs text-muted-foreground mt-1 space-y-0.5 ml-3 list-disc">
                      <li>Notify target: <span className="font-mono bg-muted px-1 rounded">Seel AI Webhook</span></li>
                      <li>Add tags: <span className="font-mono bg-muted px-1 rounded">seel_ai_processing</span></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">3</div>
              <div>
                <p className="text-sm font-semibold">Create the Webhook Target</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Before the trigger can work, create a webhook target in <span className="font-mono bg-muted px-1 rounded">Admin Center &gt; Apps and integrations &gt; Webhooks</span>
                </p>
                <div className="mt-2 p-3 rounded-lg bg-muted/20 border border-border/50 space-y-2">
                  <div>
                    <p className="text-[11px] font-medium">Endpoint URL</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <code className="text-xs font-mono bg-muted px-2 py-1 rounded flex-1">https://api.seel.com/webhooks/zendesk/acme</code>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText("https://api.seel.com/webhooks/zendesk/acme"); toast.success("Copied"); }}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium">Request method</p>
                    <p className="text-xs font-mono bg-muted px-2 py-1 rounded mt-0.5">POST</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium">Request format</p>
                    <p className="text-xs font-mono bg-muted px-2 py-1 rounded mt-0.5">JSON</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium">Authentication</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Add a header: <span className="font-mono bg-muted px-1 rounded">X-Seel-Signature</span> with your webhook secret.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">4</div>
              <div>
                <p className="text-sm font-semibold">Test the Trigger</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create a test ticket in Zendesk and verify that the webhook is received. You can check the status in the "Trigger Status" section above.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/15">
              <HelpCircle className="w-4 h-4 text-primary shrink-0" />
              <p className="text-xs text-primary">
                Need help? Contact <a href="mailto:support@seel.com" className="underline">support@seel.com</a> or check our <button className="underline font-medium" onClick={() => toast.info("Full documentation coming soon")}>full integration documentation</button>.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

/* ── Main Settings Component ── */
export default function Settings() {
  const [guardrailDialogOpen, setGuardrailDialogOpen] = useState(false);
  const [integrationDetail, setIntegrationDetail] = useState<string | null>(null);

  return (
    <motion.div variants={containerV} initial="hidden" animate="visible" className="p-6 space-y-6">
      <motion.div variants={itemV}>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform configuration, integrations, and global guardrails</p>
      </motion.div>

      <Tabs defaultValue="integrations">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="integrations" className="gap-1.5 text-xs"><Plug className="w-3.5 h-3.5" /> Integrations</TabsTrigger>
          <TabsTrigger value="guardrails" className="gap-1.5 text-xs"><Shield className="w-3.5 h-3.5" /> Global Guardrails</TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5 text-xs"><Users className="w-3.5 h-3.5" /> Team</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5 text-xs"><Bell className="w-3.5 h-3.5" /> Notifications</TabsTrigger>
          <TabsTrigger value="general" className="gap-1.5 text-xs"><SettingsIcon className="w-3.5 h-3.5" /> General</TabsTrigger>
        </TabsList>

        {/* ── Integrations ── */}
        <TabsContent value="integrations" className="mt-4">
          {integrationDetail === "Zendesk" ? (
            <ZendeskDetail onBack={() => setIntegrationDetail(null)} />
          ) : (
            <motion.div variants={itemV} className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/15">
                <Plug className="w-4 h-4 text-primary shrink-0" />
                <p className="text-xs text-primary">Connect your support and ecommerce platforms to enable AI agent capabilities. Click on a connected integration to configure its settings.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {integrations.map((int) => (
                  <Card
                    key={int.name}
                    className={cn(
                      "shadow-sm transition-all",
                      int.status === "connected" ? "hover:shadow-md cursor-pointer hover:border-primary/30" : "hover:shadow-md"
                    )}
                    onClick={() => { if (int.status === "connected" && int.hasDetail) setIntegrationDetail(int.name); }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold",
                          int.status === "connected" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                        )}>{int.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{int.name}</p>
                            <Badge variant="outline" className="text-[9px]">{int.category}</Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{int.description}</p>
                          <div className="mt-2">
                            {int.status === "connected" ? (
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20 gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> Connected</Badge>
                                {int.hasDetail && (
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                    Configure <ArrowRight className="w-2.5 h-2.5" />
                                  </span>
                                )}
                              </div>
                            ) : (
                              <Button variant="outline" size="sm" className="text-xs h-7" onClick={(e) => { e.stopPropagation(); toast.info(`Connecting to ${int.name}...`); }}>Connect</Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
        </TabsContent>

        {/* ── Global Guardrails ── */}
        <TabsContent value="guardrails" className="mt-4 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50/50 border border-red-200/60">
            <Shield className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-xs text-red-700"><strong>Global Guardrails</strong> apply to ALL agents regardless of channel. They define platform-wide safety rules like escalation triggers, brand voice enforcement, and PII protection. For action-specific guardrails, configure them within each Action.</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs gap-1"><Shield className="w-3 h-3" />{globalGuardrails.filter(g => g.enabled).length} Active</Badge>
              <Badge variant="outline" className="text-xs gap-1 text-red-600 border-red-200">{globalGuardrails.filter(g => g.severity === "critical").length} Critical</Badge>
            </div>
            <Button size="sm" className="gap-1 bg-primary hover:bg-primary/90 text-xs h-8" onClick={() => setGuardrailDialogOpen(true)}>
              <Plus className="w-3.5 h-3.5" /> Add Guardrail
            </Button>
          </div>

          <div className="space-y-3">
            {globalGuardrails.map((g) => (
              <Card key={g.id} className={cn("shadow-sm transition-all", g.enabled ? "hover:shadow-md" : "opacity-60")}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", typeColors[g.type])}>
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold">{g.name}</p>
                        <Badge variant="outline" className={cn("text-[9px]", severityColors[g.severity])}>{g.severity}</Badge>
                        <Badge variant="outline" className="text-[9px]">{g.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{g.desc}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] text-muted-foreground font-medium">Triggers:</span>
                        {g.triggers.map(t => <Badge key={t} variant="secondary" className="text-[9px]">{t}</Badge>)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.info("Edit guardrail coming soon")}><Pencil className="w-3 h-3" /></Button>
                      <Switch checked={g.enabled} onCheckedChange={() => toast.info("Guardrail toggled")} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Team ── */}
        <TabsContent value="team" className="mt-4">
          <motion.div variants={itemV}>
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Team Members</CardTitle>
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => toast("Invite member dialog coming soon")}>Invite Member</Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {teamMembers.map((member) => (
                    <div key={member.email} className="flex items-center gap-4 px-6 py-3.5">
                      <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center"><span className="text-xs font-semibold text-primary">{member.name.charAt(0)}</span></div>
                      <div className="flex-1"><p className="text-sm font-medium">{member.name}</p><p className="text-xs text-muted-foreground">{member.email}</p></div>
                      <Badge variant="outline" className="text-[10px]">{member.role}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ── Notifications ── */}
        <TabsContent value="notifications" className="mt-4">
          <motion.div variants={itemV}>
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-sm font-semibold">Notification Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Guardrail Triggers", desc: "Get notified when a guardrail is triggered", icon: Shield, enabled: true },
                  { label: "Agent Escalations", desc: "Notifications when agents escalate to human", icon: Users, enabled: true },
                  { label: "CSAT Alerts", desc: "Alert when CSAT drops below threshold", icon: Bell, enabled: true },
                  { label: "Daily Performance Report", desc: "Daily summary of agent performance", icon: Mail, enabled: false },
                  { label: "New Ticket Notifications", desc: "Real-time notifications for new tickets", icon: MessageSquare, enabled: false },
                ].map(pref => (
                  <div key={pref.label} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted"><pref.icon className="w-4 h-4 text-muted-foreground" /></div>
                      <div><Label className="text-sm">{pref.label}</Label><p className="text-[10px] text-muted-foreground">{pref.desc}</p></div>
                    </div>
                    <Switch defaultChecked={pref.enabled} onCheckedChange={() => toast("Preference updated")} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ── General ── */}
        <TabsContent value="general" className="mt-4">
          <motion.div variants={itemV} className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-sm font-semibold">Platform Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label className="text-sm">Company Name</Label><Input className="mt-1.5" defaultValue="Seel Inc." /></div>
                <div>
                  <Label className="text-sm">Default Language</Label>
                  <Select defaultValue="en"><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="zh">Chinese</SelectItem><SelectItem value="es">Spanish</SelectItem></SelectContent></Select>
                </div>
                <div>
                  <Label className="text-sm">Timezone</Label>
                  <Select defaultValue="utc-8"><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="utc-8">Pacific Time (UTC-8)</SelectItem><SelectItem value="utc-5">Eastern Time (UTC-5)</SelectItem><SelectItem value="utc+8">China Standard Time (UTC+8)</SelectItem></SelectContent></Select>
                </div>
                <div className="pt-2"><Button className="bg-primary hover:bg-primary/90" onClick={() => toast("Settings saved!")}>Save Changes</Button></div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-sm font-semibold">API Configuration</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><Label className="text-sm">API Key</Label><div className="flex gap-2 mt-1.5"><Input className="flex-1 font-mono" value="sk-seel-****-****-****-a8f2" readOnly /><Button variant="outline" size="sm" onClick={() => toast("API key copied!")}>Copy</Button></div></div>
                <div><Label className="text-sm">Webhook URL</Label><Input className="mt-1.5 font-mono" defaultValue="https://api.seel.com/webhooks/agent" /></div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* ── Add Guardrail Dialog ── */}
      <Dialog open={guardrailDialogOpen} onOpenChange={setGuardrailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-red-500" /> Add Global Guardrail</DialogTitle>
            <DialogDescription>Global guardrails apply to all agents across all channels.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-sm">Guardrail Name</Label><Input className="mt-1.5" placeholder="e.g. Risk Word Escalation" /></div>
            <div><Label className="text-sm">Description</Label><Textarea className="mt-1.5" placeholder="Describe when and how this guardrail should trigger..." rows={3} /></div>
            <div>
              <Label className="text-sm">Type</Label>
              <Select defaultValue="escalation"><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="escalation">Escalation</SelectItem><SelectItem value="tone">Tone / Brand Voice</SelectItem><SelectItem value="security">Security</SelectItem><SelectItem value="workflow">Workflow</SelectItem></SelectContent></Select>
            </div>
            <div>
              <Label className="text-sm">Severity</Label>
              <Select defaultValue="high"><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="critical">Critical</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent></Select>
            </div>
            <div><Label className="text-sm">Trigger Keywords (comma-separated)</Label><Input className="mt-1.5" placeholder="e.g. lawsuit, attorney, BBB" /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setGuardrailDialogOpen(false)}>Cancel</Button>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => { toast.success("Guardrail created"); setGuardrailDialogOpen(false); }}>Create Guardrail</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
