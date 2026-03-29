# Seel AI Support Agent — 产品需求文档 (PRD)

**版本**: v6.0
**日期**: 2026-03-29
**状态**: Draft

---

## 目录

1. 产品概述
2. 产品架构
3. 需求详情
4. MVP Scope 与优先级
5. Open Items

---

## 1. 产品概述

### 1.1 产品定位

Seel AI Support Agent 是面向电商品牌的 AI 客服系统。核心理念：**CX Manager 像管理真人客服一样管理 AI**——招聘（Onboarding）、培训（Rules & Knowledge）、设置权限（Actions）、日常沟通（Inbox）、绩效考核（Performance）。

目标用户是**非技术背景的 CX Manager**。所有配置和管理操作通过直觉化的 UI 完成。

### 1.2 三个 AI 角色

| 角色 | 面向谁 | 职责 | 生命周期 |
|------|--------|------|---------|
| **Rep** | 消费者 | 在 Zendesk 中直接回复客户工单 | 持续运行 |
| **Team Lead** | Manager | 分析 Rep 数据、提出规则更新建议、接收 Manager 指令 | 持续运行 |
| **Onboarding Specialist** | Manager | 引导首次配置：连接工具、解析文档、生成初始规则 | 仅初始化阶段 |

### 1.3 两个 Manager 触点

| 触点 | 定位 | 频率 | 核心动作 |
|------|------|------|---------|
| **Seel 后台（Web）** | 战略层：培训 AI、看绩效 | 每周数次 | 规则更新、Knowledge Gap 确认、Performance Review、文档上传 |
| **Zendesk Sidebar** | 战术层：工单现场操作 | 每天多次 | 查看 AI 处理状态、查看推理流程、处理 Escalation、一键复制推荐回复 |

> **设计原则：** Zendesk App 处理即时的、Case-level 的、动作型交互；后台处理低频的、Rule-level 的、思考型交互。两者职能不重叠。

### 1.4 核心产品目标

| 目标 | 衡量指标 |
|------|---------|
| 15 分钟内完成 Onboarding | Onboarding 完成率、首次上线时间 |
| AI 自主处理常见工单 | 自动解决率（目标 >60%） |
| 无缝对接现有工单系统 | 集成成功率 |
| 行为可预测、可控 | Escalation 率、Guardrail 触发率 |
| 持续自我优化 | 同类问题重复 Escalation 率下降 |

### 1.5 MVP 排除项

| 排除项 | 原因 |
|--------|------|
| A/B 测试（规则灰度发布） | 需要足够流量基数 |
| 多语言界面 | 初期聚焦英语市场 |
| Voice 渠道 | 技术复杂度高 |
| Ask for Approval 审批流 | 需先验证基础能力 |
| 多 Agent（多品牌） | 先验证单 Agent 价值 |
| Gorgias / Intercom 集成 | MVP 只支持 Zendesk |

---

## 2. 产品架构

### 2.1 产品需求的三个层次

| 层次 | 核心问题 | 对应模块 |
|------|---------|---------|
| **回复层** | Rep 如何正确、安全、高质量地回复消费者？ | Rep 对话行为、Zendesk App |
| **控制层** | Manager 如何用业务语言控制 Rep 的行为？ | Playbook、Onboarding |
| **进化层** | 系统如何在运行中持续变好？ | Communication（Inbox）、Performance |

### 2.2 核心实体

| 实体 | 定义 | Manager 可见？ |
|------|------|---------------|
| **Agent** | 一个商家对应一个 Agent 实例，是所有配置的容器 | 是 |
| **Rule** | 一条完整的业务场景 SOP（策略 + 例外 + 升级条件） | 是（策略层） |
| **Knowledge** | 事实信息条目（政策原文、产品信息、FAQ） | 是 |
| **Action** | Rep 可执行的操作（回复、查物流、创建工单等） | 是（权限开关） |
| **Conversation** | 一次完整的客户对话，含中间状态 | 间接可见（通过 Performance） |

### 2.3 Rule 的两层结构

Rule 是系统中最核心的实体。它有两层：

- **策略层（Manager 可见、可编辑）**
  - `strategy`：业务策略，自然语言描述
  - `exceptions`：例外情况
  - `escalation`：升级条件
- **执行层（系统内部）**
  - `execution_prompt`：系统从策略层编译出的 LLM 执行指令
  - Manager 不需要看到也不需要编辑

> **设计原则：** Manager 用业务语言描述"在什么场景下、以什么方式处理"，系统自动翻译为 LLM 可执行的指令。

### 2.4 Subagent 架构

系统由三个 Subagent 协作完成所有任务，由 Orchestrator 统一调度：

| Subagent | 产品角色 | 核心职责 | 触发方式 |
|----------|---------|---------|---------|
| **Orchestrator** | 无（系统层） | 路由请求、管理状态、处理 Webhook、调度其他 Subagent | 事件驱动 |
| **Team Lead** | Team Lead | 与 Manager 对话、生成 Rule 提案、辅助 Playbook 配置 | Manager 消息 / Orchestrator 调度 |
| **AI Rep** | AI Rep | 回复客户工单、检测知识缺口、执行 Action | Ticket 分配 |

Orchestrator 不是 LLM 节点，而是确定性的事件处理引擎。它负责接收外部事件（Zendesk Webhook、Manager 消息、定时任务），路由到正确的 Subagent，管理状态（Topic 状态、Ticket 状态），并持久化数据。

### 2.5 事件路由表

| 事件 | 来源 | 路由到 | 传递的数据 |
|------|------|--------|-----------|
| 新 ticket / 新客户消息 | Zendesk Webhook | AI Rep | Ticket context + Agent config |
| AI Rep 发出 Gap Signal | AI Rep | Team Lead | Gap Signal + Ticket context |
| AI Rep Escalate ticket | AI Rep | Orchestrator（更新状态） | Ticket ID + Internal Note |
| Manager 在 escalated ticket 上操作 | Zendesk Webhook | Team Lead | Manager 的操作内容 + 原始 ticket |
| Manager 在 Inbox 中发消息 | 前端 | Team Lead | Manager 消息 + 对话历史 |
| Manager Accept/Reject Rule | 前端 | Orchestrator（更新 Rule） | Rule ID + 操作 |

### 2.6 数据闭环

两个触点之间形成持续优化的数据闭环。Zendesk App 是数据采集点，后台是数据消化点：

```
Zendesk App（采集）                    后台（消化）

① Escalation
   → Manager 解决工单 ──────────→ Team Lead 学习处理方式
                                    → 提出规则更新建议

② Bad Case 标记
   → 标记 + 一句话 ─────────────→ Team Lead 分析偏差
                                    → 提出规则修正建议

③ Manager 主动更新
   → Inbox 消息 / 上传文档 ────→ Team Lead 翻译为变更
                                    → 请求确认 → 规则更新

④ 知识缺口
   → Rep 回复"我不确定" ────────→ Team Lead 识别缺失
                                    → 建议新增 Rule 或 Knowledge
```

---

## 3. 需求详情

### Onboarding（首次配置）

#### 概述

- **触发**：Manager 首次进入系统，或点击"Set Up Agent"
- **AI 角色**：由 Team Lead（Alex）引导整个 Onboarding 流程
- **目标**：15 分钟内完成首次配置，生成可运行的 Agent
- **完成后**：Onboarding Specialist 退出，Team Lead 接管日常优化
- **UI 位置**：Communication 页面 → Team Lead 视图 → Onboarding Tab

#### 用户流程与 Agent 行为

**Step 1: Connect Tools（连接工具）**

Manager 在 Integrations 页面完成 Zendesk 和 Shopify 的 OAuth 连接。连接成功后，系统自动创建 AI Agent Seat 并配置 Zendesk Trigger 将工单路由给 AI。此阶段无 LLM 参与，纯工程逻辑。

**Step 2: Upload & Parse SOP（上传并解析文档）**

进入 Communication → Onboarding Tab 后，Team Lead（Alex）以对话形式引导 Manager 上传培训文档。

展示内容：
- Team Lead 发送欢迎消息，说明需要上传培训文档（playbooks、refund policies、escalation rules）
- 上传区域：支持拖拽上传或点击选择文件，支持 PDF / DOCX / TXT 格式，单文件最大 10MB
- URL 导入：提供输入框粘贴 URL 直接导入
- 无文档选项：提供"Try with demo data"链接，使用内置 Seel Return Guidelines 演示

Agent 处理逻辑：
1. Team Lead 接收文档后调用 Document → Rules Skill
2. 文档分块 → 每个块分类为 Rule（"怎么做"）或 Knowledge（"是什么"）
3. Rule 块结构化为：name / strategy / exceptions / escalation
4. Knowledge 块结构化为：title / content
5. 检测块之间的冲突（同一场景不同描述）
6. 对于模糊条目，标记为 ambiguity 并生成 suggested_clarification

展示解析结果：
- Team Lead 以消息形式告知"已提取 N 条 rules"
- 每条 Rule 前显示绿色勾号 + Rule 名称
- 超过 5 条时折叠，显示"+N more rules"链接
- 如有冲突，显示冲突数量 + "Review conflicts"按钮

**Step 3: Resolve Conflicts（冲突裁决）**

当文档中存在矛盾描述时，Team Lead 逐一呈现冲突项。

展示内容（每个冲突）：
- 冲突标题（如"Refund amount for partial damage"）
- 冲突描述：用自然语言解释两处矛盾内容
- 选项列表：2-3 个选项供 Manager 点选裁决

Agent 处理逻辑：
- Team Lead 将新内容和相关旧内容一起放入 context，自然识别矛盾
- 每个冲突点独立标记，Manager 逐一裁决
- 所有冲突解决后，Team Lead 确认"Your playbook is ready"

**Step 4: Hire Rep（招聘 Rep）**

Team Lead 提示 Manager 招聘第一个 Support Rep，并说明初始范围（WISMO — 最高量、最低风险）。

展示内容（Hire Rep Dialog）：
- 左栏 — 基础配置：
  - Name：文本输入（默认"Ava"）
  - Personality：5 个选项（Friendly / Neutral / Matter-of-fact / Professional / Humorous），以 pill 形式展示
  - Mode：下拉选择（Training / Production / Off）
- 右栏 — Allowed Actions：
  - 按 category 分组（Financial / Order Management / Returns / Communication / Data Access）
  - 每个 Action 显示名称 + checkbox + guardrail 描述（如有）
  - 默认基于文档解析结果预配置

Agent 处理逻辑：
- Team Lead 基于解析出的 Rules 预配置 Rep 的 Action 权限
- 读取类 Action 默认 Enabled，写入类 Action 默认 Disabled
- Manager 确认后，系统编译 execution_prompt

**Step 5: Sanity Check（场景模拟）**

Rep 被 Hire 后，自动进入 Rep 视图的 Onboarding 对话。Rep 以对话形式展示 3 个模拟场景。

展示内容（每个场景）：
- 场景标题（如"Scenario 1 — Where is my order?"）
- 模拟客户消息（斜体引用）
- Rep 的处理步骤（编号列表：查询什么系统、获取什么信息）
- Rep 的预期回复（blockquote 格式）
- Rep 询问 Manager 确认："Does this look right?"

Agent 处理逻辑：
- AI Rep 接收 Sanity Check Prompt，包含所有已配置的 Rules + Action Permissions
- 对每个场景输出：intent 分类 → 匹配的 Rule → 执行的 Action → 回复草稿 → confidence
- 三个场景覆盖：自主处理、升级转交、边界判断

Manager 操作：
- 每个场景后 Manager 回复确认（如"That's right"）
- 如不符合预期，Manager 可直接修改 Rule 或添加备注

**Step 6: Go Live（选择上线模式）**

Rep 完成 Sanity Check 后，询问 Manager 选择工作模式。

展示内容：
- Rep 以消息形式说明两种模式：
  - **Training mode**：草拟回复和操作，先经 Manager 审核再发出
  - **Production mode**：自主处理工单，Manager 事后审阅
- Manager 选择后，Rep 确认已上线并说明后续沟通方式

Agent 处理逻辑：
- Training Mode → Rep 将回复写入 Zendesk Internal Note，不直接回复客户
- Production Mode → Rep 直接回复客户
- 建议首次上线选择 Training Mode
- 如 Manager 直接选择 Production Mode → 二次确认

#### 进度保存

每完成一个 Step，状态持久化到数据库。Manager 中途离开后回来，从上次离开的 Step 继续。已完成的 Step 显示绿色勾号，可点击回退修改。

#### 边界情况

| 场景 | 处理方式 |
|------|---------|
| Zendesk 连接失败 | 显示错误信息 + 重试按钮 + 手动配置指引 |
| Manager 没有 Zendesk Admin 权限 | 提示需要 Admin 权限，提供邀请链接 |
| 文档格式混乱导致解析质量差 | 标记低置信度条目，提示 Manager 手动确认 |
| 文档内容太少 | 提示"内容较少，建议补充更多 SOP" |
| Manager 没有现成文档 | 提供 demo 数据选项 |
| 解析出的 Rule 涉及不支持的 Action | 策略自动降级为"转交人工处理"，并提示 Manager |
| Manager 确认了 0 条 Rule | 提示"至少需要确认 1 条规则才能上线" |
| 所有 Sanity Check 场景都不符合预期 | 建议 Manager 回到 Step 3 重新审阅 Rules |

---

### Communication — Team Lead 对话

#### 概述

- **定位**：Manager 与 Team Lead（Alex）的唯一沟通渠道
- **核心交互**：Team Lead 提出建议 → Manager 审批；Manager 下达指令 → Team Lead 执行
- **UI 位置**：Communication 页面 → Team Lead 视图 → Conversation Tab
- **UI 形态**：类 Slack 的 Topic Feed，每个提案或对话是一个 Topic Card

#### Topic 结构

每个提案或对话是一个 Topic。

| 属性 | 展示内容 |
|------|---------|
| 标题 | 由 Team Lead 自动生成的简短描述（如"Refund to different payment method"） |
| 类型 | knowledge_gap / performance_report / performance_summary / open_question / escalation_review / rule_update |
| 状态标记 | 黄色圆点 = 有待处理的 Pending 提案；蓝色圆点 = 有未读 AI 消息 |
| 时间 | 相对时间（如"2h ago""yesterday"） |
| 回复预览 | 显示回复数量 + 最近回复的发送者头像和内容摘要（超过 5 条时折叠中间部分） |

#### Topic Card 展示内容

**普通消息 Topic**：展示 Team Lead 头像 + 名称 + 时间 + 消息内容（支持 Markdown 加粗）。

**Rule Proposal Topic**：
- 上下文消息：Team Lead 解释为什么提出这个建议（引用具体 ticket 编号和数据）
- Source 链接：标注触发此提案的来源（如"Ticket #4501"）
- Proposed Change 卡片：
  - 卡片头部：展示提案类型（"Proposed New Rule"或"Proposed Rule Update"）+ Rule 名称
  - Current（仅 update 类型）：展示当前 Rule 内容（斜体，最多 2 行截断）
  - Updated / Content：展示建议的新 Rule 内容（最多 3 行截断）
  - 操作按钮（仅 Pending 状态）：Accept（绿色）/ Reject（红色）/ Reply
  - 已处理状态：展示 Accepted / Rejected Badge

**Performance Summary Topic**：展示"Weekly Performance Summary"标题 + 格式化的绩效数据摘要。

#### 五种信号来源与 Agent 处理逻辑

**信号 1：知识缺口（Gap Signal — 自动检测）**

触发条件：AI Rep 在处理工单时检测到无匹配 Rule、Rule 冲突、或不确定的情况，发出 Gap Signal。

Agent 处理流程：
1. AI Rep 生成 Gap Signal（包含 gap_type / description / ticket_id / customer_intent / attempted_action / context）
2. Orchestrator 接收 Gap Signal → 检查去重（是否已有相同 gap 的 Topic）→ 已有则追加到现有 Topic，没有则创建新 Topic
3. Orchestrator 调用 Team Lead（Skill 1: Gap → Rule Proposal）
4. Team Lead 输入：Gap Signal + 现有 Rules + 历史数据（如有）
5. Team Lead 输出：topic_title + context_message + proposed_rule（type / text / source / tags）
6. Orchestrator 推送到 Conversation，创建 Topic 卡片

**信号 2：Escalation 聚类（自动触发）**

触发条件：同一类型的 Escalation 累积达到阈值（如 5 次）。

Agent 处理流程：
1. Team Lead 分析这些 Escalation 的共性
2. 判断是缺少 Rule 还是现有 Rule 不完善
3. 生成提案（新增 Rule 或修改 Rule）

**信号 3：Manager 行为观察（Zendesk Webhook 触发）**

触发条件：Manager 在 Zendesk 中处理了一个 Escalated Ticket（Webhook 检测到 Manager 在 escalated ticket 上添加了公开回复）。

Agent 处理流程：
1. Zendesk Webhook 触发 ticket.comment_added
2. Orchestrator 检查：该 ticket 是否由 AI Rep escalate？→ 是
3. Orchestrator 拉取完整 ticket 内容（Zendesk REST API）
4. 调用 Team Lead（Skill 2: Behavior Observation）
5. Team Lead 输入：escalation context + manager's action + ticket metadata（order_value / product / customer_tier）
6. Team Lead 对比 Manager 的实际操作 vs 现有 Rule，推断通用原则（如"低价物品不需要照片"）
7. 输出：topic_title（"Learned: ..."格式）+ context_message + proposed_rule（type: update）

**信号 4：Manager 在 Inbox 发消息（主动指令）**

触发条件：Manager 在 Conversation 底部输入框发送消息。

Agent 处理流程：
1. Orchestrator 将 Manager 消息路由到 Team Lead（Skill 3: Manager Directive → Rule）
2. Team Lead 输入：Manager 消息 + 对话历史 + 现有 Rules
3. Team Lead 解析指令 → 定位影响范围 → 检测与现有 Rule 的冲突
4. 输出：confirmation_message + proposed_rule + conflicts（如有）+ needs_confirmation: true
5. 如指令模糊，Team Lead 追问确认（如"您说的'退货政策放宽'，具体是指延长退货期限还是放宽退货条件？"）

**信号 5：Manager 在 Inbox 上传文档（主动更新）**

触发条件：Manager 在 Conversation 中上传文件附件。

Agent 处理流程：
1. 复用 Onboarding 的文档解析 Pipeline（分块 → 分类 → 结构化）
2. 将新内容与现有 Rules / Knowledge 对比
3. 冲突检测：Team Lead 将新内容和相关旧内容一起放入 context，自然识别矛盾
4. 生成变更计划（可能同时涉及 Rule 和 Knowledge 的变更）
5. 冲突项单独标记，Manager 必须逐一确认

#### Manager 的三种操作

| 操作 | 含义 | 后续 Agent 行为 |
|------|------|----------------|
| **Accept** | 同意提案 | Orchestrator 将 Rule 写入 Playbook（status: active）→ Topic 状态 → Done → AI Rep 的 rules 列表自动更新 |
| **Reject** | 拒绝提案 | 记录拒绝。Team Lead 不会短期内重复提出相同建议（除非新数据显著增强） |
| **Reply** | 提出修改意见或追问 | 打开 Thread 面板，Team Lead 根据反馈修订提案，重新提交 |

#### Thread 面板

点击 Topic 的"Reply to topic"或 Reply 按钮后，右侧滑出 Thread 面板（宽 360px）。

展示内容：
- 面板标题：Topic 标题
- 完整消息时间线：所有消息按时间排列，每条显示发送者头像 + 名称 + 时间 + 内容
- Rule Proposal 卡片（如有）：同 Topic Card 中的 Proposed Change 卡片
- 底部输入框：Manager 可回复消息继续对话

#### All Topics 面板

点击 Conversation Tab 右上角的列表图标后，右侧滑出 All Topics 面板。

展示内容：
- 面板标题："All Topics"
- Topic 列表：每条显示标题 + 状态标记（黄/蓝圆点）+ 消息数量 + 时间
- 点击某个 Topic → 关闭 All Topics 面板，打开该 Topic 的 Thread 面板

#### 提案类型

| 类型 | 说明 |
|------|------|
| **新增 Rule** | 为新场景创建 SOP |
| **修改 Rule** | 更新现有 SOP（调整策略、添加例外、更新升级条件） |
| **拆分 Rule** | 将过于复杂的 Rule 拆为多条（分支超过 3 层嵌套或 5-6 个并列分支时） |
| **新增 / 更新 Knowledge** | 补充或修正事实信息 |

#### 重复提案抑制

当 Team Lead 准备提出的建议与近期被 Reject 的提案实质相同时，不重复提出。除非新的数据信号显著强于上次（如上次基于 5 个 case，现在累积到 30 个），才可重新提出并说明数据变化。MVP 阶段通过 Team Lead 的 Prompt 指令实现，不需要独立的去重服务。

#### 边界情况

| 场景 | 处理方式 |
|------|---------|
| Manager 长时间不处理 Pending 提案 | 不自动执行，保持 Pending 状态。Conversation Tab 上显示 pending 数量 badge |
| Team Lead 的提案 Manager 看不懂 | Manager 可 Reply 追问，Team Lead 用更通俗的语言解释 |
| 上传的文档与多条现有 Rule 冲突 | 每个冲突点独立标记，Manager 逐一裁决 |
| Manager 在 Inbox 发了模糊指令 | Team Lead 追问确认 |
| 文档解析出的 Rule 涉及不支持的 Action | 策略自动降级为"转交人工处理"，并在提案中注明 |

---

### Communication — Rep 管理

#### 概述

- **定位**：Manager 查看和管理已招聘的 AI Rep
- **UI 位置**：Communication 页面 → 左侧窄栏点击 Rep 头像切换到 Rep 视图
- **UI 形态**：对话式界面 + Escalation Feed + Profile 面板

#### 左侧窄栏（Agent 切换）

Communication 页面最左侧有一个 56px 宽的窄栏，用于在 Team Lead 和 Rep 之间切换。

展示内容：
- Team Lead 图标（👔）：点击切换到 Team Lead 视图（Conversation / Onboarding Tab）
- 分隔线
- Rep 头像（圆形，紫色背景 + 姓名缩写）：仅在 Rep 被 Hire 后出现。点击切换到 Rep 视图
- Hover 时显示 Tooltip：角色名称 + 职级描述（如"L1 — WISMO Specialist · Working"）

#### Rep 视图 — Escalation Feed

Rep 视图的主区域是一个对话式界面，展示 Rep 的 Onboarding 对话记录（Sanity Check 场景 + 模式选择）以及之后的 Escalation 卡片 Feed。

展示内容（Escalation 卡片）：
- Ticket ID + Subject（如"#4412 · Damaged ceramic vase — no photo provided"）
- Summary：Rep 对该 Escalation 的摘要说明（最多 2 行截断）
- 时间：相对时间
- Status Badge：
  - "Needs attention"（琥珀色）— 等待 Manager 处理
  - "Resolved"（灰色，降低透明度）— 已解决

#### Rep 视图 — Profile 面板

点击 Rep 视图顶栏的"Profile"按钮后，右侧滑出 Profile 面板（宽 320px）。

展示内容（View 模式）：
- 头像 + 名称 + Mode Badge（如"TRAINING"琥珀色）
- "Edit Profile"按钮
- **Details 区域**：
  - Personality：展示当前性格设置（如"Warm & Professional"）
  - Mode：展示当前运行模式（Training / Production / Off）
  - Started：展示上线日期
- **Performance 区域**：
  - Tickets：展示总数 / 今日数
  - Resolution：展示自动解决率百分比
  - CSAT：展示客户满意度评分
  - Avg Response：展示平均首次响应时间
  - "View more →"链接跳转到 Performance 页面
- **Config History 区域**（默认折叠）：
  - 每条记录展示：commit hash（紫色 Badge）+ 变更描述 + 操作者 + 时间

展示内容（Edit 模式）：
- Name：文本输入框
- Personality：5 个 pill 选项
- Mode：下拉选择
- Allowed Actions：按 category 分组，每个 Action 显示 checkbox + 名称 + guardrail 描述
- "Save Changes"按钮

---

### Playbook（配置管理）

#### 概述

- **定位**：Manager 查看和管理 Agent 所有配置的中心
- **核心内容**：Rules、Knowledge Documents
- **设计原则**：日常更新通过 Communication（Inbox）完成（Team Lead 辅助），Playbook 用于直接查看和手动编辑
- **UI 位置**：AI Support → Playbook Tab

#### Rules 列表

展示内容（每条 Rule）：
- 编号（如"#1"）
- Rule 名称（如"Seel Return Protection — Full Refund Policy"）
- 策略预览（policy 字段的前 100 字截断）
- 使用次数（invocationCount）
- 点击某条 Rule → 打开右侧详情 Sheet

#### Rule 详情 Sheet

点击 Rule 后右侧滑出详情面板，包含两个 Tab：

**Content Tab**：
- Rule 名称（大标题）
- Intent：展示该 Rule 对应的客户意图分类
- Policy：展示完整的业务策略描述
- Exceptions：展示例外情况列表（每条前有圆点标记）
- Escalation：展示升级触发条件 + 升级后的处理方式
- Tags：展示标签列表（pill 形式）
- Linked Actions：展示该 Rule 可调用的 Action 列表（pill 形式）
- Source：展示来源信息（如关联的 Topic ID 或文档 ID）
- 底部操作按钮："Edit Rule"

**Stats Tab**：
- Invocations：展示该 Rule 被匹配的总次数
- Avg CSAT：展示使用该 Rule 处理的工单的平均 CSAT 评分
- Deflection Rate：展示该 Rule 的自动解决率（不需要 escalation 的比例）
- Version History：展示每次变更记录（版本号 + 变更描述 + 时间 + 关联的 Conversation 链接）

#### Rule 编辑

Manager 可编辑的字段：

| 字段 | 说明 |
|------|------|
| 名称 | Rule 的业务场景名 |
| 策略 | 自然语言描述的处理方式 |
| 例外 | 不适用此策略的特殊情况 |
| 升级条件 | 何时转交人工 |

Manager 保存后，系统自动重新编译 execution_prompt。编辑历史可追溯（显示每次变更的 diff）。

#### Documents 管理

展示内容（每条文档）：
- 类型图标（PDF / DOC / CSV / URL 各有不同图标）
- 文档名称
- 文件大小
- 上传时间
- 状态 Badge：Processed（绿色）/ Processing（蓝色动画）/ Error（红色）
- In Use 开关：控制该文档是否参与 Knowledge 检索
- 提取的 Rule 数量

操作：
- "Upload Document"按钮 → 弹出上传 Dialog（支持拖拽 + 文件选择 + URL 导入）
- 上传后 Agent 自动解析，解析结果通过 Communication 中的 Team Lead 消息呈现

#### 边界情况

| 场景 | 处理方式 |
|------|---------|
| Manager 手动编辑了 Rule，但描述模糊 | 保存时系统提示"策略描述可能不够具体，建议补充具体条件" |
| 两条 Rule 覆盖了相同场景 | 系统检测并提示冲突，建议合并或明确优先级 |
| Manager 删除了一条正在被使用的 Rule | 二次确认弹窗，说明影响范围 |

---

### Performance（绩效监控）

#### 概述

- **定位**：Manager 了解 Agent 运行状况的仪表盘
- **核心问题**：Agent 做得怎么样？哪里需要改进？
- **设计原则**：展示数据 + 引导行动
- **UI 位置**：AI Support → Performance Tab

#### 时间范围选择

页面顶部提供时间范围切换：7d / 14d / 30d，所有数据和图表随之联动。

#### KPI 概览卡片

展示 4 张 KPI 卡片，每张卡片展示：

| 卡片 | 展示内容 |
|------|---------|
| Auto-Resolution Rate | 数值（百分比）+ 趋势箭头（↑/↓）+ 趋势描述（如"vs prev period"） |
| CSAT Score | 数值（评分）+ 趋势箭头 + 趋势描述 |
| Avg Response Time | 数值 + 单位（如"2m 15s"）+ 趋势箭头 + 趋势描述 |
| Total Conversations | 数值 + 趋势箭头 + 趋势描述 |

#### 趋势图表

展示两张面积图：
- **Resolution & Escalation Rates**：双线图，展示自动解决率和升级率随时间的变化趋势
- **CSAT Score Trend**：单线图，展示 CSAT 评分随时间的变化趋势

#### Performance by Intent 表格

展示按客户意图分类的绩效数据表格：

| 列 | 展示内容 |
|----|---------|
| Intent | 客户意图名称（如"Where Is My Order""Product Issues — Damaged Item"） |
| Volume | 该意图的工单数量 |
| Resolution | 该意图的自动解决率（百分比） |
| CSAT | 该意图的平均 CSAT 评分 |
| Avg Turns | 该意图的平均对话轮次 |
| Escalation | 该意图的升级率（百分比） |

#### 边界情况

| 场景 | 处理方式 |
|------|---------|
| Agent 刚上线，数据量不足 | 显示"数据收集中，建议运行 3 天后查看趋势" |
| CSAT 数据不可用（Zendesk 未配置 CSAT 调查） | 隐藏 CSAT 指标，不显示空值 |
| Training Mode 下的数据 | 单独标注"Training Mode 数据"，不计入 Production 指标 |

---

### Zendesk Sidebar App（工单现场）

#### 概述

- **定位**：Manager 在 Zendesk 工单界面中的即时操作面板
- **形态**：Zendesk Sidebar App，嵌入在工单详情页右侧（宽度约 350px）
- **核心场景**：Manager 正在处理工单时，需要快速了解 AI 做了什么、处理 Escalation、或采纳 AI 建议
- **UI 位置**：独立于 Seel 后台，作为 Zendesk App 运行

#### 两种工单状态

Sidebar 根据工单的 AI 处理状态展示不同内容：

**状态 1：AI Handling（AI 正常处理中）**

展示内容：
- 状态标识："AI Handling"标签
- Intent Detected：展示 AI 识别的客户意图（如"Where Is My Order""Product Issues — Damaged Item"）
- Confidence：展示 AI 的置信度百分比（如"94%"）
- Current Step：展示 AI 当前的处理步骤描述（如"Shared tracking link and updated ETA""Processed refund of $89.99"）
- 对话记录：展示客户消息和 Agent 回复的完整时间线

**状态 2：Escalated（AI 已升级转交）**

展示内容：
- 状态标识："Escalated"标签（红色）
- Escalation Reason：展示 AI 升级的原因（如"Customer explicitly requested human agent. Sentiment: very frustrated. High-value order ($450)."）
- Handoff Notes：展示 AI 的内部交接笔记（灰色背景区域），包含客户问题摘要、已收集的信息、升级原因、建议处理方向
- Suggested Reply：展示 AI 建议的回复内容
- "Copy Reply"按钮：一键复制建议回复到剪贴板

#### Training Mode vs Production Mode 的差异

| 维度 | Training Mode | Production Mode |
|------|-------------|-----------------|
| Agent 回复位置 | Zendesk Internal Note | 直接回复客户 |
| Sidebar 主要操作 | "Copy Reply"（复制到回复框） | 查看处理状态 |
| Manager 工作量 | 需要逐条审阅并手动回复 | 仅需关注异常（Escalation） |

#### 边界情况

| 场景 | 处理方式 |
|------|---------|
| 工单不是由 AI Agent 处理的 | Sidebar 显示"此工单未分配给 AI Agent" |
| Agent 正在处理中（尚未回复） | 显示"Agent 正在处理..."加载状态 |
| Manager 在 Agent 回复前手动回复了 | Agent 检测到人工回复，自动退出此对话 |
| 网络断开导致 Sidebar 加载失败 | 显示重试按钮 |

---

### Rep 对话行为

#### 概述

本节定义 Rep（AI Agent）在对话中的行为规范。这不是一个 UI 模块，而是系统核心逻辑的产品定义。

#### Rep 的两种回复模式

| 模式 | 含义 | 输出 |
|------|------|------|
| **直接回复** | Rep 有足够信息和权限处理 | 回复消息给客户（Production）或写入 Internal Note（Training） |
| **升级转交** | Rep 无法处理 | 创建 / 转交 Ticket 给人工，附带 Internal Note |

> **不存在中间态。** MVP 不支持"Rep 询问 Manager 后再回复"的流程。

#### AI Rep 的决策框架

AI Rep 对每条客户消息按以下流程处理：

1. **CLASSIFY**：识别客户意图（如 refund request、damage claim、shipping inquiry）
2. **SEARCH**：在 Rules 中搜索匹配的规则
3. **CHECK**：检查是否有所需的 Action 权限
4. **DECIDE**：
   - 有匹配 Rule + 有权限 → 执行并回复
   - 有匹配 Rule + 无权限 → Escalate + 说明原因
   - 无匹配 Rule → Escalate + 发送 Gap Signal
   - Rule 冲突或不确定 → 回复最佳判断 + 发送 Gap Signal

#### AI Rep 的三种输出

| 输出类型 | 条件 | Production Mode | Training Mode |
|---------|------|----------------|---------------|
| **Direct Reply** | 匹配到 Rule + 有 Action 权限 | 公开回复客户 | Internal Note（建议回复） |
| **Escalation** | 无匹配 Rule 或无 Action 权限 | Internal Note + Escalate | Internal Note + Escalate |
| **Gap Signal** | 匹配到 Rule 但不确定 / 发现规则冲突 | 公开回复 + 发送 Gap Signal 给 Orchestrator | Internal Note + 发送 Gap Signal |

#### Gap Signal 结构

当 AI Rep 检测到知识缺口时，输出结构化信号：

| 字段 | 说明 |
|------|------|
| gap_type | 缺口类型：no_rule / rule_conflict / uncertain / permission_denied |
| description | 缺失内容的简要描述 |
| ticket_id | 触发此 Gap 的工单 ID |
| customer_intent | 客户意图 |
| attempted_action | 尝试执行的 Action |
| context | 供 Team Lead 生成 Rule 提案的相关上下文 |

#### 升级转交的触发条件

| 条件 | 说明 |
|------|------|
| Rule 中定义的升级条件 | 每条 Rule 的 escalation 字段 |
| 客户明确要求人工 | "我要找真人""转接人工" |
| 连续 N 轮无法解决 | 默认 3 轮（可配置） |
| 涉及不支持或未授权的 Action | 可用 Action 列表中没有所需操作 |
| 兜底：没有匹配到任何 Rule | 完全未知的场景 |

升级时 Internal Note 包含：客户问题摘要、已收集的信息（订单号、邮箱、订单详情等）、升级原因、建议处理方向（如有）。

#### 对话生命周期

```
消息进入
  │
  ▼
Step 1: Context Enrichment（上下文增强）
  ├── 被动提取：从消息 + 渠道元数据中提取已有信息（邮箱、订单号等）
  ├── 自动关联：用已有信息静默查询系统（邮箱→历史订单、用户ID→客户画像）
  └── 缺失请求：关键信息仍缺失时，向客户主动询问
  │
  ▼
Step 2: Rule 路由
  ├── 意图分类：判断客户问题属于哪个业务场景
  ├── 匹配 Rule：加载对应的 Rule
  └── 无匹配：走兜底逻辑（尝试用 Knowledge 回答，或升级）
  │
  ▼
Step 3: Knowledge 检索
  ├── 用"客户问题 + 匹配的 Rule"作为检索 query
  ├── 向量检索 Knowledge，取 Top-K
  └── 相似度低于阈值时不加载（避免无关内容干扰）
  │
  ▼
Step 4: 生成回复
  ├── 输入：System Prompt + 可用 Actions + 匹配的 Rule + 检索的 Knowledge + 对话上下文
  ├── 输出：回复内容 + Action 调用（如有）
  └── Guardrail 检查：Action 是否在可用列表中
  │
  ▼
Step 5: 执行
  ├── 直接回复 → 发送消息（或写入 Internal Note）
  └── 升级转交 → 创建 Ticket + Internal Note
```

#### 多轮对话状态管理

每轮对话结束后，系统维护以下状态（注入下一轮 Prompt）：

| 状态字段 | 说明 |
|---------|------|
| `intent` | 当前识别的客户意图 |
| `matched_rule` | 当前匹配的 Rule ID |
| `enriched_context` | 已收集的上下文信息（通用 JSON） |
| `action_results` | 已执行的 Action 及其结果（通用 JSON） |
| `turn_count` | 当前对话轮次 |

#### 回复质量规范

| 规范 | 说明 |
|------|------|
| 语言匹配 | 用客户使用的语言回复 |
| 不编造信息 | 只使用 Knowledge 和系统数据中的事实 |
| 不过度承诺 | 不承诺自己无法执行的操作 |
| 简洁优先 | 售前问题简洁回答；售后问题可适当详细 |
| 一次只问一个问题 | 需要收集信息时，不一次性问多个问题 |
| 诚实表达不确定 | 不确定时说"我不确定"，而非猜测 |

#### 边界情况

| 场景 | 处理方式 |
|------|---------|
| 客户同时问了两个不同场景的问题 | 逐一处理，先回答第一个，再处理第二个 |
| 客户发送了图片 / 附件 | MVP 不处理多模态，回复"我目前无法查看图片/附件，请用文字描述您的问题" |
| 客户情绪激动 / 辱骂 | 保持专业，不对抗。如持续激动，触发升级 |
| 客户在 Agent 回复前追加了多条消息 | 合并理解所有消息后统一回复 |
| 对话超过 N 轮未解决 | 自动升级（默认 N=10，可配置） |
| 客户长时间未回复 | 不主动跟进（MVP 不做 Proactive Follow-up） |
| 同一客户在不同渠道发起相同问题 | MVP 不做跨渠道去重，各渠道独立处理 |

---

### Integrations（集成管理）

#### 概述

- **定位**：Manager 管理外部工具连接和 AI Support 模块入口
- **UI 位置**：全局导航 → Integrations

#### 展示内容

页面分为两个区域：

**Connections 区域**：展示 Zendesk 和 Shopify 的连接状态卡片。每张卡片展示平台 logo + 名称 + 连接状态（Connected / Not Connected）+ Connect 或 Manage 按钮。

**AI Support 区域**：展示 AI Support 模块的入口卡片，包含模块描述和"Go to AI Support"按钮，点击跳转到 Communication 页面。

---

## 4. MVP Scope 与优先级

### 4.1 模块优先级

| 优先级 | 模块 | 理由 |
|--------|------|------|
| **P0** | Onboarding | 没有 Onboarding，Agent 无法运行 |
| **P0** | Rep 对话行为 | 核心价值：AI 回复客户 |
| **P0** | Zendesk App | Manager 的日常操作入口 |
| **P1** | Communication（Inbox） | 持续优化的核心机制，但初期可用 Playbook 手动替代 |
| **P1** | Playbook | 配置管理，Onboarding 完成后需要 |
| **P2** | Performance | 需要数据积累后才有价值 |

### 4.2 功能裁剪

| 功能 | MVP 范围 | 后续迭代 |
|------|---------|---------|
| Onboarding Sanity Check | 3 个系统生成的模拟场景 | 支持自定义场景、更多模拟 |
| Team Lead 信号 | 5 种全部支持 | 增加更多自动检测信号 |
| Knowledge 检索 | 向量检索 Top-K + 相似度阈值 | 精确关联（Rule ↔ Knowledge） |
| Action | 7 个基础 Action | 更多写入类 Action（修改地址、换货等） |
| 渠道 | Zendesk（Email + Live Chat） | Gorgias、Intercom、Social DM |
| 多语言 | Rep 自动匹配客户语言回复 | 后台界面多语言 |
| 对话分析 | 基础统计（解决率、升级率） | 情感分析、话题聚类、趋势预测 |

### 4.3 技术依赖

| 依赖 | 说明 | 风险 |
|------|------|------|
| Zendesk API | 工单读写、Trigger 配置、Sidebar App | Zendesk API 限流 |
| Shopify API | 订单查询、物流查询、客户信息 | 需要商家授权 |
| LLM API | Rep 回复生成、Team Lead 分析、文档解析 | 延迟和成本 |
| 向量数据库 | Knowledge 检索 | 需要选型和部署 |

---

## 5. Open Items

### 5.1 设计稿与技术文档的 GAP

| # | GAP 描述 | 建议 |
|---|---------|------|
| 1 | **Zendesk Sidebar 缺少 Bad Case 标记按钮**：v5.0 PRD 中定义了 Good / Bad Case 标记功能，但当前设计稿的 Zendesk Sidebar 只有"Copy Reply"按钮，没有 Good / Bad Case 标记入口 | 确认是否在 MVP 中加入 Bad Case 标记，还是仅依赖 Escalation 作为反馈信号 |
| 2 | **Escalation 卡片缺少展开详情**：当前设计稿中 Escalation 卡片只展示摘要，点击无交互。PRD 和技术文档中描述了完整的对话上下文和 Rep 处理过程 | 确认是否需要点击 Escalation 卡片后展示完整对话上下文 |
| 3 | **Rule Proposal 缺少 diff 高亮**：当前设计稿中 Rule Update 提案的 Current/Updated 是纯文本展示，没有 diff 标记 | 建议在 Before/After 中增加文字级别的 diff 高亮 |
| 4 | **Notes to Rep 功能未体现**：技术文档中提到 Manager 可以在 Zendesk Sidebar 给 Rep 写指令（instruction 字段），但当前设计稿中没有对应的输入区域 | 确认是否在 MVP 中支持 Zendesk Sidebar 内的 Manager → Rep 指令 |
| 5 | **Actions 管理独立页面缺失**：v5.0 PRD 中 Playbook 包含 Actions 管理和 Agent 基础设置，但当前设计稿中 Playbook 只有 Rules 和 Documents，Actions 管理仅在 Hire Rep Dialog 和 Rep Profile Edit 中出现 | 确认 Actions 管理是否需要独立页面，还是仅在 Rep 配置中管理 |

### 5.2 待讨论的关键问题

**Q1: Shadow Mode / Training Mode 的退出标准是什么？**
- 目前设计：Manager 手动切换到 Production Mode
- 待讨论：是否需要系统建议退出时机？（如"Agent 已在 Training Mode 下运行 3 天，准确率 92%，建议切换到 Production Mode"）

**Q2: Escalation 工单在 Zendesk 中的具体形态是什么？**
- 选项 A：创建新 Ticket，assign 给 Manager
- 选项 B：在原 Ticket 上移除 AI Agent 的 assignee，改为 Manager
- 选项 C：在原 Ticket 上添加 Internal Note + 标记为 Escalated

**Q3: 多个 Rule 同时匹配时的优先级？**
- 当前设计：意图分类后匹配单条 Rule
- 待讨论：是否需要 Rule 优先级字段？还是由 LLM 自行判断？

**Q4: Team Lead 的分析频率和时机？**
- Escalation 聚类：实时累积，达到阈值触发？还是每天定时分析？
- Bad Case：标记后立即分析？还是攒一批后统一分析？

**Q5: Rate Limiting 和成本控制？**
- 每次对话涉及多次 LLM 调用（Context Enrichment + Rule 路由 + 回复生成）
- 需要确认：是否需要设置每日对话上限？LLM 调用失败时的降级策略是什么？
