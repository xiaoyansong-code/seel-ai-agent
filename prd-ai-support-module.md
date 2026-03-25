# PRD: Seel AI Support Module

**Version:** 1.0 MVP  
**Last Updated:** 2026-03-25  
**Status:** Draft for Review

---

## 1. Overview

### 1.1 What is it

Seel AI Support 是 Seel 平台内嵌的 AI 客服自动化模块。商家可以配置、部署和监控 AI Agent，让它在多个渠道（Live Chat、Email、Social Messaging）上自主处理售后客服对话。

### 1.2 Target Users

- **CX Manager / Team Lead** — 日常使用者，负责配置 Agent、监控表现、审核对话质量
- **E-commerce Operations Manager** — 关注 ROI 和效率指标

### 1.3 Core Value Proposition

- 自动化处理高频、标准化的售后问题（WISMO、退款、退换货等）
- 提供透明的推理过程，让 CX Manager 理解 Agent 的每一步决策
- 通过 Skill-based 架构实现灵活配置，无需技术背景即可调整 Agent 行为

### 1.4 MVP Scope Boundary

| 范围 | MVP (V1.0) | 未来版本 |
|------|-----------|---------|
| 渠道 | Live Chat (RC Widget) | Email (Zendesk), Social Messaging |
| Agent 数量 | 支持多 Agent 创建，1 个 Live | 多 Agent 同时 Live |
| Skill 管理 | 全局 Playbook + Agent 级别开关 | Skill 自定义 prompt、per-agent 参数覆盖 |
| 测试 | Single Test（Simulator） | Batch Test (V1.1) |
| 安全 | Guardrails 框架预留 | Guardrails 完整实现 |
| 反馈 | Flag for Review | Instruct Agent |
| 部署 | 直接上线 | A/B Testing |

---

## 2. Information Architecture

```
AI Support (顶部 Tab)
├── Agents (默认页)
│   ├── Agent 列表 + Status Banner
│   ├── Expand to More Channels 引导
│   ├── Opportunities
│   └── Agent Detail
│       ├── Overview (精简指标 + Performance 跳转)
│       ├── Configuration (Skills / Channel / Guardrails)
│       └── Simulator (Single Test / Batch Test V1.1)
├── Playbook
│   ├── Knowledge (知识库管理)
│   ├── Skills (全局 Skill 配置)
│   └── Actions (API 动作管理)
└── Performance
    ├── Overview (指标卡 + Skill 表 + Agent Breakdown)
    └── Conversations (对话列表 + 对话详情 + Reasoning Trace)
```

---

## 3. Feature Spec

### 3.1 Agents Tab — 列表页

**目的：** 让用户一眼看到 Agent 运行状态，建立信心，并引导 Scale。

**MVP 内容：**

- **页面标题 + 说明文案** — 一句话说明模块用途
- **Status Banner** — 展示 Live Agent 的核心指标汇总（conversations handled、resolution rate、avg response time、CSAT）
  - 仅当存在 Live Agent 时展示
  - 点击跳转 Performance Overview
- **Agent 卡片列表**
  - Live Agent：展示 3 个核心指标（Sessions 7d、Resolution、CSAT）
  - Setting Up Agent：展示下一步 CTA + 进度条
  - 点击进入 Agent Detail
- **Expand to More Channels** — 展示未覆盖的渠道卡片
  - 每张卡片一句话说明 + "Set up in 5 minutes" 引导
  - 点击直接打开 Create Agent 对话框并预选渠道
  - 仅当存在未覆盖渠道时展示
- **Opportunities** — 可操作的改进建议列表
  - 每项带状态标签（颜色编码）
  - 点击跳转到对应配置页
- **Create Agent 对话框** — 选择渠道 → 命名 → 创建
  - 创建后进入 Setting Up 状态

**待讨论：**

- [ ] Opportunities 的数据来源：是后端自动检测还是预设规则？MVP 建议预设规则，后续迭代为动态检测。

---

### 3.2 Agent Detail — Overview

**目的：** 快速了解 Agent 当前状态，提供 Performance 深入分析的入口。

**MVP 内容：**

- **精简指标卡** — 5 个核心指标（Sessions、Resolution Rate、Avg Response、CSAT、Escalation Rate）
  - 每个指标带 trend 标注
- **"View in Performance" 按钮** — 跳转 Performance 页面，URL 自动带 `?agent=AgentName` 参数
- **Recent Activity** — 最近 5 条 Agent 操作日志（时间、动作、工单号、详情、状态）

**不包含：**

- 不展示完整对话列表（避免与 Performance > Conversations 重复）
- 不展示 Conversational Management（移至 Conversation Detail 的 Instruct Agent）

---

### 3.3 Agent Detail — Configuration

**目的：** 集中管理 Agent 的所有配置项。

#### 3.3.1 Skills 配置

- **默认行为：** 全局 Playbook 中开启的 Skill 自动同步为 Agent 默认开启
- **展示方式：** 收起状态只展示 Skill 名称 + 开关；点击展开查看描述和统计数据
- **操作：** 可逐个开关、可添加新 Skill
- **标记：** Global 标签标识全局开启的 Skill

#### 3.3.2 Channel Settings

**Live Chat 渠道：**
- Agent Display Name — 客户在聊天窗口看到的名称
- Welcome Message — 开场白
- Escalation Email — 升级对话的接收邮箱

**Email 渠道：**
- Deployment Mode — Autopilot / Shadow（草稿供人工审核）
- Escalation Group — 升级对话的目标组

#### 3.3.3 Guardrails

- **MVP：** 标记 Coming Soon，展示框架预览（安全限制、自动退款上限、升级规则）
- **未来：** 完整的规则引擎配置

#### 3.3.4 Production Edit 保护

- 当 Agent 处于 Live 状态时，保存配置变更需要二次确认
- 确认弹窗提示影响范围 + A/B Testing Coming Soon 预告

**技术标记：**

- [ ] **Pending:** Skill 的 per-agent 参数覆盖（如不同 Agent 对同一 Skill 使用不同的退款上限）。MVP 仅支持开关，不支持参数覆盖。
- [ ] **Pending:** Guardrails 的规则引擎设计。需要定义规则类型（金额限制、时间窗口、关键词触发等）和执行优先级。

---

### 3.4 Agent Detail — Simulator

**目的：** 在部署前测试 Agent 的响应质量。

#### 3.4.1 Single Test (MVP)

- 聊天窗口形式，用户扮演客户输入消息
- Agent 回复展示：
  - 回复文本
  - 执行的 Actions（如 `get_order_status → process_refund`）
  - Agent Thinking（自然语言推理过程）
- 预设快捷问题供快速测试

#### 3.4.2 Batch Test (V1.1)

- **标记为 V1.1，当前不实现**
- 预期功能：
  - 预设测试用例集（8-10 条覆盖不同 Skill 的场景）
  - 批量运行，逐条展示结果（Pass / Warn / Fail）
  - 每条结果可 Deep Dive 查看完整 Reasoning Trace（与 Conversation Detail 一致的信息深度）
  - 历史 Batch Test 记录入口
  - QA Agent 判断依据的展示

**技术标记：**

- [ ] **Pending:** Batch Test 的 QA Agent 评判标准定义。需要明确 Pass/Warn/Fail 的判断逻辑（基于 intent 匹配、action 正确性、response 质量？）。
- [ ] **Pending:** 测试用例的自定义编辑能力。

---

### 3.5 Playbook — Knowledge

**目的：** 管理 Agent 可引用的知识库文章。

**MVP 内容：**

- 文章列表（标题、分类、最后更新时间、引用次数）
- 搜索和分类筛选
- 文章详情查看
- 新建 / 编辑文章

**技术标记：**

- [ ] **Pending:** 知识库的向量化索引方案。需要确认使用哪个 embedding 模型和向量数据库。

---

### 3.6 Playbook — Skills

**目的：** 全局定义 Agent 可执行的能力。

**MVP 内容：**

- Skill 列表（名称、描述、开关状态、关联 Agent 数量）
- 每个 Skill 的配置：
  - 描述和触发条件
  - 关联的 Actions
  - 关联的 Knowledge 文章
- 全局开关影响所有 Agent 的默认状态

---

### 3.7 Playbook — Actions

**目的：** 管理 Agent 可调用的外部 API 动作。

**MVP 内容：**

- Action 列表（名称、类型、调用次数、成功率）
- 预置 Actions：get_order_status、process_refund、cancel_order、update_shipping_address、send_tracking_link
- Action 详情：endpoint、参数、调用日志

**技术标记：**

- [ ] **Pending:** 自定义 Action 的创建流程。MVP 使用预置 Actions，后续支持用户自定义 API endpoint。

---

### 3.8 Performance — Overview

**目的：** 全局视角的 Agent 表现监控。

**MVP 内容：**

- **5 个核心指标卡：** Total Sessions、Resolution Rate、Avg Handling Time、Escalation Rate、CSAT Score
  - 每个指标带 vs 上周期的变化趋势
- **By Agent 筛选** — 下拉选择特定 Agent 查看数据
  - 仅当 2+ Agent 存在时展示
  - 支持 URL 参数 `?agent=` 用于从 Agent Detail 跳转时自动筛选
- **Skill Performance 表** — 按 Skill 维度展示 tickets、resolution rate、handling time、escalation rate、CSAT
- **Agent Breakdown 表** — 按 Agent 维度展示 sessions、resolution、CSAT

**未来：**

- 核心指标的 7 天趋势折线图
- 自定义时间范围选择

---

### 3.9 Performance — Conversations

**目的：** 审核和分析具体对话质量。

#### 3.9.1 对话列表

**MVP 内容：**

- 列表字段：Customer、Subject、Agent、Skill、Outcome、Sentiment、Duration、Time
- **筛选：**
  - By Agent（仅 2+ Agent 时展示，支持 URL 参数自动筛选）
  - By Outcome（Resolved / Escalated / Pending）
  - 搜索（客户名、主题关键词）
- **Sentiment 展示：** 起始 → 结束的情绪变化，用标签标注（如 "Frustrated → Satisfied"）
  - 颜色编码：绿色（Positive）、灰色（Neutral）、红色（Negative）
- 点击进入对话详情

#### 3.9.2 对话详情

**MVP 内容：**

- **左侧：Chat History**
  - 按时间顺序展示客户和 Agent 的对话
  - Agent 的连续回复归为一组
  - 每组 Agent 回复旁边有两个入口：
    - **"View Reasoning"** — 点击后右侧展示该组对应的 Reasoning Trace
    - **"Flag Reply"** — 标记该回复需要审核，Feedback 内容非必填
  - **"Instruct Agent"** — Coming Soon 预告，未来支持直接指导 Agent 行为

- **右侧：Reasoning Trace**
  - 同时只展示一个 Reasoning（对应左侧选中的 Agent 回复组）
  - 推理步骤（按顺序）：
    1. **Intent Detection** — 识别到的用户意图
    2. **Skill Matched** — 匹配到的 Skill 及匹配原因
    3. **Agent Thinking** — 自然语言的推理过程（非技术性，CX Manager 可读）
    4. **Actions Executed** — 调用的 API 及返回结果
    5. **Knowledge Referenced** — 引用的知识库文章
    6. **Guardrails Checked** — 安全规则检查结果（Pass / Triggered）
  - 不展示技术性指标（如 chunk ID、embedding score、token count）

**技术标记：**

- [ ] **关键：** Reasoning Trace 的数据结构需要与推理引擎对齐。建议后端返回标准化 JSON Schema，包含上述 6 个步骤的结构化数据。前端根据 Schema 渲染。
- [ ] **Pending:** "Flag Reply" 的数据存储和后续工作流。标记后的数据如何流转到 Agent 训练/优化环节？

---

### 3.10 Setting Up Flow（Agent 首次配置）

**目的：** 引导用户完成 Agent 的首次配置。

**MVP 内容（以 Email Agent 为例）：**

1. **Connect Integration** — 输入 Zendesk subdomain，连接账户
2. **Configure Trigger** — 设置 Webhook，验证连接
3. **Select Skills** — 选择要启用的 Skill（全局开启的默认勾选）
4. **Channel Settings** — 配置渠道特定参数
5. **Test Agent** — 侧边栏测试面板
6. **Save & Continue** — 保存配置，状态变为 Ready to Test

**技术标记：**

- [ ] **Pending:** 不同渠道的集成方式差异较大。Live Chat (RC Widget) 是 JS SDK 嵌入；Email (Zendesk) 是 Webhook + API；Social 需要 OAuth。需要分别设计集成流程。

---

## 4. Cross-cutting Concerns

### 4.1 Navigation & Deep Linking

- Agent Detail → Performance：URL 带 `?agent=AgentName`，Performance 页面自动筛选
- By Agent 筛选器：仅当 2+ Agent 存在时展示（Overview 和 Conversations 一致）
- Seel 全局侧边栏 → AI Support 模块入口

### 4.2 Data Model（概要）

| Entity | Key Fields | Notes |
|--------|-----------|-------|
| Agent | id, name, status, channel, skills[], config | status: setting-up / ready-to-test / live / paused |
| Skill | id, name, description, enabled, actions[] | 全局级别，Agent 级别可覆盖开关 |
| Action | id, name, type, endpoint, params | 预置 + 未来自定义 |
| Conversation | id, customer, agent, messages[], reasoningTraces[], outcome, sentiment | |
| ReasoningTrace | intentDetected, skillMatched, thinking, actions[], knowledgeRefs[], guardrailsResult | 每组 Agent 回复对应一个 Trace |
| KnowledgeArticle | id, title, category, content, lastUpdated | |

### 4.3 Reasoning Trace JSON Schema（建议）

```json
{
  "turn_index": 1,
  "intent": { "detected": "order_tracking", "confidence": "high" },
  "skill_matched": { "id": "s2", "name": "WISMO", "reason": "Customer asking about order status" },
  "thinking": "The customer wants to know where their order is. I'll look up the order details and provide tracking information.",
  "actions": [
    { "name": "get_order_status", "input": { "order_id": "8834" }, "output": { "status": "in_transit", "carrier": "FedEx" }, "duration_ms": 230 }
  ],
  "knowledge_refs": [
    { "article_id": "kb-12", "title": "Shipping Policy", "relevance": "high" }
  ],
  "guardrails": { "checked": true, "result": "pass", "rules_evaluated": ["max_refund_amount", "escalation_threshold"] }
}
```

---

## 5. 已识别的问题与讨论项

### 5.1 需要讨论

| # | 问题 | 影响 | 建议 |
|---|------|------|------|
| 1 | Batch Test 的 QA Agent 评判标准未定义 | 影响 V1.1 的 Batch Test 功能 | 建议定义 3 层评判：Intent 匹配、Action 正确性、Response 质量 |
| 2 | "Flag Reply" 后的数据流转 | 标记的 Bad Case 如何进入 Agent 优化循环 | MVP 先存储，后续接入 fine-tuning pipeline |
| 3 | Guardrails 的规则类型和优先级 | 影响 Guardrails 功能设计 | 建议先定义 3-5 种核心规则类型（金额上限、时间窗口、关键词黑名单、必须升级场景、合规声明） |
| 4 | 多 Agent 同时 Live 的冲突处理 | 同一客户在不同渠道同时对话时的上下文共享 | MVP 不处理，各渠道独立；V2 考虑统一客户 Profile |
| 5 | Knowledge 的向量化方案 | 影响 Agent 的知识检索质量 | 需要确认 embedding 模型选型和 chunk 策略 |

### 5.2 技术风险

| 风险 | 等级 | 缓解方案 |
|------|------|---------|
| Reasoning Trace 数据量大，影响页面加载 | 中 | 分页加载 + 懒加载 Trace 详情 |
| 多渠道集成复杂度高 | 高 | MVP 只做 Live Chat，Email 和 Social 作为 Setting Up 流程预留 |
| 实时对话的 WebSocket 稳定性 | 中 | Live Chat 依赖 RC Widget 的连接管理，Seel 侧只处理 Webhook 回调 |

---

## 6. MVP Milestone Plan

| Phase | 内容 | 依赖 |
|-------|------|------|
| M1 | Agent CRUD + Setting Up Flow + Single Test | 推理引擎 API |
| M2 | Performance Overview + Conversations 列表 | 对话数据存储 |
| M3 | Conversation Detail + Reasoning Trace | Reasoning Trace JSON Schema 对齐 |
| M4 | Playbook (Knowledge + Skills + Actions) | 知识库向量化方案 |
| M5 | Production Edit 保护 + Flag Reply | 反馈数据存储 |

---

## Appendix: Feature Status Reference

| Feature | Status | Version |
|---------|--------|---------|
| Agent 列表 + Status Banner | MVP | V1.0 |
| Agent Detail Overview | MVP | V1.0 |
| Agent Configuration (Skills + Channel) | MVP | V1.0 |
| Single Test Simulator | MVP | V1.0 |
| Batch Test Simulator | Planned | V1.1 |
| Guardrails | Coming Soon | V1.2+ |
| A/B Testing | Coming Soon | V1.2+ |
| Instruct Agent | Coming Soon | V1.2+ |
| Performance Overview | MVP | V1.0 |
| Performance Conversations | MVP | V1.0 |
| Conversation Detail + Reasoning Trace | MVP | V1.0 |
| Playbook Knowledge | MVP | V1.0 |
| Playbook Skills | MVP | V1.0 |
| Playbook Actions | MVP | V1.0 |
| Email Channel Integration | Planned | V1.1 |
| Social Messaging Integration | Planned | V2.0 |
