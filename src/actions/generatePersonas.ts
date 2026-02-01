"use server";

import { GeneratePersonasUseCase } from "@/application/usecases/GeneratePersonasUseCase";
import { LlmServiceImpl } from "@/infrastructure/adapters/LlmServiceImpl";

import { createStreamableValue } from "@ai-sdk/rsc";

export async function generatePersonasAction(personaDescription: string) {
    console.log("generatePersonasAction called...");
    const stream = createStreamableValue<any>({ step: "BRAINSTORMING_PERSONAS" });

    (async () => {
        try {
            const llmService = LlmServiceImpl.createFromEnv("openrouter");
            const useCase = new GeneratePersonasUseCase(llmService);
            const personas = await useCase.execute(personaDescription, (progress) => {
                stream.update(progress);
            });
            stream.done({ step: "DONE", personas });
        } catch (error) {
            console.error("Error generating personas:", error);
            stream.done({ step: "ERROR", error: (error as Error).message });
        }
    })();

    return { streamData: stream.value };
}
