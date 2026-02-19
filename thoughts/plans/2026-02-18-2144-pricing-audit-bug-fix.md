# Pricing Page Audit Performance and Stack Overflow Fix

## Overview
This plan addresses the `RangeError: Maximum call stack size exceeded` and UI oddities during the pricing page audit. The primary cause is identified as excessive data streaming (sending the large base64 screenshot in every token update) and lossy throttling on the frontend.

## Current State Analysis
- **Excessive Data**: `ParsePricingPageUseCase` sends the full-page screenshot (base64) in every `onProgress` callback, even for single token deltas.
- **Lossy Throttling**: `useAnalysisFlow` discards `onProgress` updates if they occur within 150ms of the last update, losing `analysisToken` data in the process.
- **State Confusion**: Completion updates in `ParsePricingPageUseCase` are missing `personaName`, causing the UI to lose track of which persona finished.

## Desired End State
- **Efficient Streaming**: Screenshot is sent once (or only when changed).
- **Non-lossy Throttling**: UI updates are throttled, but all streamed tokens are captured and displayed.
- **Consistent State**: All updates include relevant metadata (like `personaName`) to ensure the UI tracks progress accurately.

## Implementation Approach
1.  **Backend (Use Case)**: Stop sending `capturedScreenshot` in repeat updates. Add missing `personaName` to completion updates.
2.  **Frontend (Hook)**: Accumulate tokens in a local variable/ref and apply updates to state in a way that doesn't lose data, or simply rely on `useTransition` and remove the manual throttle if it proves unnecessary with the reduced data load.

## Phase 1: Backend Optimization
### Overview
Reduce the payload size of progress updates and fix missing metadata.

### Changes Required:
#### 1. ParsePricingPageUseCase
**File**: `src/application/usecases/ParsePricingPageUseCase.ts`
**Changes**: 
- [x] Remove redundant `screenshot: capturedScreenshot` from multiple `onProgress` calls.
- [x] Add `personaName: persona.name` to the final `onProgress` call after a persona is analyzed.

## Phase 2: Frontend Throttling Fix
### Overview
Ensure streaming thoughts are never lost due to throttling.

### Changes Required:
#### 1. useAnalysisFlow Hook
**File**: `src/ui/hooks/useAnalysisFlow.ts`
**Changes**:
- [x] Use an accumulator for `streamingTexts` so that tokens are NEVER discarded.
- [x] Optimize state updates to be non-lossy.

## Phase 3: Runaway Generation Guardrails
### Overview
Prevent the LLM from looping indefinitely and crashing the app.

### Changes Required:
#### 1. VisionAnalysisAdapter
- [x] Add strict rules to prompt: MAX 10 risks, No repetitions.
- [x] Set `maxTokens: 2048` to hard-stop runaway generation.

#### 2. ParsePricingPageUseCase
- [x] Add "Emergency Break" in stream loop (Limit chunks/characters).

## Phase 4: UI Robustness
### Overview
Protect the browser from massive payloads that cause stack overflows.

### Changes Required:
#### 1. useAnalysisFlow Hook
- [x] Add `50000` character limit to the frontend state accumulator.

## Testing Strategy
- **Manual**: Run a pricing page audit with multiple personas.
- **Observation**:
    - Verify the analysis doesn't hang or loop.
    - Verify thoughts for all personas are complete.
    - Verify no `RangeError` or `Maximum call stack size exceeded` occurs.
