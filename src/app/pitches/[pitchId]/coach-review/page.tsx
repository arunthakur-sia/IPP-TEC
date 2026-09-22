import { getPitchViewData } from "@/lib/agents/pitch-validation/viewData";
import { requireUser } from "@/lib/auth/session";
import { CoachReviewDecided, CoachReviewPending } from "@/components/pitch/CoachReviewPanel";
import { RunAgentButton } from "@/components/pitch/RunAgentButton";
import { Card, CardBody } from "@/components/ui/Card";

export default async function CoachReviewPage({ params }: { params: Promise<{ pitchId: string }> }) {
  const { pitchId } = await params;
  const { run, coachReview, pendingInterrupt } = await getPitchViewData(pitchId);
  const user = await requireUser();

  if (!run) {
    return (
      <Card>
        <CardBody>
          <RunAgentButton pitchId={pitchId} />
        </CardBody>
      </Card>
    );
  }

  if (coachReview) {
    return <CoachReviewDecided pitchId={pitchId} review={coachReview} />;
  }

  if (pendingInterrupt?.type === "coach_review_pending") {
    return <CoachReviewPending pitchId={pitchId} canDecide={user.role === "coach"} />;
  }

  return (
    <Card>
      <CardBody className="text-sm text-ink-500">
        {"The agent hasn't reached coach review yet — check the Readiness tab."}
      </CardBody>
    </Card>
  );
}
