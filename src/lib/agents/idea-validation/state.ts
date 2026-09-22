import { Annotation } from "@langchain/langgraph";
import type { IdeaAssessmentModelOutput } from "@/lib/schemas/idea";

// The idea record in SQLite is the durable source of truth (canvas,
// evidence, clarifications, the final assessment). This graph state only
// carries the working data that needs to flow between nodes within a single
// run — "the state machine, not the model, controls which stage the
// session is in" (reference architecture, session state machine).
export const IdeaValidationState = Annotation.Root({
  ideaId: Annotation<string>,
  locale: Annotation<"en" | "ar">,
  // Set by clarifyNode each time it runs one question; read by
  // routeAfterClarify to decide whether to loop back to "clarify" (another
  // question) or move on to "assess". See clarifyNode's comment for why
  // this has to be a graph-level self-loop rather than a while loop inside
  // one node.
  clarifyComplete: Annotation<boolean>({
    reducer: (_prev, next) => next,
    default: () => false,
  }),
  draftAssessment: Annotation<IdeaAssessmentModelOutput | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  criticalNotes: Annotation<string[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
});

export type IdeaValidationStateType = typeof IdeaValidationState.State;
