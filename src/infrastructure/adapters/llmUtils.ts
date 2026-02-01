/**
 * Utility function to strip markdown code fences from a string.
 * This is particularly useful when parsing JSON responses from LLMs that
 * might wrap the JSON in ```json blocks.
 * 
 * @param s - The string to strip code fences from.
 * @returns The cleaned string.
 */
export function stripCodeFence(s: string): string {
  if (!s) return s;
  return s
    .replace(/```json\n?/i, "")
    .replace(/```\n?/g, "")
    .trim();
}

/**
 * Robustly extracts the first JSON object found within a string.
 * Helps handle cases where LLMs prepend/append conversational text.
 */
export function extractJson(s: string): string {
  const firstOpen = s.indexOf('{');
  const lastClose = s.lastIndexOf('}');
  if (firstOpen === -1 || lastClose === -1 || lastClose < firstOpen) {
    return s; // Fallback to original
  }
  return s.slice(firstOpen, lastClose + 1);
}
