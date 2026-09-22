import { notFound } from "next/navigation";
import { getIdeaAssessment, getIdeaById } from "@/lib/db/queries/ideas";
import { getPendingIdeaInterrupt } from "@/lib/agents/idea-validation/runner";
import { requireUser } from "@/lib/auth/session";
import { IdeaOverviewClient } from "@/components/idea/IdeaOverviewClient";

export default async function IdeaOverviewPage({ params }: { params: Promise<{ ideaId: string }> }) {
  const { ideaId } = await params;
  const idea = await getIdeaById(ideaId);
  if (!idea) notFound();

  const [currentUser, pendingInterrupt] = await Promise.all([requireUser(), getPendingIdeaInterrupt(ideaId)]);
  const assessment = idea.currentAssessmentVersion > 0 ? await getIdeaAssessment(idea.id, idea.currentAssessmentVersion) : null;

  return <IdeaOverviewClient idea={idea} assessment={assessment} pendingInterrupt={pendingInterrupt} currentUser={currentUser} />;
}
