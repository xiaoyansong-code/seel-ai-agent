/* ── Zendesk Sidebar Mock Data ──────────────────────────────
   Three ticket states:
   1. "handling"   — AI handling normally, no manager attention needed
   2. "approval"   — AI suggests an action/reply, needs manager to approve
   3. "escalated"  — AI cannot handle, needs manager to take over
   ──────────────────────────────────────────────────────────── */

export type TicketState = "handling" | "approval" | "escalated";
export type ApprovalStatus = "pending" | "approved" | "denied";

export interface TicketMessage {
  from: "customer" | "agent" | "internal";
  text: string;
  timestamp: string;
}

export interface SuggestedAction {
  type: "reply" | "refund" | "replacement" | "discount" | "resend";
  label: string;
  draft?: string;           // drafted reply text (for type "reply")
  details?: Record<string, string | number>; // action details (for non-reply)
}

export interface ZendeskTicket {
  id: string;
  subject: string;
  customerName: string;
  customerEmail: string;
  state: TicketState;
  messages: TicketMessage[];
  // AI internal note — always present for approval & escalated
  internalNote?: string;
  // Suggested action — only for "approval" state
  suggestedAction?: SuggestedAction;
  approvalStatus?: ApprovalStatus;
  // Give Instruction
  instruction?: string;
}

export const ZENDESK_TICKETS: ZendeskTicket[] = [
  // ── 1. Approval: Refund for damaged item ──
  {
    id: "zd-4589",
    subject: "Broken lamp — need a refund",
    customerName: "Sarah Mitchell",
    customerEmail: "sarah.m@gmail.com",
    state: "approval",
    messages: [
      {
        from: "customer",
        text: "Hi, I received my ceramic table lamp yesterday and the base is completely cracked. I'd like a full refund please.",
        timestamp: "2026-03-26T09:00:00Z",
      },
      {
        from: "agent",
        text: "Hi Sarah! I'm so sorry about the damaged lamp. I can see your order #CLC-10234. Let me get this sorted for you right away.",
        timestamp: "2026-03-26T09:01:00Z",
      },
    ],
    internalNote: "Customer received a cracked ceramic lamp ($89.99). Photo confirms damage. Within 30-day window. Refund exceeds my $50 autonomous limit — requesting approval.",
    suggestedAction: {
      type: "refund",
      label: "Issue full refund",
      details: {
        amount: "$89.99",
        method: "Visa ···4242",
        order: "#CLC-10234",
      },
    },
    approvalStatus: "pending",
  },
  // ── 2. Approval: Draft reply for loyalty discount ──
  {
    id: "zd-4591",
    subject: "Loyalty discount request",
    customerName: "David Park",
    customerEmail: "david.park@outlook.com",
    state: "approval",
    messages: [
      {
        from: "customer",
        text: "Hey! I've been shopping with you for over a year. Any chance I could get a discount on my current cart ($234.50)?",
        timestamp: "2026-03-26T09:20:00Z",
      },
      {
        from: "agent",
        text: "Hi David! Thanks for being a loyal customer — I can see you've placed 7 orders with us. Let me check what I can do.",
        timestamp: "2026-03-26T09:20:30Z",
      },
    ],
    internalNote: "VIP customer (7 orders). Requesting 12% loyalty discount on $234.50 cart. No prior discounts given. Within 15% max threshold.",
    suggestedAction: {
      type: "discount",
      label: "Apply 12% discount",
      details: {
        discount: "12%",
        code: "LOYAL-DAVID-12",
        savings: "$28.14",
      },
    },
    approvalStatus: "pending",
  },
  // ── 3. Handling: Normal WISMO ──
  {
    id: "zd-4595",
    subject: "Where is my order?",
    customerName: "Lisa Wang",
    customerEmail: "lisa.wang@yahoo.com",
    state: "handling",
    messages: [
      {
        from: "customer",
        text: "I ordered a candle set 5 days ago and still haven't received it. Tracking hasn't updated in 3 days.",
        timestamp: "2026-03-26T08:30:00Z",
      },
      {
        from: "agent",
        text: "Hi Lisa! Your order #CLC-10250 shipped 4 days ago via USPS. Tracking shows it's in transit — estimated delivery March 28. I'll follow up if it hasn't arrived by then.",
        timestamp: "2026-03-26T08:30:45Z",
      },
      {
        from: "customer",
        text: "Okay, thanks. I'll wait until the 28th.",
        timestamp: "2026-03-26T08:32:00Z",
      },
    ],
  },
  // ── 4. Escalated: Angry customer wants manager ──
  {
    id: "zd-4593",
    subject: "URGENT: Want to speak to a manager",
    customerName: "Robert Chen",
    customerEmail: "robert.chen@gmail.com",
    state: "escalated",
    messages: [
      {
        from: "customer",
        text: "This is RIDICULOUS. THREE delivery attempts and your driver keeps marking 'not home' when I'm at my door. I want a MANAGER. This $450 bookshelf better arrive or I'm disputing the charge.",
        timestamp: "2026-03-26T08:00:00Z",
      },
    ],
    internalNote: "Customer explicitly requested a manager. Very frustrated — 3 failed delivery attempts on a $450 order. I verified the delivery failures in the carrier system. This needs human judgment on how to resolve the carrier issue.",
  },
  // ── 5. Approval: Drafted reply for complex return ──
  {
    id: "zd-4597",
    subject: "Partial return on multi-item order",
    customerName: "Emma Thompson",
    customerEmail: "emma.t@gmail.com",
    state: "approval",
    messages: [
      {
        from: "customer",
        text: "I want to return the throw blanket from my order but keep the pillows. Will I lose my free shipping?",
        timestamp: "2026-03-26T10:15:00Z",
      },
    ],
    internalNote: "Customer wants partial return. Order was $112 with free shipping ($75 threshold). After return, remaining total is $67 — below threshold. I'm unsure if we retroactively charge shipping. Drafted a reply but need approval.",
    suggestedAction: {
      type: "reply",
      label: "Send drafted reply",
      draft: "Hi Emma! You can absolutely return the throw blanket. Your refund will be $45.00 minus the $8.95 return shipping fee. Since your remaining order stays above our threshold, your original free shipping is unaffected. I'll send you a return label now — let me know if you need anything else!",
    },
    approvalStatus: "pending",
  },
  // ── 6. Escalated: International customs question ──
  {
    id: "zd-4599",
    subject: "Customs duties on my return",
    customerName: "James Wilson",
    customerEmail: "james.w@mail.co.uk",
    state: "escalated",
    messages: [
      {
        from: "customer",
        text: "I paid £22 in customs duties when my order arrived. Now I want to return it. Will I get the duties back too?",
        timestamp: "2026-03-26T11:00:00Z",
      },
    ],
    internalNote: "International return with customs duties question. I don't have a rule for whether customs duties are refundable. This has come up 5 times this week and I've been escalating each time. Needs a policy decision.",
  },
];
