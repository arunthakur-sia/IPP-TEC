import { getPitchViewData } from "@/lib/agents/pitch-validation/viewData";
import { DeckUploadPanel } from "@/components/pitch/DeckUploadPanel";
import { ParseCheckPanel } from "@/components/pitch/ParseCheckPanel";
import { PitchStudioView } from "@/components/pitch/PitchStudioView";
import { RunAgentButton } from "@/components/pitch/RunAgentButton";
import { Card, CardBody } from "@/components/ui/Card";

export default async function PitchStudioPage({ params }: { params: Promise<{ pitchId: string }> }) {
  const { pitchId } = await params;
  const { pitch, run } = await getPitchViewData(pitchId);

  if (pitch.slides.length === 0) {
    return <DeckUploadPanel pitchId={pitchId} />;
  }

  if (!pitch.parseConfirmed) {
    return <ParseCheckPanel pitchId={pitchId} slides={pitch.slides} />;
  }

  if (!run) {
    return (
      <div className="space-y-4">
        <Card>
          <CardBody>
            <RunAgentButton pitchId={pitchId} />
          </CardBody>
        </Card>
        <DeckUploadPanel pitchId={pitchId} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PitchStudioView slides={pitch.slides} comments={run.comments} />
      <details className="no-print">
        <summary className="cursor-pointer text-sm text-ink-500">Upload a revised deck</summary>
        <div className="mt-2">
          <DeckUploadPanel pitchId={pitchId} />
        </div>
      </details>
    </div>
  );
}
