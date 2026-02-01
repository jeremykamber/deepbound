import { GazePoint } from "../entities/PricingAnalysis";
import { Persona } from "../entities/Persona";

export interface IGazePredictionPort {
  predictGaze(persona: Persona, screenshotBase64: string): Promise<GazePoint[]>;
}
