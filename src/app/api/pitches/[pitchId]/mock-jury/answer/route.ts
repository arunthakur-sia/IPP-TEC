import { NextResponse } from "next/server";
import { requirePitchOwner } from "@/lib/http/pitchAccess";
import { getPendingPitchInterrupt, resumePitchValidationRun } from "@/lib/agents/pitch-validation/runner";
import { toErrorResponse } from "@/lib/http/errors";

// Several sequential model calls per request; see README on timing.
export const maxDuration = 300;

interface Params {
  params: Promise<{ pitchId: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const { pitchId } = await params;
  const access = await requirePitchOwner(pitchId);
  if ("response" in access) return access.response;

  const body = (await request.json()) as { answer: string };
  if (!body.answer?.trim()) {
    return NextResponse.json({ error: "Answer is required" }, { status: 400 });
  }
  try {
    const pending = await getPendingPitchInterrupt(pitchId);
    if (pending?.type !== "mock_jury_question") {
      return NextResponse.json({ error: "There is no jury question waiting for an answer" }, { status: 409 });
    }
    const result = await resumePitchValidationRun(pitchId, body.answer.trim());
    return NextResponse.json(result);
  } catch (err) {
    return toErrorResponse(err);
  }
}
