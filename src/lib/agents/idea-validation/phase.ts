import type { Idea, MentorReview } from "@/lib/types/domain";

/** Maps an idea's session stage onto the program's 7 numbered phases (see plan §"Where the agents sit in the program"). */
export function phaseForIdea(idea: Idea, mentorReview: MentorReview | null): number {
  if (idea.stage === "closed" && mentorReview) {
    return mentorReview.decision === "ready_to_prototype" ? 4 : 3;
  }
  if (idea.stage === "intake" && idea.currentAssessmentVersion === 0) return 2;
  return 3;
}
