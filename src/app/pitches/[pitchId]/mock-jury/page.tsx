import { getPitchViewData } from "@/lib/agents/pitch-validation/viewData";
import { MockJuryPanel } from "@/components/pitch/MockJuryPanel";
import { RunAgentButton } from "@/components/pitch/RunAgentButton";
import { Card, CardBody } from "@/components/ui/Card";
import type { MockJuryInterruptPayload } from "@/lib/agents/pitch-validation/nodes";

export default async function MockJuryPage({ params }: { params: Promise<{ pitchId: string }> }) {
  const { pitchId } = await params;
  const { pitch, pendingInterrupt } = await getPitchViewData(pitchId);

  const interrupt = pendingInterrupt?.type === "mock_jury_question" ? (pendingInterrupt as MockJuryInterruptPayload) : null;

  if (!interrupt && pitch.mockJuryLog.length === 0) {
    return (
      <Card>
        <CardBody>
          <RunAgentButton pitchId={pitchId} />
        </CardBody>
      </Card>
    );
  }

  return <MockJuryPanel pitchId={pitchId} interrupt={interrupt} log={pitch.mockJuryLog} />;
}
