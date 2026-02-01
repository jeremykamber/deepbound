# Architecture Guide: Hexagonal MVP (Strict Edition)

## 1. Core Philosophy
This project follows a strict, domain-first Hexagonal Architecture. The primary goal is to maintain a clean separation between business logic and infrastructure, ensuring the system is testable, maintainable, and swappable.

## 2. Layer Responsibilities

### 🧩 1. Domain Layer (`src/domain`)
- **Entities**: Core business objects and their logic.
- **Value Objects**: Objects defined by their attributes.
- **Ports**: Interfaces that define the boundaries (e.g., `UserRepositoryPort`).
- **Rules**: Zero imports from other layers. Pure business logic.

### ⚙️ 2. Application Layer (`src/application`)
- **Use Cases**: Orchestrate domain entities and ports to perform specific tasks.
- **Rules**: No knowledge of infrastructure details (DBs, APIs, Frameworks).

### 🧱 3. Infrastructure Layer (`src/infrastructure`)
- **Adapters**: Concrete implementations of domain ports (e.g., `SupabaseRepositoryImpl`).
- **Services**: Shared internal or external tools.
- **Rules**: Only handles translation between external worlds and the domain. No business logic.

### 🎨 4. Actions Layer (`src/actions`)
- **Next.js Server Actions**: The entry point for the UI.
- **Responsibilities**: 
  - Instantiate dependencies (Adapters, Use Cases).
  - Execute use cases.
  - Return serializable data or errors.
- **Rules**: Thin wrappers. No business logic. No state management.

### 🎨 5. UI Layer (`src/ui`)
- **Components**: React/Next.js components.
- **Stores (Zustand)**: ONLY for shared, cross-component state (e.g., Auth, global UI state).
- **Rules**: Dumb components. Trigger actions, render state.

---

## 3. Communication Flow (Server Actions Pattern)

UI Components -> Server Actions -> Application (Use Cases) -> Domain (Entities + Ports) -> Infrastructure (Adapters)

---

## 4. Feature Development Workflow

1.  **Define Entities** in `domain/entities/`.
2.  **Define Ports** (interfaces) in `domain/ports/`.
3.  **Implement Use Case** in `application/usecases/`.
4.  **Implement Adapter** in `infrastructure/adapters/`.
5.  **Create Server Action** in `actions/`.
6.  **Create UI Component** in `ui/components/`.
7.  **Write Tests** (TDD) for Entities and Use Cases.

---

## 5. Summary Table

| Layer | Folder | Purpose | Knows About | Example |
| :--- | :--- | :--- | :--- | :--- |
| **Domain** | `src/domain` | Business rules & contracts | Nothing | `User.ts`, `UserRepositoryPort.ts` |
| **Application** | `src/application` | Orchestrates domain logic | Domain | `RegisterUserUseCase.ts` |
| **Infrastructure** | `src/infrastructure` | Implements ports using tech | Domain | `UserRepositoryImpl.ts` |
| **Actions** | `src/actions` | Bridges UI and Application | Application & Infrastructure | `registerUserAction.ts` |
| **UI** | `src/ui` | Framework-bound view layer | Actions | `RegisterUserComponent.tsx` |

---

## 6. Rules for AI Agents (and Humans)

✅ **ALWAYS:**
- Use Plop generators for scaffolding (`bunx plop`).
- Mock adapters when testing use cases.
- Call server actions from components using `useTransition()`.

❌ **NEVER:**
- Put business logic in UI, Actions, or Adapters.
- Reference `infrastructure` or `ui` from `domain` or `application`.
- Create a Zustand store for every feature—keep state local where possible.
