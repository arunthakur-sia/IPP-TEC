import { NextResponse } from "next/server";
import { requirePitchOwner } from "@/lib/http/pitchAccess";
import { getPitchById, saveUploadedDeck, setPitchStage } from "@/lib/db/queries/pitches";
import { parseDeck, UnsupportedDeckFormatError } from "@/lib/parsing/deckParser";

const MAX_DECK_BYTES = 4 * 1024 * 1024;

interface Params {
  params: Promise<{ pitchId: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const { pitchId } = await params;
  const access = await requirePitchOwner(pitchId);
  if ("response" in access) return access.response;

  const formData = await request.formData();
  const file = formData.get("deck");
  const script = formData.get("script");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A deck file is required" }, { status: 400 });
  }

  // Vercel request bodies cap out around 4.5 MB.
  if (file.size > MAX_DECK_BYTES) {
    return NextResponse.json({ error: "Deck is too large (max 4 MB)" }, { status: 413 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());

  let slides;
  try {
    slides = await parseDeck(file.name, buffer);
  } catch (err) {
    if (err instanceof UnsupportedDeckFormatError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Could not read this file. Check that it is a valid, unprotected PDF or PPTX." }, { status: 400 });
  }
  if (slides.length === 0) {
    return NextResponse.json({ error: "No slides found in this file" }, { status: 400 });
  }

  await saveUploadedDeck(pitchId, file.name, slides, typeof script === "string" && script.trim() ? script.trim() : null);
  await setPitchStage(pitchId, "parse_check");

  return NextResponse.json({ pitch: await getPitchById(pitchId) });
}
