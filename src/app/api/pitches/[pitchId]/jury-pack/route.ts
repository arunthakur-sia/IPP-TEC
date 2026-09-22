import { NextResponse } from "next/server";
import { getCoachReview, getPitchById, getPitchRun } from "@/lib/db/queries/pitches";
import { getIdeaAssessment, getIdeaById, getLatestPrototypePlan } from "@/lib/db/queries/ideas";

interface Params {
  params: Promise<{ pitchId: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const { pitchId } = await params;
  const pitch = await getPitchById(pitchId);
  if (!pitch) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const run = pitch.currentRunVersion > 0 ? await getPitchRun(pitch.id, pitch.currentRunVersion) : null;
  const coachReview = run ? await getCoachReview(pitch.id, run.version) : null;

  if (!coachReview || coachReview.decision !== "confirmed") {
    return NextResponse.json({ error: "Jury pack is available only after coach confirmation" }, { status: 403 });
  }

  const idea = (await getIdeaById(pitch.ideaId))!;
  const [assessment, plan] = await Promise.all([
    idea.currentAssessmentVersion > 0 ? getIdeaAssessment(idea.id, idea.currentAssessmentVersion) : Promise.resolve(null),
    getLatestPrototypePlan(idea.id),
  ]);

  return NextResponse.json({ pitch, run, idea, assessment, plan });
}
