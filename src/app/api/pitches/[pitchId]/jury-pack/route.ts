import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getCoachReview, getPitchById, getPitchRun } from "@/lib/db/queries/pitches";
import { getIdeaAssessment, getIdeaById, getLatestPrototypePlan } from "@/lib/db/queries/ideas";

interface Params {
  params: Promise<{ pitchId: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const { pitchId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const pitch = await getPitchById(pitchId);
  if (!pitch) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Same audience as the /jury/[pitchId] page.
  if (!["jury", "coach", "program_office"].includes(user.role) && pitch.ownerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
