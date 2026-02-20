# Preserving Chat History Implementation Plan

## Overview
Preserve chat history when the user exits a chat with a persona using `localStorage`. This will ensure that returning to a chat with the same persona for the same pricing analysis resumes the conversation instead of starting over.

## Current State Analysis
- `PersonaChatInterface.tsx` uses a local `messages` state which is lost on unmount.
- There is no persistence mechanism for chat history.
- The app uses Next.js, so any `localStorage` access must be careful of SSR hydration mismatches.

## Desired End State
- Chat messages are persisted to `localStorage` as they are created.
- When opening a chat, the previous messages are loaded from `localStorage`.
- The storage is unique to the combination of `PricingAnalysis.id` and `Persona.id`.

### Key Discoveries:
- `PersonaChatInterface.tsx:35` - Source of messages state.
- `PricingAnalysis.id` and `Persona.id` are available in props.

## What We're NOT Doing
- Implementing server-side persistence (no Supabase/Database changes).
- Synchronizing chat across different browsers/devices.
- Implementing a "clear history" UI (out of scope for this request).

## Implementation Approach
We will create a reusable `useLocalStorage` hook that handles hydration safely. Then we will use this hook in `PersonaChatInterface`.

## Phase 1: Reusable Local Storage Hook
### Overview
Create a hook that manages a state value and keeps it synchronized with `localStorage`.

### Changes Required:
#### 1. Create useLocalStorage Hook
**File**: `src/ui/hooks/useLocalStorage.ts`
**Changes**: Implement the hook with hydration safety.

```typescript
'use client'

import { useState, useEffect, Dispatch, SetStateAction } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  // Pass initialValue to useState so that the first render (SSR/Hydration) 
  // matches what the server would produce.
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load from localStorage after mount
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
    }
    setIsInitialized(true)
  }, [key])

  // Save to localStorage whenever storedValue changes
  useEffect(() => {
    if (!isInitialized) return

    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue, isInitialized])

  return [storedValue, setStoredValue]
}
```

## Phase 2: PersonaChatInterface Integration
### Overview
Switch from `useState` to `useLocalStorage` for managing chat messages.

### Changes Required:
#### 1. Update PersonaChatInterface
**File**: `src/ui/components/dashboard/shared/PersonaChatInterface.tsx`
**Changes**: 
- Import `useLocalStorage`.
- Replace `useState<Message[]>([])` with `useLocalStorage`.
- Construct the key using `analysis.id` and `persona.id`.

```typescript
// ... existing imports
import { useLocalStorage } from '@/ui/hooks/useLocalStorage'

// ...
export const PersonaChatInterface: React.FC<PersonaChatInterfaceProps> = ({
  persona,
  analysis
}) => {
  const storageKey = `persona_chat_${analysis?.id || 'no-analysis'}_${persona.id}`
  const [messages, setMessages] = useLocalStorage<Message[]>(storageKey, [])
  // ... rest of the component
```

## Testing Strategy

### Manual Verification:
1. Open a chat with a persona.
2. Send a few messages.
3. Close the chat / Close the drawer.
4. Re-open the chat for the same persona.
5. Verify messages are still present.
6. Check browser DevTools -> Application -> Local Storage to see the `persona_chat_...` key.
7. Open a chat with a *different* persona and verify it is empty (or has its own unique history).
