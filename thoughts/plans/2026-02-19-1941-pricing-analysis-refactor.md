# Pricing Analysis Refactor: Scrolled Viewport and HTML Summarization Implementation Plan

## Overview
Refactor the pricing page analysis phase to use a compacted summary of the dynamically loaded HTML and strictly the scrolled viewport screenshot, replacing the current full-page screenshot and raw top-of-page HTML. This ensures the vision model evaluates the exact visual context the user sees, while retaining critical factual data through an objective, LLM-generated HTML summary.

## Current State Analysis
- **Scouting HTML**: The `ParsePricingPageUseCase` captures HTML *before* scouting (at the top of the page) and uses it to find pricing elements (Targeted Strike). This raw HTML is currently passed all the way to the persona analysis.
- **Screenshot**: After scouting, it captures a `captureFullPage()` screenshot, ignoring the actual viewport the browser scrolled to, which can dilute the model's focus.
- **Context Overload**: Raw HTML can be long. Passing both raw HTML and a full-page screenshot can lead to hallucinations or timeouts.

## Desired End State
- The Targeted Strike scouting will continue to use the initial HTML.
- **After** the browser has scrolled to the pricing section (via strike or scan), the system will capture the HTML *again* to capture dynamically loaded/hydrated content.
- A new `summarizeHtml` method using a small, fast LLM (`google/gemma-3-12b-it` or similar) will condense this post-scroll HTML into an objective summary (Product info, tiers, factual features, links).
- The `captureFullPage()` call will be removed or replaced by using the tracked `lastScoutingViewport`.
- The Persona Vision Models will receive the `lastScoutingViewport` and the `compactedHtmlSummary` as context.

### Key Discoveries:
- `ParsePricingPageUseCase.ts:169` currently uses `captureFullPage()`. The `lastScoutingViewport` is already capturing the viewport at the right moment (line 94, 124, 149).
- `RemotePlaywrightAdapter.ts:216` has `getCleanedHtml()`, which is well-suited for both initial target lookup and the final compacted summary.
- The small text model (`this.llmService.smallTextModel`) is already set up and ideal for the compacting task.

## What We're NOT Doing
- We are not changing the fallback linear scan or targeted strike logic.
- We are not altering the Persona output JSON schema; only the inputs provided to the vision model are changing.
- We are not removing HTML context entirely, just compacting it.

## Implementation Approach
Phase 1 focuses on adding the summarization capability to the LLM service. Phase 2 integrates this capability into the use case and adjusts the vision model prompt to consume the summary instead of raw HTML.

---

## Phase 1: Extraction Adapter and LLM Summarization

### Overview
Implement a new `ExtractionAdapter` to handle text-to-text extraction tasks, specifically the HTML compacting prompt. This keeps the `VisionAnalysisAdapter` focused strictly on vision-based tasks.

### Changes Required:

#### 1. Add Port Method
**File**: `src/domain/ports/LlmServicePort.ts`
**Changes**: Add `summarizeHtml(html: string): Promise<string>;` to the `LlmServicePort` interface.

#### 2. Create ExtractionAdapter
**File**: `src/infrastructure/adapters/ExtractionAdapter.ts`
**Changes**: Create a new adapter that implements the objective summarization logic using the `extractionModel` (mapped to `google/gemma-3-12b-it`).
```typescript
import { LlmServiceImpl } from "./LlmServiceImpl";

export class ExtractionAdapter {
  constructor(private llmService: LlmServiceImpl) { }

  async summarizeHtml(html: string): Promise<string> {
    const prompt = `You are an expert web data extractor. You are provided with the cleaned HTML of a page (likely a pricing page).
Your task is to summarize this HTML into a highly objective, compact markdown format.
Focus ONLY on the objective facts that would be useful for a customer evaluate the product. Do NOT include marketing fluff or subjective opinions.

Extract and structure the following:
1. Product/Website Topic: Briefly, what is this product/service based on the text?
2. Navigation/Functional Links: Key links found (e.g., "Login", "Contact Sales", "FAQ", "Book Demo").
3. Pricing Tiers: Exact names of plans, price points, and billing cycles (e.g., Monthly vs Annual). List specific currency symbols if present.
4. Features & Toggles: Objective list of features included in each tier. Mention if there's a "Free Trial" or "Freemium" version.
5. Fine Print/Limits: Any mentioned limits (e.g., "up to 5 users"), overage charges, or guarantees.

HTML CONTENT:
"""
${html}
"""

Return ONLY the markdown summary. DO NOT include any conversational preamble.`;

    const content = await this.llmService.createChatCompletion(
      [{ role: "user", content: prompt }],
      {
        temperature: 0.1,
        model: this.llmService.extractionModel,
        purpose: "HTML Compacting",
      }
    );

    return content;
  }
}
```

#### 3. Register Adapter in LLM Service
**File**: `src/infrastructure/adapters/LlmServiceImpl.ts`
**Changes**: 
- Import `ExtractionAdapter`.
- Add `private extractionAdapter: ExtractionAdapter;` to the class properties.
- Initialize it in the constructor: `this.extractionAdapter = new ExtractionAdapter(this);`.
- Implement the interface method: `async summarizeHtml(html: string) { return this.extractionAdapter.summarizeHtml(html); }`.

### Success Criteria:
* **Automated**: `tsc --noEmit` verifies the port and adapter implementation.

---

## Phase 2: Orchestration and Vision Prompt Updates

### Overview
Update the main use case to capture HTML post-scroll, summarize it, and feed the viewport screenshot + summary to the persona vision analysis.

### Changes Required:

#### 1. Update Use Case Orchestration
**File**: `src/application/usecases/ParsePricingPageUseCase.ts`
**Changes**: 
- After the scouting phase (around line 166), capture the new DOM state and generate the summary.
- Remove `capturedScreenshot = await this.browserService.captureFullPage();`.
- Pass `lastScoutingViewport` and the `compactedHtml` to the analysis step.
```typescript
      // 4. Final Capture (Hydrated Page at Scrolled Position)
      // Capture the DOM state after scrolling has triggered lazy loads/animations
      const finalHtml = await this.browserService.getCleanedHtml();
      
      // Compact the HTML into an objective summary
      onProgress?.({ step: 'THINKING' }); // Start thinking earlier while summarization happens
      console.log(`[ParsePricingPageUseCase] Compacting HTML...`);
      const compactedHtml = await this.llmService.summarizeHtml(finalHtml);
      console.log(`[ParsePricingPageUseCase] HTML Compacting complete.`);

      // Use the last targeted viewport instead of full page
      capturedScreenshot = lastScoutingViewport;
      pageHtml = compactedHtml; // Replace the raw HTML with the summary for downstream analysis
```

#### 2. Update Vision Adapter Prompt
**File**: `src/infrastructure/adapters/VisionAnalysisAdapter.ts`
**Changes**: Modify `analyzePricingPageStream` and `analyzePricingPageCompletion` to reference the "summarized HTML facts" rather than "raw HTML".
```typescript
        CONTEXT:
        You are looking at a pricing page. You have been provided with:
        1. A screenshot of the exact viewport containing the pricing.
        2. A verified factual summary of the page's HTML (including product info, tier data, and fine print).
        
        // ...
        
        HYBRID GROUNDING RULES:
        - Use the screenshot to gauge visual appeal, layout, emotion, and visual hierarchy.
        - Use the HTML summary to verify specific prices, plan names, and fine print that might be cut off or hard to read in the image.
        - If there is a contradiction, trust the HTML summary for hard data (prices/features) and the screenshot for layout/emotion.
```
*Note: Update the prompt injection variable from `PAGE HTML CONTENT:` to `PAGE FACT SUMMARY:`.*

### Success Criteria:
* **Automated**: Application compiles successfully without type errors.
* **Manual**: Running a pricing audit visually stops exactly at the viewport where pricing is found, and the AI terminal output logs `[HTML Compacting]` being executed, resulting in a successful persona analysis.

## Testing Strategy
* **Unit Tests**: N/A for this MVP wrapper level.
* **Integration Tests**: Perform a live pricing page audit on a known site (e.g., Stripe, Vercel) and verify that the context fed to the final vision call consists of the base64 view port image and a concise text string (the summary), rather than a massive HTML blob. Validation is confirming no maximum call stack/timeout issues occur and the agent grasps the plan details cleanly.
