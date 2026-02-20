# Image Upload Support Implementation Plan

## Overview
Implement the ability for users to upload a screenshot of a pricing page directly for analysis, bypassing the automated browser scouting and HTML extraction phases. This serves as a reliable "escape hatch" for pages that are gated, protected by anti-bot measures, or simply hard to scrape.

## Current State Analysis
- The system is "URL-first": it requires a valid URL to instantiate a Playwright session, scroll to find pricing, and extract HTML.
- `ParsePricingPageUseCase` orchestrates these browser-heavy steps before passing a screenshot and compacted HTML to the vision models.
- `VisionAnalysisAdapter` already handles cases where `pageHtml` is missing/optional, so the core analysis logic is ready.
- `PricingAnalysis` entity strictly validates that the `url` field is a well-formed URL.

## Desired End State
- Users can choose to either provide a URL (existing) or upload an image (new).
- If an image is uploaded, browser scouting is entirely skipped.
- The analysis proceeds using only the provided image (Vision-only grounding).
- The transition between URL and Image input in the UI is smooth and visually premium.

### Key Discoveries:
- `ParsePricingPageUseCase.ts:43`: The `execute()` method is the entry point for analysis.
- `VisionAnalysisAdapter.ts:60`: Prompt handling for optional HTML already exists.
- `PricingAnalysis.ts:46`: Validation logic requires a strict URL format.

## What We're NOT Doing
- Implementing server-side image storage (we will pass base64 to avoid unnecessary infrastructure bloat for the MVP).
- Combining URL scouting AND image upload (it's either one or the other).
- OCR processing on the uploaded image (relying solely on vision models).

## Implementation Approach
We will refactor the `ParsePricingPageUseCase` to accept an options object containing the optional image. If an image is present, we skip the browser phase and immediate proceed to persona analysis.

## Phase 1: Domain & Use Case Extensibility
### Overview
Loosen domain validation and refactor the use case to support the "Vision-only" path.

### Changes Required:

#### [x] 1. Domain Validation
**File**: `src/domain/entities/PricingAnalysis.ts`
**Changes**: Update `validatePricingAnalysis` to accept `uploaded://` as a valid "virtual" URL prefix for uploaded files, or simply allow the string "Manual Upload".

#### [x] 2. Use Case Refactoring
**File**: `src/application/usecases/ParsePricingPageUseCase.ts`
**Changes**: Update `execute()` signature and add conditional logic to skip scouting if an image is provided.

```typescript
// Updated signature
async execute(
  url: string,
  personas: Persona[],
  onProgress?: (progress: PricingAnalysisProgress) => void,
  abortSignal?: AbortSignal,
  options: {
    nonStreamingAuditMode?: boolean;
    imageBase64?: string;
  } = {}
) {
  // if options.imageBase64 exists:
  // - skip navigateTo/scouting
  // - set capturedScreenshot = options.imageBase64
  // - set pageHtml = ""
}
```

---

## Phase 2: Server Action & Hook Updates
### Overview
Wiring the new data path from the UI to the backend use case.

### Changes Required:

#### [x] 1. Server Action
**File**: `src/actions/analyzePricingPage.ts`
**Changes**: Accept `imageBase64` in `analyzePricingPageAction` and pass it through to `execute()`.

#### [x] 2. Analysis Hook
**File**: `src/ui/hooks/useAnalysisFlow.ts`
**Changes**: Add `pricingImage` state. Update `handleAnalyzePricing` to determine if it should send the URL or the image to the action.

---

## Phase 3: Premium Upload UI
### Overview
Adding a high-fidelity upload interface to the dashboard.

### Changes Required:

#### [x] 1. Persona Grid View
**File**: `src/ui/components/dashboard/views/PersonaGridView.tsx`
**Changes**: 
- Implement a "Toggle" or "Alternative" UI for Image Upload.
- Add a drag-and-drop zone with a glassmorphism aesthetic.
- Handle file-to-base64 conversion.

---

## Success Criteria

### Automated:
- [x] `npm run lint` passes across modified files.
- [x] Manual verification that the use case does not attempt to launch Playwright when `imageBase64` is provided.

### Manual:
1. Upload a `.png` or `.jpg` of a pricing table.
2. Click "Run Audit".
3. Verify that the system skips the "Opening Page" and "Finding Pricing" steps (moving straight to "Thinking").
4. Verify that the final analysis uses the uploaded image.
5. Verify that providing a URL still works as expected (backward compatibility).

## Testing Strategy
- **Edge Case**: Uploading a very large image (ensure base64 size doesn't crash the server action payload limit—standard Next.js limit is usually 1MB or 4MB).
- **Edge Case**: Providing both a URL and an image (Image should take precedence).
- **Integration**: Ensure the gaze prediction feature still works with the uploaded image.
