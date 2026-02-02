"use server";

import { GeneratePersonasUseCase } from "@/application/usecases/GeneratePersonasUseCase";
import { LlmServiceImpl } from "@/infrastructure/adapters/LlmServiceImpl";

export async function generatePersonasAction(personaDescription: string) {
    console.log("generatePersonasAction called...");
    const llmService = LlmServiceImpl.createFromEnv("openrouter");
    const useCase = new GeneratePersonasUseCase(llmService);
    const personas = await useCase.execute(personaDescription);
    return personas;
}
