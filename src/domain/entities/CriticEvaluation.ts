export interface CriticEvaluation {
  id: string;
  analysisId: string;
  personaId: string;
  coherenceScore: number; // 1-10
  isHallucinating: boolean;
  critique: string;
  suggestedFix?: string;
}

export function validateCriticEvaluation(entity: CriticEvaluation): boolean {
  if (!entity || typeof entity !== 'object') return false;

  if (typeof entity.id !== 'string' || !entity.id) return false;
  if (typeof entity.analysisId !== 'string' || !entity.analysisId) return false;
  if (typeof entity.personaId !== 'string' || !entity.personaId) return false;

  if (typeof entity.coherenceScore !== 'number' || entity.coherenceScore < 1 || entity.coherenceScore > 10) {
    return false;
  }

  if (typeof entity.isHallucinating !== 'boolean') return false;
  if (typeof entity.critique !== 'string' || !entity.critique) return false;

  if (entity.suggestedFix !== undefined && typeof entity.suggestedFix !== 'string') {
    return false;
  }

  return true;
}
