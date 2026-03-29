# Seel AI Support Agent — Agent 技术设计文档

> **Version:** 1.0 | **Date:** 2026-03-29 | **Author:** Manus AI | **Status:** Draft for Review

本文档聚焦于 Agent 层面的行为设计：每个 Subagent 在不同流程中的输入、输出、Prompt 结构，以及它们之间的协作方式。目的是让团队可以直接用这些 mock prompt 跑实验，验证系统是否按预期工作。

---

## 1. Subagent 架构总览

```
                    ┌─────────────────────────────────┐
                    │           Orchestrator           │
                    │   (路由、状态管理、Webhook 处理)    │
                    └──────────┬──────────┬────────────┘
                               │          │
                    ┌──────────▼──┐  ┌────▼───────────┐
                    │  Team Lead  │  │    AI Rep       │
                    │  (管理助手)  │  │  (客服代理)      │
                    └─────────────┘  └────────────────┘
```

| Subagent | 产品角色 | 核心职责 | 触发方式 |
| --- | --- | --- | --- |
| **Orchestrator** | 无（系统层） | 路由请求、管理状态、处理 Webhook、调度其他 Subagent | 事件驱动 |
| **Team Lead** | Team Lead | 与 Manager 对话、生成 Rule 提案、辅助 Playbook 配置 | Manager 消息 / Orchestrator 调度 |
| **AI Rep** | AI Rep | 回复客户工单、检测知识缺口、执行 Action | Ticket 分配 |

---

## 2. AI Rep — 工单回复流程

### 2.1 触发条件

新 ticket 分配给 AI Rep，或已有 ticket 收到客户新消息。

### 2.2 输入

```
┌─ Ticket Context ─────────────────────────────────┐
│  ticket_id: "#4412"                               │
│  subject: "Damaged ceramic vase"                  │
│  customer_name: "Sarah Johnson"                   │
│  customer_history: { orders: 5, returns: 1 }      │
│  conversation: [                                  │
│    { role: "customer", text: "I received my..." } │
│  ]                                                │
├─ Agent Config ────────────────────────────────────┤
│  mode: "production" | "training"                  │
│  identity: { name: "Alex", tone: "friendly" }     │
│  rules: Rule[]                                    │
│  action_permissions: ActionPermission[]            │
│  knowledge_docs: KnowledgeChunk[]                 │
└───────────────────────────────────────────────────┘
```

### 2.3 输出（三种可能）

| 输出类型 | 条件 | Production Mode | Training Mode |
| --- | --- | --- | --- |
| **Direct Reply** | 匹配到 Rule + 有 Action 权限 | 公开回复客户 | Internal Note（建议回复） |
| **Escalation** | 无匹配 Rule 或无 Action 权限 | Internal Note + Escalate | Internal Note + Escalate |
| **Gap Signal** | 匹配到 Rule 但不确定 / 发现规则冲突 | 公开回复 + 发送 Gap Signal 给 Orchestrator | Internal Note + 发送 Gap Signal |

### 2.4 Mock Prompt — AI Rep System Prompt

```
You are {{agent_name}}, a customer support representative for {{company_name}}.

## Your Identity
- Name: {{agent_name}}
- Tone: {{tone_description}}
- AI Disclosure: {{disclosure_setting}}

## Operating Mode
Current mode: {{mode}}
{{#if mode == "training"}}
IMPORTANT: You are in TRAINING mode. Do NOT send public replies.
All your outputs must be formatted as Internal Notes for manager review.
Prefix every message with [INTERNAL NOTE].
{{/if}}

## Rules (You MUST follow these strictly)
{{#each rules}}
{{@index + 1}}. {{this.text}}
   [Source: {{this.source}}] [Tags: {{this.tags}}]
{{/each}}

## Available Actions
{{#each actions}}
- {{this.name}}: {{this.permission}}
  {{#if this.guardrails}}
  Guardrails:
  {{#each this.guardrails}}
    - {{this.label}}: {{this.value}}
  {{/each}}
  {{/if}}
{{/each}}

## Decision Framework
For each customer message, follow this process:

1. CLASSIFY the customer's intent (e.g., refund request, damage claim, shipping inquiry)
2. SEARCH your rules for matching guidance
3. CHECK if you have the required action permissions
4. DECIDE:
   a. If you have a matching rule AND required permissions → Execute and reply
   b. If you have a matching rule but NO permission → Escalate with explanation
   c. If you have NO matching rule → Escalate with gap signal
   d. If rules conflict or you're uncertain → Reply with best judgment + send gap signal

## Gap Signal Format
When you detect a knowledge gap, output a structured signal:
```json
{
  "type": "gap_signal",
  "gap_type": "no_rule" | "rule_conflict" | "uncertain" | "permission_denied",
  "description": "Brief description of what's missing",
  "ticket_id": "...",
  "customer_intent": "...",
  "attempted_action": "...",
  "context": "Relevant details for Team Lead to formulate a rule proposal"
}
```

## Response Format
{{#if mode == "production"}}
Respond directly to the customer in a {{tone}} tone. Do not mention internal processes.
{{else}}
Format as Internal Note:
[INTERNAL NOTE]
Suggested reply: "..."
Reasoning: ...
{{/if}}
```

### 2.5 Mock Prompt — 实际运行示例

**场景：客户报告损坏物品，订单金额 $34.99**

**Input（简化）：**
```
Ticket #4412
Customer: "I received my ceramic vase and it's cracked. I'd like a replacement."
Customer history: 5 orders, 1 previous return
Rules:
  1. For damage claims on items under $80, process replacement or refund without photo.
  2. For items $80+, request photo before processing.
Actions:
  - Send Replacement: autonomous (guardrail: first exchange only)
  - Issue Refund: autonomous (guardrail: max $200)
```

**AI Rep 内部推理：**
```
1. Intent: Damage claim → replacement request
2. Rule match: Rule #1 applies (item $34.99 < $80, no photo needed)
3. Action check: "Send Replacement" = autonomous, guardrail OK (first exchange)
4. Decision: Execute directly
```

**Output（Production Mode）：**
```
Hi Sarah,

I'm sorry to hear your ceramic vase arrived cracked! That's definitely not the
experience we want for you.

I've gone ahead and initiated a replacement — you should receive a shipping
confirmation within 24 hours. No need to return the damaged item.

Is there anything else I can help with?

Best,
Alex
```

---

**场景：客户要求退款到不同的支付方式（无匹配 Rule）**

**Input（简化）：**
```
Ticket #4501
Customer: "Can you refund to my PayPal instead of the original credit card?"
Rules: (no rule covering cross-payment-method refunds)
Actions:
  - Issue Refund: autonomous (guardrail: max $200, same payment method)
```

**AI Rep 内部推理：**
```
1. Intent: Refund to different payment method
2. Rule match: No rule found for cross-payment-method refunds
3. Action check: "Issue Refund" guardrail says "same payment method"
4. Decision: Escalate + Gap Signal
```

**Output（Escalation）：**
```json
{
  "escalation": {
    "internal_note": "Customer requesting refund to PayPal instead of original credit card. My current rules and action permissions only cover refunds to the original payment method. I don't have guidance on cross-payment-method refunds.",
    "suggested_reply": "Hi Sarah, thank you for reaching out. I'm looking into your request to refund to a different payment method. Let me connect you with a team member who can help with this. We'll get back to you shortly!"
  },
  "gap_signal": {
    "type": "gap_signal",
    "gap_type": "no_rule",
    "description": "No rule for cross-payment-method refunds. Customer wants refund to PayPal instead of original credit card.",
    "ticket_id": "#4501",
    "customer_intent": "refund_to_different_payment",
    "attempted_action": "issue_refund",
    "context": "Guardrail on Issue Refund specifies 'same payment method'. Need guidance on whether cross-payment refunds are allowed and under what conditions."
  }
}
```

---

## 3. Orchestrator — 事件路由与调度

### 3.1 职责

Orchestrator 不是一个 LLM 节点，而是一个**确定性的事件处理引擎**。它负责：

- 接收外部事件（Zendesk Webhook、Manager 消息、定时任务）
- 路由到正确的 Subagent
- 管理状态（Topic 状态、Ticket 状态）
- 持久化数据

### 3.2 事件路由表

| 事件 | 来源 | 路由到 | 传递的数据 |
| --- | --- | --- | --- |
| 新 ticket / 新客户消息 | Zendesk Webhook | AI Rep | Ticket context + Agent config |
| AI Rep 发出 Gap Signal | AI Rep | Team Lead | Gap Signal + Ticket context |
| AI Rep Escalate ticket | AI Rep | Orchestrator（更新状态） | Ticket ID + Internal Note |
| Manager 在 escalated ticket 上操作 | Zendesk Webhook | Team Lead | Manager 的操作内容 + 原始 ticket |
| Manager 在 Messages 中发消息 | 前端 | Team Lead | Manager 消息 + 对话历史 |
| Manager Accept/Reject Rule | 前端 | Orchestrator（更新 Rule） | Rule ID + 操作 |

### 3.3 Gap Signal → Rule 提案流程

```
AI Rep 发出 Gap Signal
    │
    ▼
Orchestrator 接收 Gap Signal
    │
    ├── 检查是否已有相同 gap 的 Topic（去重）
    │     ├── 已有 → 追加到现有 Topic
    │     └── 没有 → 创建新 Topic
    │
    ▼
调用 Team Lead（Rule Generator Skill）
    │
    ▼
Team Lead 生成 Rule 提案
    │
    ▼
Orchestrator 推送到 Messages
```

---

## 4. Team Lead — Rule 提案生成

### 4.1 Skill 1: Gap → Rule Proposal

**触发：** 收到 AI Rep 的 Gap Signal

**输入：**
```
┌─ Gap Signal ──────────────────────────────────────┐
│  gap_type: "no_rule"                               │
│  description: "No rule for cross-payment refunds"  │
│  ticket_id: "#4501"                                │
│  customer_intent: "refund_to_different_payment"    │
│  context: "Guardrail says same payment method..."  │
├─ Existing Rules ──────────────────────────────────┤
│  1. Refund within 30 days, original payment method │
│  2. VIP customers: 45-day window                   │
│  3. ...                                            │
├─ Historical Patterns (if available) ──────────────┤
│  Similar tickets in last 30 days: 3                │
│  Manager handled 2 of them by issuing PayPal refund│
└───────────────────────────────────────────────────┘
```

**输出：**
```json
{
  "topic_title": "Refund to different payment method",
  "context_message": "I escalated ticket #4501 because the customer requested a refund to PayPal instead of the original credit card. My current rules only cover refunds to the original payment method.\n\nI've seen 3 similar requests in the last 30 days. In 2 cases, you processed the PayPal refund manually.",
  "proposed_rule": {
    "type": "new",
    "text": "For refund requests to a different payment method (e.g., PayPal): allow if the refund amount is under $100 and the customer has a verified account. For amounts $100+, escalate to manager.",
    "source": "learned",
    "tags": ["refund"]
  }
}
```

**Mock Prompt — Team Lead (Gap → Rule Proposal)：**

```
You are the Team Lead for {{company_name}}'s AI support team.
Your job is to analyze knowledge gaps reported by AI Reps and propose
clear, actionable rules for the Manager to approve.

## Context
You received a gap signal from the AI Rep:
{{gap_signal}}

## Existing Rules
{{#each rules}}
{{@index + 1}}. {{this.text}}
{{/each}}

## Historical Data (if available)
{{historical_patterns}}

## Your Task
1. Analyze the gap: Why couldn't the Rep handle this?
2. Check existing rules: Is this truly a gap, or did the Rep miss an existing rule?
3. If it's a real gap, propose a rule:
   - Be specific and actionable
   - Include thresholds and conditions where appropriate
   - Consider edge cases
   - Reference the ticket that triggered this

## Output Format
{
  "topic_title": "Short descriptive title (max 8 words)",
  "context_message": "2-3 sentences explaining what happened and why this matters. Reference specific ticket numbers and data points. Be factual, not verbose.",
  "proposed_rule": {
    "type": "new" | "update",
    "current_text": "(only for updates) The existing rule text",
    "text": "The proposed rule text. Must be a single, clear statement.",
    "source": "learned",
    "tags": ["relevant_tag"]
  }
}

## Guidelines
- Propose rules that are SPECIFIC, not vague. Bad: "Handle refunds carefully."
  Good: "For refund requests to a different payment method: allow if under $100."
- If you see a pattern from historical data, mention it to build confidence.
- If the gap is ambiguous, still propose your best guess — the Manager can correct it.
- Do NOT ask open-ended questions. Always propose a concrete rule first.
```

### 4.2 Skill 2: Manager 行为观察 → Rule Proposal

**触发：** Zendesk Webhook 检测到 Manager 在 escalated ticket 上操作

**输入：**
```
┌─ Escalation Context ──────────────────────────────┐
│  ticket_id: "#4412"                                │
│  original_escalation_reason: "Customer reported    │
│    damaged vase, no photo provided. Rule requires  │
│    photo for all damage claims."                   │
│  rep_internal_note: "Escalating because customer   │
│    didn't provide photo evidence."                 │
├─ Manager's Action ────────────────────────────────┤
│  action: "Sent replacement without requesting photo│
│  manager_reply: "Hi Sarah, I'm so sorry about     │
│    the damaged vase. I've sent a replacement..."   │
│  manager_internal_note: null                       │
├─ Ticket Metadata ─────────────────────────────────┤
│  order_value: $34.99                               │
│  product: "Ceramic Vase"                           │
│  customer_tier: "regular"                          │
└───────────────────────────────────────────────────┘
```

**输出：**
```json
{
  "topic_title": "Learned: Damaged item photo not always needed",
  "context_message": "I escalated ticket #4412 because the customer reported a damaged ceramic vase but didn't provide a photo. My current rule requires photo evidence for all damage claims.\n\nI noticed you processed a replacement immediately without asking for a photo. The order was $34.99.",
  "proposed_rule": {
    "type": "update",
    "current_text": "Require photo evidence for all damage claims regardless of order value.",
    "text": "For damage claims on items under $80, process replacement or refund without photo. For items $80+, still request photo.",
    "source": "learned",
    "tags": ["damage_claims"]
  }
}
```

**Mock Prompt — Team Lead (Behavior Observation)：**

```
You are the Team Lead for {{company_name}}'s AI support team.
You just observed the Manager handle an escalated ticket differently from
the current rules. Your job is to learn from this and propose a rule update.

## What Happened
The AI Rep escalated this ticket:
- Ticket: {{ticket_id}}
- Reason for escalation: {{escalation_reason}}
- Rep's internal note: {{rep_note}}

The Manager then handled it:
- Manager's action: {{manager_action}}
- Manager's reply to customer: {{manager_reply}}
- Manager's internal note: {{manager_internal_note}}

## Ticket Details
- Order value: {{order_value}}
- Product: {{product}}
- Customer tier: {{customer_tier}}

## Current Rules
{{#each rules}}
{{@index + 1}}. {{this.text}}
{{/each}}

## Your Task
1. Compare the Manager's action with the current rules
2. Identify what the Manager did differently and WHY
3. Infer a general principle (not just a one-off exception)
4. Propose a rule update that captures this principle

## Output Format
{
  "topic_title": "Learned: [what was learned] (max 8 words)",
  "context_message": "Explain what you observed. Be specific: reference the ticket, the old rule, and the Manager's different approach. 2-3 sentences max.",
  "proposed_rule": {
    "type": "update",
    "current_text": "The existing rule that needs updating",
    "text": "The updated rule incorporating what you learned",
    "source": "learned",
    "tags": ["relevant_tag"]
  }
}

## Guidelines
- Focus on inferring the GENERAL PRINCIPLE, not just copying the specific case.
  Bad: "For ticket #4412, don't require photo." 
  Good: "For damage claims under $80, don't require photo."
- Use the order value / customer tier / product type as potential thresholds.
- If the Manager's action contradicts multiple rules, propose updates for each.
- Be confident in your proposal. The Manager will correct you if you're wrong.
```

### 4.3 Skill 3: Manager 指令 → 结构化 Rule

**触发：** Manager 在 Messages 中发送自由文本指令

**输入：**
```
┌─ Manager Message ─────────────────────────────────┐
│  "For orders placed during our Spring Sale         │
│   (March 15-31), extend the return window to       │
│   60 days instead of the standard 30. This applies │
│   to all customers, not just VIP."                 │
├─ Conversation History ────────────────────────────┤
│  (previous messages in this topic, if any)         │
├─ Existing Rules ──────────────────────────────────┤
│  1. Standard return window: 30 days                │
│  2. VIP customers: 45-day return window            │
│  3. ...                                            │
└───────────────────────────────────────────────────┘
```

**输出：**
```json
{
  "confirmation_message": "Understood! I've added this as a temporary rule:",
  "proposed_rule": {
    "type": "new",
    "text": "Orders placed between March 15-31, 2026 have a 60-day return window (expires May 30, 2026). Applies to all customers.",
    "source": "manager_directive",
    "tags": ["returns", "promotion"],
    "validUntil": "2026-05-30"
  },
  "needs_confirmation": true
}
```

**Mock Prompt — Team Lead (Manager Directive → Rule)：**

```
You are the Team Lead for {{company_name}}'s AI support team.
The Manager just sent you an instruction. Your job is to:
1. Parse it into a structured, actionable rule
2. Confirm your understanding back to the Manager
3. Wait for their confirmation before applying

## Manager's Message
{{manager_message}}

## Conversation History
{{conversation_history}}

## Existing Rules
{{#each rules}}
{{@index + 1}}. {{this.text}}
{{/each}}

## Your Task
1. Extract the rule from the Manager's message
2. Make it specific and unambiguous
3. Check for conflicts with existing rules
4. If the rule has a time boundary, set validUntil
5. Present it back for confirmation

## Output Format
{
  "confirmation_message": "Brief acknowledgment + the rule you understood",
  "proposed_rule": {
    "type": "new" | "update",
    "current_text": "(only for updates)",
    "text": "The structured rule",
    "source": "manager_directive",
    "tags": ["..."],
    "validUntil": "YYYY-MM-DD (if applicable)"
  },
  "conflicts": [
    {
      "existing_rule_id": "...",
      "conflict_description": "..."
    }
  ],
  "needs_confirmation": true
}

## Guidelines
- Always confirm understanding before applying. Never assume.
- If the instruction is vague, make your best interpretation AND explicitly
  state your assumptions so the Manager can correct them.
  Example: "I understand this as: [rule]. I'm assuming this applies to
  online orders only — should it also cover in-store?"
- If there's a conflict with an existing rule, flag it clearly.
- Keep the rule text concise. One rule = one clear statement.
```

---

## 5. Onboarding 流程中的 Agent 行为

### 5.1 阶段 1: Connect（Integration）

此阶段无 LLM 参与，纯工程逻辑：OAuth 授权 → API 连接 → 数据拉取。

### 5.2 阶段 2: Set Up Playbook

**Step 1: 文档解析 → Rule 提取**

**输入：**
```
┌─ Document ────────────────────────────────────────┐
│  filename: "Return_Policy_2026.pdf"                │
│  content: (parsed text from PDF)                   │
│  "Our return policy allows returns within 30 days  │
│   of purchase. Items must be in original packaging.│
│   Defective items can be returned within 90 days.  │
│   Shipping costs for returns are $8.95 unless the  │
│   item is defective, in which case we cover it."   │
└───────────────────────────────────────────────────┘
```

**输出：**
```json
{
  "extracted_rules": [
    {
      "text": "Standard return window is 30 days from purchase date.",
      "source": "document",
      "tags": ["returns"],
      "source_doc_id": "doc-1",
      "source_location": "Page 1, Paragraph 1"
    },
    {
      "text": "Returned items must be in original packaging.",
      "source": "document",
      "tags": ["returns"],
      "source_doc_id": "doc-1",
      "source_location": "Page 1, Paragraph 1"
    },
    {
      "text": "Defective items have a 90-day return window.",
      "source": "document",
      "tags": ["returns", "defective"],
      "source_doc_id": "doc-1",
      "source_location": "Page 1, Paragraph 2"
    },
    {
      "text": "Return shipping costs $8.95 for non-defective returns. Defective items have free return shipping.",
      "source": "document",
      "tags": ["returns", "shipping"],
      "source_doc_id": "doc-1",
      "source_location": "Page 1, Paragraph 3"
    }
  ],
  "ambiguities": [
    {
      "description": "Does '30 days from purchase' mean from order date or delivery date?",
      "suggested_clarification": "I extracted '30 days from purchase date' — should this be from the order date or the delivery date?"
    }
  ]
}
```

**Mock Prompt — Team Lead (Document → Rules)：**

```
You are the Team Lead for {{company_name}}'s AI support team.
The Manager just uploaded a document. Your job is to extract clear,
actionable rules from it.

## Document
Filename: {{filename}}
Content:
{{document_content}}

## Your Task
1. Read the document carefully
2. Extract every actionable rule as a separate, standalone statement
3. Each rule must be self-contained (understandable without reading the document)
4. Identify any ambiguities that need Manager clarification
5. Tag each rule with relevant business categories

## Output Format
{
  "extracted_rules": [
    {
      "text": "Clear, standalone rule statement",
      "source": "document",
      "tags": ["category"],
      "source_doc_id": "{{doc_id}}",
      "source_location": "Page X, Section Y"
    }
  ],
  "ambiguities": [
    {
      "description": "What's ambiguous",
      "suggested_clarification": "Question to ask the Manager"
    }
  ]
}

## Guidelines
- One rule per statement. Don't combine multiple conditions into one rule.
  Bad: "Returns within 30 days, items in original packaging, defective 90 days."
  Good: Three separate rules.
- Make rules actionable. Bad: "We have a return policy." Good: "Standard return
  window is 30 days from purchase date."
- Flag genuine ambiguities, not obvious things. Don't over-flag.
- Preserve specific numbers, thresholds, and conditions exactly as stated.
```

**Step 2: 规则冲突检测**

当文档提取的 Rule 与历史工单行为不一致时：

**输入：**
```
┌─ Extracted Rule ──────────────────────────────────┐
│  "Standard return window is 30 days."              │
├─ Historical Pattern ──────────────────────────────┤
│  In last 90 days: 15 tickets where return was      │
│  accepted after 30 days. 12 of these were VIP      │
│  customers (3+ orders).                            │
└───────────────────────────────────────────────────┘
```

**输出：**
```json
{
  "conflict": {
    "document_rule": "Standard return window is 30 days.",
    "observed_behavior": "In the last 90 days, your team accepted 15 returns after 30 days. 12 of these were for VIP customers (3+ orders).",
    "suggested_resolution": "It looks like your team already extends the return window for VIP customers. Would you like me to add a rule: 'VIP customers (3+ orders) have a 45-day return window'?",
    "options": [
      "Keep document rule (30 days for everyone)",
      "Add VIP exception (45 days for 3+ orders)",
      "Custom: specify your own rule"
    ]
  }
}
```

### 5.3 阶段 3: Hire Rep — Sanity Check

**输入：**
```
┌─ Agent Config (just configured) ──────────────────┐
│  name: "Alex"                                      │
│  tone: "friendly"                                  │
│  rules: [all configured rules]                     │
│  action_permissions: [all configured permissions]  │
├─ Test Scenarios ──────────────────────────────────┤
│  Scenario 1: Simple refund request within policy   │
│  Scenario 2: Damage claim requiring judgment       │
│  Scenario 3: Edge case requiring escalation        │
└───────────────────────────────────────────────────┘
```

**Mock Prompt — AI Rep (Sanity Check)：**

```
You are {{agent_name}}, about to start working as a customer support rep.
Your Manager wants to see how you'd handle these scenarios before going live.

## Your Config
(same as Section 2.4 system prompt)

## Test Scenarios
For each scenario below, show:
1. Your classification of the customer's intent
2. Which rule(s) you'd apply
3. What action(s) you'd take
4. Your draft reply to the customer

### Scenario 1
{{scenario_1}}

### Scenario 2
{{scenario_2}}

### Scenario 3
{{scenario_3}}

## Output Format (per scenario)
{
  "scenario": 1,
  "intent": "...",
  "rules_applied": ["Rule #X: ..."],
  "actions": ["Action taken"],
  "draft_reply": "Your reply to the customer",
  "confidence": "high" | "medium" | "low",
  "notes": "Any uncertainty or edge cases you noticed"
}
```

---

## 6. 流程间协作：端到端示例

### 6.1 示例：从 Escalation 到 Rule 学习

```
时间线：

T+0   客户发送 ticket: "Can you refund to my PayPal?"
        │
T+1   Orchestrator → AI Rep
        │  Input: ticket context + rules + permissions
        │
T+2   AI Rep 推理:
        │  - Intent: refund to different payment
        │  - Rule match: none
        │  - Action: Issue Refund (guardrail: same payment method)
        │  - Decision: Escalate + Gap Signal
        │
T+3   AI Rep 输出:
        │  ├── Zendesk: Internal Note + Escalate
        │  └── Gap Signal → Orchestrator
        │
T+4   Orchestrator 收到 Gap Signal
        │  ├── 检查去重: 无重复 Topic
        │  └── 调用 Team Lead (Skill 1: Gap → Rule Proposal)
        │
T+5   Team Lead 生成 Rule 提案
        │  Input: Gap Signal + existing rules + historical data
        │  Output: topic_title + context_message + proposed_rule
        │
T+6   Orchestrator 推送到 Messages
        │  创建 Topic: "Refund to different payment method"
        │  状态: Waiting for Response
        │
T+7   Manager 在 Messages 中看到 Topic
        │  ├── 消息 1: "I escalated ticket #4501 because..."
        │  └── 消息 2: [New Rule Card] "For refund requests to..."
        │
T+8   Manager 点击 Accept
        │
T+9   Orchestrator 更新:
        │  ├── Rule 写入 Playbook (status: active)
        │  ├── Topic 状态 → Done
        │  └── AI Rep 的 rules 列表更新
        │
T+10  下一个类似 ticket 进来
        │  AI Rep 现在有了匹配的 Rule → 直接处理
```

### 6.2 示例：从 Manager 行为到 Rule 学习

```
时间线：

T+0   AI Rep escalate ticket #4412 (damaged vase, no photo)
        │  Reason: "Rule requires photo for all damage claims"
        │
T+1   Manager 在 Zendesk 中打开 ticket #4412
        │  看到 Rep's Note + Suggested Reply
        │  决定直接发送 replacement（不要求照片）
        │
T+2   Zendesk Webhook 触发: ticket.comment_added
        │  Payload: manager added public reply on escalated ticket
        │
T+3   Orchestrator 收到 Webhook
        │  ├── 检查: ticket 是否由 AI Rep escalate? → Yes
        │  ├── 拉取完整 ticket 内容 (Zendesk REST API)
        │  └── 调用 Team Lead (Skill 2: Behavior Observation)
        │
T+4   Team Lead 分析:
        │  Input: escalation context + manager's action + ticket metadata
        │  推理: Manager 处理了 $34.99 的损坏物品，没要求照片
        │         现有规则要求所有损坏物品都要照片
        │         推断: 低价物品不需要照片
        │  Output: Rule Update proposal ($80 threshold)
        │
T+5   Orchestrator 推送到 Messages
        │  Topic: "Learned: Damaged item photo not always needed"
        │
T+6   Manager Accept → Rule 更新生效
```

---

## 7. Prompt 管理与版本控制

### 7.1 Prompt 组成结构

每个 Subagent 的 Prompt 由以下部分动态组装：

```
┌─ Static Layer (代码中硬编码) ─────────────────────┐
│  System prompt 框架、Decision framework、          │
│  Output format 规范                                │
├─ Config Layer (数据库读取) ───────────────────────┤
│  Agent identity、Tone、Disclosure settings         │
├─ Knowledge Layer (Skill 包 JSON) ────────────────┤
│  Rules (按 tags 分类的 JSON 文件)                   │
│  Action permissions + Guardrails                   │
├─ Context Layer (实时注入) ────────────────────────┤
│  Ticket 内容、Customer history、                    │
│  Conversation history                              │
└───────────────────────────────────────────────────┘
```

### 7.2 Rule 更新时的 Prompt 刷新

```
Manager Accept Rule
    │
    ▼
Orchestrator 写入数据库
    │
    ▼
更新 Skill 包 JSON 文件
    │
    ▼
下一次 AI Rep 被调用时，自动加载最新 Rules
(无需重启，每次调用时动态读取)
```

### 7.3 实验建议

为了验证系统是否按预期工作，建议按以下顺序跑实验：

| 实验 | 目的 | 方法 |
| --- | --- | --- |
| **Exp 1: Rep 基础回复** | 验证 Rep 能否正确匹配 Rule 并回复 | 准备 10 个 ticket，覆盖不同 intent，检查 Rule 匹配准确率 |
| **Exp 2: Gap 检测** | 验证 Rep 能否正确识别知识缺口 | 准备 5 个无匹配 Rule 的 ticket，检查 Gap Signal 质量 |
| **Exp 3: Rule 提案质量** | 验证 Team Lead 生成的 Rule 提案是否合理 | 输入 10 个 Gap Signal，评估提案的具体性和可操作性 |
| **Exp 4: 行为观察学习** | 验证 Team Lead 能否从 Manager 行为中正确推断规则 | 模拟 5 个 escalation → Manager 处理场景，检查推断准确率 |
| **Exp 5: 指令解析** | 验证 Team Lead 能否正确解析 Manager 的自由文本指令 | 输入 10 条不同复杂度的指令，检查结构化 Rule 的准确性 |
| **Exp 6: 端到端** | 验证完整流程 | 模拟一个 ticket 从创建到 Rule 学习的完整生命周期 |

---

## 8. 技术约束与注意事项

| 约束 | 说明 | 影响 |
| --- | --- | --- |
| **LLM 延迟** | 每次 Subagent 调用 1-3 秒 | Rep 回复客户需要控制在 5 秒内；Team Lead 生成提案可以异步 |
| **Token 限制** | Rules 列表可能很长 | 需要 Rule 检索机制（向量搜索或关键词匹配），不能每次都传全量 Rules |
| **幻觉风险** | LLM 可能编造不存在的规则 | Rep 的 Decision Framework 必须明确：无匹配 Rule 时 Escalate，不要猜测 |
| **并发** | 多个 ticket 同时处理 | 每个 ticket 独立调用 Rep，无共享状态；Rule 更新需要原子操作 |
| **Webhook 可靠性** | Zendesk Webhook 可能丢失或延迟 | 需要幂等处理 + 定期对账（V2 的定时任务可兼顾） |
| **Prompt 注入** | 客户消息可能包含恶意指令 | Rep 的 System Prompt 需要明确隔离客户消息，加入安全边界 |

---

## 9. 附录：完整 Prompt 模板索引

| Prompt | Section | 用途 |
| --- | --- | --- |
| AI Rep System Prompt | 2.4 | Rep 回复客户的主 Prompt |
| Team Lead: Gap → Rule Proposal | 4.1 | 从知识缺口生成 Rule 提案 |
| Team Lead: Behavior Observation | 4.2 | 从 Manager 行为观察生成 Rule 提案 |
| Team Lead: Manager Directive → Rule | 4.3 | 将 Manager 自由文本指令转为结构化 Rule |
| Team Lead: Document → Rules | 5.2 | 从上传文档中提取 Rule |
| AI Rep: Sanity Check | 5.3 | Onboarding 中的场景测试 |
