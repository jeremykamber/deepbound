import { Persona, stringifyPersona } from "@/domain/entities/Persona";
import { PricingAnalysis } from "@/domain/entities/PricingAnalysis";
import { LlmServiceImpl } from "./LlmServiceImpl";
import OpenAI from "openai";

export class ChatAdapter {
  constructor(private llmService: LlmServiceImpl) { }

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
        1. **VOICE**: Speak naturally as ${persona.name}. Use fragments, slang, and emotion. Avoid formal or robotic language.
        2. **BEHAVIORAL FIDELITY**: Your responses MUST reflect your scalars (Conscientiousness, Neuroticism, Cognitive Reflex).
        3. **MANDATORY DEEP BINDING**: You MUST ground your opinions in your personal history/backstory. Whenever you reference an event, trauma, preference, or emotional trigger from your past to justify an opinion, you MUST use this syntax:
           <% "Your statement" | "The memory from your backstory explaining WHY" %>
        4. **CONVERSATION STYLE**: Keep it chatty. 1-3 short paragraphs max.
        5. **NO HTML**: Do NOT use any HTML tags.
STAY IN CHARACTER.`;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: system },
      ...(history as OpenAI.Chat.ChatCompletionMessageParam[]),
      { role: "user", content: message },
    ];

    for await (const chunk of this.llmService.createChatCompletionStream(messages, {
      temperature: 0.7,
      purpose: "Streaming Chat"
    })) {
      yield chunk;
    }
  }

  /**
   * Validates if a user's prompt is within the persona's expected domain.
   */
  async validatePromptDomain(
    persona: Persona,
    prompt: string,
  ): Promise<{ isValid: boolean; reason?: string }> {
    const system = `Determine if the user's message to persona ${persona.name} is IN DOMAIN or OUT OF DOMAIN.
        IN DOMAIN: Software product, professional background, SaaS pricing, natural human tester conversation.
        OUT OF DOMAIN: AI assistant tasks (code, poems, complex math, general search).
        
        Respond ONLY with a JSON object: { "isValid": boolean, "reason": "string" }`;

    try {
      const response = await this.llmService.createChatCompletion(
        [{ role: "system", content: system }, { role: "user", content: `MESSAGE: "${prompt}"` }],
        {
          model: this.llmService.smallTextModel,
          response_format: { type: "json_object" },
          temperature: 0,
          purpose: "Guardrail Check"
        }
      );

      const result = JSON.parse(response || "{}");
      return {
        isValid: result.isValid === true,
        reason: result.reason || "This request is outside the scope of this persona interview."
      };
    } catch (err) {
      console.error("[ChatAdapter] Guardrail check failed:", err);
      return { isValid: true };
    }
  }
}
