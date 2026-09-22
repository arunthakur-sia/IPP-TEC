import { getPitchViewData } from "@/lib/agents/pitch-validation/viewData";
import { StructureMap } from "@/components/pitch/StructureMap";
import { RunAgentButton } from "@/components/pitch/RunAgentButton";
import { Card, CardBody } from "@/components/ui/Card";

export default async function StructurePage({ params }: { params: Promise<{ pitchId: string }> }) {
  const { pitchId } = await params;
  const { pitch, run } = await getPitchViewData(pitchId);

  if (!run) {
    return (
      <Card>
        <CardBody>
          <RunAgentButton pitchId={pitchId} />
        </CardBody>
      </Card>
    );
  }

  return <StructureMap structure={run.structure} slides={pitch.slides} />;
}
