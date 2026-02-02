import { Persona } from '@/domain/entities/Persona';
import { PricingAnalysis } from '@/domain/entities/PricingAnalysis';
import { CriticEvaluation } from '@/domain/entities/CriticEvaluation';
import { ICriticServicePort } from '@/domain/ports/ICriticServicePort';

export class ValidateAnalysisUseCase {
  constructor(private criticService: ICriticServicePort) { }

  async execute(persona: Persona, analysis: PricingAnalysis): Promise<CriticEvaluation> {
    return this.criticService.evaluateConsistency(persona, analysis);
  }
}
