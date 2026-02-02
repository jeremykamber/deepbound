"use server";

import { RecordStepUseCase } from "@/application/usecases/RecordStepUseCase";
import { LlmMemoryAdapter } from "@/infrastructure/adapters/LlmMemoryAdapter";
import { TestingSession } from "@/domain/entities/TestingSession";
import { InteractionStep } from "@/domain/entities/InteractionStep";

/**
 * Server action to record a new interaction step in a testing session.
 * Following the Server Action Pattern to encapsulate business logic in Use Cases.
 */
export async function recordStepAction(
  session: TestingSession,
  step: InteractionStep
): Promise<{ success: true; session: TestingSession } | { success: false; error: string }> {
  try {
    // 1. Initialize Infrastructure Adapter
    const memoryAdapter = LlmMemoryAdapter.createFromEnv();

    // 2. Initialize Use Case with injected adapter
    const useCase = new RecordStepUseCase(memoryAdapter);

    // 3. Execute logic
    const updatedSession = await useCase.execute(session, step);

    return {
      success: true,
      session: updatedSession,
    };
  } catch (error) {
    console.error("Error in recordStepAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred while recording the step.",
    };
  }
}
