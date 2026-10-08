import Link from "next/link";
import { getPitchViewData } from "@/lib/agents/pitch-validation/viewData";
import { ReadinessDashboard } from "@/components/pitch/ReadinessDashboard";
import { RunAgentButton } from "@/components/pitch/RunAgentButton";
import { DeckUploadPanel } from "@/components/pitch/DeckUploadPanel";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";

export default async function ReadinessPage({ params }: { params: Promise<{ pitchId: string }> }) {
  const { pitchId } = await params;
  const { pitch, run, allRuns, coachReview } = await getPitchViewData(pitchId);

  if (!run) {
    return (
      <Card>
        <CardBody>
          <RunAgentButton pitchId={pitchId} />
        </CardBody>
      </Card>
    );
  }

  // Structure/content/coherence are saved as soon as they're ready, but
  // readiness scoring only runs after all mock jury turns are answered.
  const { verdict, readinessScore, dimensions, actions } = run;
  if (verdict === null || readinessScore === null || !dimensions || !actions) {
    return (
      <Card>
        <CardBody className="text-sm text-ink-500">
          {"The agent hasn't finished mock jury yet — readiness is scored right after. Check the Mock Jury tab."}
        </CardBody>
      </Card>
    );
  }

  // Re-running on an unchanged deck only adds scoring noise, so require a newer upload first
  // (the run route enforces the same check server-side).
  const needsRevisedDeck = pitch.deckVersion <= run.deckVersion;
  const needsParseConfirm = !needsRevisedDeck && !pitch.parseConfirmed;

  return (
    <div className="space-y-4">
      <ReadinessDashboard
        pitchId={pitchId}
        run={{ ...run, verdict, readinessScore, dimensions, actions }}
        allRuns={allRuns}
        coachReview={coachReview}
      />
      {needsRevisedDeck ? (
        <Card>
          <CardHeader>
            <CardTitle>Upload a revised deck to re-run</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-sm text-ink-600">
              Re-running scores the deck from scratch with fresh model calls — on an unchanged deck that just adds noise, not
              improvement. Upload your updated deck below, then re-run once the changes are confirmed.
            </p>
            <DeckUploadPanel pitchId={pitchId} />
          </CardBody>
        </Card>
      ) : needsParseConfirm ? (
        <Card>
          <CardBody className="text-sm text-ink-600">
            A revised deck was uploaded — confirm the parsed slides on the{" "}
            <Link href={`/pitches/${pitchId}/studio`} className="text-accent-700 underline">
              Studio tab
            </Link>{" "}
            before re-running.
          </CardBody>
        </Card>
      ) : (
        <RunAgentButton pitchId={pitchId} isRerun />
      )}
    </div>
  );
}
