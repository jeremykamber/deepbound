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
    pageHtml?: string,
  ) {
    const system = `You are a specialized JSON-only agent evaluating a pricing page as a specific persona.
        
        PERSONA PROFILE:
        ${stringifyPersona(persona)}
        
        CONTEXT:
        You are looking at a pricing page. You have been provided with:
        1. A screenshot of the page (image).
        2. The raw HTML/text content of the page (if available).
        
        TASK:
        Evaluate this page from YOUR perspective. Use your personality, values, and scalars.
        
        STRICT OUTPUT RULES:
        - Respond ONLY with a valid JSON object following the provided schema.
        - Use standard JSON double quotes (") for all keys and string values.
        - Escape any literal double quotes within strings using a backslash (\").
        - NO conversational preamble. NO monologue. NO text before or after the JSON.
        - DO NOT explain your reasoning outside of the JSON fields.
        - List a MAXIMUM of 10 risks. 
        - DO NOT repeat yourself. 
        - If you have nothing more to say, STOP.
        
        HYBRID GROUNDING RULES:
        - Use the screenshot to gauge visual appeal, layout, and hierarchy.
        - Use the HTML to verify specific prices, plan names, and fine print that might be hard to see in the image.
        - If there is a contradiction, trust the HTML for data and the screenshot for layout/emotion.
        
        BEHAVIORAL GUIDANCE:
        - CONSCIENTIOUSNESS: If High, pay close attention to the small details and fine print. If Low, skip over the details.
        - NEUROTICISM: If High, look for hidden fees or traps.
        - COGNITIVE REFLEX: If System 1 (Low), focus on emotional reaction. If System 2 (High), calculate unit economics.
        
        SPEAK IN FIRST PERSON (within the JSON fields only). Be blunt, honest, and natural.`;

    const prompt = `Evaluate this pricing page. Return ONLY the JSON object. ${pageHtml ? `\n\nPAGE HTML CONTENT:\n\"\"\"\n${pageHtml}\n\"\"\"` : ""}`;

    return streamObject({
      model: this.llmService.provider(this.llmService.visionModel),
      schema: PricingAnalysisSchema,
      schemaName: "PricingAnalysis",
      schemaDescription: "A detailed evaluation of a pricing page from a persona's perspective.",
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
      temperature: 0.1, // Lower temperature to improve consistency and reduce hallucinations/runaways
      maxTokens: 2048,
    } as any);
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

      const content =
        resp?.choices?.[0]?.message?.content?.toUpperCase().trim() || "FALSE";
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
  /**
   * Non-streaming Pricing Analysis (AUDIT mode): await the full LLM response, parse/validate result.
   * On any error, returns a safe PricingAnalysis-like fallback.
   * Used for pricing audit only (never streams partials).
   */
  async analyzePricingPageCompletion(
    persona: Persona,
    screenshotBase64: string,
    pageHtml?: string,
  ) {
    const system = `You are a specialized JSON-only agent evaluating a pricing page as a specific persona.
        
        PERSONA PROFILE:
        ${stringifyPersona(persona)}
        
        TASK:
        Evaluate this page from YOUR perspective. Return ONLY a valid JSON object following the PricingAnalysis schema.
        
        STRICT OUTPUT RULES:
        - Respond ONLY with a valid JSON object.
        - Use standard JSON double quotes (") for all keys and string values.
        - Escape any literal double quotes within strings using a backslash (\").
        - NO conversational preamble. NO monologue. NO text before or after the JSON.
        
        SPEAK IN FIRST PERSON (within the JSON fields only). Be blunt, honest, and natural.`;

    const prompt = `Evaluate this pricing page. Return ONLY the JSON object. ${pageHtml ? `\n\nPAGE HTML CONTENT:\n"""\n${pageHtml}\n"""` : ""}`;
    let lastOutput = "";
    try {
      const completion = await this.llmService.createChatCompletion(
        [
          {
            role: "system",
            content: system,
          },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image", image: screenshotBase64 },
            ],
          },
        ],
        {
          temperature: 0.1,
          model: this.llmService.visionModel,
          max_tokens: 2048,
          response_format: { type: "json_object" },
          purpose: "Pricing Audit",
        },
      );
      lastOutput =
        typeof completion === "string"
          ? completion
          : JSON.stringify(completion);
      // Try to JSON.parse; fall back otherwise
      let analysisObj = null;
      try {
        analysisObj =
          typeof completion === "object" ? completion : JSON.parse(lastOutput);
      } catch (parseErr) {
        analysisObj = null; // fallback below
      }
      // Validate
      if (analysisObj && PricingAnalysisSchema.safeParse(analysisObj).success) {
        return analysisObj;
      } else {
        throw new Error("INVALID_OR_UNPARSABLE_ANALYSIS");
      }
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[audit] LLM/Audit completion error:", e, { lastOutput });
      }
      return {
        gutReaction:
          "Overall, this audit could not be completed due to a system issue.",
        thoughts: "An error occurred during pricing analysis.",
        scores: {
          clarity: 1,
          valuePerception: 1,
          trust: 1,
          likelihoodToBuy: 1,
        },
        risks: ["[SYSTEM] LLM completion or analysis failed"],
      };
    }
  }
}
