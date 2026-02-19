---
date: 2026-02-18T21:41:56-08:00
git_commit: d9c2b698d89fc7cc7677492a0bf763a58cb3f93b
branch: hotfix/17-persona-audit-never-finishes
repository: ai_user_testing_mvp
topic: "Bug Analysis: Pricing Page Audit Hangs and Stack Overflow"
tags: [research, codebase, bug, pricing-audit, performance, streaming]
status: complete
---

# Research: Pricing Page Audit Hangs and Stack Overflow

## Research Question
Investigate why the pricing page audit hangs on the third persona, switches weirdly between personas in the UI, and eventually throws `RangeError: Maximum call stack size exceeded`.

## Summary
The investigation revealed two major issues and several optimizations:
1. **Excessive Data Streaming**: The screenshot (a large base64 string) is sent in every single progress update (including every token delta). For a typical analysis session, this results in hundreds of megabytes or even gigabytes of redundant data being serialized and streamed, likely causing the `RangeError` during serialization and eventual memory exhaustion.
2. **Lossy Throttling**: The frontend hook `useAnalysisFlow` implements a lossy throttle that discards any update received within 150ms of the last one. This causes streaming token deltas to be lost, leading to incomplete thoughts and UI flickering.
3. **State Inconsistency**: Completion updates for personas were missing the `personaName`, causing the UI to lose track of which persona was being analyzed.
4. **Race Conditions/Hangs**: While `p-limit` is used, the heavy data load might be causing backend or network timeouts that aren't being gracefully recovered, leading to the "stuck" state.

## Detailed Findings

### ParsePricingPageUseCase
- **Location:** `src/application/usecases/ParsePricingPageUseCase.ts`
- **Function:** Orchestrates the multi-persona pricing analysis.
- **Connections:** Uses `BrowserServicePort` and `LlmServicePort`. Sends progress updates via an `onProgress` callback.
- **Issue:** Lines 154, 157, 201, 204, 236, 238 show `capturedScreenshot` and `finishedCount` being passed in every update. `personaName` is missing in the completion update (line 234).

### useAnalysisFlow Hook
- **Location:** `src/ui/hooks/useAnalysisFlow.ts`
- **Function:** Manages the frontend state for the analysis process, reading from the streamable value.
- **Issue:** Lines 96-109 implement a lossy throttle. If an update arrives too soon, it is ignored entirely, including its `analysisToken`.

### analyzePricingPage Action
- **Location:** `src/actions/analyzePricingPage.ts`
- **Function:** Server action that wraps the use case and provides a streamable value.
- **Issue:** Transparently passes all progress updates from the usecase to `stream.update`.

## Code References
- `src/application/usecases/ParsePricingPageUseCase.ts:201` - Screenshot sent in streaming loop.
- `src/application/usecases/ParsePricingPageUseCase.ts:234` - Completion update missing `personaName`.
- `src/ui/hooks/useAnalysisFlow.ts:96` - Throttling logic that discards data.

## Open Questions
- Is there an underlying rate limit being hit on the LLM provider side that causes Liam (the first one) to hang while others finish? (Possible if the first request is the largest or takes longest).
- Does the `ai` SDK have an internal buffer limit for `createStreamableValue` that is being breached by the screenshot data?
