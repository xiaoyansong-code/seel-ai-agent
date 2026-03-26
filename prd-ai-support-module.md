# PRD: Seel AI Support Module

**Version:** 2.1 MVP | **Last Updated:** 2026-03-26 | **Status:** Draft for Review

---

## 1. Overview

**1.1 What is it**

Seel AI Support 是 Seel 平台内嵌的 AI 客服自动化模块。商家可以配置、部署和监控 AI Agent，让它在多个渠道上自主处理售后客服对话。

**1.2 Target Users**

- **CX Manager / Team Lead** — 日常使用者，配置 Agent、监控表现、审核对话质量
- **E-commerce Operations Manager** — 关注 ROI 和效率指标

**1.3 Core Value Proposition**

- 自动化处理高频售后问题（WISMO、退款、退换货等）
- 透明的推理过程，CX Manager 能理解 Agent 每一步决策
- Skill-based 架构，无需技术背景即可调整 Agent 行为

---

## 2. MVP Scope Boundary

| 模块 | MVP (V1.0) 实现范围 | 未来版本拓展 |
| --- | --- | --- |
| **渠道** | Live Chat (RC Widget) 完整上线 | Email via Zendesk (V1.1)；Social Messaging (V2.0) |
| **Agent 管理** | 多 Agent 创建、单页配置向导、至少 1 个 Live Agent | 多 Agent 同时 Live + 跨渠道 Profile (V2.0) |
| **Playbook** | Knowledge 知识库 + Skills 全局配置 + Actions 预置动作 | 自定义 Action 创建 (V1.1)；Skill per-agent 参数覆盖 (V2.0) |
| **Agent 配置** | Skills 开关（跟随全局默认）+ Channel Settings + CSAT 收集 | Guardrails 规则引擎 (V1.2)；A/B Testing 部署 (V2.0) |
| **测试** | Single Test Simulator（页面内展开，含 Reasoning） | Batch Test + QA Agent 评判 + 历史记录 (V1.1) |
| **监控** | Performance Overview（4 指标卡 + 4 图表 + Skill/Agent 维度表） | 时间趋势折线图 (V1.1)；自定义报表导出 (V2.0) |
| **对话审核** | Conversations 列表 + 详情 + Reasoning Trace（6 步推理链） | Instruct Agent 在对话中直接指导 (V1.2) |
| **反馈** | Flag for Review（标记 Bad Case，内容非必填） | Flag → fine-tuning pipeline 自动闭环 (V2.0) |
| **Knowledge Gap Detection** | Reasoning Trace 被动检测（无匹配知识时标记）+ Suggest Article 表单 + Performance 维度统计 | 自动聚类 + 自动草稿生成 (V1.1)；Gap → Knowledge 自动闭环 (V2.0) |
| **引导** | 首次进入弹窗 + 各页面可关闭提示 | 分步 Onboarding Tour (V1.2) |

---

## 3. Information Architecture

```
AI Support (顶部 Tab)
├── Agents (默认页)
│   ├── Agent 列表 + Status Banner + 新商家介绍弹窗
│   ├── Expand to More Channels 引导
│   ├── Better Your Customer Experience (改进建议)
│   └── Agent Detail
│       ├── [Setting Up] 配置向导（单页）
│       ├── [Ready to Test] 测试引导页
│       └── [Live] Overview / Configuration / Simulator
├── Playbook
│   ├── Knowledge (知识库管理)
│   ├── Skills (全局 Skill 配置)
│   └── Actions (API 动作管理)
├── Performance
│   ├── Overview (指标卡 + 图表 + Skill/Agent 维度表)
│   └── Conversations (对话列表 + 对话详情 + Reasoning Trace)
└── Settings
    ├── Integrations (渠道连接管理)
    ├── Team (成员权限)
    └── Global Guardrails (全局安全规则)
```

---

## 4. Feature Spec

**1. Agents Tab — 列表页**

目的：传递 "你的 Agent 正在工作" 的信心，引导用户 Scale 到更多渠道。

- **1a. 新商家介绍弹窗**
  - 首次进入时弹出，介绍 AI Support 核心价值
  - 内容：标题 + 副标题 + 3 条卖点（快速解决、提升效率、个性化推荐）+ 底部统计数据
  - 右侧展示 AI 对话示例（模拟真实客服场景）
  - CTA："Enable AI Support" 关闭弹窗进入页面、"Learn more" 跳转帮助文档
  - 关闭后不再重复展示（localStorage 记录）

- **1b. Status Banner**
  - 仅当存在 Live Agent 时展示
  - 用自然语言概括 Agent 表现（如 "Your AI agent resolved 91% of 847 conversations this week"）
  - 展示 4 个核心指标：Conversations Handled、Resolution Rate、Avg Response Time、CSAT
  - 点击跳转 Performance Overview

- **1c. Agent 卡片列表**
  - Live Agent 卡片：展示 3 个核心指标（Sessions 7d、Resolution Rate、CSAT），点击进入 Live View
  - Setting Up Agent 卡片：展示进度（"Step 1 of 3"）+ 步骤列表（✓ Create → Connect → Test & Go Live）+ 下一步 CTA

- **1d. Expand to More Channels**
  - 展示条件：存在至少一个未覆盖的渠道
  - 动态排除已有 Agent 的渠道
  - 可选渠道：Live Chat Widget（全局嵌入）、Email via Zendesk、Social Messaging
  - 每张卡片：渠道名 + 一句话说明 + "Set up in 5 minutes" 引导
  - 点击直接打开 Create Agent 对话框并预选渠道

- **1e. Better Your Customer Experience**
  - 可操作的改进建议列表
  - 每项展示：标题 + 当前状态（变量用高亮色）+ 改进收益
    - 例："Sync knowledge base — **60% synced** — Improve accuracy by covering all product categories"
    - 例："Review knowledge gaps — **21 gaps** detected this week — suggest articles to improve coverage"
  - 点击跳转到对应配置页
  - Knowledge Gap 卡片：链接到 Performance > Conversations，引导 CX Manager 审核无知识匹配的对话

- **1f. Create Agent 对话框**
  - 触发方式：页面右上角按钮 或 Expand 区域卡片点击
  - 流程：选择渠道类型 → 输入 Agent 名称 → 创建 → 跳转 Setting Up View

> **待讨论：** Better Your Customer Experience 的数据来源——MVP 建议预设规则，后续迭代为后端动态检测。

---

**2. Agent Detail — Setting Up Flow**

目的：引导用户在单页内完成 Agent 首次配置，降低感知操作成本。

- **2a. Integration 区块**
  - Live Chat (RC Widget)：展示嵌入代码 snippet，用户复制到网站
  - Email (Zendesk)：
    - 输入 Zendesk subdomain → 点击 Connect → OAuth 授权
    - 连接成功后展示 Webhook URL + 配置指南（可展开步骤说明）
    - Webhook 状态实时检测（Waiting → Testing → Connected）

- **2b. Skills 选择**
  - 全局开启的 Skill 默认勾选
  - 可手动开关、可从全局 Playbook 添加新 Skill
  - 展示方式：Skill 名称 + 开关 + 简要描述

- **2c. Channel Settings**
  - Live Chat：Agent Display Name + Welcome Message + Escalation Email
  - Email：Deployment Mode（Autopilot / Shadow）+ Escalation Group

- **2d. Bottom Actions**
  - "Test Agent" → 页面内展开测试面板（Single Test + Batch Test V1.1 标记）
  - "Save & Continue" → 保存配置，状态变为 Ready to Test

> **技术标记：** 不同渠道的集成方式差异大（Live Chat 是 JS SDK 嵌入，Email 是 Webhook + API，Social 需要 OAuth），需分别设计集成流程。

---

**3. Agent Detail — Ready to Test View**

目的：Agent 配置完成后，引导用户测试并上线。

- 顶部提示卡：说明 Agent 已配置完成，建议测试后上线
- 两个 CTA："Open Simulator" 展开测试面板、"Go Live" 直接上线
- 下方展示配置摘要（已启用的 Skills、Channel 信息）
- 测试面板与 Setting Up 一致，页面内展开

---

**4. Agent Detail — Live View**

Agent 上线后的管理界面，包含 3 个 Tab：Overview、Configuration、Simulator。

- **4a. Overview Tab**
  - 精简指标卡（5 个）：Sessions、Resolution Rate、Avg Response Time、CSAT、First Response Time
    - 每个指标带 trend 标注（如 "+3.2% vs last week"）
  - "Open in Performance Dashboard →" 链接：跳转 Performance，URL 自动带 `?agent=AgentName`
  - Recent Activity：最近 5 条 Agent 操作日志，按日期分组，每条含时间、动作描述、工单号、状态标签
  - 不包含完整对话列表和 Conversational Management（均在 Performance 侧）

- **4b. Configuration Tab**
  - **Skills 配置**
    - 默认行为：全局 Playbook 中开启的 Skill 自动同步为 Agent 默认开启
    - 收起状态：Skill 名称 + 开关 + "Playbook default" 标签
    - 展开状态：描述、关联 Conversations 数、成功率、"Edit in Playbook →" 跳转链接
    - 操作：逐个开关、添加新 Skill
  - **Channel Settings**
    - Live Chat：Agent Display Name + Welcome Message + Escalation Email（无 Deployment Mode，默认 Autopilot）
    - Email：Deployment Mode（Autopilot / Shadow）+ Escalation Group + "Test Connection" 按钮
  - **CSAT Collection**
    - Live Chat：内置 CSAT 问卷，对话结束后自动展示，无需配置
    - Email：两种收集方式可选
      - External Provider：选择调查工具（Zendesk Survey / Delighted / Typeform / Other），通过集成自动同步
      - Webhook Integration：配置自定义 Webhook URL，Seel 发送 POST 推送 CSAT 数据
        - Payload：`{ "conversation_id": "...", "score": 1-5, "comment": "..." }`
  - **Guardrails（Coming Soon）**
    - 展示 5 个具体可用的 Guardrail 预览（只读，不可配置）：
      - Risk Word Escalation (high) — 客户使用威胁性或法律语言时升级
      - Brand Voice Enforcement (medium) — 确保回复遵循品牌语调
      - PII Protection (critical) — 阻止访问或分享客户 PII
      - Repeated Failure Escalation (medium) — 连续 3 次解决失败后升级
      - Auto-refund Limit (high) — Agent 可自主退款的最大金额
    - 每项带 severity 标签和锁定图标
  - **Production Edit 保护**
    - Live 状态下修改配置，底部出现 Save 栏
    - 点击 Save 弹出 AlertDialog 二次确认："Changes will affect live conversations immediately"
    - 提供 "Save Changes" / "Cancel" 选项
    - 预告 A/B Testing Coming Soon

- **4c. Simulator Tab**
  - **Single Test (MVP)**
    - 聊天窗口形式，用户扮演客户输入消息
    - 预设快捷问题供快速测试（覆盖不同 Skill + 边界 case）：
      - Order status、Refund request、Shipping delay、Wrong item received、Product recommendation、Edge case（gibberish input）
    - Agent 回复展示：
      - 回复文本
      - Intent Detected — 识别到的用户意图标签
      - Skill Matched — 匹配到的 Skill 名称
      - Actions Executed — 调用的 API 链
      - Agent Thinking — 自然语言推理过程
  - **Batch Test (V1.1 — 当前不实现)**
    - 预设测试用例集（8-10 条覆盖不同 Skill）
    - 批量运行，逐条展示结果（Pass / Warn / Fail）
    - 每条可 Deep Dive 查看完整 Reasoning Trace（与 Conversation Detail 一致的信息深度）
    - 历史 Batch Test 记录入口
    - QA Agent 判断依据展示

> **技术标记：** Batch Test 的 QA Agent 评判标准需定义（Intent 匹配准确性、Action 正确性、Response 质量）；测试用例的自定义编辑能力。

---

**5. Playbook — Knowledge**

目的：管理 Agent 可引用的知识库内容，确保 Agent 回复有据可依。

- **5a. 知识库列表**
  - 列表字段：标题、分类（Category）、最后更新时间、被 Agent 引用次数
  - 筛选：按分类筛选 + 关键词搜索
  - 排序：默认按引用次数降序，可切换为最近更新
  - 每行可快速查看摘要（hover 或展开）

- **5b. 文章管理**
  - 新建文章：标题 + 分类选择 + 富文本内容编辑
  - 编辑文章：修改内容后保存，自动更新 lastUpdated 时间戳
  - 删除文章：二次确认弹窗（提示 "This article is referenced by X conversations"）
  - 分类管理：预设分类（Shipping、Returns、Product Info、Policies 等）+ 自定义分类

- **5c. 文章与 Agent 的关联**
  - 文章发布后自动进入 Agent 可检索范围
  - 在 Conversation Detail 的 Reasoning Trace 中展示引用的文章标题和相关度
  - 未来：文章级别的引用统计和效果分析

- **5d. 页面提示**
  - 顶部说明提示（解释知识库作用和最佳实践），可关闭（localStorage 记录）

> **技术标记：** 知识库的向量化索引方案需确认 embedding 模型和向量数据库选型。文章更新后需触发重新索引。

---

**6. Playbook — Skills**

目的：全局定义 Agent 可执行的能力单元，每个 Skill 对应一类客户问题的处理逻辑。

- **6a. Skill 列表**
  - 列表字段：名称、描述摘要、全局开关状态、关联 Agent 数量
  - 全局开关：开启/关闭影响所有 Agent 的默认状态
    - 关闭全局 Skill 时，二次确认弹窗（提示 "This will disable this skill for X agents"）
  - 搜索：按名称关键词搜索

- **6b. Skill 配置详情**
  - **Guidance** — 指导 Agent 如何处理该类问题的 prompt 文本
    - 富文本编辑，支持变量插入（如 `{{customer_name}}`、`{{order_id}}`）
    - 示例 prompt 模板供参考
  - **关联 Actions** — 该 Skill 可调用的 API 动作列表
    - 从已连接的 Actions 中选择关联
    - 展示每个 Action 的名称和简要说明
  - **关联 Knowledge** — 该 Skill 优先引用的知识库文章
    - 可手动关联特定文章，也可依赖全局检索

- **6c. Skill 创建**
  - 流程：输入名称 + 描述 → 编写 Guidance → 关联 Actions → 关联 Knowledge → 保存
  - 创建后默认全局开启

- **6d. Skill 与 Agent 的关系**
  - 全局 Skill 开启后，所有 Agent 默认继承
  - Agent 级别可单独关闭某个 Skill（在 Agent Configuration 中操作）
  - Agent 级别不可修改 Skill 的 Guidance 内容（需到 Playbook 修改）

- **6e. 页面提示**
  - 顶部说明提示（解释 Skill 的作用和配置方法），可关闭（localStorage 记录）

- **6f. 预置 Skills**
  - Order Tracking (WISMO)、Return & Exchange、Refund Processing、Shipping Issues、Product Information、General Inquiry

---

**7. Playbook — Actions**

目的：管理 Agent 可调用的外部 API 动作，是 Skill 执行具体操作的底层能力。

- **7a. 已连接的 Actions**
  - 卡片网格展示：名称、类型图标、调用次数、成功率、来源 Connector
  - 点击查看详情：endpoint、参数定义、最近调用日志
  - 每个 Action 关联到一个 Connector（如 Zendesk、Shopify）

- **7b. 未连接的 Actions（Unlock More Actions）**
  - 按 Connector 分组展示（如 Zendesk 组、Shopify 组）
  - 每组展示该 Connector 下可用但未连接的 Actions
  - 每组提供 "Connect [Connector]" 按钮，跳转 Settings > Integrations
  - 连接后 Actions 自动出现在已连接区域

- **7c. 预置 Actions**
  - get_order_status、process_refund、cancel_order、update_shipping_address、send_tracking_link、check_return_eligibility

- **7d. 页面提示**
  - 顶部说明提示，可关闭（localStorage 记录）

> **技术标记：** 自定义 Action 创建流程——MVP 使用预置 Actions，后续支持用户自定义 API endpoint + 参数映射。

---

**8. Performance — Overview**

目的：全局视角的 Agent 表现监控。

- **8a. Core Metrics（4 个指标卡）**
  - Total Sessions — 对话总数 + vs 上周变化
  - Resolution Rate — 自动解决率 + vs 上周变化
  - First Response Time — 首次响应时间 + vs 上周变化
  - Sentiment Change — 情绪改善比例 + vs 上周变化（正数表示 Agent 介入后情绪改善的对话占比）

- **8b. By Agent 筛选**
  - 下拉选择特定 Agent 查看数据
  - 展示条件：仅当 2+ Agent 存在时展示
  - 支持 URL 参数 `?agent=` 用于从 Agent Detail 跳转时自动筛选

- **8c. 图表区域（4 个图表）**
  - User Intent — 水平柱状图，展示各意图分布（Order Status、Refund、Shipping 等）
  - Resolution Result — 环形图，展示 Resolved / Escalated / Not Resolved 比例
  - Resolution Approach — 环形图，展示 Autopilot / Shadow / Merchant / Other 比例
  - Sentiment Change — 环形图，展示情绪变化分布（-2 到 +4 的变化幅度）

- **8d. Skill Performance 表**
  - 按 Skill 维度展示：Tickets、Resolution Rate、Avg Turns（带基准对比）、Knowledge Gaps、CSAT
  - **Knowledge Gaps 列**：统计该 Skill 下 Reasoning Trace 中 `knowledge_refs` 为空的对话数
    - 颜色编码：≥10 红色、≥5 橙色、1-4 灰色、0 显示 "—"
    - 帮助 CX Manager 识别哪些 Skill 领域知识覆盖不足

- **8e. Agent Breakdown 表**
  - 展示条件：仅当 2+ Agent 存在时展示
  - 按 Agent 维度展示：Sessions、Resolution Rate、CSAT

---

**9. Performance — Conversations**

目的：审核和分析具体对话质量。

- **9a. 对话列表**
  - 列表字段：Customer、Subject、Agent、Skill、Outcome、Sentiment、Approach、Duration、Time
  - 筛选能力：
    - By Agent — 仅 2+ Agent 时展示，支持 URL 参数 `?agent=` 自动筛选
    - By Outcome — Resolved / Escalated / Pending
    - 搜索 — 客户名、主题关键词
  - Sentiment 展示：文字标签标注起始 → 结束情绪（如 "Frustrated → Satisfied"）
    - 颜色编码：绿色（Positive）、灰色（Neutral）、红色（Negative）
  - Approach 列：展示 Autopilot / Shadow 标签，带 tooltip 说明两种模式含义
  - 点击进入对话详情

- **9b. 对话详情 — 左侧 Chat History**
  - 按时间顺序展示客户和 Agent 的对话消息
  - Agent 的连续回复归为一组（一组回复对应一个 Reasoning）
  - 每组 Agent 回复底部操作入口：
    - "View Reasoning" — 点击后右侧面板展示该组对应的 Reasoning Trace
    - "Flag Reply" — 标记该回复需要审核
      - 弹出输入框，Feedback 内容非必填
      - 可选 Issue 类型（Wrong info、Tone issue、Missed context）
      - 提交后标记为 "Flagged"
    - "Instruct Agent" — Coming Soon 预告标签

- **9c. 对话详情 — 右侧 Reasoning Trace**
  - 同时只展示一个 Reasoning（对应左侧选中的 Agent 回复组）
  - 默认展开第一个 Reasoning（进入页面时不为空白）
  - 推理步骤（按顺序）：
    1. **Intent Detection** — 识别到的用户意图标签
    2. **Skill Matched** — 匹配到的 Skill 名称 + 匹配原因
    3. **Agent Thinking** — 自然语言推理过程（非技术性，CX Manager 可读）
    4. **Actions Executed** — 调用的 API 名称 + 输入参数 + 返回结果 + 耗时
    5. **Knowledge Referenced** — 引用的知识库文章标题 + 相关度
       - **Knowledge Gap Detection (V1.0 MVP)**：当 `knowledge_refs` 为空时：
         - 显示黄色警告标签 "Knowledge Gap Detected — No matching knowledge article found"
         - 展示 "Suggest Article" 按钮，点击弹出轻量表单
         - 表单预填充：对话主题作为建议标题，Agent Thinking 作为上下文
         - 提交后 toast 确认 "Article suggestion submitted"
       - V1.1 拓展：自动聚类相似 Gap、自动生成知识草稿
    6. **Guardrails Checked** — 安全规则检查结果
       - Pass：绿色标签
       - Triggered：红色高亮，展示触发的具体规则
  - 不展示：chunk ID、embedding score、token count 等技术性指标

> **技术标记：** Reasoning Trace 数据结构需与推理引擎对齐，建议后端返回标准化 JSON Schema（见 Section 11.1）。"Flag Reply" 数据存储和后续工作流——标记后的数据如何流转到 Agent 优化环节。

---

**10. Settings（与 AI Support 相关部分）**

- **Integrations：** Zendesk、Shopify 等 Connector 的连接管理
- **Global Guardrails：** 全局安全规则配置（Coming Soon 的规则在此处管理）
- **Team：** 成员权限管理

---

## 5. Cross-cutting Concerns

**5.1 Navigation & Deep Linking**

- Agent Detail → Performance：URL 带 `?agent=AgentName`，Performance 页面自动筛选
- By Agent 筛选器：仅当 2+ Agent 存在时展示（Overview 和 Conversations 一致）
- Skill 展开详情 → Playbook：提供 "Edit in Playbook →" 跳转链接
- Actions 未连接区域 → Settings > Integrations：提供 "Connect [Connector]" 跳转

**5.2 新用户引导体系**

- Agents 列表页：首次进入弹出介绍弹窗（localStorage 控制）
- Playbook 各子页面：顶部说明提示带关闭按钮（localStorage 控制）
- Actions 页面：顶部说明提示带关闭按钮
- 关闭后不再展示，刷新页面后保持关闭状态

---

## 6. Technical Appendix

**6.1 Reasoning Trace JSON Schema（建议）**

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

**6.2 Data Model（概要）**

| Entity | Key Fields | Notes |
| --- | --- | --- |
| Agent | id, name, status, channel, skills[], config, csatConfig | status: setting-up / ready-to-test / live / paused |
| Skill | id, name, description, guidance, enabled, actions[] | 全局级别，Agent 级别可覆盖开关 |
| Action | id, name, type, endpoint, params, connector | 预置 + 未来自定义 |
| Conversation | id, customer, agent, messages[], reasoningTraces[], outcome, sentiment, approach | approach: autopilot / shadow |
| ReasoningTrace | turnIndex, intent, skillMatched, thinking, actions[], knowledgeRefs[], guardrails | 每组 Agent 回复对应一个 Trace |
| KnowledgeArticle | id, title, category, content, lastUpdated, refCount | |
| FlaggedReply | id, conversationId, turnIndex, issueType, feedback, createdAt | |
| KnowledgeGapSuggestion | id, conversationId, turnIndex, suggestedTitle, context, status, createdAt | status: pending / accepted / dismissed |

---

## 7. 已识别的问题与讨论项

**7.1 需要讨论**

| # | 问题 | 影响 | 建议 |
| --- | --- | --- | --- |
| 1 | Batch Test 的 QA Agent 评判标准未定义 | V1.1 | 建议 3 层评判：Intent 匹配、Action 正确性、Response 质量 |
| 2 | "Flag Reply" 后的数据流转 | Bad Case 如何进入优化循环 | MVP 先存储，后续接入 fine-tuning pipeline |
| 3 | Guardrails 规则类型和优先级 | V1.2 | 先定义 5 种核心类型（金额上限、关键词触发、升级规则等） |
| 4 | Knowledge 向量化方案 | 影响检索质量 | 需确认 embedding 模型和 chunk 策略 |
| 5 | Better Your Customer Experience 数据来源 | 影响改进建议准确性 | MVP 预设规则，后续动态检测 |

**7.2 技术风险**

| 风险 | 等级 | 缓解方案 |
| --- | --- | --- |
| Reasoning Trace 数据量大 | 中 | 分页加载 + 懒加载 Trace 详情 |
| 多渠道集成复杂度高 | 高 | MVP 只做 Live Chat，Email 作为 V1.1 |
| 实时对话 WebSocket 稳定性 | 中 | 依赖 RC Widget 连接管理，Seel 侧只处理 Webhook 回调 |

---

## 8. MVP Milestone Plan

| Phase | 内容 | 依赖 |
| --- | --- | --- |
| M1 | Agent CRUD + Setting Up Flow + Single Test | 推理引擎 API |
| M2 | Performance Overview + Conversations 列表 | 对话数据存储 |
| M3 | Conversation Detail + Reasoning Trace | Reasoning Trace JSON Schema 对齐 |
| M4 | Playbook (Knowledge + Skills + Actions) | 知识库向量化方案 |
| M5 | Production Edit 保护 + Flag Reply + CSAT 收集 | 反馈数据存储 |

---

## Appendix: Feature Status Reference

| Feature | Status | Version |
| --- | --- | --- |
| Agent 列表 + Status Banner + 新商家弹窗 | MVP | V1.0 |
| Agent Setting Up Flow（单页配置） | MVP | V1.0 |
| Agent Live View (Overview + Configuration) | MVP | V1.0 |
| CSAT Collection (Live Chat 内置 + Email 外部/Webhook) | MVP | V1.0 |
| Single Test Simulator（页面内展开） | MVP | V1.0 |
| Batch Test Simulator | Planned | V1.1 |
| Guardrails（预览 + 框架预留） | Preview | V1.0 |
| Guardrails（完整规则引擎） | Planned | V1.2 |
| A/B Testing 部署 | Coming Soon | V1.2+ |
| Instruct Agent | Coming Soon | V1.2+ |
| Performance Overview（4 指标卡 + 4 图表） | MVP | V1.0 |
| Performance Conversations + Reasoning Trace | MVP | V1.0 |
| Knowledge Gap Detection（被动检测 + Suggest Article） | MVP | V1.0 |
| Knowledge Gap Auto-clustering + Draft Generation | Planned | V1.1 |
| Flag for Review | MVP | V1.0 |
| Playbook Knowledge | MVP | V1.0 |
| Playbook Skills | MVP | V1.0 |
| Playbook Actions（含 Unlock More Actions） | MVP | V1.0 |
| Email Channel 完整集成 | Planned | V1.1 |
| Social Messaging 集成 | Planned | V2.0 |
