import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { resumeIdeaValidationSession } from "@/lib/agents/idea-validation/runner";
import { toErrorResponse } from "@/lib/http/errors";
import type { IdeaVerdict } from "@/lib/types/domain";

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

  try {
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
