---
date: 2026-02-19T20:21:47-08:00
git_commit: b1ae8e30b163e37f0dedf480e85f0b932bb7cc6c
branch: feat/preserve-chat-history-local-storage
repository: ai_user_testing_mvp
topic: "Preserving Chat History with Local Storage"
tags: [research, codebase, chat, local-storage, persistence]
status: complete
---

# Research: Preserving Chat History with Local Storage

## Research Question
Preserve chat history when the user exits a chat with a persona (local storage; no need for Supabase here)

## Summary
The current chat system uses a React component `PersonaChatInterface` to manage chat messages in local state. When the component unmounts (e.g., when the dialog is closed), the state is lost. To persist this history, we can utilize `localStorage` using a unique key composed of the `analysis.id` and `persona.id`.

## Detailed Findings

### PersonaChatInterface
- **Location:** `src/ui/components/dashboard/shared/PersonaChatInterface.tsx`
- **Function:** Manages the chat state (`messages`), handles message sending via `chatWithPersonaAction`, and renders the chat UI.
- **Connections:** Interacts with `chatWithPersonaAction` for streaming AI responses and utilizes `Persona` and `PricingAnalysis` entities for context.

### Lifecycle of Chat State
- **Initialization:** Currently initialized to an empty array: `const [messages, setMessages] = useState<Message[]>([])`.
- **Persistence:** No persistence currently exists.
- **Exit Event:** The "exit" occurs when the `PersonaChat` dialog is closed, causing `PersonaChatInterface` to unmount.

### Key Strategy for Local Storage
- **Key Pattern:** `persona_chat_${analysisId}_${personaId}`
- **Data Structure:** An array of `Message` objects: `Array<{ role: 'user' | 'assistant', content: string }>`.

## Code References
- `src/ui/components/dashboard/shared/PersonaChatInterface.tsx:35` - Currently defines the `messages` state.
- `src/ui/components/dashboard/shared/PersonaChatInterface.tsx:56` - `handleSend` function where new messages are added to the state.
- `src/ui/components/dashboard/shared/PersonaChatInterface.tsx:67` - `startTransition` where AI responses are streamed and appended to the state.

## Open Questions
- Should there be a way to "clear" the history? (Currently not requested).
- How long should the history be preserved? (LocalStorage persists indefinitely until cleared by the browser or user).
- Is there any sensitive data in the chat that should NOT be in local storage? (Usually, pricing analysis chats are safe for local storage).
