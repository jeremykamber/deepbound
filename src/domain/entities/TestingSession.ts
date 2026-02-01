import { InteractionStep } from "./InteractionStep";

export interface TestingSession {
  id: string;
  personaId: string;
  steps: InteractionStep[];
  shortTermMemory: string;
}
