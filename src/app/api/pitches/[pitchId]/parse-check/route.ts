import { NextResponse } from "next/server";
import { requirePitchOwner } from "@/lib/http/pitchAccess";
import { confirmParse, getPitchById } from "@/lib/db/queries/pitches";

interface Params {
  params: Promise<{ pitchId: string }>;
}

export async function POST(_request: Request, { params }: Params) {
  const { pitchId } = await params;
  const access = await requirePitchOwner(pitchId);
  if ("response" in access) return access.response;
  const { pitch } = access;
  if (pitch.slides.length === 0) {
    return NextResponse.json({ error: "Upload a deck before confirming the parse" }, { status: 400 });
  }
  await confirmParse(pitchId);
  return NextResponse.json({ pitch: await getPitchById(pitchId) });
}
