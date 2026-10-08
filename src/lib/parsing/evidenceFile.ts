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
