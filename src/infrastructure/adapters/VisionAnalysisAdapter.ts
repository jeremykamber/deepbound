import { Persona, stringifyPersona } from "@/domain/entities/Persona";
import { PricingAnalysisSchema } from "@/domain/entities/PricingAnalysis";
import { LlmServiceImpl } from "./LlmServiceImpl";
import { streamObject } from "ai";

export class VisionAnalysisAdapter {
  constructor(private llmService: LlmServiceImpl) { }

  /**
   * Consolidated Pricing Analysis using Hybrid Grounding (Screenshot + HTML).
   * Returns a stream of the structured PricingAnalysis object.
   */
  async analyzePricingPageStream(
    persona: Persona,
    screenshotBase64: string,
    pageHtml?: string
  ) {
    const system = `You are adopting the persona of a specific individual to evaluate a pricing page.
        
        PERSONA PROFILE:
        ${stringifyPersona(persona)}
        
        CONTEXT:
        You are looking at a pricing page. You have been provided with:
        1. A screenshot of the page (image).
        2. The raw HTML/text content of the page (if available).
        
        TASK:
        Evaluate this page from YOUR perspective. Use your personality, values, and scalars.
        
        HYBRID GROUNDING RULES:
        - Use the screenshot to gauge visual appeal, layout, and hierarchy.
        - Use the HTML to verify specific prices, plan names, and fine print that might be hard to see in the image.
        - If there is a contradiction, trust the HTML for data and the screenshot for layout/emotion.
        
        BEHAVIORAL GUIDANCE:
        - CONSCIENTIOUSNESS: If High, pay close attention to the small details and fine print. If Low, skip over the details.
        - NEUROTICISM: If High, look for hidden fees or traps.
        - COGNITIVE REFLEX: If System 1 (Low), focus on emotional reaction. If System 2 (High), calculate unit economics.
        
        SPEAK IN FIRST PERSON. Be blunt, honest, and natural.`;

    const prompt = `Evaluate this pricing page. ${pageHtml ? `\n\nPAGE HTML CONTENT:\n\"\"\"\n${pageHtml}\n\"\"\"` : ""}`;

    return streamObject({
      model: this.llmService.provider(this.llmService.visionModel),
      schema: PricingAnalysisSchema,
      system,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image",
              image: screenshotBase64,
            },
          ],
        },
      ],
      temperature: 0.7,
    });
  }

  /**
   * Scouting call to detect if pricing is visible in the viewport.
   */
  async isPricingVisible(screenshotBase64: string): Promise<boolean> {
    const prompt = `Can you see the pricing (tiers, dollar amounts, or plan names) in roughly the center of this screen?
            Return ONLY the word "TRUE" if it is clearly visible, or "FALSE" if it is not. No other text.`;

    return this.llmService.withRetry(async () => {
      const resp = await LlmServiceImpl.limiter(() =>
        this.llmService.client.chat.completions.create({
          model: this.llmService.scoutVisionModel,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${screenshotBase64}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 10,
          temperature: 0,
        }),
      );

      const content = resp?.choices?.[0]?.message?.content?.toUpperCase().trim() || "FALSE";
      return content.includes("TRUE");
    });
  }

  /**
   * Checks if pricing elements are visible in the provided HTML/text.
   */
  async isPricingVisibleInHtml(html: string): Promise<boolean> {
    const prompt = `Analyze if the following text contains pricing information (plans, prices, etc.).
        
        TEXT:
        \"\"\"\n${html}\n\"\"\"
        
        Return ONLY "TRUE" or "FALSE".`;

    const content = await this.llmService.createChatCompletion(
      [{ role: "user", content: prompt }],
      {
        temperature: 0,
        model: this.llmService.smallTextModel,
        max_tokens: 10,
        purpose: "Scouting HTML",
      },
    );

    return content.toUpperCase().includes("TRUE");
  }
}
