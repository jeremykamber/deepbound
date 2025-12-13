import { Persona } from "../entities/Persona";

export interface LlmServicePort {
    generateInitialPersonas(icp: string): Promise<Persona[]>;
    generatePersonaBackstory(persona: Persona, icp: string): Promise<string>;
}
