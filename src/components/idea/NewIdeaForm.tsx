"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { IdeaCanvas, TeamProfile } from "@/lib/types/domain";

const copy = {
  title: { en: "New idea", ar: "فكرة جديدة" },
  ideaTitle: { en: "Idea title", ar: "عنوان الفكرة" },
  problem: { en: "Problem", ar: "المشكلة" },
  affectedUsers: { en: "Affected users", ar: "المستخدمون المتأثرون" },
  currentWorkaround: { en: "Current workaround", ar: "الحل البديل الحالي" },
  proposedSolution: { en: "Proposed solution", ar: "الحل المقترح" },
  expectedValue: { en: "Expected value to TEC", ar: "القيمة المتوقعة للمجلس" },
  knownRisks: { en: "Known risks", ar: "المخاطر المعروفة" },
  teamSize: { en: "Team size", ar: "حجم الفريق" },
  hours: { en: "Hours/week available", ar: "الساعات المتاحة أسبوعيًا" },
  create: { en: "Create idea", ar: "إنشاء الفكرة" },
};

function t(entry: { en: string; ar: string }, locale: "en" | "ar") {
  return locale === "ar" ? entry.ar : entry.en;
}

export function NewIdeaForm() {
  const { locale } = useLocale();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [canvas, setCanvas] = useState<IdeaCanvas>({
    problem: "",
    affectedUsers: "",
    currentWorkaround: "",
    proposedSolution: "",
    expectedValue: "",
    alignmentTags: [],
    knownRisks: "",
  });
  const [team, setTeam] = useState<TeamProfile>({ size: 1, skills: [], hoursPerWeek: 5 });
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    const res = await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, canvas, team }),
    });
    const data = (await res.json()) as { idea: { id: string } };
    router.push(`/workspace/${data.idea.id}`);
  }

  function field(key: keyof IdeaCanvas, label: { en: string; ar: string }) {
    return (
      <div>
        <label className="mb-1 block text-sm font-medium text-ink-700">{t(label, locale)}</label>
        <textarea
          rows={2}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          value={canvas[key] as string}
          onChange={(e) => setCanvas((c) => ({ ...c, [key]: e.target.value }))}
        />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(copy.title, locale)}</CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700">{t(copy.ideaTitle, locale)}</label>
          <input className="w-full rounded-lg border border-border px-3 py-2 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        {field("problem", copy.problem)}
        {field("affectedUsers", copy.affectedUsers)}
        {field("currentWorkaround", copy.currentWorkaround)}
        {field("proposedSolution", copy.proposedSolution)}
        {field("expectedValue", copy.expectedValue)}
        {field("knownRisks", copy.knownRisks)}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">{t(copy.teamSize, locale)}</label>
            <input
              type="number"
              min={1}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              value={team.size}
              onChange={(e) => setTeam((tm) => ({ ...tm, size: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">{t(copy.hours, locale)}</label>
            <input
              type="number"
              min={0}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              value={team.hoursPerWeek}
              onChange={(e) => setTeam((tm) => ({ ...tm, hoursPerWeek: Number(e.target.value) }))}
            />
          </div>
        </div>
        <Button onClick={submit} disabled={submitting || !title.trim()}>
          {t(copy.create, locale)}
        </Button>
      </CardBody>
    </Card>
  );
}
