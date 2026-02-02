"use server";

import { ValidateAnalysisUseCase } from "@/application/usecases/ValidateAnalysisUseCase";
import { OpenRouterCriticAdapter } from "@/infrastructure/adapters/OpenRouterCriticAdapter";
import { Persona } from "@/domain/entities/Persona";
import { PricingAnalysis } from "@/domain/entities/PricingAnalysis";
import { CriticEvaluation } from "@/domain/entities/CriticEvaluation";

/**
 * Server action to validate a PricingAnalysis against a Persona's backstory.
 * Following the Server Action Pattern for clean separation of concerns.
 */
export async function validateAnalysisAction(
  persona: Persona,
  analysis: PricingAnalysis
): Promise<{ success: true; evaluation: CriticEvaluation } | { success: false; error: string }> {
  try {
    // 1. Initialize Infrastructure Adapter
    const criticService = OpenRouterCriticAdapter.createFromEnv();

    // 2. Initialize Use Case
    const useCase = new ValidateAnalysisUseCase(criticService);

    // 3. Execute and Return Result
    const evaluation = await useCase.execute(persona, analysis);

    return {
      success: true,
      evaluation,
    };
  } catch (error) {
    console.error("Error in validateAnalysisAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred during validation.",
    };
  }
}
