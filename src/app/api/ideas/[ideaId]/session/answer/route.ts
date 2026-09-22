import { NextResponse } from "next/server";
import { resumeIdeaValidationSession } from "@/lib/agents/idea-validation/runner";
import { toErrorResponse } from "@/lib/http/errors";

interface Params {
  params: Promise<{ ideaId: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const { ideaId } = await params;
  const body = (await request.json()) as { answer: string };
  if (!body.answer?.trim()) {
    return NextResponse.json({ error: "Answer is required" }, { status: 400 });
  }
  try {
    const result = await resumeIdeaValidationSession(ideaId, body.answer.trim());
    return NextResponse.json(result);
  } catch (err) {
    return toErrorResponse(err);
  }
}
