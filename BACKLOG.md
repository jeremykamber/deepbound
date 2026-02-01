# Product Backlog

## Research Foundation

This project is grounded in **"Deep Binding of Language Model Virtual Personas"** (Kang et al., UC Berkeley). Key insights:

- **Narrative Identity**: Personas internalize life stories; detailed backstories → deeper binding to decision-making patterns
- **Consistency Matters**: 54% improvement in persona fidelity when using LLM-as-critic to validate backstory coherence
- **Length Matters**: 10x longer backstories (2500+ tokens from multi-turn interviews) vs single-question approach
- **Financial Context**: For pricing evaluation, backstories MUST reveal spending patterns, ROI calculations, risk tolerance, financial pressures

### Prompt Strategy

1. **Initial Personas**: Emphasize diverse financial profiles + decision-making styles
2. **Backstories**: Interview-style (not monologue), internally consistent, financially grounded
3. **Validation** (future): LLM-as-critic checks for contradictions before using in evaluation
4. **Judge Prompts** (future): LLMs evaluate pricing pages AS personas, not about personas

## In Progress

### Core Persona Generation Features
- [x] **Improved LLM Prompts** - Initial persona generation + backstory prompts (Deep Binding research-backed)
- [x] **Extended Backstory Generation** - Multi-turn interview approach (5000+ tokens per backstory)
- [x] **GeneratePersonasUseCase** - Orchestrates persona and backstory generation
- [x] **LlmServiceImpl (LLM Consolidation)** - Unified adapter supporting OpenRouter, Ollama, and OpenAI-compatible APIs with built-in retries and concurrency limits.
- [x] **generatePersonasAction** - Server action wiring use case to frontend
- [x] **Dashboard UI** - Generate personas from custom customer profile + display with full backstories
- [x] **Expandable Backstory** - Backstories hidden by default, expandable on click

### Pricing Page Analysis (Phase 2)
- [x] **BrowserServicePort** - Port interface for browser automation capabilities
- [x] **RemotePlaywrightAdapter** - Implements browser service with Playwright for screenshot capture
- [x] **ParsePricingPageUseCase** - Orchestrates pricing page capture and persona analysis
- [x] **analyzePricingPageAction** - Server action for pricing analysis workflow
- [x] **Dashboard Analysis UI** - URL input, analysis display with scores/thoughts/risks per persona

### Phase 3: Deep Evaluation & Refinement [IN PROGRESS]
- [x] **LLM-as-Critic Validation** - Implement the consistency check using a separate LLM pass to ensure backstory coherence.
- [ ] **Persona-Specific Heatmaps** - AI-predicted "Gaze Maps" based on persona goals (e.g., a "Value Hunter" looks at the price first, a "CTO" looks at security/compliance first).
- [ ] **Comparative Perspective View** - Side-by-side comparison of how different personas view the same pricing tier.
- [ ] **Economic Environment Toggles** - Simulate different market conditions (Recession vs. Growth) to see how persona behavior and risk tolerance change.

## Phase 4: Behavioral Simulation & UX Flow (The "Agent" Phase) [IN PROGRESS]
- [x] **Interactive Persona Chat** - A "Talking with the User" mode where developers can interview the AI persona about their feelings toward the UI.
- [ ] **Agentic Memory (Multi-Step Foundation)** - Implement session memory and step recording to support future multi-step flows.
- [x] **Live Screenshot Feed** - Real-time viewport screenshots every 500ms during page load for debugging and monitoring agent progress.
- [ ] **Agentic Browser Navigation/Interaction** - Implement agentic browser navigation and interaction to support future multi-step flows.
- [ ] **Multi-Step Flow Testing** - Move from static page analysis to multi-page flows (e.g., Onboarding -> Pricing -> Checkout).
- [ ] **Flash-Testing (5-Second Test)** - AI persona "glance" analysis to see what sticks most in the first few seconds of exposure.
- [ ] **A/B/n Testing Simulation** - Input multiple URL variants or screenshots and have the same cohort of personas rank them based on perceived value.

### Phase 5: Team Collaboration & Reporting
- [ ] **Branded PDF Export** - Generate high-fidelity, professional PDF reports for clients and stakeholders.
- [ ] **Multi-Persona Collective Report** - Unified dashboard view that aggregates risks and friction points across the entire persona cohort.
- [ ] **Team Workspaces & Sharing** - Shared projects and persona libraries for collaborative testing.
- [ ] **Stakeholder Annotations** - Allow human users to add comments and takeaways directly onto the AI's analysis.
- [ ] **Automated PPTX/Slide Deck Generation** - Export findings as a ready-to-present slide deck for executive reviews.

### Phase 6: Integration & Ecosystem
- [ ] **CRM / Segment Integration** - Map AI personas to real-world customer segments for deeper business intelligence.
- [ ] **CI/CD "Pricing Audit"** - Automated CLI trigger to run a persona audit whenever the pricing page production build changes.
- [ ] **Chrome Extension** - One-click pricing analysis as you browse competitor sites.
- [ ] **Webhooks** - Send notifications to Slack/Discord when an analysis identifies a high-friction "Persona Red Flag."

## Backlog

- [ ] **Multi-language Support** - Generate personas and responses in other languages
- [ ] **Historical Analysis** - Track how personas respond to pricing over time
- [ ] **Export Results** - CSV export of raw persona thought data
- [ ] **Persona Templates** - Save and reuse core ICP "Master Personas" across different pricing pages.

## Done

- [x] Architecture scaffold and domain entities
- [x] Improved LLM prompts (Deep Binding research-backed)
- [x] GeneratePersonasUseCase implementation
- [x] Unified LlmServiceImpl with realistic prompts and multi-provider support
- [x] Server action layer (generatePersonasAction)
- [x] Dashboard UI with persona generation and display
- [x] AI_README.md updated for server actions pattern
- [x] **Persona Chat Integration** - Interactive interview mode with deep-linking to backstory
- [x] **Agentic Memory System** - Session recording and automated summarization every 3 steps
- [x] **Visual Gaze Prediction** - Vision-based coordinate mapping and UI overlay
- [x] **LLM-as-Critic Audit** - Automated consistency check between analysis and backstory
- [x] **Branded PDF Export** - Professional analysis reports
- [x] **Live Screenshot Feed** - Real-time viewport screenshots every 500ms during Playwright page load for live debugging
