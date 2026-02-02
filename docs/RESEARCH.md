# Research Foundation: Deep Binding

This project is grounded in the research paper **"Deep Binding of Language Model Virtual Personas"** (Kang et al., UC Berkeley).

## Key Insights

- **Narrative Identity**: Personas internalize life stories. Detailed backstories lead to deeper binding into decision-making patterns.
- **Consistency Matters**: There is a 54% improvement in persona fidelity when using an LLM-as-critic to validate backstory coherence.
- **Length Matters**: We aim for 2,500+ word backstories to ensure deep persona binding.
- **Financial Context**: For pricing evaluation, backstories MUST reveal:
  - Spending patterns
  - ROI calculations
  - Risk tolerance
  - Financial pressures

## Applied Strategy

1. **Initial Personas**: Emphasize diverse financial profiles and decision-making styles.
2. **Backstories**: Interview-style generation (not monologue), internally consistent, and financially grounded.
3. **Validation**: LLM-as-critic checks for contradictions before using in evaluation.
4. **Judge Prompts**: LLMs evaluate pricing pages *AS* personas, not just *about* personas.
