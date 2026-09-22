import { getPitchViewData } from "@/lib/agents/pitch-validation/viewData";
import { CoherenceReport } from "@/components/pitch/CoherenceReport";
import { RunAgentButton } from "@/components/pitch/RunAgentButton";
import { Card, CardBody } from "@/components/ui/Card";

export default async function CoherencePage({ params }: { params: Promise<{ pitchId: string }> }) {
  const { pitchId } = await params;
  const { run } = await getPitchViewData(pitchId);

  if (!run) {
    return (
      <Card>
        <CardBody>
          <RunAgentButton pitchId={pitchId} />
        </CardBody>
      </Card>
    );
  }

  return <CoherenceReport rows={run.coherence} />;
}
