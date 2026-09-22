import { NextResponse } from "next/server";
import { getIdeaById, addEvidence } from "@/lib/db/queries/ideas";
import { runFollowUpCheckIn } from "@/lib/agents/idea-validation/followUp";
import { toErrorResponse } from "@/lib/http/errors";

interface Params {
  params: Promise<{ ideaId: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const { ideaId } = await params;
  const idea = await getIdeaById(ideaId);
  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
