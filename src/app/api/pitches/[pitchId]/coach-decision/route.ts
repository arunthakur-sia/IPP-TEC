import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { resumePitchValidationRun } from "@/lib/agents/pitch-validation/runner";
import { toErrorResponse } from "@/lib/http/errors";
import type { CoachReview } from "@/lib/types/domain";

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

  try {
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
