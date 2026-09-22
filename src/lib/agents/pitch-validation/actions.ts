import { pitchDimensionLabels, label } from "@/lib/skills/glossary";
import type { CoherenceRow, PitchDimensionRating, ReadinessAction, SlideComment } from "@/lib/types/domain";

/**
 * "The team receives a prioritised action list of at most ten items" —
 * derived deterministically from what the model already found (comments,
 * coherence flags, dimension ratings) rather than a separate model call,
 * so the list can never drift from the comments and flags it summarizes.
 */
export function deriveActions(
  comments: SlideComment[],
  coherence: CoherenceRow[],
  dimensions: PitchDimensionRating[],
  locale: "en" | "ar"
): ReadinessAction[] {
  const items: { text: string; link: string; weight: number }[] = [];

  for (const row of coherence) {
    if (row.status === "overstated" || row.status === "unsupported") {
      items.push({
        text: `Fix a ${row.status} claim on slide ${row.slide + 1}: "${row.claim}"`,
        link: `slide:${row.slide}`,
        weight: 0,
      });
    }
  }

  for (const c of comments.filter((c) => c.priority === "high")) {
    items.push({ text: `${c.issue} — ${c.rewrite}`, link: `slide:${c.slide}`, weight: 1 });
  }

  for (const dim of dimensions.filter((d) => d.rating < 3)) {
    items.push({
      text: `Strengthen ${label(pitchDimensionLabels[dim.name], locale)}: ${dim.anchor}`,
      link: `slide:0`,
      weight: 2,
    });
  }

  for (const c of comments.filter((c) => c.priority === "medium")) {
    items.push({ text: `${c.issue} — ${c.rewrite}`, link: `slide:${c.slide}`, weight: 3 });
  }

  items.sort((a, b) => a.weight - b.weight);

  return items.slice(0, 10).map((item, i) => ({ priority: i + 1, text: item.text, link: item.link, done: false }));
}
