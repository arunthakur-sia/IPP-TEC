"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { IdeaVerdictBadge } from "@/components/ui/Badge";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { ideaVerdictLabels, label } from "@/lib/skills/glossary";
import { formatDateTime } from "@/lib/utils";
import type { IdeaVerdict, MentorReview } from "@/lib/types/domain";

const copy = {
  pendingTitle: { en: "Mentor review", ar: "مراجعة الموجّه" },
  probe: { en: "Points to probe", ar: "نقاط يجب استقصاؤها" },
  decision: { en: "Gate decision", ar: "قرار البوابة" },
  reason: { en: "Reason (required, stored for the audit trail)", ar: "السبب (مطلوب، يُحفظ في سجل المراجعة)" },
  confirm: { en: "Confirm decision", ar: "تأكيد القرار" },
  waitingTitle: { en: "Awaiting mentor review", ar: "بانتظار مراجعة الموجّه" },
  waitingBody: {
    en: "A mentor will confirm, adjust or override the agent's verdict before this idea can move to prototype building.",
    ar: "سيقوم الموجّه بتأكيد أو تعديل أو تجاوز قرار العامل قبل أن تنتقل الفكرة إلى مرحلة بناء النموذج الأولي.",
  },
  decidedTitle: { en: "Mentor decision", ar: "قرار الموجّه" },
  override: { en: "Overrode the agent's verdict", ar: "تجاوز قرار العامل" },
  decidedAt: { en: "Decided", ar: "تاريخ القرار" },
  minutes: { en: "min to decide", ar: "دقيقة لاتخاذ القرار" },
};

function t(entry: { en: string; ar: string }, locale: "en" | "ar") {
  return locale === "ar" ? entry.ar : entry.en;
}

export function MentorReviewPending({
  ideaId,
  pointsToProbe,
  suggestedVerdict,
  canDecide,
}: {
  ideaId: string;
  pointsToProbe: string[];
  suggestedVerdict: IdeaVerdict;
  canDecide: boolean;
}) {
  const { locale } = useLocale();
  const router = useRouter();
  const [decision, setDecision] = useState<IdeaVerdict>(suggestedVerdict);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function confirm() {
    if (!reason.trim()) return;
    setSubmitting(true);
    await fetch(`/api/ideas/${ideaId}/session/mentor-decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, reason }),
    });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{canDecide ? t(copy.pendingTitle, locale) : t(copy.waitingTitle, locale)}</CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        {pointsToProbe.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-semibold text-ink-500">{t(copy.probe, locale)}</p>
            <ul className="list-disc ps-5 text-sm text-ink-700">
              {pointsToProbe.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}

        {canDecide ? (
          submitting ? (
            <p className="text-sm text-ink-500">…</p>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">{t(copy.decision, locale)}</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(ideaVerdictLabels) as IdeaVerdict[]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setDecision(v)}
                      className={`rounded-full border px-3 py-1 text-sm ${
                        decision === v ? "border-accent-500 bg-accent-100 text-accent-700" : "border-border text-ink-600"
                      }`}
                    >
                      {label(ideaVerdictLabels[v], locale)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">{t(copy.reason, locale)}</label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <Button onClick={confirm} disabled={!reason.trim()}>
                {t(copy.confirm, locale)}
              </Button>
            </div>
          )
        ) : (
          <p className="text-sm text-ink-500">{t(copy.waitingBody, locale)}</p>
        )}
      </CardBody>
    </Card>
  );
}

export function MentorReviewDecided({ review, suggestedVerdict }: { review: MentorReview; suggestedVerdict: IdeaVerdict }) {
  const { locale } = useLocale();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(copy.decidedTitle, locale)}</CardTitle>
      </CardHeader>
      <CardBody className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <IdeaVerdictBadge verdict={review.decision} label={label(ideaVerdictLabels[review.decision], locale)} />
          {review.overrodeAgent && <span className="text-xs text-accent-700">{t(copy.override, locale)}</span>}
        </div>
        <p className="text-ink-700">{review.reason}</p>
        {review.pointsToProbe.length > 0 && (
          <ul className="list-disc ps-5 text-ink-600">
            {review.pointsToProbe.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        )}
        <p className="text-xs text-ink-400">
          {t(copy.decidedAt, locale)}: {formatDateTime(review.decidedAt, locale)} · {review.minutesToDecide.toFixed(0)} {t(copy.minutes, locale)}
        </p>
        {review.overrodeAgent && (
          <p className="text-xs text-ink-400">
            {label(ideaVerdictLabels[suggestedVerdict], locale)} → {label(ideaVerdictLabels[review.decision], locale)}
          </p>
        )}
      </CardBody>
    </Card>
  );
}
