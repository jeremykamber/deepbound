# Fix Pricing Audit LLM Streaming Stack/Socket Crash

## Overview
Fix the fatal crash (max call stack size exceeded, socket closed) that occurs when running pricing page audits. The root cause is likely improper or unnecessary streaming of LLM output (partial objects) in the audit pathway, leading to stack/memory leaks in the async stream pipeline. For pricing audits, only the final result needs to be shown, not partial streaming. This plan switches audit calls to simple, non-streaming completion (await final result), hardens error handling, and ensures a soft, user-friendly fallback on LLM/streaming failures.

## Current State Analysis
- Audit logic parallelizes persona analysis with `p-limit` (max 3 at a time)
- Persona output is streamed and shown live (needed)
- **Audit previously used streaming/partial object technique, but this is NOT needed for pricing audit**
- Root causes of stack/socket errors may include:
    - Unbounded async/streaming work on incomplete/malformed data
    - Infinite or recursive loop triggered by streaming pipeline
    - Memory/callback retention across many personas in async context
    - Improper abort/error handling, especially in the LLM vision analysis path
- Current behavior: on error, the function crashes, which bubbles up as a disconnect/socket close in Next.js

### Key Discoveries:
- `src/infrastructure/adapters/LlmServiceImpl.ts` — p-limit, withRetry, and streaming logic
- `src/infrastructure/adapters/VisionAnalysisAdapter.ts` — used streamObject, now must switch to non-streaming completion for audit
- No actual stack-based recursion in TS; all issues are in streaming or async callback accumulation
- The UI does not render any audit output until final/complete, so streaming partial JSON for audit is not needed

## Desired End State
- No ‘max call stack size exceeded’ or socket errors, even on malformed or unusually slow LLM output
- Persona streaming remains live/partial for each card
- Pricing audit waits for final LLM result (via a simple completion call), then displays
- On any LLM/stream error: show generic error and retry button for pricing audit, never a crash

### Key Discoveries
- LLM streaming errors are not always caught or mapped to user-friendly errors
- audit path does not need incremental output, only final/full result

## What We’re NOT Doing
- Not changing persona audit streaming (partial/streaming keeps working as is)
- Not removing p-limit batching/concurrency controls
- Not fixing rare persona-audit crash yet (unless the same root cause is found)
- Not implementing persistent remote logs (will just log in dev for now)

## Implementation Approach
- Switch pricing audit to a plain, non-streaming completion call (await result, no partial/async iteration)
- Make sure every LLM/completion error, or schema violation, goes to a safe error state for the audit (never leaves the function hanging)
- For personas, preserve current streaming logic
- Add logging and error boundaries around audit LLM calls
- UI: show user-friendly “Audit failed. Please retry.” with a retry button, if audit errors
- Dev only: verbose error + LLM output dump on catastrophic error

## Phase 1: Instrumentation & Simulation

### Overview
Instrument the audit pathway to log, catch, and surface any LLM/completion errors. Rapidly surface root cause if failure occurs again.

### Changes Required:

#### 1. ParsePricingPageUseCase & VisionAnalysisAdapter
**File**: `src/application/usecases/ParsePricingPageUseCase.ts`, `src/infrastructure/adapters/VisionAnalysisAdapter.ts`
**Changes**:
- Add try/catch around audit LLM completion block (non-streaming)
- Log LLM outputs (+ error stack) on catch (NODE_ENV=development only)
- Add timeouts (e.g. 2 minutes per audit persona)
- Log every start/finish/error of an audit LLM call (not personas)

```typescript
try {
  const result = await visionAdapter.analyzePricingPageCompletion(...);
  // ...
} catch (e) {
  if (process.env.NODE_ENV !== 'production') {
    console.error('LLM/Audit completion error:', e, { lastOutput });
  }
  // propagate for UI fallback
  throw new Error('PRICING_AUDIT_LLM_COMPLETION_ERROR');
}
```

### Success Criteria:

#### Automated Verification:
- [ ] All failures in LLM/pricing audit path log verbosely in dev
- [ ] No uncaught errors bubble up (all are handled)

#### Manual Verification:
- [ ] You can see logs in console/dev tools on audit fail
- [ ] Socket/call stack errors are always caught and mapped to UI error

---

## Phase 2: Hard Audit Completion and Fallback for Errors

### Overview
Patch audit pathway to only use final, completed output. On any error, return a generic known error object.

### Changes Required:

#### 1. VisionAnalysisAdapter (Audit Mode)
**File**: `src/infrastructure/adapters/VisionAnalysisAdapter.ts`
**Changes**:
- Provide `analyzePricingPageCompletion` method
- For audit, call plain LLM completion endpoint, pass screenshot & HTML, system prompt, and schema
- On any error, return a fallback object

```typescript
try {
  const completion = await llmService.createChatCompletion(
    [{ role: "user", content: prompt }],
    { ...options }
  );
  // parse/validate completion as PricingAnalysis object
} catch(e) {
  return {
    gutReaction: "Overall, this audit could not be completed due to a system issue.",
    thoughts: "An error occurred during pricing analysis.",
    scores: {
      clarity: 1, valuePerception: 1, trust: 1, likelihoodToBuy: 1
    },
    risks: ["[SYSTEM] LLM completion or analysis failed"],
  };
}
```

### Success Criteria:

#### Automated Verification:
- [ ] All malformed LLM output produces safe fallback, not error/undefined
- [ ] No socket/call stack errors propagate

#### Manual Verification:
- [ ] Breaking completion produces soft error, not crash

---

## Phase 3: Persona-Atomic Error Handling

### Overview
Ensure only errored persona fails, not the whole batch or audit process.

### Changes Required:

#### 1. ParsePricingPageUseCase/Persona Handlers
**File**: `src/application/usecases/ParsePricingPageUseCase.ts`
**Changes**:
- Wrap persona analysis in try/catch so a single streaming/LLM error for a persona results in the fallback output for that persona only
- Do NOT abort the queue for all personas on single failure

### Success Criteria:
- [ ] Broken or slow LLM stream for one persona does not break the others
- [ ] Error clearly marked in persona card

---

## Phase 4: Remove Unnecessary Streaming for Audit

### Overview
Pricing audit: change implementation to use completion calls (no partial/streaming JSON). Only update after LLM completes.

### Changes Required:

#### 1. ParsePricingPageUseCase/VisionAnalysisAdapter
**File**: `src/application/usecases/ParsePricingPageUseCase.ts`, `src/infrastructure/adapters/VisionAnalysisAdapter.ts`
**Changes**:
- Detect if in audit mode; call completion endpoint
- Only return/display after LLM completes output and validates

```typescript
// in audit mode
const finalResult = await visionAdapter.analyzePricingPageCompletion(...);
return finalResult;
```

### Success Criteria:
- [ ] No partial audit output triggers UI updates
- [ ] Client only sees full/final audit result
- [ ] Confirms generic error+retry UI on fail

---

## Phase 5: Automated & Stress Testing

### Overview
Add or enhance test cases (unit + manual) to simulate extreme or malformed LLM behaviors; confirm robust update/abort/error for audit.

### Changes Required:

#### 1. Mock/Replace LLM Service in Tests
**File**: Test support or inline mock
**Changes**:
- Inject mock LLM provider that simulates malformed JSON, slow output, premature close
- Unit: test all abort/error/timeout paths return fallback, never crash

#### 2. Manual Stress
- Run with various bogus/slow/dead LLM configs in dev; confirm audit never crashes

### Success Criteria:
- [ ] All test paths prove hard error, never a crash/unhandled
- [ ] Manual stress yields generic error/soft fail with retry

---

## Testing Strategy

### Unit Tests:
- Test fallback object returned for audit if completion throws or aborts unexpectedly
- Test audit path never exposes partials/undefineds

### Integration/Manual Tests:
- Run “bad” LLMs (malformed JSON, missing fields, super slow output) in dev + CI
- Confirm no UI regressions or uncaught errors
- Trigger pricing audit with real/invalid parameters and check all UI branches

## Success Criteria Guidelines
- **Automated Verification**:
    - All backend code paths caught by automated tests
    - No socket or stack errors are observed in automated or manual testing
    - Correct fallback object always returned
    - Lint, typechecks, and CI pass
- **Manual Verification**:
    - UI displays audit only after final
    - UI displays generic error + retry on fail
    - Dev logs show root causes if present (in development only)
