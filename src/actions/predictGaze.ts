"use server";

import { PredictGazeUseCase } from "@/application/usecases/PredictGazeUseCase";
import { GazePredictionAdapter } from "@/infrastructure/adapters/GazePredictionAdapter";
import { Persona } from "@/domain/entities/Persona";

export async function predictGazeAction(persona: Persona, screenshotBase64: string) {
  try {
    const adapter = new GazePredictionAdapter();
    const useCase = new PredictGazeUseCase(adapter);

    const gazePoints = await useCase.execute(persona, screenshotBase64);
    return { success: true, data: gazePoints };
  } catch (error) {
    console.error("Action error in predictGazeAction:", error);
    return { success: false, error: (error as Error).message };
  }
}
