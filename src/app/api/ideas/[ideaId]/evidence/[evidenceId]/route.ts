import { NextResponse } from "next/server";
import { getIdeaById, removeEvidence } from "@/lib/db/queries/ideas";

interface Params {
  params: Promise<{ ideaId: string; evidenceId: string }>;
}

export async function DELETE(_request: Request, { params }: Params) {
  const { ideaId, evidenceId } = await params;
  const idea = await getIdeaById(ideaId);
  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (idea.stage !== "intake" || idea.currentAssessmentVersion > 0) {
    return NextResponse.json({ error: "Evidence can only be removed before the validation session starts" }, { status: 409 });
  }
  await removeEvidence(ideaId, evidenceId);
  return NextResponse.json({ ok: true });
}
