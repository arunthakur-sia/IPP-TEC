"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { speakingWordsPerMinute } from "@/lib/skills/pitchRubric";
import type { Slide } from "@/lib/types/domain";

const copy = {
  title: { en: "Confirm parsed slides", ar: "تأكيد الشرائح المستخرجة" },
  body: {
    en: "Check that nothing was lost before the agent reads this deck.",
    ar: "تحقق من عدم فقدان أي محتوى قبل أن يقرأ العامل هذا العرض.",
  },
  words: { en: "words", ar: "كلمة" },
  minutes: { en: "min speaking", ar: "دقيقة للإلقاء" },
  confirm: { en: "Looks right — confirm", ar: "يبدو صحيحًا — تأكيد" },
};

function t(entry: { en: string; ar: string }, locale: "en" | "ar") {
  return locale === "ar" ? entry.ar : entry.en;
}

export function ParseCheckPanel({ pitchId, slides }: { pitchId: string; slides: Slide[] }) {
  const { locale } = useLocale();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const totalWords = slides.reduce((sum, s) => sum + s.wordCount, 0);

  async function confirm() {
    setConfirming(true);
    await fetch(`/api/pitches/${pitchId}/parse-check`, { method: "POST" });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{t(copy.title, locale)}</CardTitle>
        <span className="text-xs text-ink-500">
          {totalWords} {t(copy.words, locale)} · {(totalWords / speakingWordsPerMinute).toFixed(1)} {t(copy.minutes, locale)}
        </span>
      </CardHeader>
      <CardBody className="space-y-3">
        <p className="text-sm text-ink-600">{t(copy.body, locale)}</p>
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {slides.map((s) => (
            <div key={s.index} className="rounded-lg border border-border p-3 text-sm">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-medium text-ink-900">
                  {locale === "ar" ? "شريحة" : "Slide"} {s.index + 1}: {s.title || "—"}
                </span>
                <span className="text-xs text-ink-400">
                  {s.wordCount} {t(copy.words, locale)}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-ink-600">{s.body || "—"}</p>
            </div>
          ))}
        </div>
        <Button onClick={confirm} disabled={confirming}>
          {t(copy.confirm, locale)}
        </Button>
      </CardBody>
    </Card>
  );
}
