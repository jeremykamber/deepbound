---
date: 2026-02-17T22:23:50-08:00
git_commit: 3b175a5ba43d3395d416fa8a2a6df272aafed169
branch: fix/lost-generation-context
repository: ai_user_testing_mvp
topic: "Pricing Page Analysis Refactoring & Vision Debugging"
tags: [research, vision-models, llm, pricing-analysis]
status: complete
---

# Research: Pricing Page Analysis & Vision Debugging

## Research Question
Identify why the pricing page analysis results in hallucinations and suggest simplification for the current analysis pipeline.

## Summary
The current pricing page analysis pipeline is suffering from a critical model misconfiguration: the designated "vision" model is actually a text-only model. This causes the LLM to ignore image context and hallucinate responses based on the prompt alone. Furthermore, the analysis process is multi-staged and can be significantly simplified by consolidating state and leveraging modern structured-output streaming.

## Detailed Findings

### 1. Vision Model Misconfiguration (The Hallucination Bug)
- **Location:** `src/infrastructure/adapters/LlmServiceImpl.ts:30`
- **Issue:** `OR_VISION_MODEL` is set to `mistralai/mistral-small-3.1-24b-instruct`.
- **Finding:** Mistral Small 24B is a text-only model. It does not support image input on OpenRouter. When images are sent via the `image_url` block, they are either stripped or ignored. The model then generates a "monologue" based solely on the prompt's instruction to "evaluate a pricing page," leading to pure hallucination.
- **Fix:** Update `OR_VISION_MODEL` to a legitimate vision model like `google/gemini-2.0-flash-001`, `anthropic/claude-3.5-sonnet`, or `openai/gpt-4o-mini`.

### 2. Analysis Pipeline Complexity
- **Location:** `src/application/usecases/ParsePricingPageUseCase.ts`
- **Current Flow:**
    1. **Scouting:** Navigates and takes live screenshots (intensive).
    2. **Grounding Check:** Calls `isPricingVisibleInHtml` (Extra LLM call).
    3. **Analysis Step 1:** `analyzeStaticPageStream` (Streams raw thoughts).
    4. **Analysis Step 2:** `extractInsights` (Second LLM call per persona to parse the raw thoughts into JSON).
- **Redundancy:** The "raw thoughts" stream is helpful for UI feedback but requires a second heavy call to structure the data for the radar charts and risk lists.

### 3. Data Grounding Gap
- **Location:** `src/infrastructure/adapters/LlmServiceImpl.ts:849`
- **Finding:** While the `ParsePricingPageUseCase` fetches `cleanedHtml`, this text is **not passed** to the `analyzeStaticPageStream` method. The vision model only receives the persona and the image. If the image resolution is low or text is small, the model has no text grounding to rely on, exacerbating hallucinations if vision fails.

## Code References
- `src/infrastructure/adapters/LlmServiceImpl.ts:30` - `OR_VISION_MODEL` definition.
- `src/infrastructure/adapters/LlmServiceImpl.ts:818` - `analyzeStaticPageStream` method missing text grounding in the prompt.
- `src/application/usecases/ParsePricingPageUseCase.ts:149` - The loop that triggers the two-step analysis process.

## Simplification Opportunities
1. **Consolidate LLM Calls:** Use a single Vision + Structured Output call per persona. Modern SDKs (like Vercel AI SDK's `streamObject`) allow streaming the JSON parts so the UI can still update live while the analysis is "thinking."
2. **Remove Redundant Scouting:** If the goal is a simple "wedge" product, we can skip the live-streaming "scouting" phase and just take one high-quality full-page screenshot.
3. **Inject Text Grounding:** Pass the `cleanedHtml` as part of the vision model prompt. This allows the model to see the actual text (prices, features) even if the vision part of the model is struggling with image clarity.

## Open Questions
- Do we want to keep the "Long Backstory" generation as a separate step, or should the analysis also be grounded in the backstory more explicitly? (Currently it is passed via `stringifyPersona`).
- Which specific vision model is preferred for cost/speed vs. accuracy? `gemini-2.0-flash` is currently very fast and capable on OpenRouter.
