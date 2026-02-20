---
date: 2026-02-19T11:52:36-08:00
git_commit: 5f68b8cac55e82bb4a3a3aca2a856678cfc0cf14
branch: dev
repository: ai_user_testing_mvp
topic: "Adaptive Pricing Page Scouting via Scrolling and Vision"
tags: [research, codebase, pricing, scouting, vision, playwright]
status: complete
---

# Research: Adaptive Pricing Page Scouting via Scrolling and Vision

## Research Question
Support scrolling down in the page until a pricing page is found (scroll down, feed image to very small image model, have it return true/false based on whether it sees pricing or not, repeat until true or until it reached the end of the page). Once it’s found, use that screenshot for the stream of consciousness and persona pricing page analysis. This should be predicated by a check to see if the pricing is in the HTML (which is already done; so keep that check).

## Summary
The current implementation of pricing page parsing (`ParsePricingPageUseCase.ts`) performs a navigation, captures a full-page screenshot, and then validates if pricing exists using an HTML-based check (`isPricingVisibleInHtml`). If the HTML check returns false, it currently warns but proceeds with the captured screenshot.

To support the requested "scouting" feature:
1.  **Browser Capabilities**: `RemotePlaywrightAdapter` already supports `scrollDown(pixels)`, `captureViewport()`, and `captureFullPage()`.
2.  **Scouting Model**: `LlmServiceImpl` provides access to `scoutVisionModel` (mapped to `qwen/qwen-2.5-vl-7b-instruct:free`), which is suitable for the "very small image model" requirement.
3.  **Vision Check**: `VisionAnalysisAdapter` already has a method `isPricingVisible(screenshotBase64)` that uses the scout model to return a boolean.
4.  **Integration Point**: The scouting loop should be integrated into `ParsePricingPageUseCase.execute`, occurring if the initial HTML check fails.

## Detailed Findings

### ParsePricingPageUseCase
- **Location:** `src/application/usecases/ParsePricingPageUseCase.ts`
- **Function:** Coordinates the entire pricing page analysis flow, from navigation to persona-based streaming analysis.
- **Connections:** Uses `BrowserServicePort` for navigation/scrolling/screenshots and `LlmServicePort` for HTML/Vision checks.
- **Current Logic (Lines 91-104):**
  - Captures full-page screenshot.
  - Gets cleaned HTML.
  - Checks HTML for pricing via `llmService.isPricingVisibleInHtml(pageHtml)`.

### VisionAnalysisAdapter
- **Location:** `src/infrastructure/adapters/VisionAnalysisAdapter.ts`
- **Function:** Handles vision-related API calls.
- **Code Reference:** `isPricingVisible(screenshotBase64: string)` (Line 81) implements the "TRUE/FALSE" check requested by the user using the `scoutVisionModel`.

### RemotePlaywrightAdapter
- **Location:** `src/infrastructure/adapters/RemotePlaywrightAdapter.ts`
- **Function:** Implements `BrowserServicePort` using Playwright.
- **Code Reference:** `scrollDown(pixels: number)` (Line 123) uses `window.scrollBy` and waits for 1 second. `captureViewport()` (Line 137) takes a JPEG screenshot of the current view.

## Code References
- `src/application/usecases/ParsePricingPageUseCase.ts:100` - Existing HTML-based pricing check.
- `src/infrastructure/adapters/VisionAnalysisAdapter.ts:81` - Implementation of the vision-based pricing check.
- `src/infrastructure/adapters/RemotePlaywrightAdapter.ts:123` - Implementation of the scroll logic.

## Open Questions
- **Maximum Scrolls:** How many times should we scroll before giving up? (Currently "until the end of the page").
- **Scroll Increment:** What is the ideal pixel increment for scrolling? (Current `RemotePlaywrightAdapter` uses a parameter, we need to decide the value, e.g., 800px).
- **Screenshot Usage:** If a pricing section is found at a specific scroll position, should we use the *viewport* screenshot or attempt a new *full-page* screenshot centered there? The request says "use that screenshot", implying the viewport screenshot where pricing was found.
