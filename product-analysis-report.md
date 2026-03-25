# Seel AI Support Module — MVP 产品分析报告

**作者：** Manus AI  
**日期：** 2026年3月25日  
**版本：** v1.0  

---

## 1. 分析背景与方法

本报告基于对当前 Seel AI Support 模块原型的全面审查，从 **用户体验（UX）**、**技术实现可行性** 和 **MVP 范围控制** 三个维度进行分析。审查覆盖了以下核心页面：Agents 列表页、Agent Detail 配置页、Performance Overview、Performance Conversations（含 Reasoning Trace 详情）、Simulator、Playbook（Skills / Knowledge / Actions）以及 Settings。

分析的目标用户画像为 **CX Manager**（客户体验经理），他们关注的核心问题是：我的 AI Agent 在做什么？做得好不好？出了问题我怎么干预？

---

## 2. 已识别问题与改进建议

### 2.1 高优先级问题（P0 — 影响核心体验，建议 MVP 内解决）

#### 问题 1：Conversational Management 的定位模糊

**现状描述：** Agent Detail 的 Overview 中有一个 "Conversational Management" 聊天窗口，允许 CX Manager 直接与 Agent 对话（如 "为什么你给那个客户退款了？"）。这个功能概念上很有吸引力，但存在两个根本问题：(a) 在 MVP 阶段，这个功能无法真正与 Agent 的推理引擎对接，只能是模拟对话；(b) 用户可能误以为这是一个实时控制面板，期望通过对话改变 Agent 行为，但实际上 Agent 的行为由 Skills、Guardrails 和 Knowledge 共同决定。

**风险评估：** 如果用户在这里输入指令（如 "以后不要自动退款超过 $30"），但 Agent 行为没有改变，会严重损害信任。

**建议方案：**
- **短期（MVP）：** 将此区域重新定位为 "Agent Activity Feed"，展示 Agent 最近的决策摘要（类似 audit log 的自然语言版本），而非双向对话。保留输入框但标注为 "Coming Soon — Instruct your agent via natural language"。
- **中期：** 接入推理引擎后，实现真正的 Manager-Agent 对话，支持 "为什么" 类查询和 "以后请这样做" 类指令。

| 维度 | 评估 |
|------|------|
| 用户影响 | 高 — 核心信任问题 |
| 技术难度 | 低（短期方案仅需 UI 调整） |
| MVP 建议 | 改为 Activity Feed，对话功能标记 Coming Soon |

---

#### 问题 2：Simulator 的测试结果缺乏可操作性

**现状描述：** Simulator 的 Single Test 和 Batch Test 都能展示 Agent 的回复和推理过程，但测试完成后没有 "下一步" 引导。用户看到一个 "warn" 状态的测试用例（如 "I haven't received my refund after 2 weeks" 被 escalated），但不知道该怎么改进 Agent 的表现。

**建议方案：**
- 在 Batch Test 结果中，为每个 warn/fail 用例添加 "Investigate" 按钮，点击后跳转到 Conversations 详情页（或展开该用例的 Reasoning Trace）。
- 在 Single Test 中，当 Agent 的回复不理想时，提供 "Adjust in Configuration" 的快捷入口（如直接跳转到 Skills 或 Guardrails 设置）。
- 长期考虑：支持用户直接在 Simulator 中标注 "Expected Behavior"，形成回归测试集。

| 维度 | 评估 |
|------|------|
| 用户影响 | 高 — 测试无闭环等于无效测试 |
| 技术难度 | 低（UI 跳转 + 状态传递） |
| MVP 建议 | 添加 Investigate 跳转和 Configuration 快捷入口 |

---

#### 问题 3：Agent 状态流转缺乏明确的生命周期管理

**现状描述：** Agent 有四个状态（Setting Up → Ready to Test → Live → Paused），但状态之间的流转规则不够明确。例如：从 Live 切换到 Paused 只需要一个 Switch toggle，没有确认步骤；从 Paused 恢复到 Live 也是一键操作。对于生产环境的 Agent，这种轻量操作可能导致误操作。

**建议方案：**
- Pause/Resume 操作添加简短的确认提示（不需要完整的 AlertDialog，一个 inline confirmation 即可）。
- 添加状态变更的 audit log（"Agent paused by [user] at [time]"），在 Recent Activity 中展示。
- 考虑添加 "Scheduled Pause" 功能（如 "在今晚 10 点暂停 Agent"），这在运维场景中很常见。

| 维度 | 评估 |
|------|------|
| 用户影响 | 中高 — 生产环境误操作风险 |
| 技术难度 | 低 |
| MVP 建议 | 添加 Pause/Resume 确认提示 + 状态变更日志 |

---

### 2.2 中优先级问题（P1 — 影响使用效率，建议 MVP 后第一个迭代解决）

#### 问题 4：Performance 数据缺乏时间趋势维度

**现状描述：** Performance Overview 展示的是静态的汇总数据（如 "Resolution Rate 91.2%, +2.1%"），但没有时间趋势图。CX Manager 无法回答 "这周的表现比上周好还是差？" 或 "哪一天出了问题？" 这类问题。

**建议方案：**
- 在 5 个核心指标卡下方添加一个可切换的趋势折线图区域（默认展示 Resolution Rate 的 7 天趋势）。
- 技术上可以用 Chart.js 或 Recharts 实现，数据为 mock 即可。
- 折线图支持 hover 查看具体数值，支持多指标叠加对比。

| 维度 | 评估 |
|------|------|
| 用户影响 | 中 — 趋势分析是 CX Manager 的核心需求 |
| 技术难度 | 中（需要引入图表库 + 设计交互） |
| MVP 建议 | 可延后，但应在第一个迭代中加入 |

---

#### 问题 5：Knowledge Base 与 Agent 行为的关联不够透明

**现状描述：** Playbook > Knowledge 页面允许上传和管理知识库文档，但用户无法直观地看到 "哪些知识被哪些 Skill 引用了" 以及 "某个知识文档对 Agent 回复的影响有多大"。在 Reasoning Trace 中虽然展示了 "Knowledge Referenced"，但这是事后查看，不是事前配置。

**建议方案：**
- 在 Knowledge 页面中，为每个文档添加 "Used by Skills" 标签，展示哪些 Skills 引用了该文档。
- 在 Skill 详情中，添加 "Knowledge Sources" 区域，展示该 Skill 关联的知识文档列表。
- 长期考虑：支持 Knowledge 的版本管理和 A/B 测试（不同版本的知识对 Agent 回复质量的影响）。

| 维度 | 评估 |
|------|------|
| 用户影响 | 中 — 影响配置信心 |
| 技术难度 | 中（需要建立 Skill-Knowledge 关联模型） |
| MVP 建议 | 延后，但 Reasoning Trace 中的 Knowledge Referenced 已部分满足需求 |

---

#### 问题 6：Bad Case 反馈缺乏闭环管理

**现状描述：** 当前在 Conversation Detail 中已经添加了 "Leave Feedback" 功能，允许 CX Manager 对 Agent 的某一轮回复提交改进建议。但反馈提交后没有后续流程 — 没有反馈列表页、没有状态追踪、没有与 Skill/Knowledge 改进的关联。

**建议方案：**
- 短期：在 Performance 下添加一个 "Feedback" 子页面（或在 Overview 中添加 "Recent Feedback" 区域），汇总所有已提交的反馈。
- 中期：将反馈与 Skill 关联，形成 "Skill 改进建议" 的工作流。
- 长期：支持基于反馈的自动 fine-tuning 或 prompt 调整。

| 维度 | 评估 |
|------|------|
| 用户影响 | 中 — 反馈无闭环会降低用户提交反馈的意愿 |
| 技术难度 | 中（需要反馈存储 + 列表页 + 关联逻辑） |
| MVP 建议 | MVP 中保留当前的反馈入口即可，闭环管理延后 |

---

### 2.3 低优先级问题（P2 — 体验优化，可在后续迭代中逐步解决）

#### 问题 7：多 Agent 场景下的全局视图缺失

**现状描述：** 当用户有多个 Agent（如 RC Live Chat + Email Support）时，Agents 列表页只是简单的卡片排列。缺少一个 "全局仪表盘" 视图，让用户一眼看到所有 Agent 的健康状态。

**建议方案：** 在 Agents 页面顶部添加一个紧凑的全局状态栏（如 "2 agents active, 1 setting up | Total sessions today: 847 | Overall CSAT: 4.6"）。

---

#### 问题 8：Playbook 各模块之间的导航体验割裂

**现状描述：** Skills、Knowledge、Actions 三个页面各自独立，但在实际使用中它们是紧密关联的（一个 Skill 会引用多个 Knowledge 文档和 Actions）。用户在配置 Skill 时需要频繁在三个页面之间切换。

**建议方案：** 在 Skill 详情页中内嵌 Knowledge 和 Actions 的引用管理，减少页面跳转。

---

#### 问题 9：移动端响应式适配不足

**现状描述：** 当前原型主要针对桌面端设计，在窄屏幕下部分表格和多列布局会出现水平溢出。CX Manager 可能需要在手机上快速查看 Agent 状态。

**建议方案：** 为关键页面（Agents 列表、Performance Overview）添加移动端适配，表格在窄屏下转为卡片视图。

---

#### 问题 10：缺少 Onboarding 引导流程

**现状描述：** 新用户首次进入 AI Support 模块时，面对的是一个空的 Agents 列表和 "Create Agent" 按钮，没有任何引导说明。用户不知道应该先做什么（是先配置 Playbook？还是直接创建 Agent？）。

**建议方案：** 添加首次使用引导（可以是一个简单的 checklist 或 tooltip tour），引导用户完成 "连接集成 → 配置 Skills → 创建 Agent → 测试 → 上线" 的完整流程。

---

## 3. 技术实现风险评估

以下是当前原型中涉及的技术实现点及其在真实产品中的复杂度评估：

| 功能模块 | 原型复杂度 | 真实实现复杂度 | 核心挑战 |
|----------|-----------|--------------|---------|
| Agent CRUD + 状态管理 | 低 | 中 | 需要与集成平台（Zendesk/RC）的 OAuth 对接和 webhook 管理 |
| Reasoning Trace 展示 | 低 | 高 | 依赖推理引擎输出结构化的 thinking chain，需要定义标准 JSON schema |
| Skill 配置与执行 | 中 | 高 | 每个 Skill 本质上是一个 prompt template + action pipeline，需要可视化编排 |
| Knowledge Base 检索 | 低 | 高 | 需要 RAG pipeline（embedding + vector search + chunk management） |
| Simulator 测试 | 低 | 中 | 需要调用真实的推理引擎 API，处理异步响应和超时 |
| Performance 数据聚合 | 低 | 中 | 需要设计数据模型、ETL pipeline 和实时/准实时聚合 |
| Bad Case 反馈闭环 | 低 | 中 | 需要反馈存储、与 Skill/Knowledge 的关联、以及后续的改进工作流 |
| A/B Testing | 未实现 | 高 | 需要流量分配、版本管理、统计显著性计算 |
| Conversational Management | 低 | 极高 | 需要 Agent 理解自然语言指令并修改自身行为，本质上是 meta-learning |

---

## 4. MVP 范围建议

基于以上分析，建议 MVP 版本聚焦以下核心功能，确保 "可用且可信"：

### MVP Must-Have（必须包含）

1. **Agent 创建与基础配置** — 连接集成、选择 Skills、设置 Guardrails、部署模式选择
2. **Agent 状态生命周期** — Setting Up → Ready to Test → Live → Paused，含状态变更确认
3. **Simulator 基础测试** — Single Test（含 Reasoning Trace）+ Batch Test（含结果状态）
4. **Performance Overview** — 5 个核心指标 + Skill 维度表 + Agent 筛选
5. **Conversations 列表与详情** — 含 Reasoning Trace（per-turn Agent Thinking）+ Bad Case 反馈入口
6. **Production Edit Safeguard** — Live Agent 配置修改的二次确认

### MVP Should-Have（强烈建议包含）

7. **Performance 时间趋势图** — 至少一个核心指标的 7 天趋势
8. **Simulator → Configuration 闭环** — 测试发现问题后的改进路径
9. **Onboarding 引导** — 首次使用的 checklist

### MVP Nice-to-Have（可延后）

10. A/B Testing 框架
11. Conversational Management（自然语言指令）
12. Bad Case 反馈闭环管理
13. Knowledge-Skill 关联可视化
14. 移动端适配

---

## 5. Reasoning Trace JSON Schema 设计建议

用户在需求中提到了一个关键的技术问题：Reasoning Trace 的数据结构应该如何设计？以下是一个兼顾 CX Manager 可读性和技术实现简洁性的 JSON Schema 建议：

```json
{
  "conversation_id": "C-1001",
  "turns": [
    {
      "turn_index": 1,
      "trigger": "customer_message",
      "customer_message": "Hi, I placed an order 3 days ago and haven't received any shipping updates. Order #8834.",
      "agent_reply": "Hello Sarah! Let me check the status of your order #8834 right away.",
      "reasoning": {
        "thinking": "The customer is asking about their order status — this is a standard WISMO request. I'll look up order #8834 in the system to get the current shipping status before responding.",
        "intent_detected": "Order Tracking (WISMO)",
        "confidence": 0.96,
        "actions_executed": [
          {
            "action": "get_order_status",
            "input": { "order_id": "8834" },
            "output_summary": "Order #8834: In Transit, FedEx, ETA Mar 27",
            "duration_ms": 120
          }
        ],
        "knowledge_referenced": [
          {
            "document": "Shipping FAQ",
            "section": "How to track your order",
            "relevance_score": 0.92
          }
        ],
        "guardrails_checked": [
          {
            "rule": "max_auto_refund",
            "result": "not_applicable"
          }
        ]
      },
      "sentiment_at_turn": "neutral",
      "timestamp": "2026-03-25T14:32:00Z"
    }
  ]
}
```

**设计原则：**

这个 Schema 的核心设计原则是 **分层可读性**。对于 CX Manager，前端只需要展示 `thinking`（自然语言推理过程）和 `actions_executed` 的 `output_summary`（操作结果摘要），这两个字段完全是人类可读的自然语言。而 `confidence`、`duration_ms`、`relevance_score` 等技术指标则作为可选的 "展开查看" 内容，供需要深入了解的用户使用。

`guardrails_checked` 字段记录了每一轮推理中哪些安全规则被检查了，以及检查结果。这对于 CX Manager 理解 "为什么 Agent 没有自动退款" 或 "为什么 Agent 选择了 escalate" 非常重要。

在前端展示时，建议的层级为：**Agent Thinking**（始终可见）→ **Actions & Results**（始终可见）→ **Knowledge Referenced**（可选展开）→ **Guardrails & Technical Details**（可选展开）。这种分层确保了 CX Manager 在不关心技术细节的情况下也能理解 Agent 的决策逻辑。

---

## 6. 总结

当前的 Seel AI Support 原型已经建立了一个结构清晰、功能覆盖面广的基础框架。核心的信息架构（Agents → Agent Detail → Performance → Conversations → Reasoning Trace）是合理的，用户的主要工作流（配置 Agent → 测试 → 上线 → 监控 → 改进）都有对应的页面支撑。

最需要关注的三个方向是：(1) **确保每个功能都有闭环**（测试后能改进、反馈后能追踪、发现问题后能定位原因）；(2) **明确区分 "展示型功能" 和 "交互型功能"**（避免用户对模拟功能产生真实期望）；(3) **控制 MVP 范围**，将 A/B Testing、Conversational Management 等高复杂度功能明确标记为 Coming Soon，集中精力打磨核心的配置-测试-监控链路。
