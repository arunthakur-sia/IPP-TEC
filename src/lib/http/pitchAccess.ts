import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getPitchById } from "@/lib/db/queries/pitches";
import type { Pitch } from "@/lib/types/domain";

/** Signed-in owner of an existing pitch, or the error response to return. */
export async function requirePitchOwner(pitchId: string): Promise<{ pitch: Pitch } | { response: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) return { response: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  const pitch = await getPitchById(pitchId);
  if (!pitch) return { response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  if (pitch.ownerId !== user.id) return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { pitch };
}
