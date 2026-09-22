import { Annotation } from "@langchain/langgraph";
import type { CoherenceRow, PitchDimensionRating, SlideComment, StructureResult } from "@/lib/types/domain";

// As with the idea-validation graph, the pitch record in SQLite is the
// durable source of truth. This state carries partial results between the
// structure/content/coherence/readiness nodes within a single run, which
// are upserted into one PitchRun row (keyed by runVersion) as each stage
// finishes, so the UI can show structure/content/coherence before mock
// jury and readiness scoring are done.
export const PitchValidationState = Annotation.Root({
  pitchId: Annotation<string>,
  locale: Annotation<"en" | "ar">,
  // Reserved once (in structureNode) and reused by every later node so
  // they all upsert the same pitch_runs row instead of creating new ones.
  runVersion: Annotation<number | null>({ reducer: (_p, n) => n, default: () => null }),
  // Named structureResult/coherenceRows, not structure/coherence — those
  // names collide with this graph's node names, which LangGraph rejects.
  structureResult: Annotation<StructureResult | null>({ reducer: (_p, n) => n, default: () => null }),
  comments: Annotation<SlideComment[]>({ reducer: (_p, n) => n, default: () => [] }),
  coherenceRows: Annotation<CoherenceRow[]>({ reducer: (_p, n) => n, default: () => [] }),
  dimensions: Annotation<PitchDimensionRating[]>({ reducer: (_p, n) => n, default: () => [] }),
});

export type PitchValidationStateType = typeof PitchValidationState.State;
