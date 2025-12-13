import OpenAI from "openai";
import { LlmServicePort } from "@/domain/ports/LlmServicePort";
import { Persona } from "@/domain/entities/Persona";

export class OpenRouterAdapter implements LlmServicePort {
    private client: any;
    private model: string;

    constructor(client: any, model = "google/gemma-3-27b-it:free") {
        this.client = client;
        this.model = model;
    }

    // Factory to create adapter using environment variables
    static createFromEnv(): OpenRouterAdapter {
        const apiKey =
            process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error(
                "OPENROUTER_API_KEY or OPENAI_API_KEY environment variable is required",
            );
        }
        const baseURL =
            process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
        const model =
            process.env.OPENROUTER_MODEL ||
            process.env.OPENAI_MODEL ||
            "gpt-4.1-nano";
        const client = new OpenAI({ apiKey, baseURL });
        return new OpenRouterAdapter(client, model);
    }

    private async createChatCompletion(
        messages: { role: string; content: string }[],
    ) {
        const resp = await this.client.chat.completions.create({
            model: this.model,
            messages,
            temperature: 0.8,
            max_tokens: 1200,
        });

        // new OpenAI client responses typically live at resp.choices[0].message.content
        const choice = resp?.choices?.[0];
        const content = choice?.message?.content ?? choice?.text ?? null;
        if (!content) throw new Error("No content returned from LLM");
        return content;
    }

    async generateInitialPersonas(icp: string): Promise<Persona[]> {
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
  backstory?: string;
}

CRITICAL REQUIREMENTS:
- Each persona must have DIFFERENT financial situations (e.g., bootstrapper, mid-market, enterprise)
- Include hobbies/interests that reveal their VALUES and decision-making style
- Personality traits should hint at how they approach purchasing decisions
- Occupations should span different industries/seniority levels
- Ages should vary (at least 15 years apart)
- Each persona should have DISTINCT spending patterns and risk tolerance

Return ONLY valid JSON without explanatory text or markdown code blocks.`;

        const user = `Create 3 diverse personas for pricing evaluation based on the following ideal customer profile description: "${icp}"

You MUST make sure above all that your personas fall within and match that ideal customer profile.

DIVERSITY CRITERIA:
1. Different financial profiles
2. Different industries or roles where applicable
3. Different approaches to technology adoption and ROI calculation
4. Different communication styles and decision-making speeds

Make them realistic, specific, and ready for deep backstory generation. JSON array only.`;

        const content = await this.createChatCompletion([
            { role: "system", content: system },
            { role: "user", content: user },
        ]);

        // Try parsing JSON; be forgiving of code fences
        const cleaned = this.stripCodeFence(content);
        try {
            const parsed = JSON.parse(cleaned);
            if (!Array.isArray(parsed))
                throw new Error("Expected JSON array from LLM");
            // Basic validation / shaping
            return parsed.map(
                (p: any, idx: number) =>
                    ({
                        id:
                            p.id ??
                            p.uuid ??
                            p.name?.toLowerCase().replace(/\s+/g, "-") +
                                `-${idx}`,
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
                            : typeof p.interests === "string"
                              ? [p.interests]
                              : [],
                        goals: Array.isArray(p.goals)
                            ? p.goals
                            : typeof p.goals === "string"
                              ? [p.goals]
                              : [],
                        personalityTraits: Array.isArray(p.personalityTraits)
                            ? p.personalityTraits
                            : p.traits && Array.isArray(p.traits)
                              ? p.traits
                              : [],
                        backstory: p.backstory ?? p.story ?? undefined,
                    }) as Persona,
            );
        } catch (err) {
            throw new Error(
                `Failed to parse personas from LLM response: ${err}\nResponse was: ${cleaned}`,
            );
        }
    }

    async generatePersonaBackstory(
        persona: Persona,
        icp: string,
    ): Promise<string> {
        const personaText = JSON.stringify(persona);

        const system = `You are a narrative psychologist conducting an EXHAUSTIVE, MULTI-HOUR DEEP INTERVIEW to build an extraordinarily detailed life story of a buyer persona.

That buyer persona is considered part of this ideal customer profile: ${icp}

Your task: Build a MASSIVE, COMPREHENSIVE, INTERNALLY CONSISTENT interview-style backstory (8000+ tokens) that reveals every nuance of this person's life, values, and decision-making patterns.

CRITICAL REQUIREMENTS (Deep Binding research):
- Write 3-4 SUBSTANTIAL paragraphs for EACH section, each paragraph 200-300 words
- MULTI-TURN DEPTH: This is a deep psychological interview, not a summary
- CONSISTENCY: Every detail aligns with established facts. Reference earlier points constantly.
- SPECIFICITY: Actual dollar amounts, brand names, company names, real scenarios, dates, names of people
- AUTHENTICITY: First-person voice. Natural, conversational. Tangents and rambling welcome.
- CAUSE-AND-EFFECT: Show HOW every experience shaped their current values and decisions
- PERSONAL DETAILS: Names of people, places, specific products, actual conversations
- EMOTIONAL DEPTH: Why things matter to them, not just what happened

This should feel like a REAL person's actual life story—messy, detailed, deeply personal, with rich sensory details.

Return plain text only. No labels, no markdown, no metadata. NO SUMMARIES OR HEADERS.`;

        const parts = [];

        // PART 1: Childhood and family financial culture
        const part1 = await this.createChatCompletion([
            { role: "system", content: system },
            {
                role: "user",
                content: `Generate 3-4 detailed paragraphs about this persona's childhood and family financial culture:

${personaText}

Focus on:
- Their parents' relationship with money (were they savers, spenders, anxious about money?)
- Early memories about money (good and bad)
- What financial lessons they absorbed from watching their family
- Family economic situation (struggling, middle-class, wealthy?)
- Early money mistakes or wins they witnessed
- Names of family members, specific stores, specific amounts they remember
- How their parents' money values are still with them today

Write in first person, as if they're vividly recalling their childhood.`,
            },
        ]);
        parts.push(part1);

        // PART 2: Education and early financial lessons
        const part2 = await this.createChatCompletion([
            { role: "system", content: system },
            {
                role: "user",
                content: `Continue this persona's backstory with 3-4 detailed paragraphs about their education and early financial lessons:

Previous context:
${part1}

Now write about:
- Their educational path (schools, colleges, any gaps)
- First job and how that shaped their work ethic
- Early financial mistakes (stupid purchases, bad decisions)
- First time they managed their own money
- Specific amounts they remember earning, spending, saving
- Teachers, mentors, or friends who influenced their thinking
- How their education affected their ability to earn later
- Early jobs and the salaries/wages they received

Include specific names, schools, job titles, and amounts. Show cause-and-effect.`,
            },
        ]);
        parts.push(part2);

        // PART 3: Early career and income journey
        const part3 = await this.createChatCompletion([
            { role: "system", content: system },
            {
                role: "user",
                content: `Continue with 3-4 detailed paragraphs about their early career and income journey:

Previous context:
${part1}

${part2}

Now write about:
- Career progression through their 20s and 30s
- Job transitions and why they happened
- Salary growth (specific numbers and years)
- Companies they worked for (names, industries)
- Colleagues who influenced their career
- Big career decisions and how they made them
- Times when they felt secure or insecure about money
- First time they made real money
- When did they start to feel "successful"?
- Financial goals they set and whether they achieved them

Be extremely specific: "In 2015 I made $52K at TechCorp, then moved to StartupXYZ for $68K..."`,
            },
        ]);
        parts.push(part3);

        // PART 4: Major financial wins and successes
        const part4 = await this.createChatCompletion([
            { role: "system", content: system },
            {
                role: "user",
                content: `Continue with 3-4 detailed paragraphs about their major financial wins and successes:

Previous context:
${part1}

${part2}

${part3}

Now write about:
- Their biggest financial wins (investments, bonuses, selling something)
- A time they made a great purchasing decision
- A time they saved money strategically
- Financial goals they achieved (buying a house, paying off debt, saving X amount)
- How these wins affected their confidence
- Specific amounts and dates
- Who helped them, who they told, how they celebrated
- What these wins taught them about money
- Did they repeat the behavior that led to wins?

Show the emotional and practical impact of these successes.`,
            },
        ]);
        parts.push(part4);

        // PART 5: Major financial failures and painful lessons
        const part5 = await this.createChatCompletion([
            { role: "system", content: system },
            {
                role: "user",
                content: `Continue with 3-4 detailed paragraphs about their major financial failures and painful lessons:

Previous context:
${part1}

${part2}

${part3}

${part4}

Now write about:
- Their biggest financial mistakes (wasted money, bad purchases, failed investments)
- A business or personal finance failure
- Times they lost money and how much
- Expensive lessons they learned
- Tools or services they bought that didn't work out
- Specific amounts, dates, company names
- Who knew about these failures (and who they hid them from)
- How long it took to recover
- What they learned and how it changed their behavior
- Do they still think about these failures?
- How paranoid or careful did these make them?

Be brutally honest about the impact of these failures.`,
            },
        ]);
        parts.push(part5);

        // PART 6: Spending patterns and financial personality
        const part6 = await this.createChatCompletion([
            { role: "system", content: system },
            {
                role: "user",
                content: `Continue with 3-4 detailed paragraphs about their spending patterns and financial personality:

Previous context:
${part1}

${part2}

${part3}

${part4}

${part5}

Now write about:
- Are they a spender or a saver? (with evidence)
- Monthly budget breakdown (housing, food, entertainment, business tools)
- Actual dollar amounts they spend on different categories
- What they splurge on vs where they're cheap
- Their credit card approach (pay off monthly? Carry balance?)
- Do they track spending? Use budgeting tools? How?
- Impulse purchases—what triggers them?
- Do they negotiate or haggle?
- How do they feel about debt?
- Do they shop around or buy from trusted brands?
- Spending habits that embarrass them or that they're proud of

Reveal their actual financial personality through specific examples.`,
            },
        ]);
        parts.push(part6);

        // PART 7: Technology adoption and tool purchasing history
        const part7 = await this.createChatCompletion([
            { role: "system", content: system },
            {
                role: "user",
                content: `Continue with 3-4 detailed paragraphs about their technology adoption and tool purchasing history:

Previous context:
${part1}

${part2}

${part3}

${part4}

${part5}

${part6}

Now write about:
- How early are they to adopt new technology? (early adopter, middle, late?)
- Tools and software they've purchased (specific names and costs)
- Free tools they've tried and upgraded from
- Tools that completely changed their life (and why)
- Tools they wasted money on
- How do they decide to buy a tool? (free trial? Reviews? Friend recommendation?)
- Do they evaluate ROI consciously?
- What % of their budget goes to business/productivity tools monthly?
- Specific tools they'd never give up
- Tools they've abandoned
- How often do they switch tools?
- Do they read reviews or jump in?

Show their actual decision-making process and regrets.`,
            },
        ]);
        parts.push(part7);

        // PART 8: How they evaluate ROI and value
        const part8 = await this.createChatCompletion([
            { role: "system", content: system },
            {
                role: "user",
                content: `Continue with 3-4 detailed paragraphs about how they evaluate ROI and perceive value:

Previous context:
${part1}

${part2}

${part3}

${part4}

${part5}

${part6}

${part7}

Now write about:
- What does "value for money" actually mean to them?
- How do they calculate ROI? (formally or gut-feel?)
- Time vs money—what's more precious to them?
- Do they think about lifetime value or just upfront cost?
- What makes them feel scammed?
- When have they paid more and felt it was worth it?
- Price anchoring—how do they react to high prices?
- Do they price-shop obsessively or just pay?
- How long does it need to work before they judge it a success?
- Specific examples of "worth it" and "not worth it" purchases
- How much do they need to like something before paying?
- What's their breaking point for abandoning a tool?

Reveal their authentic decision-making psychology.`,
            },
        ]);
        parts.push(part8);

        // PART 9: Current pressures, opportunities, and priorities
        const part9 = await this.createChatCompletion([
            { role: "system", content: system },
            {
                role: "user",
                content: `Continue with 3-4 detailed paragraphs about their current pressures, opportunities, and priorities:

Previous context:
${part1}

${part2}

${part3}

${part4}

${part5}

${part6}

${part7}

${part8}

Now write about:
- What's stressing them about money right now?
- Current financial goals (next 1-3 years)
- What opportunities are they excited about?
- What are they worried they're missing?
- Current monthly income and expenses
- Do they feel secure or anxious right now?
- What would change their financial life?
- Are they trying to save, invest, grow income, or reduce costs?
- Who do they trust for financial advice?
- Specific tools or solutions they wish existed
- What's keeping them awake at night financially?
- Where do they see themselves in 5 years?

Show their current state of mind.`,
            },
        ]);
        parts.push(part9);

        // PART 10: Communication style, decision-making pace, and final reflections
        const part10 = await this.createChatCompletion([
            { role: "system", content: system },
            {
                role: "user",
                content: `Finish this persona's backstory with 3-4 detailed final paragraphs:

Previous context:
${part1}

${part2}

${part3}

${part4}

${part5}

${part6}

${part7}

${part8}

${part9}

Now write final paragraphs that:
- How do they prefer to be communicated with? (email, calls, async?)
- Fast decision maker or deliberate?
- Do they ask lots of questions before buying?
- Who do they consult before spending money? (spouse, mentor, nobody?)
- How long do they need to think before purchasing?
- Do they read terms and conditions?
- How important is customer support quality?
- What would make them switch from a trusted tool?
- Are they loyal to brands or always searching for better?
- How much do they like risk vs preferring safety?
- What's the core of who they are as a financial person?
- Tie back to childhood lessons—what came full circle?
- What would they tell their younger self about money?
- Looking back at their whole story, what's the through-line?

End with a sense of who this person fundamentally is.`,
            },
        ]);
        parts.push(part10);

        // Combine all 10 parts into one cohesive narrative
        const fullBackstory = parts
            .map((p) => this.stripCodeFence(p).trim())
            .join("\n\n");

        return fullBackstory;
    }

    // Helper: remove markdown code fences which may break JSON.parse
    private stripCodeFence(s: string) {
        if (!s) return s;
        return s
            .replace(/```json\n?/i, "")
            .replace(/```/g, "")
            .trim();
    }
}
