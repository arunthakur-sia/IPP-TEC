import OpenAI from "openai";
import { GATEWAY_BASE_URL } from "./models";

declare global {
  var __tecLlmClient: OpenAI | undefined;
}

export class LlmNotConfiguredError extends Error {
  constructor() {
    super("LLM gateway credentials are not configured. Set LLM_GATEWAY_API_KEY in .env.local.");
    this.name = "LlmNotConfiguredError";
  }
}

/**
 * Client for the OpenAI-compatible LiteLLM gateway (see models.ts). Never
 * hardcoded — reads the key from the environment and throws a clear,
 * typed error if it's missing, same contract the rest of the app expects.
 */
export function getLlmClient(): OpenAI {
  if (!globalThis.__tecLlmClient) {
    const apiKey = process.env.LLM_GATEWAY_API_KEY;
    if (!apiKey) throw new LlmNotConfiguredError();
    globalThis.__tecLlmClient = new OpenAI({ apiKey, baseURL: GATEWAY_BASE_URL });
  }
  return globalThis.__tecLlmClient;
}

export function assertLlmConfigured(): void {
  if (!process.env.LLM_GATEWAY_API_KEY) {
    throw new LlmNotConfiguredError();
  }
}
