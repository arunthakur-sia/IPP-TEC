// Prototype fidelity ladder — a skill file the program office can extend
// without touching any prompt. The agent works down this ladder and stops
// at the first rung that can test the riskiest assumption.

export interface PrototypeRung {
  rung: 1 | 2 | 3 | 4 | 5;
  type: string;
  typicalTools: string[];
  tests: string;
  effortTeamDays: { min: number; max: number };
}

export const prototypeCatalogue: PrototypeRung[] = [
  {
    rung: 1,
    type: "Storyboard or one-page concept with a fake sign-up",
    typicalTools: ["Slides", "Canva", "a simple form"],
    tests: "Interest and desirability",
    effortTeamDays: { min: 1, max: 2 },
  },
  {
    rung: 2,
    type: "Clickable mockup of the core flow",
    typicalTools: ["Figma", "Balsamiq"],
    tests: "Usability and comprehension of the flow",
    effortTeamDays: { min: 3, max: 5 },
  },
  {
    rung: 3,
    type: "No-code working prototype with real or sample data",
    typicalTools: ["Power Apps", "Glide", "Softr", "Airtable", "Power Automate"],
    tests: "Value delivered in a real task",
    effortTeamDays: { min: 5, max: 10 },
  },
  {
    rung: 4,
    type: "AI-assisted demo (for ideas that rely on language or documents)",
    typicalTools: ["Claude project or app built on the API, connected to sample documents"],
    tests: "Whether the AI output is good enough for the user",
    effortTeamDays: { min: 3, max: 8 },
  },
  {
    rung: 5,
    type: "Concierge or manual pilot behind a simple front end",
    typicalTools: ["Forms", "spreadsheets", "a human doing the work"],
    tests: "Operational viability before automation",
    effortTeamDays: { min: 5, max: 10 },
  },
];
