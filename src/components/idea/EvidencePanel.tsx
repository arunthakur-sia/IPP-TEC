"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { EvidenceItem } from "@/lib/types/domain";

const copy = {
  title: { en: "Evidence pack", ar: "حزمة الأدلة" },
  empty: { en: "No evidence submitted yet.", ar: "لم يتم تقديم أي أدلة بعد." },
  placeholder: { en: "Paste an interview note, data point or link…", ar: "أضف ملاحظة مقابلة أو بيانات أو رابطًا…" },
  remove: { en: "Remove", ar: "إزالة" },
  add: { en: "Add evidence", ar: "إضافة دليل" },
  attach: { en: "Attach file (docs, PDF, images, any file)", ar: "إرفاق ملف (مستندات، PDF، صور، أي ملف)" },
  uploading: { en: "Uploading…", ar: "جارٍ الرفع…" },
  uploadFailed: { en: "Upload failed", ar: "فشل الرفع" },
};

function t(entry: { en: string; ar: string }, locale: "en" | "ar") {
  return locale === "ar" ? entry.ar : entry.en;
}

export function EvidencePanel({ ideaId, evidence, readOnly, canRemove = false }: { ideaId: string; evidence: EvidenceItem[]; readOnly: boolean; canRemove?: boolean }) {
  const { locale } = useLocale();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function uploadFile(file: File | undefined) {
    if (!file) return;
    setSubmitting(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/ideas/${ideaId}/evidence`, { method: "POST", body: formData });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setUploadError(data?.error ?? t(copy.uploadFailed, locale));
    }
    if (fileRef.current) fileRef.current.value = "";
    setSubmitting(false);
    router.refresh();
  }

  async function remove(evidenceId: string) {
    setSubmitting(true);
    await fetch(`/api/ideas/${ideaId}/evidence/${evidenceId}`, { method: "DELETE" });
    setSubmitting(false);
    router.refresh();
  }

  async function add() {
    if (!content.trim()) return;
    setSubmitting(true);
    await fetch(`/api/ideas/${ideaId}/evidence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "note", content }),
    });
    setContent("");
    setSubmitting(false);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(copy.title, locale)}</CardTitle>
      </CardHeader>
      <CardBody className="space-y-3">
        {evidence.length === 0 ? (
          <p className="text-sm text-ink-500">{t(copy.empty, locale)}</p>
        ) : (
          <ul className="space-y-2">
            {evidence.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-ink-800 whitespace-pre-wrap">
                <span className="min-w-0 break-words">
                {e.file ? `📎 ${e.file.name}` : e.content}
                {e.url && (
                  <a href={e.url} className="ms-1 text-ink-500 underline" target="_blank" rel="noreferrer">
                    ({e.url})
                  </a>
                )}
                </span>
                {canRemove && (
                  <button type="button" onClick={() => remove(e.id)} disabled={submitting} className="shrink-0 text-xs text-verdict-refine underline disabled:opacity-50">
                    {t(copy.remove, locale)}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {!readOnly && (
          <div className="flex gap-2">
            <textarea
              rows={2}
              className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm"
              placeholder={t(copy.placeholder, locale)}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <Button variant="secondary" size="sm" onClick={add} disabled={submitting}>
              {t(copy.add, locale)}
            </Button>
          </div>
        )}
        {!readOnly && (
          <div>
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => uploadFile(e.target.files?.[0])} />
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={submitting}>
              {submitting ? t(copy.uploading, locale) : t(copy.attach, locale)}
            </Button>
            {uploadError && <p className="mt-1 text-sm text-verdict-refine">{uploadError}</p>}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
