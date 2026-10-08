import JSZip from "jszip";
import { PDFParse } from "pdf-parse";
import { getPath as getPdfWorkerPath } from "pdf-parse/worker";

const MAX_TEXT_CHARS = 8000;

let workerConfigured = false;

async function pdfText(buffer: Buffer): Promise<string> {
  if (!workerConfigured) {
    PDFParse.setWorker(getPdfWorkerPath());
    workerConfigured = true;
  }
  const parser = new PDFParse({ data: buffer });
  try {
    return (await parser.getText()).text;
  } finally {
    await parser.destroy();
  }
}

async function docxText(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const xml = (await zip.file("word/document.xml")?.async("string")) ?? "";
  return xml
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/**
 * Best-effort text extraction from an evidence upload. Images and formats we
 * can't read return an empty string; the file is still recorded by name.
 */
export async function extractEvidenceText(fileName: string, mimeType: string, buffer: Buffer): Promise<string> {
  const lower = fileName.toLowerCase();
  try {
    let text = "";
    if (lower.endsWith(".pdf")) text = await pdfText(buffer);
    else if (lower.endsWith(".docx")) text = await docxText(buffer);
    else if (mimeType.startsWith("text/") || /\.(txt|md|csv|json)$/.test(lower)) text = buffer.toString("utf8");
    return text.trim().slice(0, MAX_TEXT_CHARS);
  } catch {
    return "";
  }
}

const SIGNATURES: { test: (b: Buffer) => boolean; label: string; match: (name: string, mime: string) => boolean }[] = [
  { label: "PDF", test: (b) => b.subarray(0, 5).toString("latin1") === "%PDF-", match: (n, m) => m === "application/pdf" || n.endsWith(".pdf") },
  { label: "PNG", test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), match: (n, m) => m === "image/png" },
  { label: "JPEG", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff, match: (n, m) => m === "image/jpeg" },
  { label: "GIF", test: (b) => b.subarray(0, 4).toString("latin1") === "GIF8", match: (n, m) => m === "image/gif" },
  {
    label: "WebP",
    test: (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP",
    match: (n, m) => m === "image/webp",
  },
];

/**
 * The model rejects the whole request on a corrupt PDF or image, so check the
 * file's magic bytes against its claimed type at upload. Returns an error
 * message, or null if the file looks valid (or is a type we only read as text).
 */
export function validateEvidenceFile(fileName: string, mimeType: string, buffer: Buffer): string | null {
  const lower = fileName.toLowerCase();
  const sig = SIGNATURES.find((s) => s.match(lower, mimeType));
  if (sig && !sig.test(buffer)) return `"${fileName}" is not a valid ${sig.label} file`;
  return null;
}
