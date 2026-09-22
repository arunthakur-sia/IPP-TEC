import { StateGraph, MemorySaver, START, END } from "@langchain/langgraph";
import { IdeaValidationState } from "./state";
import {
  assessNode,
  clarifyNode,
  closedNode,
  critiqueNode,
  intakeNode,
  mentorReviewNode,
  prototypePlanNode,
  routeAfterClarify,
  routeAfterVerdict,
  verdictNode,
} from "./nodes";

// Mirrors the plan's own state machine exactly:
// intake -> clarify -> assess -> critique -> verdict -> prototype_plan -> mentor_review -> closed
// (Pivot verdicts skip prototype_plan and go straight to mentor_review.)
// "clarify" is a self-loop — one question per visit, see clarifyNode's comment.
const builder = new StateGraph(IdeaValidationState)
  .addNode("intake", intakeNode)
  .addNode("clarify", clarifyNode)
  .addNode("assess", assessNode)
  .addNode("critique", critiqueNode)
  .addNode("verdict", verdictNode)
  .addNode("prototype_plan", prototypePlanNode)
  .addNode("mentor_review", mentorReviewNode)
  .addNode("closed", closedNode)
  .addEdge(START, "intake")
  .addEdge("intake", "clarify")
  .addConditionalEdges("clarify", routeAfterClarify, ["clarify", "assess"])
  .addEdge("assess", "critique")
  .addEdge("critique", "verdict")
  .addConditionalEdges("verdict", routeAfterVerdict, ["prototype_plan", "mentor_review"])
  .addEdge("prototype_plan", "mentor_review")
  .addEdge("mentor_review", "closed")
  .addEdge("closed", END);

// A process-lifetime checkpointer: durable domain data (the idea record,
// every assessment/plan/review version) lives in Supabase regardless, so
// this only needs to survive long enough to carry a session's
// `interrupt()` pauses across HTTP requests within the same dev/prod
// server process. See lib/agents/idea-validation/runner.ts for how a lost
// checkpoint (e.g. after a server restart) is recovered from the Supabase
// state instead.
const checkpointer = new MemorySaver();

export const ideaValidationGraph = builder.compile({ checkpointer });
