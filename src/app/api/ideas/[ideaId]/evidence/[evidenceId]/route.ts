import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getIdeaById, removeEvidence } from "@/lib/db/queries/ideas";

interface Params {
  params: Promise<{ ideaId: string; evidenceId: string }>;
}

export async function DELETE(_request: Request, { params }: Params) {
  const { ideaId, evidenceId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const idea = await getIdeaById(ideaId);
  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (idea.ownerId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (idea.currentAssessmentVersion > 0 || idea.clarifications.length > 0 || (idea.stage !== "intake" && idea.stage !== "clarify")) {
    return NextResponse.json({ error: "Evidence can only be removed before the validation session starts" }, { status: 409 });
  }
  await removeEvidence(ideaId, evidenceId);
  return NextResponse.json({ ok: true });
}
