import { notFound } from "next/navigation";
import {
  getIdeaAssessment,
  getIdeaById,
  getLatestPrototypePlan,
  getMentorReview,
} from "@/lib/db/queries/ideas";
import { getPendingIdeaInterrupt } from "@/lib/agents/idea-validation/runner";
import { requireUser } from "@/lib/auth/session";
import { IdeaPlanClient } from "@/components/idea/IdeaPlanClient";

export default async function IdeaPlanPage({ params }: { params: Promise<{ ideaId: string }> }) {
  const { ideaId } = await params;
  const idea = await getIdeaById(ideaId);
  if (!idea) notFound();

  const [currentUser, pendingInterrupt, prototypePlan] = await Promise.all([
    requireUser(),
    getPendingIdeaInterrupt(ideaId),
    getLatestPrototypePlan(idea.id),
  ]);
  const assessment = idea.currentAssessmentVersion > 0 ? await getIdeaAssessment(idea.id, idea.currentAssessmentVersion) : null;
  const mentorReview = assessment ? await getMentorReview(idea.id, assessment.version) : null;

  return (
    <IdeaPlanClient
      idea={idea}
      assessment={assessment}
      prototypePlan={prototypePlan}
      mentorReview={mentorReview}
      pendingInterrupt={pendingInterrupt}
      isMentor={currentUser.role === "mentor"}
    />
  );
}
