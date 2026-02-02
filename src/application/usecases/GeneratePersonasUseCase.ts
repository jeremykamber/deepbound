import { Persona } from "@/domain/entities/Persona";
import { LlmServicePort } from "../../domain/ports/LlmServicePort";

export type PersonaGenerationProgressStep =
    | 'BRAINSTORMING_PERSONAS'
    | 'GENERATING_BACKSTORIES'
    | 'DONE'
    | 'ERROR';

export interface PersonaGenerationProgress {
    step: PersonaGenerationProgressStep;
    personaName?: string;
    completedCount?: number;
    totalCount?: number;
    completedSubSteps?: number;
    totalSubSteps?: number;
    error?: string;
    personas?: Persona[];
    streamingText?: string; // For live UI feedback
}

export class GeneratePersonasUseCase {
    constructor(private llmService: LlmServicePort) { }

    async execute(
        personaDescription: string,
        onProgress?: (progress: PersonaGenerationProgress) => void
    ): Promise<Persona[]> {
        console.log("Executing GeneratePersonas use case");

        // Stream structured personas directly
        let partialPersonas: Partial<Persona>[] = [];
        for await (const partialArray of this.llmService.generateInitialPersonasStream(personaDescription)) {
            partialPersonas = partialArray;
            onProgress?.({
                step: 'BRAINSTORMING_PERSONAS',
                personas: partialPersonas as Persona[], // Cast for UI preview (some fields may be missing)
                streamingText: JSON.stringify(partialPersonas, null, 2) // Optional: Keep raw JSON for debug/cool effect
            });
        }

        // Finalize personas (ensure they are fully formed)
        let personas: Persona[] = partialPersonas as Persona[];

        // Safety check: if stream yielded nothing or empty, fallback
        if (!personas || personas.length === 0) {
            console.warn("Stream yielded no personas, falling back to legacy generation");
            personas = await this.llmService.generateInitialPersonas(personaDescription);
        }

        // Broadcast initial personas immediately for UI responsiveness
        onProgress?.({
            step: 'GENERATING_BACKSTORIES',
            personas,
            totalCount: personas.length,
            completedCount: 0,
            totalSubSteps: personas.length * 4,
            completedSubSteps: 0,
            streamingText: ""
        });

        const totalCount = personas.length;
        let completedCount = 0;
        let completedSubSteps = 0;
        const totalSubSteps = totalCount * 4; // 4 parts per backstory

        const pLimit = (await import('p-limit')).default;
        const limit = pLimit(2); // Generate 2 backstories in parallel

        await Promise.all(personas.map((persona) => limit(async () => {
            onProgress?.({
                step: 'GENERATING_BACKSTORIES',
                personaName: persona.name,
                completedCount,
                totalCount,
                completedSubSteps,
                totalSubSteps,
                personas,
                streamingText: ""
            });

            let fullBackstory = "";
            console.log(`[GeneratePersonasUseCase] Starting backstory stream for ${persona.name}...`);
            for await (const chunk of this.llmService.generatePersonaBackstoryStream(persona)) {
                fullBackstory += chunk;
                process.stdout.write(chunk); // Stream to terminal
            }
            console.log(`\n[GeneratePersonasUseCase] Completed backstory for ${persona.name}`);

            persona.backstory = fullBackstory;
            completedCount++;
            completedSubSteps += 4; // Assuming 4 parts were yielded

            onProgress?.({
                step: 'GENERATING_BACKSTORIES',
                completedCount,
                totalCount,
                completedSubSteps,
                totalSubSteps,
                personas
            });
        })));

        return personas;
    }
}
