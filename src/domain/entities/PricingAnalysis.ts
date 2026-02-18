import { z } from "zod";

export interface GazePoint {
    x: number; // 0-100 percentage
    y: number; // 0-100 percentage
    focusLabel: string;
}

export interface PricingAnalysis {
    id: string;
    url: string;
    screenshotBase64: string;
    thoughts: string;
    scores: {
        clarity: number; // 1 - 10
        valuePerception: number; // 1 - 10
        trust: number; // 1 - 10
        likelihoodToBuy: number; // 1 - 10
    };
    risks: string[];
    gazePoints?: GazePoint[];
    gutReaction?: string;
    rawAnalysis?: string;
}

export const PricingAnalysisSchema = z.object({
    gutReaction: z.string().describe("A verbatim direct quote (substring) from your raw monologue that best captures your initial reaction."),
    thoughts: z.string().describe("A blunt, high-level summary of your perspective in exactly 2 paragraphs. Speak in first person."),
    scores: z.object({
        clarity: z.number().min(1).max(10).describe("How clear is the pricing?"),
        valuePerception: z.number().min(1).max(10).describe("How is the perceived value?"),
        trust: z.number().min(1).max(10).describe("How much do you trust this page?"),
        likelihoodToBuy: z.number().min(1).max(10).describe("How likely are you to buy?"),
    }),
    risks: z.array(z.string()).describe("A list of the specific things that bothered you or felt like risks."),
});


export function validatePricingAnalysis(entity: PricingAnalysis): boolean {
    if (!entity || typeof entity !== "object") return false;

    // id
    if (!entity.id || typeof entity.id !== "string") return false;

    // url - must be a non-empty valid URL
    if (!entity.url || typeof entity.url !== "string") return false;
    try {
        // eslint-disable-next-line no-new
        new URL(entity.url);
    } catch (e) {
        return false;
    }

    // screenshotBase64 - must be a non-empty string (basic check)
    if (!entity.screenshotBase64 || typeof entity.screenshotBase64 !== "string")
        return false;

    // thoughts - non-empty string
    if (!entity.thoughts || typeof entity.thoughts !== "string") return false;

    // scores - must contain required numeric keys in range 1..10
    const scores = entity.scores as any;
    if (!scores || typeof scores !== "object") return false;

    const requiredScoreKeys = [
        "clarity",
        "valuePerception",
        "trust",
        "likelihoodToBuy",
    ];

    for (const key of requiredScoreKeys) {
        const val = scores[key];
        if (typeof val !== "number" || !Number.isFinite(val)) return false;
        if (val < 1 || val > 10) return false;
    }

    // risks - must be an array of strings (can be empty)
    if (!Array.isArray(entity.risks)) return false;
    for (const r of entity.risks) {
        if (typeof r !== "string") return false;
    }

    // gazePoints - optional array of GazePoint objects
    if (entity.gazePoints !== undefined) {
        if (!Array.isArray(entity.gazePoints)) return false;
        for (const gp of entity.gazePoints) {
            if (typeof gp.x !== "number" || typeof gp.y !== "number" || typeof gp.focusLabel !== "string") {
                return false;
            }
        }
    }

    return true;
}
