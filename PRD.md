# Seel AI Support Agent — Product Requirements Document

> **Version:** 2.0**Date:** 2026-03-27**Author:** Manus AI**Status:** Draft for Review

---

## 1. Product Overview

Seel AI Support Agent 是面向电商客服团队的 AI Agent 管理平台。Manager（客服主管）通过与 **Team Lead**（AI 管理助手）对话式交互，配置、训练和监控 **AI Rep**（AI 客服代理）。

核心价值：Manager 不需要学习复杂的配置界面，而是像管理真人员工一样，通过对话来教会 AI Rep 处理客服工单。

---

## 2. 核心概念

### 2.1 角色定义

| 角色 | 类型 | 职责 | 交互对象 |
| --- | --- | --- | --- |
| **Manager** | 人类 | 配置规则、审批动作、教学指导 | Team Lead、Zendesk Sidebar |
| **Team Lead** | AI | 系统使用的 Co-pilot，辅助 Manager 管理 Playbook 和全局配置 | Manager（通过 Messages） |
| **AI Rep** | AI | 对外以人类身份回复客户工单 | 客户（通过 Zendesk） |

**Team Lead 与 AI Rep 的关系：** Team Lead 是 Manager 的管理助手，负责接收 Manager 的指令、提出规则建议、汇报 Rep 的学习情况。本期 Team Lead 不直接与 Rep 交互，未来会扩展为可以向 Rep 下达 Rep 级别的 Action Instruction。

**从用户心智角度：** Team Lead 像是一个 Rep 团队的管理者，Manager 通过 Team Lead 来间接管理 Rep 的行为。

### 2.2 核心实体

| 实体 | 说明 | 归属 |
| --- | --- | --- |
| **Rule** | AI Rep 遵循的业务规则，以编号列表形式呈现 | Playbook |
| **Knowledge Document** | 上传的知识文档，系统自动提取 Rule | Playbook |
| **Action** | AI Rep 可执行的操作（如退款、发送替换品） | Playbook |
| **Action Permission** | 每个 Action 的权限开关 + Guardrail 限制 | Playbook |
| **Topic** | Messages 中围绕一个问题的对话单元 | Messages |
| **Zendesk Ticket** | 客户工单，Rep 在其上执行操作 | Zendesk |

### 2.3 实体关系

```
Manager ──对话──▶ Team Lead (via Messages)
    │                   │
    │                   ├── 管理 ──▶ AI Rep
    │                   │             │
    │                   │             ├── 遵循 ──▶ Rules
    │                   │             ├── 受限于 ──▶ Action Permissions (含 Guardrails)
    │                   │             └── 操作 ──▶ Zendesk Tickets
    │                   │
    │                   └── 提出 / 接收 ──▶ Rule 提案 (via Topics)
    │
    ├── 配置 ──▶ Playbook
    │               ├── Knowledge Documents ──提取──▶ Rules
    │               ├── Actions ──绑定──▶ Action Permissions + Guardrails
    │               └── Rules（所有 Rule 统一管理，通过标签分类）
    │
    └── 审阅 ──▶ Zendesk Tickets (via Sidebar)
```

**Rule、Action、Knowledge Document 的关系：**

- Knowledge Document 是 Rule 的来源之一。上传文档后系统自动提取 Rule。

- Rule 是 AI Rep 的行为准则。所有 Rule 是同一种实体，通过标签分类管理（如 Refund、Shipping、Escalation）。Escalation Rule 就是一条标签为 "Escalation" 的普通 Rule。

- Action 是 AI Rep 可执行的具体操作。每个 Action 有独立的 Permission 开关和 Guardrail 限制。

- Rule 指导 Rep "什么情况下做什么"；Action Permission 限制 Rep "能不能做"；Guardrail 限制 Rep "做到什么程度"。

**技术实现对应：** AI Rep 对应一个负责回复客户的 Subagent，其 Skill 包中不同 JSON 文件对应不同类别的 Rule。用户侧看到的是扁平的编号列表。JSON schema 预留 `tags` 字段，方便后续按标签筛选。

### 2.4 Agent Mode

| Mode | 行为 | Zendesk 表现 | 何时使用 |
| --- | --- | --- | --- |
| **Production** | 直接回复客户；遇到不确定场景时发送 Internal Note 并在 Messages 中提出 Rule 提案 | 公开回复 + 偶尔 Internal Note | Rep 已充分训练 |
| **Training** | 仅以 Internal Note 形式发送所有内容（包括建议回复和 Rule 提案），不直接回复客户 | 仅 Internal Note | 新 Rep 或重大规则变更后 |
| **Off** | 不处理任何工单 | 所有工单分配给人类 | 暂停 AI |

**Production 与 Training 的核心区别：** Production 模式下 Rep 可以直接发送公开回复，但遇到不确定场景时仍会发 Internal Note 请求指导。Training 模式下 Rep 的所有输出都是 Internal Note，Manager 需要手动复制并发送。

### 2.5 Action Permission

**MVP 版本采用两级制：**

| 级别 | 说明 | 示例 |
| --- | --- | --- |
| **Autonomous** | Rep 在支持范围内自行执行，无需审批 | 查询物流、关闭工单、$50 以下退款 |
| **Disabled** | Rep 不可执行，遇到时升级给人类 | 创建优惠券、大额退款 |

> **Future:** Ask Permission 级别将在后续版本支持。届时 Rep 可以草拟动作等待 Manager 审批。

**Guardrail 嵌入 Action Permission：** 每个打开的 Action 可附带 Guardrail 条件。Guardrail 是逻辑上可行但业务规则上不允许的限制。

| Action | Permission | Guardrail |
| --- | --- | --- |
| Issue Refund | Autonomous | 单笔不超过 $200；不适用于 Final Sale 商品 |
| Send Replacement | Autonomous | 仅限首次退换 |
| Apply Discount | Disabled | — |
| Close Ticket | Autonomous | （无限制） |

> Guardrail 不包含技术性限制（如"仅限有库存 SKU"），这类逻辑属于 Action 内部实现。

### 2.6 Zendesk Ticket 状态

**MVP 版本（无 Ask Permission）：**

| 状态 | 含义 | Sidebar 展示 | Manager 操作 |
| --- | --- | --- | --- |
| **AI Handling** | Rep 正常处理中 | 绿色状态条 | 无需操作；可查看 Rep's Note；可留 Notes to Rep |
| **Escalated** | Rep 无法处理 | Rep's Note（说明原因）+ Suggested Reply（可复制） | 自行处理工单；可留 Notes to Rep |

> **Future:** Request for Approval 状态将在 Ask Permission 上线后支持。届时 Sidebar 增加 Approve/Deny 按钮。

**核心区别：** AI Handling = Rep 有能力处理；Escalated = Rep 没有能力处理，需要人类接手。即使在 Escalated 状态下，Rep 仍会提供 Suggested Reply 供 Manager 参考复制。

---

## 3. Module: Onboarding

### 3.1 阶段划分

| 阶段 | 步骤 | 交互方式 | 完成标志 |
| --- | --- | --- | --- |
| **Integration** | 连接 Zendesk | OAuth 授权卡片 | 授权成功 |
|  | 连接 Shopify | OAuth 授权卡片 | 授权成功 |
|  | 导入现有规则 | 进度条 + 冲突解决 | 规则入库 |
| **Playbook ** | 审核提取的规则 | 逐条确认/修改 | 全部审核完 |
|  | 设置 Escalation Rules | 预设规则 + 开关 | 确认配置 |
| **Hire Rep** | 命名 Rep | 文本输入 | 名称确认 |
|  | 设置 Tone | 选项卡 | 选择完成 |
|  | Sanity Check（3 场景） | AI 展示处理方案 | Manager 确认 |
|  | 选择运行模式 | Training / Production | 选择完成 |

### 3.2 **Integration**

> **待讨论：** Zendesk 和 Shopify 的连接逻辑需要单独讨论，涉及已连接/未连接商家的不同体验、Zendesk App 安装方式等。此处先记录已知信息。

| 场景 | 流程 |
| --- | --- |
| 未连接 Zendesk | 跳转到 Integration 连接 |
| 已连接 Zendesk | 待讨论：是否复用已有连接 |
| 未连接 Shopify | 展示“暂不支持”  |
| 已连接 Shopify | 待讨论：是否复用已有连接 |

边界条件

| 场景 | 处理方式 |
| --- | --- |
| 中途退出 | 状态保留在当前步骤，下次进入从断点继续 |
| 连接失败 | 展示错误信息 + 重试按钮 + 跳过选项 |
| 导入规则数量为 0 | 引导手动上传文档或直接进入对话式教学 |
| 文档规则与历史工单行为不一致 | 展示两个版本让 Manager 选择 |
| Sanity Check 全部不满意 | 提供"重新配置"选项，回到 Playbook 阶段 |
| Onboarding 完成后 | 配置写入 Playbook 和 Agent，进入正常 Messages 工作流 |

---

## 4. Module: Messages

Messages 是 Manager 与 Team Lead 的主要对话界面。采用 DM 对话风格，所有消息按时间线排列为聊天气泡，Topic 用轻量分隔线标注。

### 4.1 Topic 生命周期

| 状态 | 含义 | 触发条件 |
| --- | --- | --- |
| **Waiting for Response** | 需要 Manager 操作 | Team Lead 发起提案 / Manager 发起指令后等待确认 |
| **Done** | 已处理完毕 | Manager Accept/Reject / 对话自然结束 |

### 4.2 Flow 1: Team Lead 主动提案 Rule

Team Lead 在 Rep 处理工单过程中发现知识缺口或规则不足，主动向 Manager 提出规则提案。

```
Rep 处理工单时发现问题
    │
    ▼
Team Lead 在 Messages 中创建 Topic
    ├── 消息 1: 上下文说明（观察到的模式、涉及的工单、频率）
    └── 消息 2: Rule 提案卡片（New Rule 或 Rule Update）
    │
    ▼
Manager 操作
    ├── Accept → Rule 生效，Topic → Done
    ├── Reject → Rule 不生效，Topic → Done
    └── Reply → 继续对话，Team Lead 修正提案后再次请求确认
```

**Rule 提案的两种类型：**

| 类型 | 展示方式 | 示例 |
| --- | --- | --- |
| **New Rule** | 绿色标记 + 完整规则文本 | "国际退货运费由客户承担" |
| **Rule Update** | Current（删除线）→ Proposed（绿色） | 损坏物品：增加 $80 以下免照片条件 |

**Rule 提案的来源（实现层面）：**

| 来源 | 触发方式 | 技术实现 | MVP |
| --- | --- | --- | --- |
| Rep 处理工单时发现 SOP 空白 | 实时 | Rep Subagent 在处理 ticket 时检测到无匹配 Rule，触发提案 | Yes |
| Manager 手动处理 escalated ticket | Zendesk Webhook | 订阅 `ticket.comment_added` + `ticket.status_changed`，检测 Manager 在 escalated ticket 上的操作，分析其处理方式并生成 Rule 提案 | Yes |
| ~~Rep 的建议被 Manager deny~~ | ~~Zendesk Webhook~~ | ~~订阅 ~~~~`ticket.comment_added`~~~~（Internal Note），检测 deny 信号，分析原因并生成 Rule Update~~ | ~~No~~ |
| 批量历史 ticket 模式分析 | 定时任务 | 每日凌晨拉取最近 24h ticket，由 Analyst Subagent 聚合分析，发现统计性 pattern | No |

**Zendesk Webhook 实现细节：**

订阅的事件类型：

| 事件 | 用途 |
| --- | --- |
| `ticket.comment_added` | 检测 Manager 在 escalated ticket 上添加回复或 Internal Note |
| `ticket.status_changed` | 检测 escalated ticket 被 Manager 关闭/解决 |
| `ticket.agent_assignment_changed` | 检测 ticket 从 AI Rep 重新分配给人类 |

处理流程：Webhook 触发 → 检查 ticket 是否由 AI Rep 处理/escalate → 调用 Zendesk REST API 获取完整 ticket 内容 → 传入分析逻辑 → 生成 Rule 提案推送到 Messages。

**需要的 LLM 分工（Draft）：**

| Skill | 职责 | 触发方式 |
| --- | --- | --- |
| **Reply Skill
(Rep)** | 回复客户，处理 ticket；遇到 SOP 空白时生成 Rule 提案（TBD - 是否放在 Team Lead） | 实时（ticket 分配） |
| ~~Analyst Subagent~~ | ~~批量分析历史 ticket，发现模式~~ | ~~定时任务（V2）~~ |
| **Rule Generator Skill**
**(Team Lead)** | 辅助 Manager identify Playbook | Manager 交互触发 |

### 4.3 Flow 2: Manager 主动下达 Rule

```
Manager 在 Messages 中发送指令
    │
    ▼
Team Lead 解析指令，生成结构化 Rule
    │
    ▼
Team Lead 回复确认（展示理解的内容 + Rule 卡片）
    │
    ▼
Manager 二次确认（Yes / No）
    ├── Yes → Rule 生效，Topic → Done
    └── No → Team Lead 请求澄清
```

- 待讨论：



### 4.4 Flow 3: Rep 从 Manager 行为中学习

```
Rep 在 Zendesk 中 Escalate ticket
    │
    ▼
Manager 自行处理该 ticket
    │
    ▼
Webhook 检测到 Manager 操作（添加回复 / 关闭 ticket）
    │
    ▼
Team Lead 分析 Manager 的处理方式
    │
    ▼
Team Lead 在 Messages 中创建 Topic:
"我注意到你在 #4412 上直接处理了退款，没有要求照片。
我理解了：$80 以下的损坏物品不需要照片证据。"
    │
    ▼
展示 Rule Update 卡片 → Manager Accept / Reject / Reply
```



### 4.5 边界条件

| 场景 | 处理方式 |
| --- | --- |
| 新 Rule 与已有 Rule 矛盾 | 提交提案时自动检测冲突，展示两条规则让 Manager 选择 |
| ~~（非MVP）临时 Rule 过期（如促销期退货窗口）~~ | ~~Rule 支持有效期字段，过期自动失效并通知 Manager~~ |  |
| Manager 发送的指令含糊不清 | Team Lead 先确认理解，再生成 Rule |
| Topic 长时间无人处理 | 定期 bump 提醒 |
| ~~（非MVP）Manager Accept 后想撤回~~ | ~~支持 Undo（限时 5 分钟）~~ |
| Rule Update 的 Before/After 内容很长 | 默认折叠，Show more 展开；超长内容提供全屏 diff 视图 |
| Manager 同时回复多个 Topic | 确保每个回复关联到正确的 Topic |

---

## 5. Module: Playbook

Playbook 是 AI Rep 的知识库和规则配置中心。

### 5.1 功能组成

| Section | 内容 | 说明 |
| --- | --- | --- |
| **Integrations** | Zendesk / Shopify 连接状态 | 展示连接状态、重新连接入口 |
| **Knowledge** | Documents + Rules | 文档管理 + 从文档/对话中提取的规则列表 |
| **Actions** | Action 列表 + Permission + Guardrail | 每个 Action 的开关和限制条件 |

### 5.2 Knowledge — Documents

| 操作 | 说明 |
| --- | --- |
| 上传 | 支持 PDF / DOC / CSV，系统自动解析提取 Rule |
| 查看 | 展示文档名、类型、提取的 Rule 数量、上传时间 |
| 删除 | 删除文档时提示 Manager 选择保留或删除关联 Rule |

### 5.3 Knowledge — Rules

所有 Rule 以编号列表形式展示。每条 Rule 包含：

| 字段 | 说明 |
| --- | --- |
| 编号 | 自增 ID |
| 规则文本 | 具体的业务规则描述 |
| 来源 | 文档提取 / Messages 对话 / Manager 指令 |
| 标签 | 业务场景分类（MVP 暂不做标签筛选 UI，但数据结构预留） |
| 状态 | Active / Inactive |

### 5.4 Actions + Permissions + Guardrails

每个 Action 的配置结构：

```
[开关] Action Name
  Guardrail: 限制条件 1
  Guardrail: 限制条件 2
```

### 5.5 边界条件

| 场景 | 处理方式 |
| --- | --- |
| 上传文档内容模糊或自相矛盾 | 标记为"需要澄清"，让 Manager 补充说明 |
| 文档更新（上传新版本） | 自动 diff 新旧版本的规则变化，展示给 Manager 确认 |
| 删除文档后关联 Rule 处理 | 提示 Manager 选择保留或删除 |
| 新文档规则与现有规则冲突 | 展示冲突警告，两个版本 A/B 选择 |
| Guardrail 参数设为 0 或负数 | 输入校验，最小值限制 |
| 禁用 Action 时有依赖关系 | 提示并自动禁用依赖 Action |

---

## 6. Module: AI Reps

AI Reps 页面配置 AI Rep 的身份和运行模式。

### 6.1 功能组成

| Section | 内容 |
| --- | --- |
| **Mode** | Production / Training / Off 三选一 |
| **Identity** | Name, Tone, AI Disclosure |

### 6.2 边界条件

| 场景 | 处理方式 |
| --- | --- |
| Production → Off 切换 | 确认对话："当前有 N 个进行中工单，切换后将分配给人类" |
| Production → Training 切换 | 进行中的工单继续以 Production 模式完成，新工单以 Training 模式处理 |
| 修改 Tone 后对进行中对话的影响 | 仅对新对话生效 |
| 修改 Name 后 | 仅对新对话生效，已有对话保持原名 |

---

## 7. Module: Zendesk Sidebar（待讨论On）

Zendesk Sidebar 是嵌入 Zendesk 的 App，Manager 在处理工单时查看 AI Rep 的状态和建议。

### 7.1 MVP 状态（两种）

| 状态 | Sidebar 展示 | Manager 可用操作 |
| --- | --- | --- |
| **AI Handling** | 绿色状态条 + Rep's Note（如有） | Notes to Rep |
| **Escalated** | Rep's Note（说明原因）+ Suggested Reply（可复制） | Copy Suggested Reply + Notes to Rep |

> **Future:** 增加 Request for Approval 状态，含 Approve/Deny 按钮。

### 7.2 Notes to Rep

所有状态下 Manager 都可以留 Notes to Rep。这是 Manager 在工单级别给 Rep 的教学指令。

| 行为 | 说明 |
| --- | --- |
| Manager 输入 Note | 保存为该工单的教学记录 |
| Rep 学习 | Rep 从 Note 中学习，应用到未来类似场景 |
| 同步到 Messages | Notes to Rep 的内容同步到 Messages 对应 Topic，形成完整教学记录 |

### 7.3 边界条件

| 场景 | 处理方式 |
| --- | --- |
| Manager 写了 Notes to Rep 但 Rep 未学习 | Rep 回复"已学习"并展示理解，Manager 可纠正 |
| 客户工单被合并 | 检测合并事件，更新 Sidebar 展示 |
| Sidebar 与 Messages 中同一问题的 Topic 关联 | 通过 sourceTicketId 关联，Sidebar 提供跳转到 Messages Topic 的链接 |
| Escalated ticket Manager 长时间未处理 | 设置 SLA 提醒，超时后二次通知 |
| 客户在 Escalation 等待期间继续发消息 | Rep 发送安抚消息告知正在转接 |
| Escalated 后 Manager 处理完毕 | Webhook 触发学习流程，Team Lead 在 Messages 中总结学到的内容 |

---

## 8. Module: Performance（WIP）

Performance 是 AI Rep 的数据看板。

### 8.1 功能组成

| 功能 | 说明 |
| --- | --- |
| 时间范围筛选 | 7d / 14d / 30d |
| KPI 卡片 | 自动解决率、CSAT、Escalation 率、首次响应时间 |
| 趋势图 | Resolution/Escalation 趋势、CSAT 趋势 |
| Intent 分析表 | 按 Intent 维度的 Volume、Resolution、CSAT、Turns、Escalation |

### 8.2 边界条件

| 场景 | 处理方式 |
| --- | --- |
| 某 Intent 表现持续下降 | Team Lead 主动在 Messages 中报告并建议改进 |
| 数据量不足（新 Rep 刚上线） | 展示"数据积累中"提示，不展示不可靠的统计 |

---

## 10. 数据模型摘要

### 10.1 核心类型

```typescript
type TopicStatus = "waiting" | "done";
type AgentMode = "production" | "training" | "off";
type PermissionLevel = "autonomous" | "disabled";  // MVP; future: "ask_permission"
type TicketState = "handling" | "escalated";        // MVP; future: "approval"
type RuleChangeType = "new" | "update";
```

### 10.2 关键接口

```typescript
interface Rule {
  id: string;
  text: string;
  source: "document" | "messages" | "manager_directive" | "learned";
  tags: string[];           // 预留标签字段，MVP 暂不做筛选 UI
  status: "active" | "inactive";
  validUntil?: string;      // 临时 Rule 的过期时间
  version?: number;         // 预留版本字段
}

interface Action {
  id: string;
  name: string;
  category: string;
  permission: PermissionLevel;
  guardrails: Guardrail[];  // 嵌入 Action 内部
}

interface Guardrail {
  id: string;
  label: string;            // e.g. "Maximum refund amount"
  value: string | number;   // e.g. 200
  enabled: boolean;
}

interface Topic {
  id: string;
  title: string;
  status: TopicStatus;
  messages: Message[];
  proposedRule?: ProposedRule;
  sourceTicketId?: string;
}

interface ZendeskTicket {
  id: string;
  subject: string;
  state: TicketState;
  internalNote?: string;
  suggestedReply?: string;  // Escalated 状态下的建议回复（可复制）
  instruction?: string;     // Manager 的 Notes to Rep
}
```

---

## 11. MVP vs Future

| 功能 | MVP | Future |
| --- | --- | --- |
| Agent Mode: Production / Training / Off | Yes | — |
| Action Permission: Autonomous / Disabled | Yes | Ask Permission 级别 |
| Zendesk Sidebar: AI Handling / Escalated | Yes | Request for Approval 状态 |
| Zendesk Sidebar: Approve / Deny 按钮 | No | 随 Ask Permission 上线 |
| Zendesk Sidebar: Copy Suggested Reply | Yes | — |
| Rule 提案: Webhook 实时学习 | Yes | — |
| Rule 提案: 定时批量分析 | No | Analyst Subagent |
| Rule 标签筛选 UI | No | 数据结构预留 |
| Rule 版本历史 | No | 数据结构预留 |
| 多 Agent 管理 | No | 多 Rep 支持 |
| Team Lead 直接与 Rep 交互 | No | Rep 级别 Action Instruction |
| 多 Manager 权限分级 | No | 架构预留 |
| Guardrail 触发通知到 Messages | No | 通知机制 |
| 已 Resolved Topic 重新打开 | Yes | — |

---

## 12. 术语表

| 术语 | 定义 |
| --- | --- |
| **Manager** | 人类客服主管，管理和训练 AI Rep |
| **Team Lead** | AI 管理助手，Manager 的 Co-pilot，辅助管理 Playbook 和 Rep |
| **AI Rep** | AI 客服代理，对外以人类身份回复客户 |
| **Subagent** | 技术实现层面的大模型节点，处理不同任务。Rep Subagent 与产品概念的 AI Rep 一一对应 |
| **Topic** | Messages 中围绕一个问题的对话单元 |
| **Rule** | AI Rep 遵循的业务规则，统一实体，通过标签分类 |
| **Action** | AI Rep 可执行的具体操作 |
| **Guardrail** | 嵌入 Action Permission 的业务限制条件 |
| **Escalation** | AI 无法处理，转交给人类 |
| **Training Mode** | Rep 仅以 Internal Note 形式输出，不直接回复客户 |
| **Production Mode** | Rep 直接回复客户 |
| **Notes to Rep** | Manager 在 Zendesk Sidebar 中给 Rep 的教学指令 |

