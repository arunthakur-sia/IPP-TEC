import type { IdeaCanvas, TeamProfile } from "@/lib/types/domain";

const MIN_FIELD_LENGTH = 20;

export interface CanvasCompleteness {
  complete: boolean;
  missingFields: string[];
}

/**
 * "The application checks canvas completeness; fields under a minimum
 * length are flagged and must be completed before the session starts. No
 * model call yet." — Agent 1 process flow, Intake.
 */
export function checkCanvasCompleteness(canvas: IdeaCanvas, team: TeamProfile): CanvasCompleteness {
  const missingFields: string[] = [];
  const textFields: (keyof IdeaCanvas)[] = [
    "problem",
    "affectedUsers",
    "currentWorkaround",
    "proposedSolution",
    "expectedValue",
    "knownRisks",
  ];
  for (const field of textFields) {
    const value = canvas[field];
    if (typeof value === "string" && value.trim().length < MIN_FIELD_LENGTH) {
      missingFields.push(field);
    }
  }
  if (team.size < 1) missingFields.push("team.size");

  return { complete: missingFields.length === 0, missingFields };
}

export const CANVAS_MIN_FIELD_LENGTH = MIN_FIELD_LENGTH;
