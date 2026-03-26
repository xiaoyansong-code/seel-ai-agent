# Design Brainstorm: Seel AI Support Agent Platform (Rebuild)

## Context
Rebuilding from scratch. This is a CX Manager's tool for managing an AI employee. Two parts: Seel Backend (dashboard) and Zendesk App Sidebar simulation. The user is a busy CX Manager — interface must feel professional, calm, efficient.

---

<response>
<text>

## Idea 1: "Nordic Control Room"

**Design Movement:** Scandinavian Functionalism meets Data Dashboard

**Core Principles:**
- Extreme clarity — every element earns its space
- Warm neutrals over cold grays — approachable, not clinical
- Information density without visual noise
- Quiet confidence — "everything is under control"

**Color Philosophy:**
- Base: warm off-white (#FAFAF8) and soft charcoal (#1A1A1A)
- Primary accent: deep teal (#0D7377) — professional, calming, trust
- Secondary: warm amber (#D4A853) — attention items, notifications
- Success: sage green (#5B8C5A), Danger: muted terracotta (#C45C3E)
- Surfaces: subtle warm gray (#F2F0ED) for cards

**Layout Paradigm:**
- Persistent left sidebar (narrow, icon-first with labels)
- 2-column split for Instruct (topic list + conversation)
- Card grid for Performance and Settings
- Full-screen conversational flow for Onboarding

**Signature Elements:**
- Subtle paper-like texture on background (very faint grain)
- Rounded but not bubbly corners (8px radius)
- Status indicators as small colored dots

**Interaction Philosophy:** Minimal motion, hover = subtle background shifts, inline editing, quick actions

**Animation:** 200ms fade transitions, 2px card lift on hover, skeleton loading, chat messages slide up 150ms

**Typography:** DM Sans (600/700) headings + Inter (400/500) body + JetBrains Mono for metrics

</text>
<probability>0.08</probability>
</response>

<response>
<text>

## Idea 2: "Workspace Ink"

**Design Movement:** Editorial Design meets SaaS — Notion/Linear inspired

**Core Principles:**
- Typography-driven hierarchy — type does the heavy lifting
- Monochrome base with single accent color
- Dense but breathable
- Every screen reads like a well-designed document

**Color Philosophy:**
- Base: white (#FFFFFF) and ink black (#111111)
- Single accent: electric indigo (#4F46E5)
- 5 grays: #F9F9F9, #E8E8E8, #999999, #555555, #222222
- Desaturated status colors, no gradients

**Layout Paradigm:**
- Ultra-minimal sidebar, expands on hover
- Maximized content area
- Newspaper-style grid for Performance
- Vertical scroll conversational blocks for Onboarding

**Signature Elements:** Thin 1px borders (no shadows), generous whitespace, large display metrics (48px+)

**Interaction Philosophy:** Keyboard-first, cmd+K palette, inline editing, hover reveals actions

**Animation:** Almost none — instant state changes, 100ms chat fade-in, button press scale(0.98)

**Typography:** Instrument Serif (400) headings + Geist Sans (400/500) body + Geist Mono for data

</text>
<probability>0.06</probability>
</response>

<response>
<text>

## Idea 3: "Soft Machine"

**Design Movement:** Evolved Soft UI — Apple visionOS / Vercel dashboard inspired

**Core Principles:**
- Depth through layering — cards float, modals float above cards
- Soft, diffused lighting feel
- Glass-like translucency for overlays
- Tactile, dimensional control panel feel

**Color Philosophy:**
- Base: cool light gray (#F4F4F5) with blue undertone
- Primary: deep blue (#2563EB)
- Glass: rgba(255,255,255,0.7) with backdrop-blur
- Violet (#7C3AED) for AI elements, orange (#EA580C) for attention

**Layout Paradigm:**
- Floating sidebar with glass effect
- Layered shadow cards
- Card-based topic list + "paper" conversation container
- Centered wizard cards for Onboarding

**Signature Elements:** Multi-layer shadows, frosted glass nav, purple glow for AI elements

**Interaction Philosophy:** Everything feels pressable, smooth physics-based transitions, drag-and-drop

**Animation:** Spring-based (200-400ms with overshoot), hover lifts 4px, shimmer loading

**Typography:** Plus Jakarta Sans (400-700) for everything + IBM Plex Mono for metrics

</text>
<probability>0.05</probability>
</response>

---

## Selected: Idea 1 — "Nordic Control Room"

**Rationale:** Professional tool for busy CX Managers needs clarity and calm, not spectacle. Warm Scandinavian palette avoids cold/clinical SaaS feel. Teal + amber provides clear hierarchy. DM Sans + Inter is distinctive without distracting. Editorial (Idea 2) too sparse for data-heavy dashboard. Soft UI (Idea 3) too trendy, ages poorly. Nordic Control Room = warm, professional, information-dense, timeless.
