import { NextResponse } from "next/server";
import { resumePitchValidationRun } from "@/lib/agents/pitch-validation/runner";
import { toErrorResponse } from "@/lib/http/errors";

interface Params {
  params: Promise<{ pitchId: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const { pitchId } = await params;
  const body = (await request.json()) as { answer: string };
  if (!body.answer?.trim()) {
    return NextResponse.json({ error: "Answer is required" }, { status: 400 });
  }
  try {
    const result = await resumePitchValidationRun(pitchId, body.answer.trim());
    return NextResponse.json(result);
  } catch (err) {
    return toErrorResponse(err);
  }
}
