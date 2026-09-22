// The working credential for this build is a key on an internal
// OpenAI-compatible LLM gateway (LiteLLM, at litellm.heka.ai), scoped to
// exactly one model alias: "bedrock-opus-4.6" (itself a gateway alias for
// Claude Opus 4.6 on Amazon Bedrock — see lib/llm/client.ts). Confirmed
// working directly against the gateway: chat completions, and structured
// (json_schema) output.
//
// The plan's "model usage pattern" calls for a fast model on interactive
// turns and a capable model on assessment passes. This key has access to
// only one model, so both constants point at it for now — swap FAST_MODEL
// to a quicker alias the moment this key (or another one) has access to
// one, with no other code changes needed.
export const GATEWAY_BASE_URL = process.env.LLM_GATEWAY_BASE_URL || "https://litellm.heka.ai/v1";

export const CAPABLE_MODEL = process.env.LLM_CAPABLE_MODEL || "bedrock-opus-4.6";
export const FAST_MODEL = process.env.LLM_FAST_MODEL || "bedrock-opus-4.6";

// Claude Opus 4.6's own output cap (128K tokens) — the highest this model
// supports, regardless of how small any one call's schema usually is.
export const MAX_OUTPUT_TOKENS = 128_000;
