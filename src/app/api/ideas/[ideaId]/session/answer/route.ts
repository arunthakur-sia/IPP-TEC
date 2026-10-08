import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getIdeaById } from "@/lib/db/queries/ideas";
import { getPendingIdeaInterrupt, resumeIdeaValidationSession } from "@/lib/agents/idea-validation/runner";
import { toErrorResponse } from "@/lib/http/errors";

// Several sequential model calls per request; see README on timing.
export const maxDuration = 300;

interface Params {
  params: Promise<{ ideaId: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const { ideaId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const idea = await getIdeaById(ideaId);
  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (idea.ownerId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json()) as { answer: string };
  if (!body.answer?.trim()) {
    return NextResponse.json({ error: "Answer is required" }, { status: 400 });
  }
  try {
    const pending = await getPendingIdeaInterrupt(ideaId);
    if (pending?.type !== "clarify_question") {
      return NextResponse.json({ error: "There is no question waiting for an answer" }, { status: 409 });
    }
    const result = await resumeIdeaValidationSession(ideaId, body.answer.trim());
    return NextResponse.json(result);
  } catch (err) {
    return toErrorResponse(err);
  }
}
