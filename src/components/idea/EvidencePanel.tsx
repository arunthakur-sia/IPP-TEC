"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { EvidenceItem } from "@/lib/types/domain";

const copy = {
  title: { en: "Evidence pack", ar: "حزمة الأدلة" },
  empty: { en: "No evidence submitted yet.", ar: "لم يتم تقديم أي أدلة بعد." },
  placeholder: { en: "Paste an interview note, data point or link…", ar: "أضف ملاحظة مقابلة أو بيانات أو رابطًا…" },
  add: { en: "Add evidence", ar: "إضافة دليل" },
};

function t(entry: { en: string; ar: string }, locale: "en" | "ar") {
  return locale === "ar" ? entry.ar : entry.en;
}

export function EvidencePanel({ ideaId, evidence, readOnly }: { ideaId: string; evidence: EvidenceItem[]; readOnly: boolean }) {
  const { locale } = useLocale();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
              <li key={e.id} className="rounded-lg bg-muted px-3 py-2 text-sm text-ink-800 whitespace-pre-wrap">
                {e.content}
                {e.url && (
                  <a href={e.url} className="ms-1 text-ink-500 underline" target="_blank" rel="noreferrer">
                    ({e.url})
                  </a>
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
      </CardBody>
    </Card>
  );
}
