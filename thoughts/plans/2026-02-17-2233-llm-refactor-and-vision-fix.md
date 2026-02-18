# LLM Service Refactoring & Vision Analysis Fix Implementation Plan

## Overview
This plan addresses the "Pricing Page Analysis" hallucination bug by fixing the vision model configuration and simplifying the analysis pipeline. Additionally, it refactors the bloated `LlmServiceImpl` (1000+ lines) into a lean core service with specialized domain adapters (`PersonaAdapter`, `VisionAnalysisAdapter`, `ChatAdapter`) to improve maintainability and extensibility.

## Current State Analysis
- **Hallucination Bug**: Previously caused by a text-only model default. The USER has manually switched to `qwen/qwen3-vl-8b-instruct`, which supports vision. The remaining issue is the pipeline grounding and complexity.
- **Pipeline Inefficiency**: The analysis process is split into two heavy LLM calls: one for raw thoughts and one for structured JSON extraction.
- **Complexity**: `LlmServiceImpl.ts` is a "God Class" that handles everything from persona generation to scouting and chat, making it difficult to debug and evolve.
- **Grounding Gap**: The vision analysis does not receive the `cleanedHtml` of the page, relying solely on a potentially low-res screenshot.

## Desired End State
- **Functional Vision**: Use the manually configured `qwen/qwen3-vl-8b-instruct` (or equivalent vision-capable model) for analysis.
- **Consolidated Analysis**: A single `streamObject` (structured output) call provides both the raw thoughts and the JSON data in real-time.
- **Decoupled Architecture**: `LlmServiceImpl` is a thin wrapper for LLM plumbing; specialized domain logic lives in separate adapters.
- **Hybrid Grounding**: The analysis prompt incorporates both the screenshot and the `cleanedHtml`.

### Key Discoveries:
- **Correction**: The USER manually updated `OR_VISION_MODEL` to `qwen/qwen3-vl-8b-instruct` (fixed the base capability issue).
- **Pattern**: `src/infrastructure/adapters/LlmServiceImpl.ts:418` - Use of Vercel AI SDK `streamText` and `Output` types.
- **Missing Link**: `src/application/usecases/ParsePricingPageUseCase.ts:149` - The loop triggers redundant extraction after streaming.

## What We're NOT Doing
- Changing the Browser scouting logic (keeping specialized scouting for now, but reducing its usage).
- Implementing new persona types or branding features.
- Modifying the UI's Radar charts or Risk lists (only the data source).

## Implementation Approach
1. **Lean Core**: Strip `LlmServiceImpl` down to its core: `createChatCompletion`, `createChatCompletionStream`, and `withRetry` logic.
2. **Adapter Split**: Extract persona, vision analysis, and chat logic into their own adapter classes.
3. **Structured Streaming**: Use `streamObject` or similar to consolidate the "Thoughts + JSON" process into a single pass.
4. **Integration**: Update the `ParsePricingPageUseCase` to use the new adapters and the simplified pipeline.

---

## Phase 1: Core Refactoring & Infrastructure Cleanup

### Overview
Refactor `LlmServiceImpl` to be a domain-agnostic LLM utility. (Vision model already updated by USER).

### Changes Required:

#### 1. Core LLM Service
**File**: `src/infrastructure/adapters/LlmServiceImpl.ts`
**Changes**: 
- Retain only `client`, `providerInstance`, `withRetry`, `createChatCompletion`, and `createChatCompletionStream`.
- Remove all domain-specific methods (they will move to adapters).
- Keep `OR_VISION_MODEL` as `qwen/qwen3-vl-8b-instruct` (manually set by USER).

#### 2. Specialized Interface Extensions
**File**: `src/domain/ports/LlmServicePort.ts`
**Changes**: Update the interface or create new interfaces for the specialized adapters if necessary.

### Success Criteria:

#### Automated Verification:
- [ ] Type checking passes: `npm run tsc` (expected errors due to missing methods in `LlmServiceImpl` until adapters are wired).

#### Manual Verification:
- [ ] Check if `OR_VISION_MODEL` can successfully process an image in a simple test script.

---

## Phase 2: Domain Adapters Implementation

### Overview
Create specialized adapters to house the business logic for Personas, Vision Analysis, and Chat.

### Changes Required:

#### 1. Persona Adapter
**File**: `src/infrastructure/adapters/PersonaAdapter.ts`
**Changes**: Implement `generateInitialPersonas` and `generatePersonaBackstory`.

#### 2. Vision Analysis Adapter
**File**: `src/infrastructure/adapters/VisionAnalysisAdapter.ts`
**Changes**: 
- Implement `analyzeStaticPageStream` to use **hybrid grounding** (Screenshot + HTML).
- **CONSOLIDATION**: Implement a single method that returns a stream of the full `PricingAnalysis` object (JSON + thoughts).
- Implement `isPricingVisible` and `isPricingVisibleInHtml`.

#### 3. Chat Adapter
**File**: `src/infrastructure/adapters/ChatAdapter.ts`
**Changes**: Implement `chatWithPersonaStream` and `validatePromptDomain`.

### Success Criteria:

#### Automated Verification:
- [ ] New files exist and follow the established adapter pattern.
- [ ] `npm run tsc` passes.

---

## Phase 3: Pipeline Consolidation & Hallucination Fix

### Overview
Update the use case to use the new VisionAnalysisAdapter and ensure the vision model is receiving all context.

### Changes Required:

#### 1. Update ParsePricingPageUseCase
**File**: `src/application/usecases/ParsePricingPageUseCase.ts`
**Changes**:
- Pass `pageHtml` to the `analyzeStaticPageStream` call.
- Remove the call to `extractInsights` (since it's now part of the stream).
- Handle the consolidated stream output.

#### 2. Update Analysis Prompt
**File**: `src/infrastructure/adapters/VisionAnalysisAdapter.ts`
**Changes**:
- Update the prompt to explicitly tell the model: "You have both a screenshot and the raw HTML text. Use the HTML to verify prices and details that might be blurry in the image."

### Success Criteria:

#### Automated Verification:
- [ ] No linting errors.

#### Manual Verification:
- [ ] **Crucial Test**: Run an analysis on a pricing page.
- [ ] Verify the "Thoughts" stream is relevant to the *actual* image content.
- [ ] Verify the Radar chart and Risks are populated with real data, not hallucinations.

---

## Phase 4: Integration & Cleanup

### Overview
Final wiring of the dashboard actions and removal of dead code.

### Changes Required:

#### 1. Action Rewiring
**File**: `src/actions/analyzePricingPage.ts`
**Changes**: Update to use the new Adapter-based structure.

#### 2. Cleanup
**File**: `src/infrastructure/adapters/LlmServiceImpl.ts`
**Changes**: Remove any leftover prompt strings or deprecated methods.

### Success Criteria:

#### Automated Verification:
- [ ] `npm run build` passes.

#### Manual Verification:
- [ ] Full end-to-end flow: Generate Persona -> Backstory -> Analysis -> Chat.

---

## Testing Strategy

### Unit Tests:
- Mock the new `LlmServiceImpl` and test that `VisionAnalysisAdapter` correctly formats the hybrid prompt.
- Test `streamObject` parsing for partial/malformed JSON during the stream.

### Integration Tests:
- End-to-end analysis of a known pricing URL (e.g., a sample static page) to verify score accuracy.
