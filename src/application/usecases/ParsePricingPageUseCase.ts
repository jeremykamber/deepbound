import { BrowserServicePort } from "@/domain/ports/BrowserServicePort";
import { LlmServicePort } from "@/domain/ports/LlmServicePort";
import { Persona } from "@/domain/entities/Persona";
import { PricingAnalysis, validatePricingAnalysis } from "@/domain/entities/PricingAnalysis";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { stripCodeFence, extractJson } from "@/infrastructure/adapters/llmUtils";

export type PricingAnalysisProgressStep =
  | 'STARTING'
  | 'OPENING_PAGE'
  | 'FINDING_PRICING'
  | 'THINKING';

export interface PricingAnalysisProgress {
  step: PricingAnalysisProgressStep;
  screenshot?: string;
  personaName?: string;
  completedCount?: number;
  totalCount?: number;
  analysisToken?: string;
}

export class ParsePricingPageUseCase {
  private tempDir: string | null = null;
  private lastTempScreenshotPath: string | null = null;

  constructor(
    private readonly browserService: BrowserServicePort,
    private readonly llmService: LlmServicePort
  ) { }

  async execute(url: string, personas: Persona[], onProgress?: (progress: PricingAnalysisProgress) => void, abortSignal?: AbortSignal): Promise<PricingAnalysis[]> {
    // 1. Capture screenshot of the pricing page with adaptive scouting
    console.log(`[ParsePricingPageUseCase] Starting adaptive scouting for ${url}...`);

    let screenshotBase64 = '';
    let capturedScreenshots: string[] = [];
    let pageHtml = '';

    try {
      // Initialize temp directory for live screenshots
      this.tempDir = path.join(os.tmpdir(), `pricing-live-${Date.now()}`);
      await fs.mkdir(this.tempDir, { recursive: true });
      console.log(`[ParsePricingPageUseCase] Created temp dir: ${this.tempDir}`);

      // Check if already cancelled
      if (abortSignal?.aborted) {
        throw new Error('Request cancelled before starting');
      }

      await this.browserService.navigateTo(
        url,
        (status) => {
          if (abortSignal?.aborted) return;
          if (status === 'SETTING_UP') onProgress?.({ step: 'STARTING' });
          if (status === 'LOADING_WEBSITE') onProgress?.({ step: 'OPENING_PAGE' });
        },
        async (liveScreenshotBase64) => {
          if (abortSignal?.aborted) return;
          // Handle live screenshot: save to temp file and notify
          const screenshotPath = path.join(this.tempDir!, `live-${Date.now()}.jpg`);
          const buffer = Buffer.from(liveScreenshotBase64, 'base64');
          await fs.writeFile(screenshotPath, buffer);

          // Delete previous temp screenshot
          if (this.lastTempScreenshotPath) {
            await fs.unlink(this.lastTempScreenshotPath).catch(() => { });
          }

          this.lastTempScreenshotPath = screenshotPath;
          onProgress?.({ step: 'OPENING_PAGE', screenshot: liveScreenshotBase64 });
        }
      );

      // 1. Capture multiple screenshots (Top, Middle, Bottom) for full context
      const screenshots = await this.browserService.capturePageFragments();
      screenshotBase64 = screenshots[0]; // Use top for UI preview

      // Store for analysis phase
      capturedScreenshots = screenshots;

      onProgress?.({ step: 'FINDING_PRICING', screenshot: screenshotBase64 });

      // 2. Get cleaned HTML/Text for grounding the vision models
      pageHtml = await this.browserService.getCleanedHtml();

      // 3. One-shot check for pricing visibility in HTML
      const foundPricing = await this.llmService.isPricingVisibleInHtml(pageHtml);

      if (!foundPricing) {
        console.warn(`[ParsePricingPageUseCase] Pricing not detected in HTML. Proceeding with caution.`);
      }

    } finally {
      // Ensure browser is closed even if scouting fails
      await this.browserService.close();

      // Clean up temp directory
      if (this.tempDir) {
        await fs.rm(this.tempDir, { recursive: true, force: true }).catch(() => { });
        console.log(`[ParsePricingPageUseCase] Cleaned up temp dir: ${this.tempDir}`);
      }
    }

    // Check if cancelled before persona analysis
    if (abortSignal?.aborted) {
      throw new Error('Request cancelled before persona analysis');
    }

    // 2. Analyze the pricing page from each persona's perspective (Parallelized queue)
    console.log(`[ParsePricingPageUseCase] Analyzing from ${personas.length} personas...`);

    const pLimit = (await import('p-limit')).default;
    const limit = pLimit(3);

    let finishedCount = 0;
    const totalCount = personas.length;

    // Initial broadcast
    onProgress?.({
      step: 'THINKING',
      screenshot: screenshotBase64,
      totalCount,
      completedCount: 0
    });

    const analyses: PricingAnalysis[] = await Promise.all(
      personas.map((persona, index) => limit(async () => {
        // Check if cancelled before persona analysis
        if (abortSignal?.aborted) {
          throw new Error('Request cancelled during persona analysis');
        }

        // Reduced stagger since p-limit handles the main congestion
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, Math.min(index * 200, 1000)));
        }

        console.log(`[ParsePricingPageUseCase] Starting analysis for persona: ${persona.name}...`);
        onProgress?.({
          step: 'THINKING',
          screenshot: screenshotBase64,
          personaName: persona.name,
          totalCount,
          completedCount: finishedCount
        });

        // 1. Unified Vision Analysis (Raw Thoughts) - pure visual
        let rawThoughts = "";
        // MVP SIMPLIFICATION: We only send the top viewport (index 0) to ensure API stability.
        // The pageHtml provides the "textual grounding" for anything below the fold.
        const screenshotsToAnalyze = [capturedScreenshots[0] || screenshotBase64!];

        for await (const chunk of this.llmService.analyzeStaticPageStream(persona, screenshotsToAnalyze)) {
          if (abortSignal?.aborted) throw new Error('Request cancelled during persona analysis');
          rawThoughts += chunk;
          onProgress?.({
            step: 'THINKING',
            screenshot: screenshotBase64,
            personaName: persona.name,
            totalCount,
            completedCount: finishedCount,
            analysisToken: chunk
          });
        }

        // 2. Extract structured insights using a small LLM
        let analysis: any;
        try {
          analysis = await this.llmService.extractInsights(persona, rawThoughts);
        } catch (e) {
          console.error(`[ParsePricingPageUseCase] Extraction failed for persona ${persona.name}.`, e);
          analysis = {
            gutReaction: "Honestly, I'm having a hard time focusing on this right now.",
            thoughts: rawThoughts,
            scores: { clarity: 1, valuePerception: 1, trust: 1, likelihoodToBuy: 1 },
            risks: ["[VISUAL] Technical difficulty reading the page content"]
          };
        }

        if (abortSignal?.aborted) throw new Error('Request cancelled during persona analysis');

        finishedCount++;
        onProgress?.({
          step: 'THINKING',
          screenshot: screenshotBase64,
          totalCount,
          completedCount: finishedCount
        });

        // Add metadata and IDs
        const fullAnalysis: PricingAnalysis = {
          ...analysis,
          rawAnalysis: rawThoughts,
          id: `${persona.id}-${Date.now()}`,
          url,
          screenshotBase64,
        };

        // Validate
        if (!validatePricingAnalysis(fullAnalysis)) {
          console.error(`[ParsePricingPageUseCase] Validation failed for persona ${persona.name}.`, JSON.stringify(fullAnalysis, null, 2));
          throw new Error(`Invalid pricing analysis generated for persona ${persona.name}.`);
        }

        return fullAnalysis;
      })
      )
    );

    return analyses;
  }
}
