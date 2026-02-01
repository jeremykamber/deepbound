import { InteractionStep } from "../entities/InteractionStep";

export interface IMemoryServicePort {
  summarizeSteps(steps: InteractionStep[]): Promise<string>;
}
