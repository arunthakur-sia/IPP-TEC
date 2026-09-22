import { ideaDimensionLabels, label } from "@/lib/skills/glossary";
import type { IdeaAssessment, Locale, PrototypePlan } from "@/lib/types/domain";

/**
 * The mentor brief is derived deterministically from the already-computed
 * assessment rather than a separate model call: everything a mentor needs
 * (top reasons, the weakest dimensions, open questions, the prototype ask)
 * already exists in structured form, so composing it in code keeps the
 * brief's wording perfectly consistent with the scorecard the participant
 * sees and avoids one more model round trip on the mentor's critical path.
 */
export function derivePointsToProbe(assessment: IdeaAssessment, plan: PrototypePlan | null, locale: Locale): string[] {
  const weakest = [...assessment.dimensions]
    .sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0))
    .slice(0, 3);

  const points: string[] = [];
  for (const dim of weakest) {
    const dimLabel = label(ideaDimensionLabels[dim.name], locale);
    const question = dim.openQuestions[0];
    if (question) {
      points.push(`${dimLabel}: ${question}`);
    } else if (dim.rating !== null && dim.rating <= 2) {
      points.push(`${dimLabel} was rated low (${dim.rating}/5) — probe whether the team agrees.`);
    }
  }

  if (plan) {
    points.push(
      `Confirm the team can realistically resource the ${plan.primary.type.toLowerCase()} prototype in the plan (${plan.primary.effortTeamDays.min}-${plan.primary.effortTeamDays.max} team-days).`
    );
  }

  if (assessment.assumptionsToVerify.length > 0) {
    points.push(`Unverified assumption to check: ${assessment.assumptionsToVerify[0]}`);
  }

  return points.slice(0, 6);
}
