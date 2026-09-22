import { parsePdfDeck } from "./pdf";
import { parsePptx } from "./pptx";
import type { Slide } from "@/lib/types/domain";

export class UnsupportedDeckFormatError extends Error {
  constructor(fileName: string) {
    super(`Unsupported deck format for "${fileName}" — upload a .pdf or .pptx file.`);
    this.name = "UnsupportedDeckFormatError";
  }
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Converts an uploaded deck to structured slides: number, title, body,
 * notes, word count. Image descriptions are left null in this build — the
 * plan calls for descriptions "produced by the model from the rendered
 * slide image," which needs a slide-to-image rendering step (e.g.
 * LibreOffice headless or a rendering service) that isn't wired up here.
 * To add it: render each slide to an image, then call runStructured with
 * FAST_MODEL and lib/schemas/pitch.ts's slideDescriptionSchema per slide.
 */
export async function parseDeck(fileName: string, buffer: Buffer): Promise<Slide[]> {
  const lower = fileName.toLowerCase();
  let raw: { title: string; body: string; notes: string }[];

  if (lower.endsWith(".pdf")) {
    raw = await parsePdfDeck(buffer);
  } else if (lower.endsWith(".pptx")) {
    raw = await parsePptx(buffer);
  } else {
    throw new UnsupportedDeckFormatError(fileName);
  }

  return raw.map((s, i) => ({
    index: i,
    title: s.title,
    body: s.body,
    notes: s.notes,
    imageDescription: null,
    wordCount: wordCount(`${s.title} ${s.body}`),
  }));
}
