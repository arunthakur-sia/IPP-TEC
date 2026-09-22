"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CANVAS_MIN_FIELD_LENGTH, checkCanvasCompleteness } from "@/lib/validation/ideaCanvas";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { Idea, IdeaCanvas, TeamProfile } from "@/lib/types/domain";

const copy = {
  canvas: { en: "Idea canvas", ar: "لوحة الفكرة" },
  problem: { en: "Problem", ar: "المشكلة" },
  affectedUsers: { en: "Affected users", ar: "المستخدمون المتأثرون" },
  currentWorkaround: { en: "Current workaround", ar: "الحل البديل الحالي" },
  proposedSolution: { en: "Proposed solution", ar: "الحل المقترح" },
  expectedValue: { en: "Expected value to TEC", ar: "القيمة المتوقعة للمجلس" },
  alignmentTags: { en: "Alignment tags (comma separated)", ar: "علامات التوافق (مفصولة بفواصل)" },
  knownRisks: { en: "Known risks", ar: "المخاطر المعروفة" },
  team: { en: "Team profile", ar: "ملف الفريق" },
  size: { en: "Team size", ar: "حجم الفريق" },
  skills: { en: "Skills (comma separated)", ar: "المهارات (مفصولة بفواصل)" },
  hours: { en: "Hours/week available", ar: "الساعات المتاحة أسبوعيًا" },
  save: { en: "Save canvas", ar: "حفظ اللوحة" },
  saved: { en: "Saved", ar: "تم الحفظ" },
  minLength: { en: `Needs at least ${CANVAS_MIN_FIELD_LENGTH} characters`, ar: `يتطلب ${CANVAS_MIN_FIELD_LENGTH} حرفًا على الأقل` },
};

function t(entry: { en: string; ar: string }, locale: "en" | "ar") {
  return locale === "ar" ? entry.ar : entry.en;
}

export function CanvasEditor({ idea, readOnly }: { idea: Idea; readOnly: boolean }) {
  const { locale } = useLocale();
  const [canvas, setCanvas] = useState<IdeaCanvas>(idea.canvas);
  const [team, setTeam] = useState<TeamProfile>(idea.team);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const completeness = checkCanvasCompleteness(canvas, team);

  async function save() {
    setSaving(true);
    await fetch(`/api/ideas/${idea.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ canvas, team }),
    });
    setSaving(false);
    setSavedAt(Date.now());
  }

  function field(key: keyof IdeaCanvas, label: { en: string; ar: string }, multiline = true) {
    const missing = completeness.missingFields.includes(key);
    const value = canvas[key];
    return (
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium text-ink-700">{t(label, locale)}</label>
          {typeof value === "string" && (
            <span className={missing ? "text-xs text-verdict-refine" : "text-xs text-verdict-ready"}>
              {missing ? t(copy.minLength, locale) : "✓"}
            </span>
          )}
        </div>
        {multiline ? (
          <textarea
            disabled={readOnly}
            rows={2}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm disabled:bg-muted"
            value={value as string}
            onChange={(e) => setCanvas((c) => ({ ...c, [key]: e.target.value }))}
          />
        ) : null}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{t(copy.canvas, locale)}</CardTitle>
        {savedAt && !saving && <span className="text-xs text-verdict-ready">{t(copy.saved, locale)}</span>}
      </CardHeader>
      <CardBody className="space-y-4">
        {field("problem", copy.problem)}
        {field("affectedUsers", copy.affectedUsers)}
        {field("currentWorkaround", copy.currentWorkaround)}
        {field("proposedSolution", copy.proposedSolution)}
        {field("expectedValue", copy.expectedValue)}
        {field("knownRisks", copy.knownRisks)}
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700">{t(copy.alignmentTags, locale)}</label>
          <input
            disabled={readOnly}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm disabled:bg-muted"
            value={canvas.alignmentTags.join(", ")}
            onChange={(e) => setCanvas((c) => ({ ...c, alignmentTags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))}
          />
        </div>

        <div className="border-t border-border pt-4">
          <h4 className="mb-2 text-sm font-semibold text-ink-800">{t(copy.team, locale)}</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-ink-600">{t(copy.size, locale)}</label>
              <input
                type="number"
                min={1}
                disabled={readOnly}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm disabled:bg-muted"
                value={team.size}
                onChange={(e) => setTeam((tm) => ({ ...tm, size: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink-600">{t(copy.hours, locale)}</label>
              <input
                type="number"
                min={0}
                disabled={readOnly}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm disabled:bg-muted"
                value={team.hoursPerWeek}
                onChange={(e) => setTeam((tm) => ({ ...tm, hoursPerWeek: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-xs text-ink-600">{t(copy.skills, locale)}</label>
            <input
              disabled={readOnly}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm disabled:bg-muted"
              value={team.skills.join(", ")}
              onChange={(e) => setTeam((tm) => ({ ...tm, skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))}
            />
          </div>
        </div>

        {!readOnly && (
          <Button variant="secondary" onClick={save} disabled={saving}>
            {t(copy.save, locale)}
          </Button>
        )}
      </CardBody>
    </Card>
  );
}
