# Adaptive Pricing Page Scouting Implementation Plan

## Overview
Enhance the pricing page analysis flow by implementing an "adaptive scouting" mechanism. Instead of relying solely on a full-page screenshot, the browser will scroll through the page and uses a lightweight vision model to identify when pricing information is actually visible in the viewport. This ensures the subsequent persona-based analysis is grounded in the most relevant visual context.

## Current State Analysis
- `ParsePricingPageUseCase` currently performs a single `captureFullPage()` call.
- It performs an HTML-based check (`isPricingVisibleInHtml`) but proceeds even if it fails.
- `RemotePlaywrightAdapter` already has `scrollDown` and `captureViewport` capabilities.
- `VisionAnalysisAdapter` already has `isPricingVisible` (using the `scoutVisionModel`).

## Desired End State
The system intelligently "hunts" for pricing on the page by scrolling and looking. Once found, it captures that specific viewport as the primary visual context for analysis.

### Key Discoveries:
- `ParsePricingPageUseCase.ts:100`: Existing HTML check.
- `VisionAnalysisAdapter.ts:81`: Implementation of vision-based pricing check already exists but isn't integrated into the main flow.
- `RemotePlaywrightAdapter.ts:123`: Scroll logic is available.

## What We're NOT Doing
- We are not changing the core analysis prompt or the persona logic.
- We are not adding complex multi-page navigation (only scrolling on the provided URL).

## Implementation Approach
1.  **Refine Scouting Loop**: Implement a loop in `ParsePricingPageUseCase` that scrolls down the page in increments (e.g., 800px).
2.  **Vision Verification**: In each step of the loop, capture the current viewport and ask the `scoutVisionModel` if pricing is visible.
3.  **Shortcut/Fallback**: Use the HTML check as a "gate" or "booster". If the HTML check is negative, we still scout (as the HTML cleaner might miss JS-heavy pricing components), but we use it to inform progress.
4.  **Screenshot Capture**: Once the scout model returns `TRUE`, we lock in that screenshot for the rest of the pipeline.

## Phase 1: Implement Scouting Loop in UseCase
### Overview
Modify `ParsePricingPageUseCase.execute` to include the scrolling and vision-check loop.

### Changes Required:
#### 1. ParsePricingPageUseCase
**File**: `src/application/usecases/ParsePricingPageUseCase.ts`
**Changes**: 
- Update the `execute` method to include a scouting loop.
- Add `maxScrolls` and `scrollIncrement` constants.
- Integrate `llmService.isPricingVisible`.
- Fallback to full-page screenshot if scrolling completes without a "hit".

```typescript
// Proposed Scouting Loop Logic
let foundVisually = false;
let scoutingScreenshot = '';
const maxScrolls = 10;
const scrollIncrement = 800;

for (let i = 0; i < maxScrolls; i++) {
  const viewportScreenshot = await this.browserService.captureViewport();
  const isVisible = await this.llmService.isPricingVisible(viewportScreenshot);
  
  if (isVisible) {
    foundVisually = true;
    scoutingScreenshot = viewportScreenshot;
    console.log(`[ParsePricingPageUseCase] Pricing found visually at scroll ${i}`);
    break;
  }
  
  // Check if we can scroll further (some logic to detect end of page)
  await this.browserService.scrollDown(scrollIncrement);
}

capturedScreenshot = foundVisually ? scoutingScreenshot : await this.browserService.captureFullPage();
```

## Phase 2: Refine Browser Adapter Stability
### Overview
Ensure that `scrollDown` and `captureViewport` are performant and wait for any lazy-loaded content to appear.

### Changes Required:
#### 1. RemotePlaywrightAdapter
**File**: `src/infrastructure/adapters/RemotePlaywrightAdapter.ts`
**Changes**: 
- Ensure `captureViewport` uses a reasonable quality/format for the scouting model.
- (Optional) Add a check to see if the page has reached the bottom.

## Success Criteria:
### Automated:
- `npm run lint` passes.
- Unit tests for `ParsePricingPageUseCase` (if any exist) cover the scouting logic.

### Manual:
1. Provide a URL where pricing is "below the fold" (e.g., a long landing page like `Stripe.com` or `Linear.app`).
2. Observe the logs to see "Scrolling..." and "Pricing found visually...".
3. Verify that the final analysis uses the screenshot where pricing is centered.

---
## GIT COMMIT MESSAGE
feat: implement adaptive pricing scouting via scrolling and vision-based detection
