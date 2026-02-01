import { Persona } from "@/domain/entities/Persona";
import { PricingAnalysis } from "@/domain/entities/PricingAnalysis";
import { LlmServicePort } from "@/domain/ports/LlmServicePort";

export class ChatWithPersonaUseCase {
  constructor(private llmService: LlmServicePort) { }

  async execute(
    persona: Persona,
    analysis: PricingAnalysis | null,
    message: string,
    history: { role: 'user' | 'assistant', content: string }[]
  ): Promise<string> {
    return this.llmService.chatWithPersona(persona, analysis, message, history);
  }

  executeStream(
    persona: Persona,
    analysis: PricingAnalysis | null,
    message: string,
    history: { role: 'user' | 'assistant', content: string }[]
  ): AsyncIterable<string> {
    return this.llmService.chatWithPersonaStream(persona, analysis, message, history);
  }
}
