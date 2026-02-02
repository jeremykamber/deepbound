import { Persona } from '../entities/Persona';
import { PricingAnalysis } from '../entities/PricingAnalysis';
import { CriticEvaluation } from '../entities/CriticEvaluation';

export interface ICriticServicePort {
  evaluateConsistency(persona: Persona, analysis: PricingAnalysis): Promise<CriticEvaluation>;
}
