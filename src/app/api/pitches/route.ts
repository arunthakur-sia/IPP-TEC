import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createPitch, listAllPitches, listPitchesForIdea } from "@/lib/db/queries/pitches";
import { getIdeaById } from "@/lib/db/queries/ideas";
import { getServerLocale } from "@/lib/i18n/locale.server";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const ideaId = searchParams.get("ideaId");

  if (ideaId) return NextResponse.json({ pitches: await listPitchesForIdea(ideaId) });

  const allPitches = await listAllPitches();
  const visible = user.role === "program_office" || user.role === "coach" ? allPitches : allPitches.filter((p) => p.ownerId === user.id);
  return NextResponse.json({ pitches: visible });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const locale = await getServerLocale();
  const body = (await request.json()) as { ideaId: string };

  const idea = await getIdeaById(body.ideaId);
  if (!idea) return NextResponse.json({ error: "Idea not found" }, { status: 404 });

  const pitch = await createPitch({ ideaId: idea.id, ownerId: user.id, language: locale });
  return NextResponse.json({ pitch }, { status: 201 });
}
