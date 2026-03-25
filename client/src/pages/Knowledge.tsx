/**
 * Knowledge: Unified knowledge management page
 * Two sub-modules: Knowledge Articles (reference info) + Actions (executable rules with embedded guardrails)
 * Includes document upload and AI parsing flow
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Zap,
  Upload,
  FileText,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  ChevronRight,
  ExternalLink,
  Tag,
  Bot,
  ArrowRight,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

/* ── Knowledge Articles ── */
const knowledgeArticles = [
  {
    id: "K-001",
    title: "Refund & Return Policy",
    source: "Refund_Policy_v3.2.pdf",
    status: "active" as const,
    lastUpdated: "2025-03-20",
    summary: "Complete refund and return policy including timelines, eligibility criteria, and exceptions for different product categories.",
    agents: ["Agent Alpha", "Agent Beta"],
    tags: ["Refund", "Return", "Policy"],
    priority: 1,
  },
  {
    id: "K-002",
    title: "Shipping & Delivery FAQ",
    source: "Shipping_Procedures.pdf",
    status: "active" as const,
    lastUpdated: "2025-03-18",
    summary: "Shipping methods, delivery timelines, tracking information, and international shipping policies.",
    agents: ["Agent Alpha", "Agent Beta"],
    tags: ["Shipping", "Delivery", "WISMO"],
    priority: 1,
  },
  {
    id: "K-003",
    title: "Product Care Instructions",
    source: "Product_Guide.pdf",
    status: "active" as const,
    lastUpdated: "2025-03-15",
    summary: "Care and maintenance instructions for all product categories, warranty information, and troubleshooting tips.",
    agents: ["Agent Alpha"],
    tags: ["Product", "Care", "Warranty"],
    priority: 2,
  },
  {
    id: "K-004",
    title: "VIP Customer Program Details",
    source: "VIP_Escalation_Guide.docx",
    status: "review" as const,
    lastUpdated: "2025-03-22",
    summary: "VIP tier definitions, exclusive benefits, priority handling procedures, and loyalty program details.",
    agents: [],
    tags: ["VIP", "Loyalty", "Premium"],
    priority: 1,
    conflict: "Conflicts with K-001 on VIP refund timelines",
  },
];

/* ── Actions (Rules with embedded Guardrails) ── */
const actions = [
  {
    id: "A-001",
    title: "Auto-Refund for Small Orders",
    trigger: "Refund request AND order total < $50",
    action: "Process refund automatically via Shopify API",
    guardrail: "Daily refund cap: $5,000 per agent",
    status: "active" as const,
    source: "Refund_Policy_v3.2.pdf",
    agents: ["Agent Alpha"],
    triggered: 23,
    lastTriggered: "2h ago",
    category: "Financial",
  },
  {
    id: "A-002",
    title: "Negative Sentiment Escalation",
    trigger: "Customer sentiment score < -0.5",
    action: "Escalate to human agent with full context",
    guardrail: "Immediate escalation, no retry",
    status: "active" as const,
    source: "Manual",
    agents: ["Agent Alpha", "Agent Beta"],
    triggered: 15,
    lastTriggered: "45m ago",
    category: "Sentiment",
  },
  {
    id: "A-003",
    title: "High-Value Refund Escalation",
    trigger: "Refund amount > $100",
    action: "Escalate to CX Manager for approval",
    guardrail: "Hard block: Agent cannot override",
    status: "active" as const,
    source: "Refund_Policy_v3.2.pdf",
    agents: ["Agent Alpha", "Agent Beta"],
    triggered: 8,
    lastTriggered: "3h ago",
    category: "Financial",
  },
  {
    id: "A-004",
    title: "WISMO Auto-Response",
    trigger: "Customer asks about order status / tracking",
    action: "Fetch order status from Shopify, provide tracking link",
    guardrail: "None",
    status: "active" as const,
    source: "Shipping_Procedures.pdf",
    agents: ["Agent Alpha", "Agent Beta"],
    triggered: 156,
    lastTriggered: "5m ago",
    category: "Workflow",
  },
  {
    id: "A-005",
    title: "VIP Priority Processing",
    trigger: "Customer is VIP tier AND any request",
    action: "Skip queue, process immediately without escalation",
    guardrail: "Refund limit raised to $200 for VIP",
    status: "draft" as const,
    source: "VIP_Escalation_Guide.docx",
    agents: [],
    triggered: 0,
    lastTriggered: "Never",
    category: "Workflow",
  },
  {
    id: "A-006",
    title: "PII Access Block",
    trigger: "Any attempt to access customer PII",
    action: "Block action and log attempt",
    guardrail: "Hard block: No exceptions",
    status: "active" as const,
    source: "Manual",
    agents: ["Agent Alpha", "Agent Beta"],
    triggered: 0,
    lastTriggered: "Never",
    category: "Security",
  },
];

/* ── Uploaded Documents ── */
const documents = [
  { name: "Refund_Policy_v3.2.pdf", size: "2.4 MB", uploaded: "2025-03-20", status: "parsed" as const, knowledgeCount: 3, actionCount: 4 },
  { name: "Shipping_Procedures.pdf", size: "1.8 MB", uploaded: "2025-03-18", status: "parsed" as const, knowledgeCount: 2, actionCount: 3 },
  { name: "VIP_Escalation_Guide.docx", size: "890 KB", uploaded: "2025-03-22", status: "review" as const, knowledgeCount: 1, actionCount: 1 },
  { name: "Product_Guide.pdf", size: "1.2 MB", uploaded: "2025-03-15", status: "parsed" as const, knowledgeCount: 1, actionCount: 0 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function Knowledge() {
  const [activeTab, setActiveTab] = useState("articles");
  const [showUpload, setShowUpload] = useState(false);
  const [uploadStep, setUploadStep] = useState(0); // 0: upload, 1: parsing, 2: review

  const handleUpload = () => {
    setShowUpload(true);
    setUploadStep(0);
  };

  const simulateParse = () => {
    setUploadStep(1);
    setTimeout(() => setUploadStep(2), 2000);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-6 space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Knowledge</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage knowledge articles and action rules that power your AI agents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleUpload}>
            <Upload className="w-3.5 h-3.5" /> Upload Document
          </Button>
          <Button size="sm" className="gap-1.5 bg-teal-600 hover:bg-teal-700" onClick={() => toast("Manual creation coming soon")}>
            <Plus className="w-3.5 h-3.5" /> Create New
          </Button>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs">Knowledge Articles</span>
            </div>
            <p className="text-2xl font-bold">{knowledgeArticles.length}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{knowledgeArticles.filter(k => k.status === "active").length} active</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-xs">Action Rules</span>
            </div>
            <p className="text-2xl font-bold">{actions.length}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{actions.filter(a => a.status === "active").length} active</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-xs">Source Documents</span>
            </div>
            <p className="text-2xl font-bold">{documents.length}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{documents.filter(d => d.status === "review").length} needs review</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs">Conflicts</span>
            </div>
            <p className="text-2xl font-bold">1</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Requires resolution</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upload Modal */}
      {showUpload && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="shadow-md border-teal-200 bg-teal-50/30">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Upload & Parse Document</h3>
                <button onClick={() => { setShowUpload(false); setUploadStep(0); }} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {uploadStep === 0 && (
                <div className="border-2 border-dashed border-teal-300 rounded-lg p-8 text-center">
                  <Upload className="w-8 h-8 text-teal-500 mx-auto mb-3" />
                  <p className="text-sm font-medium mb-1">Drop your SOP or policy document here</p>
                  <p className="text-xs text-muted-foreground mb-4">PDF, DOCX, or TXT — AI will auto-classify into Knowledge Articles and Action Rules</p>
                  <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={simulateParse}>
                    Select File & Parse
                  </Button>
                </div>
              )}

              {uploadStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center animate-pulse">
                      <Zap className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">AI is parsing your document...</p>
                      <p className="text-xs text-muted-foreground">Classifying content into Knowledge Articles and Action Rules</p>
                    </div>
                  </div>
                  <Progress value={65} className="h-1.5" />
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2 rounded-lg bg-white">
                      <p className="text-lg font-bold text-teal-600">3</p>
                      <p className="text-[10px] text-muted-foreground">Knowledge found</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white">
                      <p className="text-lg font-bold text-teal-600">2</p>
                      <p className="text-[10px] text-muted-foreground">Actions found</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white">
                      <p className="text-lg font-bold text-amber-500">1</p>
                      <p className="text-[10px] text-muted-foreground">Conflict detected</p>
                    </div>
                  </div>
                </div>
              )}

              {uploadStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-teal-700 mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Parsing complete — Review results</span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Knowledge Articles Extracted</p>
                    {["Holiday Return Extension Policy", "Gift Card Refund Rules", "International Return Shipping"].map((title, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-border">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                          <span className="text-sm">{title}</span>
                        </div>
                        <Badge variant="outline" className="text-[9px] bg-teal-50 text-teal-700 border-teal-200">Knowledge</Badge>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action Rules Extracted</p>
                    {[
                      { title: "Holiday period: extend return window to 60 days", guardrail: "Max refund $200" },
                      { title: "Gift card balance: refund as store credit only", guardrail: "No cash refund" },
                    ].map((rule, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-border">
                        <div className="flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          <div>
                            <span className="text-sm">{rule.title}</span>
                            <span className="text-[10px] text-muted-foreground ml-2">Guardrail: {rule.guardrail}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-200">Action</Badge>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-xs font-semibold text-amber-800">Conflict Detected</span>
                    </div>
                    <p className="text-xs text-amber-700">
                      "Holiday Return Extension Policy" conflicts with existing K-001 (Refund & Return Policy) on return window duration.
                      Existing: 30 days → New: 60 days during holidays.
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => toast("Kept existing version")}>Keep Existing</Button>
                      <Button size="sm" className="text-xs h-7 bg-amber-600 hover:bg-amber-700" onClick={() => toast("Updated to new version")}>Use New Version</Button>
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => toast("Both versions kept with priority")}>Keep Both (Set Priority)</Button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setShowUpload(false); setUploadStep(0); }}>Cancel</Button>
                    <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => { setShowUpload(false); setUploadStep(0); toast.success("Document parsed and items added to knowledge base"); }}>
                      Confirm & Add All
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="articles" className="gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Knowledge Articles
          </TabsTrigger>
          <TabsTrigger value="actions" className="gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Actions
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Source Documents
          </TabsTrigger>
        </TabsList>

        {/* Knowledge Articles Tab */}
        <TabsContent value="articles" className="mt-4 space-y-3">
          {knowledgeArticles.map((article) => (
            <motion.div key={article.id} variants={itemVariants}>
              <Card className={`shadow-sm hover:shadow-md transition-shadow ${article.conflict ? "border-amber-200" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-muted-foreground">{article.id}</span>
                        <KnowledgeStatusBadge status={article.status} />
                        {article.priority === 1 && (
                          <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200">High Priority</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{article.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{article.summary}</p>

                      {article.conflict && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-600 mb-3 p-2 rounded bg-amber-50">
                          <AlertTriangle className="w-3 h-3" />
                          {article.conflict}
                          <Button size="sm" variant="link" className="text-xs h-auto p-0 ml-1 text-amber-700" onClick={() => toast("Conflict resolution UI coming soon")}>
                            Resolve
                          </Button>
                        </div>
                      )}

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">{article.source}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">Updated {article.lastUpdated}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {article.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[9px] h-4">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="ml-4 text-right shrink-0">
                      <p className="text-[10px] text-muted-foreground mb-1">Assigned to</p>
                      <div className="flex flex-col gap-1 items-end">
                        {article.agents.length > 0 ? article.agents.map((a) => (
                          <Badge key={a} variant="outline" className="text-[9px] gap-1">
                            <Bot className="w-2.5 h-2.5" />{a}
                          </Badge>
                        )) : (
                          <span className="text-[10px] text-muted-foreground italic">Unassigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="mt-4 space-y-3">
          {actions.map((action) => (
            <motion.div key={action.id} variants={itemVariants}>
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-mono text-muted-foreground">{action.id}</span>
                        <ActionStatusBadge status={action.status} />
                        <CategoryBadge category={action.category} />
                      </div>
                      <h3 className="font-semibold text-sm mb-2">{action.title}</h3>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
                        <div className="p-2.5 rounded-lg bg-muted/50">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">When</p>
                          <p className="text-xs">{action.trigger}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-teal-50/50">
                          <p className="text-[10px] font-semibold text-teal-700 uppercase tracking-wider mb-1">Then</p>
                          <p className="text-xs">{action.action}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-amber-50/50">
                          <div className="flex items-center gap-1 mb-1">
                            <Shield className="w-2.5 h-2.5 text-amber-600" />
                            <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">Guardrail</p>
                          </div>
                          <p className="text-xs">{action.guardrail}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">Source: {action.source}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">Triggered {action.triggered}x · Last: {action.lastTriggered}</span>
                        </div>
                      </div>
                    </div>

                    <div className="ml-4 text-right shrink-0 space-y-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-1">Assigned to</p>
                        <div className="flex flex-col gap-1 items-end">
                          {action.agents.length > 0 ? action.agents.map((a) => (
                            <Badge key={a} variant="outline" className="text-[9px] gap-1">
                              <Bot className="w-2.5 h-2.5" />{a}
                            </Badge>
                          )) : (
                            <span className="text-[10px] text-muted-foreground italic">Unassigned</span>
                          )}
                        </div>
                      </div>
                      <Switch
                        checked={action.status === "active"}
                        onCheckedChange={() => toast(`Action ${action.status === "active" ? "paused" : "activated"}`)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        {/* Source Documents Tab */}
        <TabsContent value="documents" className="mt-4">
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {documents.map((doc) => (
                  <div key={doc.name} className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className="text-[10px] text-muted-foreground">{doc.size} · Uploaded {doc.uploaded}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs">
                          <span className="text-teal-600 font-medium">{doc.knowledgeCount}</span> Knowledge ·{" "}
                          <span className="text-amber-600 font-medium">{doc.actionCount}</span> Actions
                        </p>
                      </div>
                      <DocStatusBadge status={doc.status} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

function KnowledgeStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    active: { label: "Active", className: "bg-teal-50 text-teal-700 border-teal-200" },
    review: { label: "Needs Review", className: "bg-amber-50 text-amber-700 border-amber-200" },
    draft: { label: "Draft", className: "bg-gray-50 text-gray-600 border-gray-200" },
  };
  const c = config[status] || config.active;
  return <Badge variant="outline" className={`text-[9px] ${c.className}`}>{c.label}</Badge>;
}

function ActionStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    active: { label: "Active", className: "bg-teal-50 text-teal-700 border-teal-200" },
    draft: { label: "Draft", className: "bg-gray-50 text-gray-600 border-gray-200" },
    paused: { label: "Paused", className: "bg-amber-50 text-amber-700 border-amber-200" },
  };
  const c = config[status] || config.active;
  return <Badge variant="outline" className={`text-[9px] ${c.className}`}>{c.label}</Badge>;
}

function CategoryBadge({ category }: { category: string }) {
  const config: Record<string, string> = {
    Financial: "bg-blue-50 text-blue-700 border-blue-200",
    Sentiment: "bg-purple-50 text-purple-700 border-purple-200",
    Workflow: "bg-teal-50 text-teal-700 border-teal-200",
    Security: "bg-red-50 text-red-700 border-red-200",
  };
  return <Badge variant="outline" className={`text-[9px] ${config[category] || ""}`}>{category}</Badge>;
}

function DocStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    parsed: { label: "Parsed", className: "bg-teal-50 text-teal-700 border-teal-200" },
    review: { label: "Needs Review", className: "bg-amber-50 text-amber-700 border-amber-200" },
    parsing: { label: "Parsing...", className: "bg-blue-50 text-blue-700 border-blue-200" },
  };
  const c = config[status] || config.parsed;
  return <Badge variant="outline" className={`text-[9px] ${c.className}`}>{c.label}</Badge>;
}
