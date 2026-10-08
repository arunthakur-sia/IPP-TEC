import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { addEvidence, addEvidenceFile, getIdeaById } from "@/lib/db/queries/ideas";
import { validateEvidenceFile } from "@/lib/parsing/evidenceFile";
import type { EvidenceItem } from "@/lib/types/domain";

interface Params {
  params: Promise<{ ideaId: string }>;
}

// Vercel request bodies cap out around 4.5 MB.
const MAX_FILE_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request, { params }: Params) {
  const { ideaId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const idea = await getIdeaById(ideaId);
  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (idea.ownerId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "File is too large (max 4 MB)" }, { status: 413 });
    }
    const data = Buffer.from(await file.arrayBuffer());
    const invalid = validateEvidenceFile(file.name, file.type, data);
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
    const evidence = await addEvidenceFile(ideaId, file.name, file.type, data);
    return NextResponse.json({ evidence }, { status: 201 });
  }
  const body = (await request.json()) as { kind: EvidenceItem["kind"]; content: string; url?: string };
  if (!body.content?.trim()) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }
  const evidence = await addEvidence(ideaId, body.kind ?? "note", body.content.trim(), body.url?.trim() || undefined);
  return NextResponse.json({ evidence }, { status: 201 });
}
