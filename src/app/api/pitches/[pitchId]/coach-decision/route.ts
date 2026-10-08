import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { getPendingPitchInterrupt, resumePitchValidationRun } from "@/lib/agents/pitch-validation/runner";
import { toErrorResponse } from "@/lib/http/errors";
import type { CoachReview } from "@/lib/types/domain";

// Several sequential model calls per request; see README on timing.
export const maxDuration = 300;

interface Params {
  params: Promise<{ pitchId: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const { pitchId } = await params;
  let coach;
  try {
    coach = await requireRole("coach");
  } catch {
    return NextResponse.json({ error: "Only a coach can confirm Demo Day readiness" }, { status: 403 });
  }

  const body = (await request.json()) as { decision: CoachReview["decision"]; reason: string };
  if (!body.decision || !body.reason?.trim()) {
    return NextResponse.json({ error: "decision and reason are required" }, { status: 400 });
  }

  if (body.decision !== "confirmed" && body.decision !== "rehearse_again") {
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  }

  try {
    const pending = await getPendingPitchInterrupt(pitchId);
    if (pending?.type !== "coach_review_pending") {
      return NextResponse.json({ error: "This pitch is not waiting for a coach decision" }, { status: 409 });
    }
    const result = await resumePitchValidationRun(pitchId, {
      coachId: coach.id,
      decision: body.decision,
      reason: body.reason.trim(),
    });
    return NextResponse.json(result);
  } catch (err) {
    return toErrorResponse(err);
  }
}
