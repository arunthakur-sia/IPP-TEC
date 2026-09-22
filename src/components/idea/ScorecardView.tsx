"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, IdeaVerdictBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { confidenceLabels, ideaDimensionLabels, ideaVerdictLabels, label } from "@/lib/skills/glossary";
import type { IdeaAssessment } from "@/lib/types/domain";

const copy = {
  title: { en: "Scorecard", ar: "بطاقة التقييم" },
  score: { en: "Weighted score", ar: "الدرجة الموزونة" },
  confidence: { en: "Confidence", ar: "مستوى الثقة" },
  reasons: { en: "Top reasons", ar: "أهم الأسباب" },
  assumptions: { en: "Assumptions to verify", ar: "افتراضات تحتاج للتحقق" },
  noAssumptions: { en: "No unverified assumptions flagged.", ar: "لا توجد افتراضات غير مؤكدة." },
  anchor: { en: "Rubric anchor applied", ar: "المعيار المطبق" },
  evidence: { en: "Evidence quoted", ar: "الأدلة المقتبسة" },
  openQuestions: { en: "Open questions", ar: "أسئلة مفتوحة" },
  insufficient: { en: "Insufficient information", ar: "معلومات غير كافية" },
  respond: { en: "Respond", ar: "الرد" },
  respondPlaceholder: { en: "Add context or push back on this rating…", ar: "أضف سياقًا أو اعترض على هذا التقييم…" },
  send: { en: "Send", ar: "إرسال" },
  reassess: { en: "Add evidence above, then request re-assessment", ar: "أضف أدلة أعلاه، ثم اطلب إعادة التقييم" },
  requestReassessment: { en: "Request re-assessment", ar: "طلب إعادة التقييم" },
  reassessingLabel: { en: "Reassessing…", ar: "جارٍ إعادة التقييم…" },
  pivotReframings: { en: "Adjacent problem framings to consider", ar: "صياغات بديلة للمشكلة يمكن النظر فيها" },
  hardRule: { en: "Rule applied", ar: "القاعدة المطبقة" },
  sourceCanvas: { en: "Canvas", ar: "اللوحة" },
  sourceClarification: { en: "Interview", ar: "المقابلة" },
  sourceEvidence: { en: "Evidence pack", ar: "حزمة الأدلة" },
  sourceWeb: { en: "Web", ar: "الويب" },
};

function t(entry: { en: string; ar: string }, locale: "en" | "ar") {
  return locale === "ar" ? entry.ar : entry.en;
}

/** Evidence is cited as raw "canvas.field" / "clarification.<n>" strings; render those as a readable pill instead of literal brackets. */
function formatEvidenceSource(source: string, locale: "en" | "ar"): string {
  const [kind, detail] = source.split(".", 2);
  switch (kind) {
    case "canvas":
      return detail ? `${t(copy.sourceCanvas, locale)} · ${detail.replace(/_/g, " ")}` : t(copy.sourceCanvas, locale);
    case "clarification":
      return detail ? `${t(copy.sourceClarification, locale)} Q${detail}` : t(copy.sourceClarification, locale);
    case "evidence":
      return detail ? `${t(copy.sourceEvidence, locale)} #${detail}` : t(copy.sourceEvidence, locale);
    case "web":
      return t(copy.sourceWeb, locale);
    default:
      return source;
  }
}

function DimensionCard({ ideaId, dim, locale }: { ideaId: string; dim: IdeaAssessment["dimensions"][number]; locale: "en" | "ar" }) {
  const router = useRouter();
  const [responding, setResponding] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    await fetch(`/api/ideas/${ideaId}/evidence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "note", content: `[${label(ideaDimensionLabels[dim.name], locale)}] ${text.trim()}` }),
    });
    setText("");
    setSending(false);
    setResponding(false);
    router.refresh();
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex items-center justify-between gap-3">
        <CardTitle>{label(ideaDimensionLabels[dim.name], locale)}</CardTitle>
        <Badge tone={dim.rating === null ? "neutral" : dim.rating >= 4 ? "good" : dim.rating >= 3 ? "warn" : "bad"}>
          {dim.rating === null ? t(copy.insufficient, locale) : `${dim.rating}/5`}
        </Badge>
      </CardHeader>
      <CardBody className="flex flex-1 flex-col text-sm">
        <div className="flex-1 space-y-3">
          <p className="text-ink-600 italic">&ldquo;{dim.anchor}&rdquo;</p>
          {dim.evidence.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-ink-500">{t(copy.evidence, locale)}</p>
              <ul className="space-y-1.5">
                {dim.evidence.map((e, i) => (
                  <li key={i} className="rounded-lg bg-muted px-2.5 py-1.5 text-ink-700">
                    <span className="mb-1 inline-block rounded-full bg-white px-2 py-0.5 text-[11px] font-medium capitalize text-ink-500 ring-1 ring-inset ring-border">
                      {formatEvidenceSource(e.source, locale)}
                    </span>
                    <p>{e.quote}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {dim.openQuestions.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-ink-500">{t(copy.openQuestions, locale)}</p>
              <ul className="list-disc ps-4 text-ink-700">
                {dim.openQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-4 border-t border-border pt-3">
          {responding ? (
            <div className="space-y-2">
              <textarea
                rows={2}
                className="w-full rounded-lg border border-border px-2 py-1.5 text-sm"
                placeholder={t(copy.respondPlaceholder, locale)}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <Button size="sm" variant="secondary" onClick={send} disabled={sending}>
                {t(copy.send, locale)}
              </Button>
            </div>
          ) : (
            <button type="button" className="text-xs font-medium text-accent-700 underline" onClick={() => setResponding(true)}>
              {t(copy.respond, locale)}
            </button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

/** Verdict + weighted score + top reasons + the re-assessment trigger. Lives on the idea's overview page. */
export function ScorecardSummary({
  assessment,
  readOnly,
  onRequestReassessment,
  reassessing,
}: {
  assessment: IdeaAssessment;
  readOnly: boolean;
  onRequestReassessment?: () => void;
  reassessing?: boolean;
}) {
  const { locale } = useLocale();

  return (
    <Card>
      <CardBody className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <IdeaVerdictBadge verdict={assessment.verdict} label={label(ideaVerdictLabels[assessment.verdict], locale)} />
            <span className="text-sm text-ink-500">
              {t(copy.score, locale)}: <strong className="text-ink-900">{assessment.weightedScore.toFixed(2)}</strong>/5
            </span>
            <Badge tone="neutral">
              {t(copy.confidence, locale)}: {label(confidenceLabels[assessment.confidence], locale)}
            </Badge>
          </div>
          <ul className="list-disc ps-5 text-sm text-ink-700">
            {assessment.topReasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          {assessment.hardRuleTriggered && (
            <p className="mt-2 text-xs text-ink-500">
              {t(copy.hardRule, locale)}: {assessment.hardRuleTriggered.replaceAll("_", " ")}
            </p>
          )}
        </div>
        {!readOnly && onRequestReassessment && (
          <Button variant="secondary" size="sm" onClick={onRequestReassessment} disabled={reassessing}>
            {reassessing && <Spinner />}
            {reassessing ? t(copy.reassessingLabel, locale) : t(copy.requestReassessment, locale)}
          </Button>
        )}
      </CardBody>
    </Card>
  );
}

/** The six rubric-dimension cards ("6 pillars"). Lives on its own page since each card carries real detail. */
export function ScorecardDimensions({ ideaId, assessment }: { ideaId: string; assessment: IdeaAssessment }) {
  const { locale } = useLocale();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {assessment.dimensions.map((dim) => (
        <DimensionCard key={dim.name} ideaId={ideaId} dim={dim} locale={locale} />
      ))}
    </div>
  );
}

/** Pivot reframings + assumptions to verify — secondary scorecard detail, grouped with the plan/review page. */
export function ScorecardExtras({ assessment }: { assessment: IdeaAssessment }) {
  const { locale } = useLocale();

  return (
    <div className="space-y-4">
      {assessment.verdict === "pivot" && assessment.pivotReframings && (
        <Card>
          <CardHeader>
            <CardTitle>{t(copy.pivotReframings, locale)}</CardTitle>
          </CardHeader>
          <CardBody>
            <ul className="list-disc ps-5 text-sm text-ink-700">
              {assessment.pivotReframings.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t(copy.assumptions, locale)}</CardTitle>
        </CardHeader>
        <CardBody>
          {assessment.assumptionsToVerify.length === 0 ? (
            <p className="text-sm text-ink-500">{t(copy.noAssumptions, locale)}</p>
          ) : (
            <ul className="list-disc ps-5 text-sm text-ink-700">
              {assessment.assumptionsToVerify.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
