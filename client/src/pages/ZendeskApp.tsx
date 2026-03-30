/* ── Zendesk App Sidebar Simulation ───────────────────────────
   Compact Zendesk sidebar (320px). States:
   1. Non-AI ticket — empty state
   2. Handling — AI handling, show intent/confidence/status + training copy reply
   3. Escalated — handoff notes, sentiment, order value, suggested reply
   Flag Issue toggle on all AI tickets.
   Loading / Error boundary states.
   ──────────────────────────────────────────────────────────── */

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ZENDESK_TICKETS,
  type ZendeskTicket,
} from "@/lib/zendesk-data";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  CheckCircle2,
  AlertTriangle,
  Flag,
  Copy,
  Check,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

// ── Helpers ──────────────────────────────────────────────

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// ── Sidebar: Status Badge ────────────────────────────────

function StatusBadge({ state }: { state: ZendeskTicket["state"] }) {
  if (state === "handling") {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-50 border border-emerald-200">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[11px] font-medium text-emerald-700">AI is handling this</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-red-50 border border-red-200">
      <AlertTriangle className="w-3 h-3 text-red-500" />
      <span className="text-[11px] font-medium text-red-600">Needs your attention</span>
    </div>
  );
}

// ── Sidebar: Non-AI Ticket Empty State ──────────────────

function NonAiTicketState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="w-10 h-10 rounded-full bg-[#f0f1f2] flex items-center justify-center mb-3">
        <Bot className="w-5 h-5 text-[#87929d]" />
      </div>
      <p className="text-[12px] font-medium text-[#2f3941] mb-1">Not an AI ticket</p>
      <p className="text-[11px] text-[#68737d] leading-relaxed">
        This ticket is not assigned to your AI Rep.
      </p>
    </div>
  );
}

// ── Sidebar: Loading State ──────────────────────────────

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <Loader2 className="w-6 h-6 text-[#87929d] animate-spin mb-3" />
      <p className="text-[11px] text-[#68737d]">Loading ticket data...</p>
    </div>
  );
}

// ── Sidebar: Error State ────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-3">
        <AlertTriangle className="w-5 h-5 text-red-400" />
      </div>
      <p className="text-[12px] font-medium text-[#2f3941] mb-1">Unable to load</p>
      <p className="text-[11px] text-[#68737d] mb-3">Something went wrong fetching ticket data.</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium text-[#1f73b7] hover:bg-blue-50 transition-colors border border-[#1f73b7]/30"
      >
        <RefreshCw className="w-3 h-3" />
        Retry
      </button>
    </div>
  );
}

// ── Sidebar: Flag Issue Toggle ──────────────────────────

function FlagIssue({
  flagged,
  flagNote,
  onToggleFlag,
  onSubmitNote,
}: {
  flagged: boolean;
  flagNote?: string;
  onToggleFlag: () => void;
  onSubmitNote: (note: string) => void;
}) {
  const [noteText, setNoteText] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [noteSent, setNoteSent] = useState(!!flagNote);

  return (
    <div className="space-y-2">
      {/* Toggle button */}
      <button
        onClick={() => {
          onToggleFlag();
          if (!flagged) {
            setShowNote(true);
          } else {
            setShowNote(false);
            setNoteSent(false);
            setNoteText("");
          }
        }}
        className={cn(
          "w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-[11px] font-medium transition-colors border",
          flagged
            ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
            : "text-[#68737d] border-transparent hover:text-[#2f3941] hover:bg-[#f0f1f2]"
        )}
      >
        <Flag className={cn("w-3.5 h-3.5", flagged && "fill-red-500 text-red-500")} />
        {flagged ? "Issue flagged" : "Flag Issue"}
      </button>

      {/* Optional note input (shown when flagged) */}
      {flagged && showNote && !noteSent && (
        <div className="space-y-1.5">
          <textarea
            placeholder="Add a note (optional)..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="w-full text-[11px] border border-[#d8dcde] rounded px-2 py-1.5 resize-none min-h-[48px] outline-none focus:border-[#1f73b7] placeholder:text-[#b0b8c0]"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (noteText.trim()) {
                  onSubmitNote(noteText.trim());
                }
                setNoteSent(true);
                setNoteText("");
              }}
              className="flex-1 py-1.5 rounded text-[11px] font-medium bg-[#1f73b7] text-white hover:bg-[#1565a0] transition-colors"
            >
              {noteText.trim() ? "Submit note" : "Skip note"}
            </button>
            <button
              onClick={() => { setShowNote(false); }}
              className="px-3 py-1.5 rounded text-[11px] text-[#68737d] hover:bg-[#f0f1f2] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Note sent confirmation */}
      {flagged && noteSent && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-red-50/60 border border-red-200/60">
          <CheckCircle2 className="w-3 h-3 text-red-500" />
          <span className="text-[10px] text-red-700 font-medium">
            {flagNote ? "Flagged with note" : "Flagged — Team Lead will review"}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Sidebar Content ──────────────────────────────────────

function SidebarContent({
  ticket,
  onToggleFlag,
  onSubmitFlagNote,
}: {
  ticket: ZendeskTicket;
  onToggleFlag: (ticketId: string) => void;
  onSubmitFlagNote: (ticketId: string, note: string) => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(null), 2000);
    });
  };

  // Non-AI ticket
  if (!ticket.isAiTicket) {
    return <NonAiTicketState />;
  }

  const sentimentColors: Record<string, string> = {
    frustrated: "bg-red-50 text-red-600 border-red-200",
    urgent: "bg-orange-50 text-orange-600 border-orange-200",
    neutral: "bg-slate-50 text-slate-600 border-slate-200",
  };

  return (
    <div className="space-y-3">
      {/* Status */}
      <StatusBadge state={ticket.state} />

      {/* AI Handling Info */}
      {ticket.state === "handling" && (
        <div className="rounded-md bg-[#f8f9fa] border border-[#e9ebed] p-2.5 space-y-1.5">
          {ticket.intentDetected && (
            <div className="flex justify-between text-[11px]">
              <span className="text-[#68737d]">Intent</span>
              <span className="text-[#2f3941] font-medium">{ticket.intentDetected}</span>
            </div>
          )}
          {ticket.confidence !== undefined && (
            <div className="flex justify-between text-[11px]">
              <span className="text-[#68737d]">Confidence</span>
              <span className="text-[#2f3941] font-medium">{Math.round(ticket.confidence * 100)}%</span>
            </div>
          )}
          {ticket.currentStep && (
            <div className="flex justify-between text-[11px]">
              <span className="text-[#68737d]">Status</span>
              <span className="text-[#2f3941] font-medium text-right max-w-[160px]">{ticket.currentStep}</span>
            </div>
          )}
        </div>
      )}

      {/* Training Mode: Rep's draft reply (copy-able) */}
      {ticket.state === "handling" && ticket.trainingDraftReply && (
        <div className="rounded-md bg-blue-50/60 border border-blue-200/60 p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-blue-600/80 uppercase tracking-wider">Rep's Draft Reply</span>
            <button
              onClick={() => handleCopy(ticket.trainingDraftReply!, "draft")}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-blue-600 hover:bg-blue-100/60 transition-colors"
            >
              {copied === "draft" ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
              {copied === "draft" ? "Copied" : "Copy reply"}
            </button>
          </div>
          <p className="text-[11.5px] text-[#2f3941] leading-relaxed">{ticket.trainingDraftReply}</p>
          <p className="text-[9px] text-blue-500/70 mt-1.5 italic">
            Training mode — reply saved as internal note. Copy and send manually if it looks good.
          </p>
        </div>
      )}

      {/* Escalation: Handoff Notes */}
      {ticket.state === "escalated" && ticket.handoffNotes && (
        <div className="rounded-md bg-[#f8f9fa] border border-[#e9ebed] p-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Bot className="w-3 h-3 text-[#68737d]" />
            <span className="text-[10px] font-semibold text-[#68737d] uppercase tracking-wider">Handoff Notes</span>
          </div>
          <p className="text-[11.5px] text-[#2f3941] leading-relaxed">{ticket.handoffNotes}</p>
        </div>
      )}

      {/* Escalation: Sentiment + Order Value */}
      {ticket.state === "escalated" && (ticket.sentiment || ticket.orderValue !== undefined) && (
        <div className="flex items-center gap-2 flex-wrap">
          {ticket.sentiment && (
            <Badge variant="outline" className={cn("text-[9px]", sentimentColors[ticket.sentiment] || sentimentColors.neutral)}>
              {ticket.sentiment}
            </Badge>
          )}
          {ticket.orderValue !== undefined && (
            <span className="text-[10px] font-medium text-[#2f3941]">
              Order: ${ticket.orderValue.toLocaleString()}
            </span>
          )}
        </div>
      )}

      {/* Escalation: Suggested Reply */}
      {ticket.state === "escalated" && ticket.suggestedReply && (
        <div className="rounded-md bg-blue-50/60 border border-blue-200/60 p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-blue-600/80 uppercase tracking-wider">Suggested Reply</span>
            <button
              onClick={() => handleCopy(ticket.suggestedReply!, "suggested")}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-blue-600 hover:bg-blue-100/60 transition-colors"
            >
              {copied === "suggested" ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
              {copied === "suggested" ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="text-[11.5px] text-[#2f3941] leading-relaxed">{ticket.suggestedReply}</p>
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-[#e9ebed]" />

      {/* Flag Issue */}
      <FlagIssue
        flagged={!!ticket.flagged}
        flagNote={ticket.flagNote}
        onToggleFlag={() => onToggleFlag(ticket.id)}
        onSubmitNote={(note) => onSubmitFlagNote(ticket.id, note)}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── MAIN PAGE ────────────────────────────────────────────
// ══════════════════════════════════════════════════════════

export default function ZendeskApp() {
  const [tickets, setTickets] = useState<ZendeskTicket[]>(ZENDESK_TICKETS);
  const [selectedTicketId, setSelectedTicketId] = useState<string>(ZENDESK_TICKETS[0]?.id || "");
  const [sidebarState, setSidebarState] = useState<"loaded" | "loading" | "error">("loaded");

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  const handleToggleFlag = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, flagged: !t.flagged, flagNote: !t.flagged ? t.flagNote : undefined }
          : t
      )
    );
  };

  const handleSubmitFlagNote = (ticketId: string, note: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, flagNote: note } : t))
    );
    toast.success("Note saved — Team Lead will review this ticket");
  };

  const escalatedCount = tickets.filter((t) => t.isAiTicket && t.state === "escalated").length;

  return (
    <div className="flex h-screen bg-[#f8f9fa]">
      {/* Left: Simulated Zendesk ticket view */}
      <div className="flex-1 bg-white border-r border-[#d8dcde]">
        <div className="h-11 bg-[#03363D] flex items-center px-4 gap-3">
          <span className="text-[12px] text-white/80 font-medium">Zendesk Support</span>
          <div className="flex-1" />
          <span className="text-[10px] text-white/40 font-mono">Simulation</span>
        </div>

        <div className="flex h-[calc(100%-44px)]">
          {/* Ticket list */}
          <div className="w-[240px] border-r border-[#e9ebed] bg-[#f8f9fa]">
            <div className="px-3 py-2.5 border-b border-[#e9ebed] flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#2f3941]">Tickets</span>
              <span className="text-[10px] text-[#87929d]">{tickets.length}</span>
            </div>
            <ScrollArea className="h-[calc(100%-38px)]">
              {tickets.map((ticket) => {
                const needsAttention = ticket.isAiTicket && ticket.state === "escalated";
                const isNonAi = !ticket.isAiTicket;
                return (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 border-b border-[#e9ebed] transition-colors",
                      selectedTicketId === ticket.id ? "bg-[#edf7ff]" : "hover:bg-[#f0f1f2]"
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {needsAttention && <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
                      {isNonAi && <div className="w-1.5 h-1.5 rounded-full bg-[#87929d] shrink-0" />}
                      <span className="text-[10px] text-[#87929d]">#{ticket.id.slice(-4)}</span>
                    </div>
                    <p className="text-[11.5px] text-[#2f3941] font-medium truncate">{ticket.subject}</p>
                    <p className="text-[10px] text-[#87929d] mt-0.5">{ticket.customerName}</p>
                  </button>
                );
              })}
            </ScrollArea>
          </div>

          {/* Ticket detail */}
          {selectedTicket && (
            <div className="flex-1 flex flex-col">
              <div className="px-5 py-3 border-b border-[#e9ebed]">
                <h2 className="text-[14px] font-semibold text-[#2f3941]">{selectedTicket.subject}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] text-[#68737d]">{selectedTicket.customerName}</span>
                  <span className="text-[9px] text-[#b0b8c0]">·</span>
                  <span className="text-[11px] text-[#87929d]">{selectedTicket.customerEmail}</span>
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="px-5 py-4 space-y-3 max-w-[560px]">
                  {selectedTicket.messages.map((msg, idx) => (
                    <div key={idx} className={cn("flex gap-2.5", msg.from === "agent" && "flex-row-reverse")}>
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold",
                          msg.from === "customer" && "bg-[#e9ebed] text-[#68737d]",
                          msg.from === "agent" && "bg-[#03363D] text-white",
                          msg.from === "internal" && "bg-amber-100 text-amber-700"
                        )}
                      >
                        {msg.from === "customer" ? selectedTicket.customerName[0] : msg.from === "agent" ? "AI" : "!"}
                      </div>
                      <div
                        className={cn(
                          "max-w-[380px] rounded-lg px-3 py-2",
                          msg.from === "customer" && "bg-[#f8f9fa] border border-[#e9ebed]",
                          msg.from === "agent" && "bg-[#03363D] text-white",
                          msg.from === "internal" && "bg-amber-50 border border-amber-200 italic"
                        )}
                      >
                        <p className="text-[12px] leading-relaxed">{msg.text}</p>
                        <p className={cn("text-[9px] mt-1", msg.from === "agent" ? "text-white/50" : "text-[#b0b8c0]")}>
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>

      {/* Right: Seel AI Sidebar */}
      <div className="w-[300px] bg-white flex flex-col shrink-0">
        <div className="h-11 bg-[#03363D] flex items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-white/80" />
            <span className="text-[12px] text-white/80 font-medium">Seel AI</span>
          </div>
          {escalatedCount > 0 && (
            <Badge className="bg-red-500 text-white text-[9px] border-0 px-1.5">
              {escalatedCount}
            </Badge>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="px-3 py-3">
            {/* Demo controls for loading/error states */}
            <div className="flex items-center gap-1.5 mb-3">
              <button
                onClick={() => setSidebarState("loaded")}
                className={cn("px-2 py-0.5 rounded text-[9px] border transition-colors",
                  sidebarState === "loaded" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "text-[#87929d] border-[#e9ebed] hover:bg-[#f0f1f2]"
                )}
              >
                Loaded
              </button>
              <button
                onClick={() => setSidebarState("loading")}
                className={cn("px-2 py-0.5 rounded text-[9px] border transition-colors",
                  sidebarState === "loading" ? "bg-blue-50 text-blue-700 border-blue-200" : "text-[#87929d] border-[#e9ebed] hover:bg-[#f0f1f2]"
                )}
              >
                Loading
              </button>
              <button
                onClick={() => setSidebarState("error")}
                className={cn("px-2 py-0.5 rounded text-[9px] border transition-colors",
                  sidebarState === "error" ? "bg-red-50 text-red-700 border-red-200" : "text-[#87929d] border-[#e9ebed] hover:bg-[#f0f1f2]"
                )}
              >
                Error
              </button>
            </div>

            {sidebarState === "loading" && <LoadingState />}
            {sidebarState === "error" && <ErrorState onRetry={() => setSidebarState("loaded")} />}
            {sidebarState === "loaded" && selectedTicket && (
              <SidebarContent
                ticket={selectedTicket}
                onToggleFlag={handleToggleFlag}
                onSubmitFlagNote={handleSubmitFlagNote}
              />
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
