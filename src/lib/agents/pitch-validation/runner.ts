import { Command, INTERRUPT, isInterrupted } from "@langchain/langgraph";
import { getCoachReview, getPitchById, getPitchRun } from "@/lib/db/queries/pitches";
import { MOCK_JURY_QUESTION_COUNT } from "@/lib/skills/pitchRubric";
import { pitchValidationGraph } from "./graph";
import type { CoachDecisionResume, CoachReviewInterruptPayload, MockJuryInterruptPayload } from "./nodes";

export type PitchSessionInterrupt = MockJuryInterruptPayload | CoachReviewInterruptPayload;

export interface PitchSessionResult {
  status: "interrupted" | "completed";
  interrupt?: PitchSessionInterrupt;
}

function threadConfig(pitchId: string) {
  return { configurable: { thread_id: pitchId } };
}

function extractInterrupt(result: unknown): PitchSessionInterrupt | undefined {
  if (isInterrupted<PitchSessionInterrupt>(result)) {
    const interrupts = (result as Record<string, { value?: PitchSessionInterrupt }[]>)[INTERRUPT];
    return interrupts[0]?.value;
  }
  return undefined;
}

export async function startPitchValidationRun(pitchId: string): Promise<PitchSessionResult> {
  const pitch = await getPitchById(pitchId);
  if (!pitch) throw new Error("Pitch not found");
  const result = await pitchValidationGraph.invoke({ pitchId, locale: pitch.language }, threadConfig(pitchId));
  const interrupt = extractInterrupt(result);
  return interrupt ? { status: "interrupted", interrupt } : { status: "completed" };
}

export async function resumePitchValidationRun(
  pitchId: string,
  resumeValue: string | CoachDecisionResume
): Promise<PitchSessionResult> {
  const pending = await getPendingPitchInterrupt(pitchId);
  if (!pending) {
    return startPitchValidationRun(pitchId);
  }
  const result = await pitchValidationGraph.invoke(new Command({ resume: resumeValue }), threadConfig(pitchId));
  const interrupt = extractInterrupt(result);
  return interrupt ? { status: "interrupted", interrupt } : { status: "completed" };
}

async function getLivePitchInterrupt(pitchId: string): Promise<PitchSessionInterrupt | null> {
  const snapshot = await pitchValidationGraph.getState(threadConfig(pitchId));
  if (!snapshot.next || snapshot.next.length === 0) return null;
  const task = snapshot.tasks.find((t) => t.interrupts.length > 0);
  return (task?.interrupts[0]?.value as PitchSessionInterrupt | undefined) ?? null;
}

/**
 * The checkpointer is in-memory (see graph.ts), so it is gone after a server
 * restart and is never shared between serverless instances. Everything the
 * graph carries between nodes is also saved on the pitch_runs row as each
 * stage finishes, so when the pause point is a mock jury question or coach
 * review, rebuild the checkpoint from the database and re-run only the
 * (model-free) step up to that interrupt, instead of restarting the whole run
 * and losing what the participant or coach just submitted.
 */
async function rehydratePitchCheckpoint(pitchId: string): Promise<void> {
  const pitch = await getPitchById(pitchId);
  if (!pitch || pitch.currentRunVersion === 0) return;
  const run = await getPitchRun(pitchId, pitch.currentRunVersion);
  if (!run) return;

  const hasOpenQuestion = pitch.mockJuryLog.some((t) => t.answer === null) && pitch.mockJuryLog.length <= MOCK_JURY_QUESTION_COUNT;
  const awaitingCoach = pitch.stage === "coach_review" && !(await getCoachReview(pitchId, run.version));
  if (!(pitch.stage === "mock_jury" && hasOpenQuestion) && !awaitingCoach) return;

  await pitchValidationGraph.updateState(
    threadConfig(pitchId),
    {
      pitchId,
      locale: pitch.language,
      runVersion: run.version,
      structureResult: run.structure,
      comments: run.comments,
      coherenceRows: run.coherence,
      dimensions: run.dimensions ?? [],
    },
    awaitingCoach ? "readiness" : "coherence"
  );
  await pitchValidationGraph.invoke(null, threadConfig(pitchId));
}

export async function getPendingPitchInterrupt(pitchId: string): Promise<PitchSessionInterrupt | null> {
  const live = await getLivePitchInterrupt(pitchId);
  if (live) return live;
  await rehydratePitchCheckpoint(pitchId);
  return getLivePitchInterrupt(pitchId);
}
