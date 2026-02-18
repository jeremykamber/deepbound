import OpenAI from "openai";
import pLimit from "p-limit";
import { LlmServicePort } from "@/domain/ports/LlmServicePort";
import { createOpenAI, OpenAIProvider } from "@ai-sdk/openai";

/**
 * Lean core implementation of the LlmServicePort that handles LLM plumbing.
 * Domain-specific logic is moved to specialized adapters.
 */
export class LlmServiceImpl implements LlmServicePort {
    public client: OpenAI;
    public provider: OpenAIProvider;
    public textModel: string;
    public smallTextModel: string;
    public visionModel: string;
    public scoutVisionModel: string;
    public extractionModel: string;
    private static requestCount = 0;
    public static readonly limiter = pLimit(1);

    // OpenRouter Defaults
    private static readonly OR_TEXT_MODEL = "qwen/qwen3-30b-a3b-instruct-2507";
    private static readonly OR_SMALL_TEXT_MODEL = "google/gemma-3-4b-it";
    private static readonly OR_VISION_MODEL = "qwen/qwen3-vl-8b-instruct";
    private static readonly OR_SCOUT_MODEL = "qwen/qwen-2.5-vl-7b-instruct:free";
    private static readonly OR_EXTRACTION_MODEL = "google/gemma-3-4b-it";

    // Ollama Defaults
    private static readonly OLLAMA_DEFAULT_MODEL = "gemma3:1b-it-qat";

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

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    public async withRetry<T>(fn: () => Promise<T>, maxRetries = 5): Promise<T> {
        let lastError: unknown;
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error: unknown) {
                lastError = error;
                const status = (error as { status?: number }).status;
                const isRetryable = status === 429 || (status !== undefined && status >= 500);
                if (!isRetryable || i === maxRetries - 1) throw error;
                const waitTime = Math.pow(2, i) * 5000 + Math.random() * 2000;
                console.warn(`[LlmService] Retry ${i + 1}/${maxRetries} after ${Math.round(waitTime)}ms`);
                await this.sleep(waitTime);
            }
        }
        throw lastError;
    }

    static createFromEnv(
        provider: "ollama" | "openrouter",
        overrides?: { text?: string; smallText?: string; vision?: string; scout?: string; extraction?: string },
    ): LlmServiceImpl {
        const baseURL = provider === "ollama"
            ? process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1"
            : process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

        const apiKey = provider === "openrouter"
            ? process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
            : process.env.OLLAMA_API_KEY || "ollama";

        const client = new OpenAI({ baseURL, apiKey: apiKey as string, dangerouslyAllowBrowser: true });
        const providerInstance = createOpenAI({ baseURL, apiKey: apiKey as string });

        const models = provider === "ollama"
            ? {
                text: overrides?.text || LlmServiceImpl.OLLAMA_DEFAULT_MODEL,
                smallText: overrides?.smallText || LlmServiceImpl.OLLAMA_DEFAULT_MODEL,
                vision: overrides?.vision || LlmServiceImpl.OLLAMA_DEFAULT_MODEL,
                scout: overrides?.scout || LlmServiceImpl.OLLAMA_DEFAULT_MODEL,
                extraction: overrides?.extraction || LlmServiceImpl.OLLAMA_DEFAULT_MODEL,
            }
            : {
                text: overrides?.text || LlmServiceImpl.OR_TEXT_MODEL,
                smallText: overrides?.smallText || LlmServiceImpl.OR_SMALL_TEXT_MODEL,
                vision: overrides?.vision || LlmServiceImpl.OR_VISION_MODEL,
                scout: overrides?.scout || LlmServiceImpl.OR_SCOUT_MODEL,
                extraction: overrides?.extraction || LlmServiceImpl.OR_EXTRACTION_MODEL
            };

        return new LlmServiceImpl(client, providerInstance, models);
    }

    public async createChatCompletion(
        messages: OpenAI.Chat.ChatCompletionMessageParam[],
        options: { temperature?: number; max_tokens?: number; response_format?: { type: "json_object" | "text" }; model?: string; purpose?: string }
    ): Promise<string> {
        return this.withRetry(async () => {
            const reqId = ++LlmServiceImpl.requestCount;
            const purpose = options.purpose || "General";
            console.log(`[LlmService] [Req #${reqId}] [${purpose}] Sending request to ${options.model || this.textModel}...`);
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

            console.log(`[LlmService] [Req #${reqId}] [${purpose}] Completed in ${Date.now() - startTime}ms.`);
            const content = resp?.choices?.[0]?.message?.content;
            if (!content) throw new Error("No content returned from LLM chat completion");
            return content;
        });
    }

    public async * createChatCompletionStream(
        messages: OpenAI.Chat.ChatCompletionMessageParam[],
        options: { temperature?: number; max_tokens?: number; response_format?: { type: "json_object" | "text" }; model?: string; purpose?: string }
    ): AsyncIterable<string> {
        const stream = await this.withRetry(async () => {
            const reqId = ++LlmServiceImpl.requestCount;
            const purpose = options.purpose || "General";
            console.log(`[LlmService] [Req #${reqId}] [${purpose}] Starting stream to ${options.model || this.textModel}...`);
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

    // Mock implementations for interface satisfaction (temporary until adapters are fully integrated)
    async generateInitialPersonas(): Promise<any> { throw new Error("Move to PersonaAdapter"); }
    async * generateInitialPersonasStream(): AsyncIterable<any> { throw new Error("Move to PersonaAdapter"); }
    async generatePersonaBackstory(): Promise<any> { throw new Error("Move to PersonaAdapter"); }
    async * generatePersonaBackstoryStream(): AsyncIterable<any> { throw new Error("Move to PersonaAdapter"); }
    async decideNextStep(): Promise<any> { throw new Error("Not implemented"); }
    async analyzeStaticPage(): Promise<any> { throw new Error("Move to VisionAnalysisAdapter"); }
    async * analyzeStaticPageStream(): AsyncIterable<any> { throw new Error("Move to VisionAnalysisAdapter"); }
    async extractInsights(): Promise<any> { throw new Error("Move to VisionAnalysisAdapter"); }
    async isPricingVisible(): Promise<any> { throw new Error("Move to VisionAnalysisAdapter"); }
    async isPricingVisibleInHtml(): Promise<any> { throw new Error("Move to VisionAnalysisAdapter"); }
    async chatWithPersona(): Promise<any> { throw new Error("Move to ChatAdapter"); }
    async * chatWithPersonaStream(): AsyncIterable<any> { throw new Error("Move to ChatAdapter"); }
    async validatePromptDomain(): Promise<any> { throw new Error("Move to ChatAdapter"); }
}
