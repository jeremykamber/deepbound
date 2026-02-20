# Adaptive Pricing Page Scouting Implementation Plan

## Overview
Enhance the pricing page analysis flow by implementing an "adaptive scouting" mechanism. Instead of a blind scroll, the system will use a two-step "guided strike" approach:
1.  **Targeted Jump**: Use the small text LLM to analyze the HTML and identify specific IDs, selectors, or anchor text where pricing exists.
2.  **Lazy-Load Approach**: Jump to a 1000px buffer above the target and perform a "stroll" (2 smaller scrolls) to trigger lazy-loaded animations.
3.  **Vision Verification**: Use a lightweight vision model to confirm the pricing is actually visible before locking in the screenshot.

## Current State Analysis
- `ParsePricingPageUseCase` currently performs a single `captureFullPage()` call.
- `isPricingVisibleInHtml` is a simple boolean check.
- `RemotePlaywrightAdapter` has basic scrolling but needs more granular control (scrollTo, coordinate detection).

## Desired End State
The system intelligently "targets" the pricing section using HTML cues, approaches it carefully to handle modern JS animations, and verifies the result with vision.

### Key Discoveries:
- `VisionAnalysisAdapter.ts:117`: Existing `isPricingVisibleInHtml` can be upgraded to return JSON.
- `RemotePlaywrightAdapter.ts`: Already handles viewport screenshots and basic scrolling.

## What We're NOT Doing
- We are not changing the core analysis prompt or the persona logic.
- We are not scrolling through multiple sub-pages (only the current URL).

## Implementation Approach

### 1. The "Locator" Upgrade
Upgrade `isPricingVisibleInHtml` to return:
```typescript
interface PricingLocation {
  found: boolean;
  selector?: string;   // Likely ID or specific class
  anchorText?: string; // Unique text like "Choose your plan"
  reasoning?: string;
}
```

### 2. The "Approach" Strategy
1.  **Calculate Target Y**: Use Playwright to find the coordinate of the `selector` or `anchorText`.
2.  **The Buffer Jump**: If found, jump to `targetY - 1000px`.
3.  **The Stroll**: Perform 2 scrolls of ~500px with brief pauses to trigger `IntersectionObserver` callbacks and animations.
4.  **Confirm**: Capture viewport and run `isPricingVisible` (Vision).
5.  **Fallback**: If no target found or Vision confirmation fails, fall back to linear scrolling (800px increments).

## Phase 1: Port & Schema Updates - [x] Done
### Overview
Define the new `PricingLocation` interface and update the service ports.

### Changes Required:
#### 1. Domain Types
**File**: `src/domain/ports/LlmServicePort.ts`
**Changes**: Update `isPricingVisibleInHtml` return type.

#### 2. VisionAnalysisAdapter
**File**: `src/infrastructure/adapters/VisionAnalysisAdapter.ts`
**Changes**: Update `isPricingVisibleInHtml` to use a JSON-based prompt and parse the `PricingLocation` response.

## Phase 2: Browser Adapter Enhancements - [x] Done
### Overview
Add specialized methods to handle coordinate detection and specific scrolling.

### Changes Required:
#### 1. BrowserServicePort
**File**: `src/domain/ports/BrowserServicePort.ts`
**Changes**: Add `getElementLocation(selector: string, anchorText?: string): Promise<number | null>` and `scrollTo(y: number): Promise<void>`.

#### 2. RemotePlaywrightAdapter
**File**: `src/infrastructure/adapters/RemotePlaywrightAdapter.ts`
**Changes**: Implement `getElementLocation` using `page.evaluate` and `scrollTo`.

## Phase 3: Implement Scouting Logic in UseCase - [x] Done
### Overview
Assemble the pieces in `ParsePricingPageUseCase.execute`.

### Changes Required:
#### 1. ParsePricingPageUseCase
**File**: `src/application/usecases/ParsePricingPageUseCase.ts`
**Changes**: 
- Implement the "Guided Strike" logic: `HTML Check -> Targeted Jump -> Vision Confirm`.
- Implement the "Linear Scroll" fallback.
- Broadcast progress updates during the "scouting" phase.

## Success Criteria:
### Automated:
- [x] `npm run lint` passes (except for pre-existing errors).
- [x] `PricingLocation` JSON parsing is robust against LLM preamble.

### Manual:
1. Test on a page with a standard ID (e.g., `<section id="pricing">`).
2. Test on a page with lazy-loaded tables.
3. Verify that the "Stroll" pauses allow images to load.
4. Verify fallback to linear scrolling when HTML analysis fails.

---
## GIT COMMIT MESSAGE
feat: implement targeted pricing scouting with lazy-load approach and vision verification

