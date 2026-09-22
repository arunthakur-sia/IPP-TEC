import { Command, INTERRUPT, isInterrupted } from "@langchain/langgraph";
import { getPitchById } from "@/lib/db/queries/pitches";
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

export async function getPendingPitchInterrupt(pitchId: string): Promise<PitchSessionInterrupt | null> {
  const snapshot = await pitchValidationGraph.getState(threadConfig(pitchId));
  if (!snapshot.next || snapshot.next.length === 0) return null;
  const task = snapshot.tasks.find((t) => t.interrupts.length > 0);
  return (task?.interrupts[0]?.value as PitchSessionInterrupt | undefined) ?? null;
}
