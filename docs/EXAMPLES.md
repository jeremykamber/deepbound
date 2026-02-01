# Reference Implementations & Patterns

This document provides stable, "Gold Standard" examples of how to implement features following the DeepBound architecture.

## 1. Traditional Hexagonal Pattern (DTO + Store)
*Use this when state needs to be shared across many components.*

### Domain DTO (`src/domain/dtos/UserDTO.ts`)
```typescript
export interface UserDTO {
  id: string;
  email: string;
}
```

### Use Case (`src/application/usecases/RegisterUserUseCase.ts`)
```typescript
import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { UserDTO } from '../../domain/dtos/UserDTO';

export class RegisterUserUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(userDTO: UserDTO): Promise<void> {
    // Business logic here
    await this.userRepository.saveUser(userDTO);
  }
}
```

---

## 2. Server Action Pattern (Recommended)
*Use this for most features to reduce state management boilerplate.*

### Server Action (`src/actions/generatePersonas.ts`)
```typescript
"use server"

import { GeneratePersonasUseCase } from "@/application/usecases/GeneratePersonasUseCase";
import { OpenRouterAdapter } from "@/infrastructure/adapters/OpenRouterAdapter";

export async function generatePersonas(personaDescription: string) {
    try {
        // 1. Instantiate dependencies (DI)
        const adapter = OpenRouterAdapter.createFromEnv();
        const useCase = new GeneratePersonasUseCase(adapter);
        
        // 2. Call use case
        const personas = await useCase.execute(personaDescription);
        
        return { personas };
    } catch (error) {
        return { error: (error as Error).message };
    }
}
```

### UI Component (`src/ui/components/Dashboard.tsx`)
```typescript
"use client"

import { useTransition, useState } from 'react'
import { generatePersonas } from '@/actions/generatePersonas'

export const Dashboard = () => {
    const [isPending, startTransition] = useTransition()
    const [result, setResult] = useState(null)

    const handleAction = () => {
        startTransition(async () => {
            const data = await generatePersonas("Customer profile...")
            setResult(data)
        })
    }

    return (
        <button onClick={handleAction} disabled={isPending}>
            {isPending ? 'Processing...' : 'Start'}
        </button>
    )
}
```

---

## 3. Port Implementation (Adapter)
### `src/infrastructure/adapters/OpenRouterAdapter.ts`
```typescript
import { LlmServicePort } from "@/domain/ports/LlmServicePort";

export class OpenRouterAdapter implements LlmServicePort {
    async generatePersona(desc: string) {
        // External API logic here...
    }
}
```
