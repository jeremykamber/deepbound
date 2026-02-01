import { Persona } from "../entities/Persona";

/**
 * Port for the Chat Service.
 * Defines the contract for interacting with a persona via chat.
 */
export interface IChatServicePort {
  /**
   * Gets a response from a persona based on a user message and context.
   * @param persona The persona instance we are chatting with.
   * @param message The message sent by the user.
   * @param context Additional context (e.g., current UI state, previous interactions).
   * @returns A promise that resolves to the persona's response.
   */
  getPersonaResponse(persona: Persona, message: string, context: string): Promise<string>;
}
