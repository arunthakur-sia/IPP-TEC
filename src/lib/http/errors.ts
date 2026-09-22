import { NextResponse } from "next/server";
import { LlmNotConfiguredError } from "@/lib/llm/client";

export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof LlmNotConfiguredError) {
    return NextResponse.json({ error: err.message, code: "llm_not_configured" }, { status: 503 });
  }
  const message = err instanceof Error ? err.message : "Unexpected error";
  console.error(err);
  return NextResponse.json({ error: message }, { status: 500 });
}
