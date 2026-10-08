import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getIdeaById, addEvidence } from "@/lib/db/queries/ideas";
import { runFollowUpCheckIn } from "@/lib/agents/idea-validation/followUp";
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

  const body = (await request.json()) as { updateText: string };
  if (!body.updateText?.trim()) {
    return NextResponse.json({ error: "updateText is required" }, { status: 400 });
  }

  let result;
  try {
    result = await runFollowUpCheckIn(idea, body.updateText.trim());
  } catch (err) {
    return toErrorResponse(err);
  }

  await addEvidence(
    ideaId,
    "note",
    `[Weekly check-in] ${body.updateText.trim()}\n\nAgent read: ${result.progressAssessment}${
      result.riskiestAssumptionChanged ? `\nRiskiest assumption changed: ${result.updatedRiskiestAssumption}` : ""
    }\nRecommendation: ${result.recommendation}`
  );

  return NextResponse.json({ result });
}
