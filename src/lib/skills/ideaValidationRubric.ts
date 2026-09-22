// TEC Idea Validation rubric — loaded on demand as a skill by Agent 1 and by
// the deterministic scoring engine (lib/scoring/ideaVerdict.ts). Anchors are
// reproduced from the program's rubric so the model rates against the same
// written anchors a mentor would use.

import type { IdeaDimensionName } from "@/lib/types/domain";

export interface RubricDimension {
  name: IdeaDimensionName;
  weight: number; // fraction, sums to 1
  rating1Anchor: string;
  rating5Anchor: string;
}

export const ideaValidationRubric: RubricDimension[] = [
  {
    name: "problem_clarity",
    weight: 0.2,
    rating1Anchor:
      "Problem stated as a solution or as a vague pain; no affected user named",
    rating5Anchor:
      "Specific problem, named user group, frequency and cost of the problem evidenced",
  },
  {
    name: "user_evidence",
    weight: 0.2,
    rating1Anchor: "No contact with affected users",
    rating5Anchor:
      "Five or more user conversations or usage data confirming the problem and current workaround",
  },
  {
    name: "strategic_fit",
    weight: 0.2,
    rating1Anchor:
      "No link to a TEC priority or an area TEC explicitly does not pursue",
    rating5Anchor:
      "Direct contribution to a named TEC priority with a plausible sponsor",
  },
  {
    name: "value_viability",
    weight: 0.15,
    rating1Anchor: "Value not articulated or purely qualitative with no logic",
    rating5Anchor:
      "Value mechanism explained (time, cost, revenue, risk, experience) with an order-of-magnitude estimate and assumptions listed",
  },
  {
    name: "feasibility",
    weight: 0.15,
    rating1Anchor:
      "Depends on data, systems or approvals that are unavailable within the program",
    rating5Anchor:
      "Can be prototyped with no-code tools and existing data within the phase 4 window",
  },
  {
    name: "novelty_risk",
    weight: 0.1,
    rating1Anchor: "Existing TEC or market solution ignored; no risks identified",
    rating5Anchor:
      "Differentiation from existing solutions stated; top three risks named with mitigation",
  },
];

export const ideaVerdictThresholds = {
  readyToPrototype: { min: 3.6, max: 5.0 },
  refineAndResubmit: { min: 2.6, max: 3.5 },
  pivot: { min: 1.0, max: 2.5 },
};

// TEC's strategic priorities for the current cohort. Placeholder content —
// replace with the priorities the program office signs off on during
// Stage 0 (Foundations and calibration) of the build plan.
export const tecStrategicPriorities: { title: string; description: string }[] = [
  {
    title: "Government service efficiency",
    description:
      "Reducing time, cost or friction in a service the Executive Council or its entities deliver to residents, businesses or government staff.",
  },
  {
    title: "Data-driven decision making",
    description:
      "Making Dubai government data more usable for planning, oversight or public reporting.",
  },
  {
    title: "Resident and business experience",
    description:
      "Improving a specific, measurable moment in how residents or businesses interact with Dubai government entities.",
  },
  {
    title: "Sustainability and resource efficiency",
    description:
      "Reducing waste, energy, or resource use in a government operation or a program TEC oversees.",
  },
  {
    title: "Innovation capability of government staff",
    description:
      "Building a tool, workflow or capability that helps government teams innovate faster on their own.",
  },
];
