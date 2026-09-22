"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { formatDateTime } from "@/lib/utils";
import type { CoachReview } from "@/lib/types/domain";

const copy = {
  pendingTitle: { en: "Coach review", ar: "مراجعة المدرّب" },
  waitingTitle: { en: "Awaiting coach review", ar: "بانتظار مراجعة المدرّب" },
  waitingBody: { en: "A coach will confirm Demo Day readiness or ask for another rehearsal.", ar: "سيؤكد المدرّب جاهزية يوم العرض أو يطلب بروفة إضافية." },
  decision: { en: "Decision", ar: "القرار" },
  confirm: { en: "Confirm — ready for Demo Day", ar: "تأكيد — جاهز ليوم العرض" },
  rehearse: { en: "Request another rehearsal", ar: "طلب بروفة إضافية" },
  reason: { en: "Reason", ar: "السبب" },
  submit: { en: "Submit decision", ar: "إرسال القرار" },
  decidedTitle: { en: "Coach decision", ar: "قرار المدرّب" },
  juryPack: { en: "View jury pack", ar: "عرض حزمة لجنة التحكيم" },
};

function t(entry: { en: string; ar: string }, locale: "en" | "ar") {
  return locale === "ar" ? entry.ar : entry.en;
}

export function CoachReviewPending({ pitchId, canDecide }: { pitchId: string; canDecide: boolean }) {
  const { locale } = useLocale();
  const router = useRouter();
  const [decision, setDecision] = useState<CoachReview["decision"]>("confirmed");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!reason.trim()) return;
    setSubmitting(true);
    await fetch(`/api/pitches/${pitchId}/coach-decision`, {
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
      <CardBody className="space-y-3">
        {!canDecide ? (
          <p className="text-sm text-ink-500">{t(copy.waitingBody, locale)}</p>
        ) : submitting ? (
          <p className="text-sm text-ink-500">…</p>
        ) : (
          <>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDecision("confirmed")}
                className={`rounded-full border px-3 py-1 text-sm ${decision === "confirmed" ? "border-accent-500 bg-accent-100 text-accent-700" : "border-border text-ink-600"}`}
              >
                {t(copy.confirm, locale)}
              </button>
              <button
                type="button"
                onClick={() => setDecision("rehearse_again")}
                className={`rounded-full border px-3 py-1 text-sm ${decision === "rehearse_again" ? "border-accent-500 bg-accent-100 text-accent-700" : "border-border text-ink-600"}`}
              >
                {t(copy.rehearse, locale)}
              </button>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">{t(copy.reason, locale)}</label>
              <textarea rows={3} className="w-full rounded-lg border border-border px-3 py-2 text-sm" value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <Button onClick={submit} disabled={!reason.trim()}>
              {t(copy.submit, locale)}
            </Button>
          </>
        )}
      </CardBody>
    </Card>
  );
}

export function CoachReviewDecided({ pitchId, review }: { pitchId: string; review: CoachReview }) {
  const { locale } = useLocale();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(copy.decidedTitle, locale)}</CardTitle>
      </CardHeader>
      <CardBody className="space-y-2 text-sm">
        <p className="font-medium text-ink-900">{review.decision === "confirmed" ? t(copy.confirm, locale) : t(copy.rehearse, locale)}</p>
        <p className="text-ink-700">{review.reason}</p>
        <p className="text-xs text-ink-400">{formatDateTime(review.decidedAt, locale)}</p>
        {review.decision === "confirmed" && (
          <Link href={`/jury/${pitchId}`} className="inline-block text-sm font-medium text-accent-700 underline">
            {t(copy.juryPack, locale)}
          </Link>
        )}
      </CardBody>
    </Card>
  );
}
