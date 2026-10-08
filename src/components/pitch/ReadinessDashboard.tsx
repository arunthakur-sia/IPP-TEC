"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { PitchVerdictBadge } from "@/components/ui/Badge";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { DimensionBars } from "@/components/ui/DimensionBars";
import { Markdown } from "@/components/ui/Markdown";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { pitchDimensionLabels, pitchVerdictLabels, label } from "@/lib/skills/glossary";
import { pitchVerdictThresholds } from "@/lib/skills/pitchRubric";
import type { CoachReview, PitchDimensionName, PitchRun, ReadinessAction, ScoredPitchRun } from "@/lib/types/domain";

const copy = {
  score: { en: "Readiness score", ar: "درجة الجاهزية" },
  dims: { en: "Dimensions", ar: "الأبعاد" },
  dimsHint: { en: "Click a dimension to see its actions", ar: "انقر على بُعد لعرض إجراءاته" },
  actions: { en: "Prioritised actions", ar: "الإجراءات ذات الأولوية" },
  actionsFilteredFor: { en: "Actions for", ar: "إجراءات" },
  clearFilter: { en: "Show all", ar: "عرض الكل" },
  noActionsForDim: { en: "No open actions for this dimension.", ar: "لا توجد إجراءات مفتوحة لهذا البُعد." },
  trend: { en: "Version trend", ar: "اتجاه النسخ" },
  coachStatus: { en: "Coach status", ar: "حالة المدرّب" },
  goToCoach: { en: "Go to coach review", ar: "الانتقال إلى مراجعة المدرّب" },
  hardRule: { en: "Rule applied", ar: "القاعدة المطبقة" },
  rework: { en: "Rework", ar: "إعادة عمل" },
  rehearse: { en: "Rehearse", ar: "بروفة" },
  ready: { en: "Ready", ar: "جاهز" },
};

function t(entry: { en: string; ar: string }, locale: "en" | "ar") {
  return locale === "ar" ? entry.ar : entry.en;
}

export function ReadinessDashboard({
  pitchId,
  run,
  allRuns,
  coachReview,
}: {
  pitchId: string;
  run: ScoredPitchRun;
  allRuns: PitchRun[];
  coachReview: CoachReview | null;
}) {
  const { locale } = useLocale();
  const router = useRouter();
  const [selectedDimension, setSelectedDimension] = useState<PitchDimensionName | null>(null);

  async function toggleDone(action: ReadinessAction, done: boolean) {
    await fetch(`/api/pitches/${pitchId}/actions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority: action.priority, done }),
    });
    router.refresh();
  }

  const visibleActions = selectedDimension ? run.actions.filter((a) => a.dimension === selectedDimension) : run.actions;

  const zones = [
    { from: 1, to: pitchVerdictThresholds.rework.max, color: "var(--color-verdict-pivot-bg)", label: t(copy.rework, locale) },
    { from: pitchVerdictThresholds.rehearse.min, to: pitchVerdictThresholds.rehearse.max, color: "var(--color-verdict-refine-bg)", label: t(copy.rehearse, locale) },
    { from: pitchVerdictThresholds.readyForDemoDay.min, to: 5, color: "var(--color-verdict-ready-bg)", label: t(copy.ready, locale) },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-center gap-2">
            <PitchVerdictBadge verdict={run.verdict} label={label(pitchVerdictLabels[run.verdict], locale)} />
            <span className="text-sm text-ink-500">
              {t(copy.score, locale)}: <strong className="text-ink-900">{run.readinessScore.toFixed(2)}</strong>/5
            </span>
          </div>
          <ScoreGauge score={run.readinessScore} zones={zones} />
          {run.hardRuleTriggered && (
            <p className="text-xs text-ink-500">
              {t(copy.hardRule, locale)}: {run.hardRuleTriggered.replaceAll("_", " ")}
            </p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t(copy.dims, locale)}</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="mb-2 text-xs text-ink-500">{t(copy.dimsHint, locale)}</p>
          <DimensionBars
            rows={run.dimensions.map((d) => ({ id: d.name, label: label(pitchDimensionLabels[d.name], locale), value: d.rating }))}
            selected={selectedDimension}
            onSelect={(id) => setSelectedDimension((prev) => (prev === id ? null : (id as PitchDimensionName)))}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>
            {t(copy.actions, locale)}
            {selectedDimension && (
              <span className="ml-2 text-xs font-normal text-ink-500">
                {t(copy.actionsFilteredFor, locale)} {label(pitchDimensionLabels[selectedDimension], locale)}
              </span>
            )}
          </CardTitle>
          {selectedDimension && (
            <button type="button" onClick={() => setSelectedDimension(null)} className="text-xs text-accent-700 underline">
              {t(copy.clearFilter, locale)}
            </button>
          )}
        </CardHeader>
        <CardBody className="space-y-2">
          {visibleActions.length === 0 ? (
            <p className="text-sm text-ink-500">{t(copy.noActionsForDim, locale)}</p>
          ) : (
            visibleActions.map((a) => (
              <label key={a.priority} className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1" checked={a.done} onChange={(e) => toggleDone(a, e.target.checked)} />
                <Markdown className={`flex-1 ${a.done ? "text-ink-400 line-through" : "text-ink-800"}`}>{a.text}</Markdown>
              </label>
            ))
          )}
        </CardBody>
      </Card>

      {allRuns.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t(copy.trend, locale)}</CardTitle>
          </CardHeader>
          <CardBody className="flex gap-4 text-sm">
            {allRuns.map((r) => (
              <span key={r.version} className={r.version === run.version ? "font-semibold text-ink-900" : "text-ink-500"}>
                v{r.version}: {r.readinessScore !== null ? r.readinessScore.toFixed(2) : "…"}
              </span>
            ))}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t(copy.coachStatus, locale)}</CardTitle>
        </CardHeader>
        <CardBody className="flex items-center justify-between">
          <span className="text-sm text-ink-600">
            {coachReview ? `${coachReview.decision} — ${coachReview.reason}` : locale === "ar" ? "لم يتم البت بعد" : "Not yet decided"}
          </span>
          <Link href={`/pitches/${pitchId}/coach-review`} className="text-sm font-medium text-accent-700 underline">
            {t(copy.goToCoach, locale)}
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
