"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { demoDayDefaultFormat } from "@/lib/skills/pitchRubric";
import type { MockJuryInterruptPayload } from "@/lib/agents/pitch-validation/nodes";
import type { MockJuryTurn } from "@/lib/types/domain";

const copy = {
  pending: { en: "Mock jury", ar: "لجنة تحكيم تجريبية" },
  timeLeft: { en: "Time left", ar: "الوقت المتبقي" },
  placeholder: { en: "Answer as if you were on stage…", ar: "أجب كما لو كنت على المسرح…" },
  submit: { en: "Submit answer", ar: "إرسال الإجابة" },
  thinking: { en: "Evaluating your answer…", ar: "جارٍ تقييم إجابتك…" },
  log: { en: "Session log", ar: "سجل الجلسة" },
  modelAnswer: { en: "Model answer", ar: "إجابة نموذجية" },
};

function t(entry: { en: string; ar: string }, locale: "en" | "ar") {
  return locale === "ar" ? entry.ar : entry.en;
}

// A dedicated, remount-per-question component: keying it by turnId (below)
// makes a new question reset the countdown for free, so the effect only
// ever needs to set up/tear down the interval — never call setState
// synchronously from the effect body itself.
function CountdownTimer({ locale }: { locale: "en" | "ar" }) {
  const [secondsLeft, setSecondsLeft] = useState(demoDayDefaultFormat.questionTimeSeconds);

  useEffect(() => {
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <p className="text-xs text-ink-500">
      {t(copy.timeLeft, locale)}: {secondsLeft}s
    </p>
  );
}

export function MockJuryPanel({ pitchId, interrupt, log }: { pitchId: string; interrupt: MockJuryInterruptPayload | null; log: MockJuryTurn[] }) {
  const { locale } = useLocale();
  const router = useRouter();
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!answer.trim()) return;
    setSubmitting(true);
    await fetch(`/api/pitches/${pitchId}/mock-jury/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    });
    setAnswer("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {interrupt && (
        <Card>
          <CardHeader>
            <CardTitle>
              {t(copy.pending, locale)} — {interrupt.personaName}
            </CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <ProgressBar value={interrupt.turnNumber} max={interrupt.totalTurns} label={`${interrupt.turnNumber}/${interrupt.totalTurns}`} />
            <p className="text-base font-medium text-ink-900">{interrupt.question}</p>
            <CountdownTimer key={interrupt.turnId} locale={locale} />
            {submitting ? (
              <p className="text-sm text-accent-700">{t(copy.thinking, locale)}</p>
            ) : (
              <>
                <textarea rows={4} autoFocus className="w-full rounded-lg border border-border px-3 py-2 text-sm" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder={t(copy.placeholder, locale)} />
                <Button onClick={submit} disabled={!answer.trim()}>
                  {t(copy.submit, locale)}
                </Button>
              </>
            )}
          </CardBody>
        </Card>
      )}

      {log.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t(copy.log, locale)}</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {log.map((turn) => (
              <div key={turn.id} className="rounded-lg border border-border p-3 text-sm">
                <p className="font-medium text-ink-900">{turn.question}</p>
                {turn.answer && <p className="mt-1 text-ink-700">A: {turn.answer}</p>}
                {turn.evaluation && <p className="mt-1 text-xs text-ink-500">{turn.evaluation}</p>}
                {turn.modelAnswer && (
                  <p className="mt-1 text-xs text-accent-700">
                    {t(copy.modelAnswer, locale)}: {turn.modelAnswer}
                  </p>
                )}
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
