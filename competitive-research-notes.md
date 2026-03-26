# Competitive Research Notes

## Gorgias AI Agent
- **Positioning**: "The only AI Agent built for ecommerce"
- **Core capabilities**:
  - Automate 60%+ of support
  - Connect help center, Shopify store, and more
  - Brand-specific Guidance (tells AI exactly how to respond)
  - Upload docs, write rules, and hit go
  - Auto handle order tracking, returns, FAQs
  - Offer discounts and upsells based on live inventory + shopper data
  - Tailor every reply based on customer's unique needs
- **Analytics/Performance**:
  - Review performance and success rates across key intents
  - View reasoning behind every AI response
  - Analytics to spot gaps
  - Resolution time, conversion rate metrics
- **Optimization**:
  - Update AI behavior with thumbs up or guidance tweak
  - Auto QA process to refine responses
- **Tech stack**:
  - OpenAI partnership for LLMs
  - Proprietary prompt engineering for ecommerce
  - Chaining and orchestration (cascading prompts)
  - Knowledge: help centers, internal guidelines, docs
  - 100+ ecommerce tool integrations
  - Real-time Shopify data (orders, products, inventory, customer tags)
- **Pricing**: $0.90 per resolution (annual), $1.00 per resolution (monthly)
- **Real-world performance**: Median AI resolution rate ~10%, top performers up to 51%
- **Channels**: Email, chat, social (multi-channel helpdesk)
- **Key differentiator**: Deep Shopify integration, revenue-driving (upsells/discounts), 100+ integrations


## Decagon AI
- **Positioning**: "The AI concierge for every customer" — enterprise-focused
- **Target**: Large enterprises (Chime, Duolingo, Oura, Rippling, Curology)
- **Core capabilities**:
  - Agent Operating Procedures (AOPs): natural language workflow definitions (no code)
  - Build → Optimize → Scale lifecycle
  - Multi-channel: Voice, Chat, Email — unified intelligence layer
  - Complex workflow execution (identity verification, transactional tasks, account management)
  - 70% chat and voice resolution (Chime case study)
- **Evaluation Engine**:
  - Two-phase: Offline evaluation → Online A/B testing
  - LLM-as-judge (relevance, correctness, naturalness, empathy)
  - Ground truth evaluation with human-labeled benchmarks
  - Controlled A/B testing with gradual traffic rollout
  - Customers can opt out of experiments
  - Continuous feedback loop
- **Analytics/Observability**:
  - Watchtower: always-on QA monitoring
  - Ask AI: natural language analysis of conversations
  - Business-critical metrics: CSAT, resolution rate
  - Unified evaluation view
- **Tech**:
  - Multi-model: OpenAI, Anthropic, Gemini + fine-tuned open-source
  - Orchestrated AI workflows
  - Cascading prompt chains
- **Key differentiators**:
  - Enterprise-grade evaluation engine (most sophisticated testing)
  - Natural language AOPs (no code configuration)
  - Voice AI support
  - A/B testing built-in
  - Multi-model approach


## QuickCEP
- **Positioning**: "AI-Powered Chatbots that Exceed Customer Expectations" — SMB e-commerce focused
- **Target**: Small-to-mid e-commerce brands (PatPat, Velotric, Cider, Aiper)
- **Core capabilities**:
  - AI Chatbot: product recommendation, product info, order status, returns & exchanges
  - Flow Bot: no-code chatbot flow builder for automated workflows
  - Live Chat: real-time customer conversations
  - AI Email Copilot: inbox management, draft responses, learns habits
  - Marketing automation: email, SMS, WhatsApp
  - Coupon code delivery at right moment
  - Auto collect customer email/phone
- **Setup**: Very simple — add website URLs, upload docs, click start
- **Channels**: Live chat widget, email, SMS, WhatsApp
- **Analytics**: Real-time monitoring and analytics
- **Integration**: Shopify, Shoplazza, WordPress
- **Pricing**: Free plan available, lifetime deals on SaaS marketplaces
- **Key differentiators**:
  - Very low barrier to entry (free plan, simple setup)
  - Marketing + support combined (not just support)
  - Interactive video shopping feature
  - Multi-language support
- **Weaknesses**:
  - No reasoning transparency / trace
  - No A/B testing
  - No sophisticated analytics (intent breakdown, sentiment)
  - Limited enterprise features
  - More chatbot than AI agent (rule-based flows)

## Shoplazza (Platform-native AI Support)
- **Positioning**: E-commerce platform with built-in AI operation scenarios
- **Context**: Shoplazza is an e-commerce platform (like Shopify), not a standalone AI support tool
- **Recently announced**: "Agentic Commerce Architecture" (March 2026)
  - Ecom Agent orchestration layer
  - Automated task execution (campaigns, merchandising, customer management)
  - Goal-based execution across systems
- **Customer support approach**: Marketplace of third-party tools
  - Laibot: multichannel support (chat, email, social), 100+ languages, preset workflows, real-time analytics
  - HelpLook: AI knowledge base, zero-code, AI Q&A assistant
  - WildGoose Live Chat: 201 languages, custom AI bots, multi-channel
  - QuickCEP: AI chatbot + interactive video shopping
- **Key characteristics**:
  - Platform-native integration advantage
  - Relies on third-party apps for actual AI support
  - Focus on broader "agentic commerce" (not just support)
  - Strong in Chinese cross-border e-commerce market
- **Weaknesses**:
  - No first-party AI support agent product
  - Fragmented experience (multiple third-party tools)
  - No unified analytics across tools
  - No reasoning transparency


## Gorgias AI Agent Reasoning (detailed)
- **Reasoning section** expandable under any AI Agent message:
  - What AI Agent is trying to achieve (specific goal)
  - Which knowledge sources it used (exact guidance, help article, or action)
  - Why it made its final decision (close/snooze/handover reasoning)
- Available in live conversations AND test playground
- Available from September 2025 onward
- **Analytics dashboard**:
  - Automation rate
  - Time savings, cost savings
  - First Response Time reduction
  - Performance by feature (Flows, Article Recommendations)
  - Flow drop-off analysis
  - Custom dashboards with configurable widgets
- **Testing**:
  - AI Agent Testing with source visibility
  - Can see which sources informed test responses
  - No A/B testing mentioned (unlike Decagon)

## Gorgias AI Agent Pricing
- $0.90 per resolution (annual) / $1.00 per resolution (monthly)
- Separate from helpdesk subscription
- Median real-world resolution rate: ~10%, top performers up to 51%


## Decagon Product Details (expanded)
- **AOPs (Agent Operating Procedures)**: Natural language instructions that compile into code
  - Non-technical users can build and iterate
  - Technical teams retain control over guardrails, integrations, versioning
- **Build features**:
  - Seamless integration with ticketing, CRM, knowledge bases, CCaaS
  - Brand consistency across channels
  - Omnichannel: chat, email, voice, SMS, custom API
- **Optimize features**:
  - Simulated conversations and unit testing before deployment
  - Transparent observability: trace every decision (model calls, workflows, knowledge articles)
  - Enterprise-grade guardrails (identity verification, refunds)
  - A/B testing: route live conversations across agent versions, measure CSAT/deflection
- **Scale features**:
  - AI-powered insights: built-in analytics, theme identification, anomaly detection
  - Natural language analysis agent (Ask AI)
  - Watchtower: review, flag, audit responses; monitor sentiment, fraud alerts
  - Knowledge suggestions: identify knowledge gaps, auto-draft new articles
  - User memory: cross-interaction context
- **Pricing**: Enterprise custom, median ~$400K/year, per-conversation or per-resolution
- **Design approach**: Clean, modern enterprise SaaS. Heavy on observability and debugging tools.

