"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { Idea } from "@/lib/types/domain";

const copy = {
  title: { en: "New pitch", ar: "عرض جديد" },
  select: { en: "Select the validated idea this pitch is for", ar: "اختر الفكرة التي تم التحقق منها لهذا العرض" },
  create: { en: "Create pitch", ar: "إنشاء العرض" },
  none: { en: "No ideas available yet — validate an idea first.", ar: "لا توجد أفكار متاحة بعد — تحقق من فكرة أولاً." },
};

function t(entry: { en: string; ar: string }, locale: "en" | "ar") {
  return locale === "ar" ? entry.ar : entry.en;
}

export function NewPitchForm({ ideas }: { ideas: Idea[] }) {
  const { locale } = useLocale();
  const router = useRouter();
  const [ideaId, setIdeaId] = useState(ideas[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!ideaId) return;
    setSubmitting(true);
    const res = await fetch("/api/pitches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ideaId }),
    });
    const data = (await res.json()) as { pitch: { id: string } };
    router.push(`/pitches/${data.pitch.id}/studio`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(copy.title, locale)}</CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        {ideas.length === 0 ? (
          <p className="text-sm text-ink-500">{t(copy.none, locale)}</p>
        ) : (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">{t(copy.select, locale)}</label>
              <select
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={ideaId}
                onChange={(e) => setIdeaId(e.target.value)}
              >
                {ideas.map((idea) => (
                  <option key={idea.id} value={idea.id}>
                    {idea.title}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={submit} disabled={submitting || !ideaId}>
              {t(copy.create, locale)}
            </Button>
          </>
        )}
      </CardBody>
    </Card>
  );
}
