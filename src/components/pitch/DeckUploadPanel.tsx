"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { cn } from "@/lib/utils";

const ACCEPTED_EXTENSIONS = [".pdf", ".pptx"];

const copy = {
  title: { en: "Upload deck", ar: "رفع العرض التقديمي" },
  body: { en: "Upload a .pdf or .pptx export of your pitch deck. You can optionally paste a script or rehearsal transcript.", ar: "ارفع نسخة PDF أو PPTX من عرضك التقديمي. يمكنك اختياريًا لصق نص أو نسخة بروفة." },
  dropActive: { en: "Drop the file to attach it", ar: "أفلت الملف لإرفاقه" },
  dropIdle: { en: "Drag and drop a .pdf or .pptx file here, or click to browse", ar: "اسحب وأفلت ملف PDF أو PPTX هنا، أو انقر للتصفح" },
  browse: { en: "Browse files", ar: "تصفح الملفات" },
  remove: { en: "Remove", ar: "إزالة" },
  noFile: { en: "Choose a .pdf or .pptx file before uploading.", ar: "اختر ملف PDF أو PPTX قبل الرفع." },
  invalidType: { en: "Only .pdf or .pptx files are supported.", ar: "يتم دعم ملفات PDF أو PPTX فقط." },
  script: { en: "Script or transcript (optional)", ar: "النص أو النسخة (اختياري)" },
  upload: { en: "Upload", ar: "رفع" },
  uploading: { en: "Parsing…", ar: "جارٍ التحليل…" },
};

function t(entry: { en: string; ar: string }, locale: "en" | "ar") {
  return locale === "ar" ? entry.ar : entry.en;
}

function hasAcceptedExtension(fileName: string) {
  const lower = fileName.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function DeckUploadPanel({ pitchId }: { pitchId: string }) {
  const { locale } = useLocale();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [script, setScript] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function selectFile(candidate: File | null) {
    if (!candidate) return;
    if (!hasAcceptedExtension(candidate.name)) {
      setError(t(copy.invalidType, locale));
      return;
    }
    setError(null);
    setFile(candidate);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragActive(false);
    selectFile(e.dataTransfer.files?.[0] ?? null);
  }

  async function upload() {
    if (!file) {
      setError(t(copy.noFile, locale));
      return;
    }
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("deck", file);
    if (script.trim()) formData.append("script", script.trim());

    const res = await fetch(`/api/pitches/${pitchId}/upload`, { method: "POST", body: formData });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Upload failed");
      setUploading(false);
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(copy.title, locale)}</CardTitle>
      </CardHeader>
      <CardBody className="space-y-3">
        <p className="text-sm text-ink-600">{t(copy.body, locale)}</p>
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={handleDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors",
            isDragActive ? "border-accent-500 bg-accent-500/5" : "border-border hover:border-ink-400/40"
          )}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.pptx"
            className="hidden"
            onChange={(e) => selectFile(e.target.files?.[0] ?? null)}
          />
          <p className="text-sm text-ink-600">{isDragActive ? t(copy.dropActive, locale) : t(copy.dropIdle, locale)}</p>
          {file ? (
            <div className="flex items-center gap-2 text-sm font-medium text-ink-800">
              <span>{file.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="text-xs font-normal text-ink-500 underline hover:text-ink-700"
              >
                {t(copy.remove, locale)}
              </button>
            </div>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                fileRef.current?.click();
              }}
            >
              {t(copy.browse, locale)}
            </Button>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700">{t(copy.script, locale)}</label>
          <textarea rows={4} className="w-full rounded-lg border border-border px-3 py-2 text-sm" value={script} onChange={(e) => setScript(e.target.value)} />
        </div>
        {error && <p className="text-sm text-verdict-refine">{error}</p>}
        <Button type="button" onClick={upload} disabled={uploading}>
          {uploading ? t(copy.uploading, locale) : t(copy.upload, locale)}
        </Button>
      </CardBody>
    </Card>
  );
}
