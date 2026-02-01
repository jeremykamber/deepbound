import OpenAI from "openai";
import pLimit from "p-limit";
import { AgentAction, LlmServicePort } from "@/domain/ports/LlmServicePort";
import { Persona, stringifyPersona, PersonaSchema } from "@/domain/entities/Persona";
import { PricingAnalysis } from "@/domain/entities/PricingAnalysis";
import { stripCodeFence } from "./llmUtils";
import { createOpenAI, OpenAIProvider } from "@ai-sdk/openai";
import { streamText, Output } from "ai";

/**
 * Implementation of the LlmServicePort that uses OpenAI-compatible providers
 * (like OpenRouter, Ollama, or OpenAI itself).
 */
export class LlmServiceImpl implements LlmServicePort {
    private client: OpenAI;
    private provider: OpenAIProvider;
    private textModel: string;
    private smallTextModel: string;
    private visionModel: string;
    private scoutVisionModel: string;
    private extractionModel: string;
    private static requestCount = 0;
    private static readonly limiter = pLimit(1);

    // OpenRouter Defaults
    private static readonly OR_TEXT_MODEL =
        "qwen/qwen3-30b-a3b-instruct-2507";
    private static readonly OR_SMALL_TEXT_MODEL = "google/gemma-3-4b-it";
    // private static readonly OR_VISION_MODEL = "nvidia/nemotron-nano-12b-v2-vl:free";
    private static readonly OR_VISION_MODEL = "meta-llama/llama-3.2-11b-vision-instruct";
    private static readonly OR_SCOUT_MODEL =
        "qwen/qwen-2.5-vl-7b-instruct:free";
    private static readonly OR_EXTRACTION_MODEL = "google/gemma-3-4b-it";

    // Ollama Defaults
    private static readonly OLLAMA_DEFAULT_MODEL = "gemma3:1b-it-qat";

    /**
     * @param client - An instantiated OpenAI client (or compatible).
     * @param models - The model IDs to use for different tasks.
     */
    constructor(
        client: OpenAI,
        provider: OpenAIProvider,
        models: { text: string; smallText: string; vision: string; scout: string; extraction: string },
    ) {
        this.client = client;
        this.provider = provider;
        this.textModel = models.text;
        this.smallTextModel = models.smallText;
        this.visionModel = models.vision;
        this.scoutVisionModel = models.scout;
        this.extractionModel = models.extraction;
    }

    /**
     * Internal helper to sleep for a given duration.
     */
    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Generic retry wrapper for LLM calls with exponential backoff.
     */
    private async withRetry<T>(
        fn: () => Promise<T>,
        maxRetries = 5,
    ): Promise<T> {
        let lastError: any;
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error: any) {
                lastError = error;
                // Retry on 429 (Rate Limit) or 5xx errors
                const isRetryable = error.status === 429 || error.status >= 500;
                if (!isRetryable || i === maxRetries - 1) {
                    throw error;
                }
                // More aggressive backoff: 5s, 10s, 20s, 40s...
                const waitTime = Math.pow(2, i) * 5000 + Math.random() * 2000;
                console.warn(
                    `[LlmService] Rate limited or server error (${error.status}). Retrying in ${Math.round(waitTime)}ms... (Attempt ${i + 1}/${maxRetries})`,
                );
                await this.sleep(waitTime);
            }
        }
        throw lastError;
    }

    /**
     * Factory to create an adapter instance based on environment configuration.
     *
     * @param provider - The provider to use ('ollama' or 'openrouter').
     * @param overrides - Optional model overrides.
     * @returns A new instance of LlmServiceImpl.
     */
    static createFromEnv(
        provider: "ollama" | "openrouter",
        overrides?: { text?: string; smallText?: string; vision?: string; scout?: string; extraction?: string },
    ): LlmServiceImpl {
        const baseURL =
            provider === "ollama"
                ? process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1"
                : process.env.OPENROUTER_BASE_URL ||
                "https://openrouter.ai/api/v1";

        const apiKey =
            provider === "openrouter"
                ? process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
                : process.env.OLLAMA_API_KEY || "ollama";

        if (provider === "openrouter" && !apiKey) {
            throw new Error(
                "OPENROUTER_API_KEY or OPENAI_API_KEY environment variable is required for OpenRouter provider",
            );
        }

        const client = new OpenAI({
            baseURL,
            apiKey: apiKey as string,
            dangerouslyAllowBrowser: true,
        });

        const providerInstance = createOpenAI({
            baseURL,
            apiKey: apiKey as string,
        });

        // Set logical defaults based on provider
        const models =
            provider === "ollama"
                ? {
                    text:
                        overrides?.text ||
                        LlmServiceImpl.OLLAMA_DEFAULT_MODEL,
                    smallText:
                        overrides?.smallText ||
                        LlmServiceImpl.OLLAMA_DEFAULT_MODEL,
                    vision:
                        overrides?.vision ||
                        LlmServiceImpl.OLLAMA_DEFAULT_MODEL,
                    scout:
                        overrides?.scout ||
                        LlmServiceImpl.OLLAMA_DEFAULT_MODEL,
                    extraction:
                        overrides?.extraction ||
                        LlmServiceImpl.OLLAMA_DEFAULT_MODEL,
                }
                : {
                    text: overrides?.text || LlmServiceImpl.OR_TEXT_MODEL,
                    smallText: overrides?.smallText || LlmServiceImpl.OR_SMALL_TEXT_MODEL,
                    vision:
                        overrides?.vision || LlmServiceImpl.OR_VISION_MODEL,
                    scout: overrides?.scout || LlmServiceImpl.OR_SCOUT_MODEL,
                    extraction: overrides?.extraction || LlmServiceImpl.OR_EXTRACTION_MODEL
                };

        return new LlmServiceImpl(client, providerInstance, models);
    }

    /**
     * Internal helper to handle chat completion boilerplate.
     * Extracts content, handles potential nulls, and applies common parameters.
     */
    private async createChatCompletion(
        messages: OpenAI.Chat.ChatCompletionMessageParam[],
        options: {
            temperature?: number;
            max_tokens?: number;
            response_format?: { type: "json_object" | "text" };
            model?: string;
            purpose?: string; // For better logging
        }
    ): Promise<string> {
        return this.withRetry(async () => {
            const reqId = ++LlmServiceImpl.requestCount;
            const purpose = options.purpose || "General";
            console.log(
                `[LlmService] [Req #${reqId}] [${purpose}] Sending request to ${options.model || this.textModel}...`,
            );
            const startTime = Date.now();

            const resp = await LlmServiceImpl.limiter(() =>
                this.client.chat.completions.create({
                    model: options.model || this.textModel,
                    messages,
                    temperature: options.temperature ?? 0.8,
                    max_tokens: options.max_tokens ?? null,
                    response_format: options.response_format,
                }),
            );

            const duration = Date.now() - startTime;
            const content = resp?.choices?.[0]?.message?.content;
            const tokens = resp?.usage?.total_tokens || "unknown";

            console.log(
                `[LlmService] [Req #${reqId}] [${purpose}] Completed in ${duration}ms. Tokens: ${tokens}.`,
            );

            if (!content) {
                throw new Error("No content returned from LLM chat completion");
            }
            return content;
        });
    }

    /**
     * Internal helper to handle chat completion boilerplate (streaming version).
     */
    private async * createChatCompletionStream(
        messages: OpenAI.Chat.ChatCompletionMessageParam[],
        options: {
            temperature?: number;
            max_tokens?: number;
            response_format?: { type: "json_object" | "text" };
            model?: string;
            purpose?: string;
        }
    ): AsyncIterable<string> {
        const stream = await this.withRetry(async () => {
            const reqId = ++LlmServiceImpl.requestCount;
            const purpose = options.purpose || "General";
            console.log(
                `[LlmService] [Req #${reqId}] [${purpose}] Starting stream to ${options.model || this.textModel}...`,
            );
            return await this.client.chat.completions.create({
                model: options.model || this.textModel,
                messages,
                temperature: options.temperature ?? 0.8,
                max_tokens: options.max_tokens ?? null,
                response_format: options.response_format,
                stream: true,
            });
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) yield content;
        }
    }

    /**
     * Generates a set of initial buyer personas based on a customer profile description.
     *
     * @param personaDescription - Description of the ideal customer profile.
     * @returns A promise resolving to an array of Persona objects.
     */
    async generateInitialPersonas(
        personaDescription: string,
    ): Promise<Persona[]> {
        const system = `You are a persona generator creating realistic buyer personas for SaaS pricing evaluation.

Generate a JSON array of 3 DISTINCT personas matching this TypeScript interface:

interface Persona {
  id: string;
  name: string;
  age: number;
  occupation: string;
  educationLevel: string;
  interests: string[];
  goals: string[];
  personalityTraits: string[];
  // Big Five Personality Traits (0-100)
  conscientiousness: number; 
  neuroticism: number;
  openness: number;
  extraversion: number;
  agreeableness: number;
  // Cognitive Engine (0-100: 0=System 1/Intuitive, 100=System 2/Analytical)
  cognitiveReflex: number;
  // Skill & Resource Layer (0-100)
  technicalFluency: number;
  economicSensitivity: number;
  // Aesthetic & Environment
  designStyle: string;       // e.g. Minimalist, Industrial, Mid-Century Modern
  favoriteColors: string[];
  livingEnvironment: string; // Describe their messy/organized home or office
  backstory?: string;
}

CRITICAL REQUIREMENTS:
- SCIENTIFIC ROOT CAUSES: Assign high-fidelity scalars (0-100) for the Big Five and Cognitive Reflex. These are the "genes" of the persona.
- CONSCIENTIOUSNESS: High=Meticulous/reads everything; Low=Chaotic/skips details.
- NEUROTICISM: High=Risk-averse/anxious about contract traps; Low=Bold/adventuresome.
- COGNITIVE REFLEX: 0=System 1 (Emotional/Gut); 100=System 2 (Calculative/Unit Economics).
- DISTRIBUTION: Ensure the 3 personas represent a spectrum across these variables (e.g., don't make them all high System 2).
- REALISM: Ages, occupations, and goals must remain grounded in the provided ICP description.
- AESTHETIC DNA: Define their design taste. Are they minimalists who hate clutter? Do they love bold, vibrant colors or muted tones? Is their living space a chaotic creative studio or a sterile, organized office?

Return ONLY valid JSON without explanatory text or markdown code blocks.`;

        const user = `Create 3 diverse personas for pricing evaluation based on the following ideal customer profile description: "${personaDescription}"

You MUST make sure above all that your personas fall within and match that ideal customer profile.

DIVERSITY CRITERIA:
1. Different financial profiles
2. Different industries or roles where applicable
3. Different approaches to technology adoption and ROI calculation
4. Different communication styles and decision-making speeds

Make them realistic, specific, and ready for deep backstory generation. JSON array only.`;

        const content = await this.createChatCompletion(
            [
                { role: "system", content: system },
                { role: "user", content: user },
            ],
            {
                model: this.smallTextModel,
                temperature: 0.7,
                purpose: "Generate Personas",
            },
        );

        const cleaned = stripCodeFence(content);
        try {
            const parsed = JSON.parse(cleaned);
            if (!Array.isArray(parsed))
                throw new Error("Expected JSON array from LLM");

            return parsed.map(
                (p: any, idx: number) =>
                    ({
                        id:
                            p.id ??
                            p.uuid ??
                            `${(p.name || "persona").toLowerCase().replace(/\s+/g, "-")}-${idx}`,
                        name: p.name ?? "Unknown",
                        age:
                            typeof p.age === "number"
                                ? p.age
                                : Number(p.age) || 30,
                        occupation: p.occupation ?? "Unknown",
                        educationLevel:
                            p.educationLevel ?? p.education ?? "Unknown",
                        interests: Array.isArray(p.interests)
                            ? p.interests
                            : p.interests
                                ? [p.interests]
                                : [],
                        goals: Array.isArray(p.goals)
                            ? p.goals
                            : p.goals
                                ? [p.goals]
                                : [],
                        personalityTraits: Array.isArray(p.personalityTraits)
                            ? p.personalityTraits
                            : p.traits && Array.isArray(p.traits)
                                ? p.traits
                                : [],
                        conscientiousness: Number(p.conscientiousness) || 50,
                        neuroticism: Number(p.neuroticism) || 50,
                        openness: Number(p.openness) || 50,
                        extraversion: Number(p.extraversion) || 50,
                        agreeableness: Number(p.agreeableness) || 50,
                        cognitiveReflex: Number(p.cognitiveReflex) || 50,
                        technicalFluency: Number(p.technicalFluency) || 50,
                        economicSensitivity: Number(p.economicSensitivity) || 50,
                        designStyle: p.designStyle ?? "Minimalist",
                        favoriteColors: Array.isArray(p.favoriteColors) ? p.favoriteColors : [],
                        livingEnvironment: p.livingEnvironment ?? "Unknown",
                        backstory: p.backstory ?? p.story ?? undefined,
                    }) as Persona,
            );
        } catch (err) {
            throw new Error(
                `Failed to parse personas from LLM response: ${err}\nResponse was: ${cleaned}`,
            );
        }
    }

    /**
     * Streaming version of generateInitialPersonas.
     */
    /**
     * Streaming version of generateInitialPersonas using Vercel AI SDK's streamObject.
     */
    /**
     * Streaming version of generateInitialPersonas using Vercel AI SDK's streamObject.
     */
    async * generateInitialPersonasStream(personaDescription: string): AsyncIterable<Partial<Persona>[]> {
        const system = `You are a persona generator Creating 3 DISTINCT buyer personas.
CRITICAL: You must generate a JSON ARRAY of personas.
Assign high-fidelity 0-100 scalars for all psychological traits.`;

        const { partialOutputStream } = streamText({
            model: this.provider(this.smallTextModel),
            output: Output.array({
                element: PersonaSchema,
            }),
            system,
            prompt: `Create 3 diverse personas for: "${personaDescription}". Ensure different financial profiles and tech fluency.`,
        });

        if (!partialOutputStream) {
            throw new Error("partialOutputStream is not available. Ensure the model supports tool calling/structured output.");
        }

        for await (const partialArray of partialOutputStream) {
            yield partialArray as Partial<Persona>[];
        }
    }

    /**
     * Generates an extremely detailed and long backstory for a persona.
     * Uses a multi-step generation process to bypass single-call token limits and ensure depth.
     *
     * @param personaDescriptionOrPersona - Either a raw description or a Persona object.
     * @returns A promise resolving to the full narrative backstory.
     */
    async generatePersonaBackstory(
        personaDescriptionOrPersona: string | Persona,
        onProgress?: (part: number, totalParts: number) => void,
    ): Promise<string> {
        const totalParts = 4;
        let completedParts = 0;
        const personaText =
            typeof personaDescriptionOrPersona === "string"
                ? personaDescriptionOrPersona
                : JSON.stringify(personaDescriptionOrPersona);

        const system = `You are a narrative psychologist conducting a deep interview to build a comprehensive life story of a buyer persona.

Your task: Build a RICH, LENGTHY, INTERNALLY CONSISTENT interview-style backstory (8000+ tokens) that reveals:
1. Childhood and family influences on their relationship with money
2. Educational background and early career lessons
3. Detailed financial journey: wins, failures, lessons learned
4. Past purchasing decisions and how they shaped them
5. Major life events that changed their worldview
6. Current economic pressures and opportunities
7. How they evaluate ROI on tools and services
8. Specific examples of successful and failed purchases
9. Values around efficiency, risk, and spending
10. Communication style and decision-making pace
11. Design Taste: Their favorite colors, their preferred aesthetic (Minimalist, Brutalist, etc.), and a description of their living/working environment (Is it messy? Hyper-organized? Sterile? Cozy?). Describe how this environment reflects their personality scalars.

CRITICAL REQUIREMENTS (Deep Binding research):
- Write 8-12 substantial paragraphs, each 150-250 words
- MULTI-TURN DEPTH: This is an extended interview, not a summary
- CONSISTENCY: Every detail aligns with established facts. Reference earlier points.
- SPECIFICITY: Actual dollar amounts, brand names, company names, real scenarios
- AUTHENTICITY: First-person voice. Natural language.
- CAUSE-AND-EFFECT: Show HOW their life experiences led to their specific psychological profile. 
- PSYCHOLOGICAL ANCHORING: Their narrative MUST explain their Root Causes. 
  * If they have High Neuroticism, describe the specific loss or anxiety that caused it. 
  * If they are Low Conscientiousness, show their history of skipping details and the consequences.
  * Their decision-making pace and tone MUST match their Cognitive Reflex (System 1 vs. System 2).

This should feel like a real person's actual life story—messy, detailed, with depth.

Return plain text only. No labels, no markdown, no metadata. NO SUMMARIES OR HEADERS.`;

        // PART 1: Early background and financial formation
        const part1 = await this.createChatCompletion(
            [
                { role: "system", content: system },
                {
                    role: "user",
                    content: `Generate the first 2-3 paragraphs of a detailed backstory for this persona. Focus on their childhood, family, early financial lessons, and education:

${personaText}

Start the life story from the beginning. Write in first person. Be specific with names, places, and amounts.`,
                },
            ],
            { purpose: "Backstory Part 1" },
        );

        onProgress?.(++completedParts, totalParts);

        // PART 2: Career progression and financial wins/failures
        const part2 = await this.createChatCompletion(
            [
                { role: "system", content: system },
                {
                    role: "user",
                    content: `Continue this persona's backstory. 
PREVIOUS HISTORY: 
${part1}

Now write 2-3 paragraphs about their career progression, job changes, financial wins and failures. Include specific companies, roles, and amounts of money. Show how each experience shaped their current approach to spending and evaluating tools.`,
                },
            ],
            { purpose: "Backstory Part 2" },
        );
        onProgress?.(++completedParts, totalParts);

        // PART 3: Recent years and specific purchasing trauma
        const part3 = await this.createChatCompletion(
            [
                { role: "system", content: system },
                {
                    role: "user",
                    content: `Continue this persona's backstory. 
PREVIOUS HISTORY: 
${part1}
${part2}

Now write 2-3 paragraphs about recent years and current situation. Include:
- A specific "Purchasing Trauma" (a time they were scammed, locked into a bad contract, or lost substantial money on a tool). This will be their primary trigger.
- Specific purchasing decisions they made recently.
- Current financial pressures and opportunities.`,
                },
            ],
            { purpose: "Backstory Part 3" },
        );
        onProgress?.(++completedParts, totalParts);

        // PART 4: Final values and decision-making logic
        const part4 = await this.createChatCompletion(
            [
                { role: "system", content: system },
                {
                    role: "user",
                    content: `Finish this persona's backstory. 
PREVIOUS HISTORY: 
${part1}
${part2}
${part3}

Now write 2-3 final paragraphs that:
- Describe their physical world: their home or office, their favorite colors, and their design taste. Explain how their conscientiousness (or lack thereof) manifests in their environment.
- Articulate their core values around money, efficiency, and risk based on their entire life history.
- Explain how they evaluate ROI on new tools.
- Describe their decision-making pace (tied to their Cognitive Reflex and Neuroticism).
- End with their current mindset.`,
                },
            ],
            { purpose: "Backstory Part 4" },
        );
        onProgress?.(++completedParts, totalParts);

        return [part1, part2, part3, part4]
            .map((p) => stripCodeFence(p).trim())
            .join("\n\n");
    }

    /**
     * Streaming version of generatePersonaBackstory.
     */
    async * generatePersonaBackstoryStream(
        personaOrDescription: Persona | string,
    ): AsyncIterable<string> {
        const personaText =
            typeof personaOrDescription === "string"
                ? personaOrDescription
                : JSON.stringify(personaOrDescription);

        const system = `You are a narrative psychologist conducting a deep interview to build a comprehensive life story of a buyer persona.

Your task: Build a RICH, LENGTHY, INTERNALLY CONSISTENT interview-style backstory (8000+ tokens) that reveals:
1. Childhood and family influences on their relationship with money
2. Educational background and early career lessons
3. Detailed financial journey: wins, failures, lessons learned
4. Past purchasing decisions and how they shaped them
5. Major life events that changed their worldview
6. Current economic pressures and opportunities
7. How they evaluate ROI on tools and services
8. Specific examples of successful and failed purchases
9. Values around efficiency, risk, and spending
10. Communication style and decision-making pace
11. Design Taste: Their favorite colors, their preferred aesthetic (Minimalist, Brutalist, etc.), and a description of their living/working environment (Is it messy? Hyper-organized? Sterile? Cozy?). Describe how this environment reflects their personality scalars.

CRITICAL REQUIREMENTS (Deep Binding research):
- Write 8-12 substantial paragraphs, each 150-250 words
- MULTI-TURN DEPTH: This is an extended interview, not a summary
- CONSISTENCY: Every detail aligns with established facts. Reference earlier points.
- SPECIFICITY: Actual dollar amounts, brand names, company names, real scenarios
- AUTHENTICITY: First-person voice. Natural language.
- CAUSE-AND-EFFECT: Show HOW their life experiences led to their specific psychological profile. 
- PSYCHOLOGICAL ANCHORING: Their narrative MUST explain their Root Causes. 
  * If they have High Neuroticism, describe the specific loss or anxiety that caused it. 
  * If they are Low Conscientiousness, show their history of skipping details and the consequences.
  * Their decision-making pace and tone MUST match their Cognitive Reflex (System 1 vs. System 2).

This should feel like a real person's actual life story—messy, detailed, with depth.

Return plain text only. No labels, no markdown, no metadata. NO SUMMARIES OR HEADERS.`;

        // PART 1
        let part1 = "";
        for await (const chunk of this.createChatCompletionStream(
            [
                { role: "system", content: system },
                {
                    role: "user",
                    content: `Generate the first 2-3 paragraphs of a detailed backstory for this persona. Focus on their childhood, family, early financial lessons, and education:

${personaText}

Start the life story from the beginning. Write in first person. Be specific with names, places, and amounts.`,
                },
            ],
            { purpose: "Backstory Part 1 (Stream)" },
        )) {
            part1 += chunk;
            yield chunk;
        }

        yield "\n\n";

        // PART 2
        let part2 = "";
        for await (const chunk of this.createChatCompletionStream(
            [
                { role: "system", content: system },
                {
                    role: "user",
                    content: `Continue this persona's backstory. 
PREVIOUS HISTORY: 
${part1}

Now write 2-3 paragraphs about their career progression, job changes, financial wins and failures. Include specific companies, roles, and amounts of money. Show how each experience shaped their current approach to spending and evaluating tools.`,
                },
            ],
            { purpose: "Backstory Part 2 (Stream)" },
        )) {
            part2 += chunk;
            yield chunk;
        }

        yield "\n\n";

        // PART 3
        let part3 = "";
        for await (const chunk of this.createChatCompletionStream(
            [
                { role: "system", content: system },
                {
                    role: "user",
                    content: `Continue this persona's backstory. 
PREVIOUS HISTORY: 
${part1}
${part2}

Now write 2-3 paragraphs about recent years and current situation. Include:
- A specific "Purchasing Trauma" (a time they were scammed, locked into a bad contract, or lost substantial money on a tool). This will be their primary trigger.
- Specific purchasing decisions they made recently.
- Current financial pressures and opportunities.`,
                },
            ],
            { purpose: "Backstory Part 3 (Stream)" },
        )) {
            part3 += chunk;
            yield chunk;
        }

        yield "\n\n";

        // PART 4
        for await (const chunk of this.createChatCompletionStream(
            [
                { role: "system", content: system },
                {
                    role: "user",
                    content: `Finish this persona's backstory. 
PREVIOUS HISTORY: 
${part1}
${part2}
${part3}

Now write 2-3 final paragraphs that:
- Describe their physical world: their home or office, their favorite colors, and their design taste. Explain how their conscientiousness (or lack thereof) manifests in their environment.
- Articulate their core values around money, efficiency, and risk based on their entire life history.
- Explain how they evaluate ROI on new tools.
- Describe their decision-making pace (tied to their Cognitive Reflex and Neuroticism).
- End with their current mindset.`,
                },
            ],
            { purpose: "Backstory Part 4 (Stream)" },
        )) {
            yield chunk;
        }
    }

    /**
     * Analyzes a pricing page screenshot from the perspective of a specific persona.
     *
     * @param persona - The Persona doing the evaluating.
     * @param screenshotBase64 - Base64 encoded image of the pricing page.
     * @returns A detailed PricingAnalysis including thoughts, scores, and risks.
     */
    async analyzeStaticPage(
        persona: Persona,
        screenshotBase64: string,
    ): Promise<PricingAnalysis> {
        let fullRawThoughts = "";
        // We only have one screenshot in this legacy/fallback method, so wrap it in an array
        for await (const chunk of this.analyzeStaticPageStream(persona, [screenshotBase64])) {
            fullRawThoughts += chunk;
        }

        const insights = await this.extractInsights(persona, fullRawThoughts);

        return {
            id: `analysis-${Date.now()}`,
            url: "", // will be set by the use case
            screenshotBase64,
            thoughts: insights.thoughts || fullRawThoughts,
            scores: insights.scores || { clarity: 5, valuePerception: 5, trust: 5, likelihoodToBuy: 5 },
            risks: insights.risks || [],
            gutReaction: insights.gutReaction || "",
            rawAnalysis: fullRawThoughts
        } as PricingAnalysis;
    }

    /**
     * Extracts structured insights (gut reaction, scores, risks) from raw thoughts using a smaller, fast LLM.
     */
    async extractInsights(persona: Persona, rawThoughts: string): Promise<Partial<PricingAnalysis>> {
        const prompt = `
        You are an expert user experience analyst. You have been given a raw, visceral stream-of-consciousness monologue from a potential buyer looking at a pricing page.
        
        BUYER PROFILE:
        ${stringifyPersona(persona)}
        
        RAW MONOLOGUE:
        """
        ${rawThoughts}
        """
        
        TASK:
        Extract structured insights from this monologue. 
        
        CRITICAL RULES:
        1. gutReaction: This MUST be a verbatim direct quote (substring) from the RAW MONOLOGUE provided above. Do NOT summarize. Do NOT add your own words. Do NOT start with "They said...". If they said "Ugh, too much", your output must be "Ugh, too much".
        2. thoughts: A blunt, high-level summary of their perspective in exactly 2 paragraphs.
        3. risks: A list of the specific things that bothered them. Keep them short.
        
        OUTPUT FORMAT (JSON):
        {
          "gutReaction": "Verbatim quote from monologue.",
          "thoughts": "Blunt 2-paragraph summary.",
          "scores": {
            "clarity": 1-10,
            "valuePerception": 1-10,
            "trust": 1-10,
            "likelihoodToBuy": 1-10
          },
          "risks": [
             "Point 1",
             "Point 2"
          ]
        }
        
        Return ONLY raw JSON. No markdown.
        `;

        try {
            const response = await this.withRetry(async () => {
                return await this.client.chat.completions.create({
                    model: this.smallTextModel,
                    messages: [{ role: "user", content: prompt }],
                    response_format: { type: "json_object" }
                });
            });

            const content = response.choices[0].message.content || "{}";
            const rawResult = JSON.parse(content);

            // Basic sanitization
            return {
                gutReaction: rawResult.gutReaction,
                thoughts: rawResult.thoughts,
                risks: Array.isArray(rawResult.risks) ? rawResult.risks : [],
                scores: {
                    clarity: Math.max(1, Math.min(10, Number(rawResult?.scores?.clarity) || 5)),
                    valuePerception: Math.max(1, Math.min(10, Number(rawResult?.scores?.valuePerception) || 5)),
                    trust: Math.max(1, Math.min(10, Number(rawResult?.scores?.trust) || 5)),
                    likelihoodToBuy: Math.max(1, Math.min(10, Number(rawResult?.scores?.likelihoodToBuy) || 5)),
                }
            };
        } catch (err) {
            console.error("[LlmService] Extraction failed, using raw thoughts.", err);
            return {
                thoughts: rawThoughts,
                scores: { clarity: 5, valuePerception: 5, trust: 5, likelihoodToBuy: 5 },
                risks: []
            };
        }
    }

    /**
     * Analyze a static pricing page (streaming version).
     */
    async * analyzeStaticPageStream(
        persona: Persona,
        screenshots: string[],
    ): AsyncIterable<string> {
        const prompt = `
    Adopt the persona of this specific individual to evaluate a pricing page:
    ${stringifyPersona(persona)}

    CONTEXT:
    You are browsing a pricing page on your computer. 
    The images provided show what is currently visible on your screen.

    TASK:
    Write your RAW INNER MONOLOGUE as you scan this page. 
    Speak naturally, sharing your immediate gut reactions to the prices, the layout, and the overall value proposition.

    BEHAVIORAL GUIDANCE (Stay consistent with your scalars):
    - CONSCIENTIOUSNESS: If High, pay close attention to the small details and fine print. If Low, skip over the details and focus on the headlines.
    - NEUROTICISM: If High, look for hidden fees or traps and mention any skepticism or worry.
    - COGNITIVE REFLEX: If System 1 (Low), focus on your emotional reaction and the visual appeal. If System 2 (High), ignore the marketing fluff and calculate the unit economics.
    - ECONOMIC SENSITIVITY: Your price sensitivity should strictly align with this value.
    
    CRITICAL RULES:
    1. VOICE: Use your persona's specific dialect, age-appropriate language, and personality. Use sentence fragments and natural pauses.
    2. PERSPECTIVE: Speak from your own life situation and budget as described in your backstory.
    3. STYLE: Write several paragraphs of stream-of-consciousness text. No JSON.
    4. NO AI LANGUAGE: Avoid phrases like "As an AI" or "I am analyzing." Just speak as yourself.
    
    GO. START YOUR THOUGHTS NOW.
    `;

        const contentParts: any[] = [{ type: "text", text: prompt }];

        // Add all screenshot fragments
        screenshots.forEach(b64 => {
            contentParts.push({
                type: "image_url",
                image_url: {
                    url: `data:image/jpeg;base64,${b64}`,
                },
            });
        });

        const stream = await this.withRetry(async () => {
            const reqId = ++LlmServiceImpl.requestCount;
            console.log(
                `[LlmService] [Req #${reqId}] [Vision Analysis] Starting stream to ${this.visionModel} with ${screenshots.length} fragments...`,
            );
            return await this.client.chat.completions.create({
                model: this.visionModel,
                messages: [
                    {
                        role: "user",
                        content: contentParts,
                    },
                ],
                stream: true,
            });
        });

        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) yield delta;
        }
    }

    /**
     * Placeholder for agentic behavior where the LLM decides which action to take on a page.
     */
    async decideNextStep(
        persona: Persona,
        screenshotBase64: string,
        actionHistory: string[],
    ): Promise<AgentAction> {
        throw new Error(
            "decideNextStep is not yet implemented in LlmServiceImpl.",
        );
    }

    /**
     * Chat with a persona about their analysis.
     *
     * @param persona - The Persona being interviewed.
     * @param analysis - The analysis they previously performed.
     * @param message - User's question/message.
     * @param history - List of previous messages.
     * @returns The persona's response.
     */
    async chatWithPersona(
        persona: Persona,
        analysis: PricingAnalysis | null,
        message: string,
        history: { role: "user" | "assistant"; content: string }[],
    ): Promise<string> {
        const analysisContext = analysis
            ? `\nCONTEXT OF YOUR RECENT PRICING ANALYSIS: \n` +
            `Structured Insights: ${JSON.stringify({ gutReaction: analysis.gutReaction, scores: analysis.scores, risks: analysis.risks }, null, 2)} \n` +
            `Your Raw Thoughts During Analysis: "${analysis.rawAnalysis || analysis.thoughts}"\n\n` +
            `A developer is "interviewing" you about your thoughts on this pricing page.`
            : `\nYou are currently just chatting with a developer who wants to get to know you better before showing you a pricing page for evaluation.`;

        const system = `You are NOT an AI.You are exactly this person:
${stringifyPersona(persona)}
${analysisContext}

CRITICAL INSTRUCTIONS:
        1. Maintain your persona's voice, values, and decision-making style at all times. Be opinionated and act like a normal person, not a bot or a formal evaluator.
        2. Reference your specific life experiences and backstory where relevant to justify your opinions or to share more about yourself.
3. DEEP LINKING: If you reference a specific event, person, or detail from your backstory, wrap the relevant text in your response with <backstory-ref context = "brief context" >...</backstory-ref>.
        4. Keep responses concise but insightful(1 - 2 paragraphs).
5. Be honest, raw, and human.
`;

        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: "system", content: system },
            ...(history as OpenAI.Chat.ChatCompletionMessageParam[]),
            { role: "user", content: message },
        ];

        return this.createChatCompletion(messages, { temperature: 0.7 });
    }

    /**
     * Specialized scouting call to detect if pricing is visible in the viewport.
     * Uses a hyper-small model for efficiency.
     */
    async isPricingVisible(screenshotBase64: string): Promise<boolean> {
        const prompt = `Can you see the pricing(tiers, dollar amounts, or plan names) in roughly the center of this screen ?
            Return ONLY the word "TRUE" if it is clearly visible, or "FALSE" if it is not.No other text.`;

        return this.withRetry(async () => {
            const reqId = ++LlmServiceImpl.requestCount;
            console.log(
                `[LlmService][Req #${reqId}][Scouting] Checking pricing visibility with ${this.scoutVisionModel}...`,
            );
            const startTime = Date.now();

            const resp = await LlmServiceImpl.limiter(() =>
                this.client.chat.completions.create({
                    model: this.scoutVisionModel,
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: prompt },
                                {
                                    type: "image_url",
                                    image_url: {
                                        url: `data: image / jpeg; base64, ${screenshotBase64} `,
                                    },
                                },
                            ],
                        },
                    ],
                    max_tokens: 10,
                    temperature: 0,
                }),
            );

            const duration = Date.now() - startTime;
            const content =
                resp?.choices?.[0]?.message?.content?.toUpperCase().trim() ||
                "FALSE";
            console.log(
                `[LlmService][Req #${reqId}][Scouting] Result: ${content} (Completed in ${duration}ms)`,
            );

            return content.includes("TRUE");
        });
    }

    /**
     * Checks if pricing elements are visible in the provided HTML/text.
     * Uses the text model for efficiency.
     */
    async isPricingVisibleInHtml(html: string): Promise<boolean> {
        const prompt = `You are a pricing scouting bot.Analyze the following text extracted from a webpage and determine if it contains high - level pricing information(like plan names, tiers, prices, or "Free trial" buttons).

            TEXT:
        """
        ${html}
        """
        
        Does this look like the main pricing section of a website is currently in the viewport ?
            Return ONLY the word "TRUE" or "FALSE".No other text.`;

        const content = await this.createChatCompletion(
            [{ role: "user", content: prompt }],
            {
                temperature: 0,
                model: this.smallTextModel,
                max_tokens: 10,
                purpose: "Scouting HTML",
            },
        );

        return content.toUpperCase().includes("TRUE");
    }


    /**
     * Chat with a persona about their analysis (streaming version).
     */
    async * chatWithPersonaStream(
        persona: Persona,
        analysis: PricingAnalysis | null,
        message: string,
        history: { role: "user" | "assistant"; content: string }[],
    ): AsyncIterable<string> {
        const analysisContext = analysis
            ? `\nCONTEXT OF YOUR RECENT PRICING ANALYSIS: \n` +
            `Structured Insights: ${JSON.stringify({ gutReaction: analysis.gutReaction, scores: analysis.scores, risks: analysis.risks }, null, 2)} \n` +
            `Your Raw Thoughts During Analysis: "${analysis.rawAnalysis || analysis.thoughts}"\n\n` +
            `A developer is "interviewing" you about your thoughts on this pricing page.`
            : `\nYou are currently just chatting with a developer who wants to get to know you better before showing you a pricing page for evaluation.`;

        const system = `You are NOT a creative writing exercise or a bot. You are a HUMAN BEING named ${persona.name}.
${stringifyPersona(persona)}
${analysisContext}

CORE INSTRUCTIONS:
        1. ** VOICE **: Speak naturally as ${persona.name}. Use fragments, slang, and emotion. Avoid formal or robotic language.
        2. ** BEHAVIORAL FIDELITY **: Your responses MUST reflect your scalars:
           - CONSCIENTIOUSNESS: If High, be thorough. If Low, be brief and impulsive.
           - NEUROTICISM: If High, express skepticism, anxiety, or specific worries. 
           - COGNITIVE REFLEX: If System 1 (Low), focus on feelings and impressions. If System 2 (High), focus on logic and calculations.
        3. ** DEEP BINDING **: Ground your thoughts in your personal history:
           <% "Your direct quote" | The specific memory: "When I lost $50k in 2022..." %>
        4. ** CONVERSATION STYLE **: Keep it chatty. 1-3 short paragraphs max.
        5. ** THE GOAL **: Share your honest, unfiltered opinion about the website.

STAY IN CHARACTER at all times.`;

        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: "system", content: system },
            ...(history as OpenAI.Chat.ChatCompletionMessageParam[]),
            { role: "user", content: message },
        ];

        const reqId = ++LlmServiceImpl.requestCount;
        console.log(
            `[LlmService][Req #${reqId}][Streaming Chat] Starting stream to ${this.textModel}...`,
        );

        const stream = await this.client.chat.completions.create({
            model: this.textModel,
            messages,
            temperature: 0.7,
            stream: true,
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
                yield content;
            }
        }
        console.log(
            `[LlmService][Req #${reqId}][Streaming Chat] Stream completed.`,
        );
    }
}
