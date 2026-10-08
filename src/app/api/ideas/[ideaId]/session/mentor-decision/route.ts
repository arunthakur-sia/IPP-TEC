import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { getPendingIdeaInterrupt, resumeIdeaValidationSession } from "@/lib/agents/idea-validation/runner";
import { toErrorResponse } from "@/lib/http/errors";
import type { IdeaVerdict } from "@/lib/types/domain";

// Several sequential model calls per request; see README on timing.
export const maxDuration = 300;

interface Params {
  params: Promise<{ ideaId: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const { ideaId } = await params;
  let mentor;
  try {
    mentor = await requireRole("mentor");
  } catch {
    return NextResponse.json({ error: "Only a mentor can confirm a gate decision" }, { status: 403 });
  }

  const body = (await request.json()) as { decision: IdeaVerdict; reason: string };
  if (!body.decision || !body.reason?.trim()) {
    return NextResponse.json({ error: "decision and reason are required" }, { status: 400 });
  }

  if (!["ready_to_prototype", "refine_and_resubmit", "pivot"].includes(body.decision)) {
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  }

  try {
    const pending = await getPendingIdeaInterrupt(ideaId);
    if (pending?.type !== "mentor_review_pending") {
      return NextResponse.json({ error: "This idea is not waiting for a mentor decision" }, { status: 409 });
    }
    const result = await resumeIdeaValidationSession(ideaId, {
      mentorId: mentor.id,
      decision: body.decision,
      reason: body.reason.trim(),
    });
    return NextResponse.json(result);
  } catch (err) {
    return toErrorResponse(err);
  }
}
