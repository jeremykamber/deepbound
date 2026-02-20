---
date: 2026-02-20T10:25:06-08:00
git_commit: 66795c486682cb6cdd8fc96b1a87259af7359245
branch: feat/image-upload-support
repository: ai_user_testing_mvp
topic: "Image Upload Support Research"
tags: [research, codebase, image-upload, vision-analysis]
status: complete
---

# Research: Image Upload Support

## Research Question
Conduct research that supports implementing image upload support (so where we support instead of the user putting in a URL they can instead just upload a screenshot of their pricing page and have that be analyzed; HTML analysis would obviously be turned off there).

## Summary
The current system is heavily optimized for a "URL-first" workflow where a headless browser (Playwright) scouts the page, identifies pricing, captures a viewport screenshot, and extracts HTML for analysis. Implementing image upload requires bypassing the browser scouting phase and feeding the uploaded image directly into the persona analysis pipeline while disabling HTML-based grounding.

## Detailed Findings

### ParsePricingPageUseCase
- **Location:** `src/application/usecases/ParsePricingPageUseCase.ts`
- **Function:** Orchestrates the entire analysis flow. Currently, `execute()` is hardcoded to navigate to a URL and perform scouting.
- **Connections:** Uses `BrowserServicePort` for navigation/scouting and `LlmServicePort` for pricing detection, HTML summarization, and persona analysis.
- **Key Logic:**
    - Line 68: `await this.browserService.navigateTo(url, ...)` starts the browser phase.
    - Line 101: `await this.llmService.isPricingVisibleInHtml(pageHtml)` starts the HTML scouting.
    - Line 186: `await this.llmService.summarizeHtml(finalHtml)` creates the HTML summary for grounding.
    - Line 225: The persona analysis loop starts, passing `capturedScreenshot` and `pageHtml` to the LLM.

### VisionAnalysisAdapter
- **Location:** `src/infrastructure/adapters/VisionAnalysisAdapter.ts`
- **Function:** Handles the actual LLM vision calls.
- **Logic:**
    - `analyzePricingPageStream` (Line 14) and `analyzePricingPageCompletion` (Line 167) both take an optional `pageHtml`.
    - The prompt (Line 60) conditionally includes the HTML summary: `${pageHtml ? \n\nPAGE FACT SUMMARY:\n\"\"\"\n${pageHtml}\n\"\"\" : ""}`.
    - This means the vision adapter is already capable of running with just a screenshot.

### analyzePricingPage Action
- **Location:** `src/actions/analyzePricingPage.ts`
- **Function:** Server action that bridges the UI and the use case.
- **Logic:** Takes `url`, `personas`, and `requestId`. It needs to be extended to accept an image (base64) instead of or alongside the URL.

### UI Components (Dashboard & Input Views)
- **Location:** `src/ui/components/dashboard/views/PersonaGridView.tsx`
- **Function:** Currently contains the `pricingUrl` input and the "Run Audit" button.
- **Status:** Needs a new UI element (e.g., a file upload zone) to allow users to provide a screenshot.
- **useAnalysisFlow Hook:** (`src/ui/hooks/useAnalysisFlow.ts`) Manages the state and calls the server action. Needs to track the uploaded image state.

## Code References
- `src/application/usecases/ParsePricingPageUseCase.ts:43` - `execute()` method parameter list.
- `src/application/usecases/ParsePricingPageUseCase.ts:186` - HTML summarization call that should be bypassed in image-only mode.
- `src/infrastructure/adapters/VisionAnalysisAdapter.ts:60` - Prompt construction that handles optional HTML.
- `src/ui/components/dashboard/views/PersonaGridView.tsx:70` - The URL input field that needs an alternative.

## Open Questions
- **Image Storage:** Currently, scouting screenshots are stored in a temp directory. Should uploaded screenshots follow the same path or be held purely in memory?
- **HTML Bypass Flag:** How should we structure the flags in `execute()` to be most flexible? (e.g., `options: { skipScouting: boolean, skipHtml: boolean }`).
- **File Upload Mechanics:** Which library should be used for the frontend file upload (standard input, shadcn/ui components, or a specialized upload hook)?
