import { NextResponse } from "next/server";
import { addEvidence } from "@/lib/db/queries/ideas";
import type { EvidenceItem } from "@/lib/types/domain";

interface Params {
  params: Promise<{ ideaId: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const { ideaId } = await params;
  const body = (await request.json()) as { kind: EvidenceItem["kind"]; content: string; url?: string };
  if (!body.content?.trim()) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }
  const evidence = await addEvidence(ideaId, body.kind ?? "note", body.content.trim(), body.url?.trim() || undefined);
  return NextResponse.json({ evidence }, { status: 201 });
}
