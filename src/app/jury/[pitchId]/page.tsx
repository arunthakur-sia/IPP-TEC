import { notFound } from "next/navigation";
import { getPitchViewData } from "@/lib/agents/pitch-validation/viewData";
import { requireUser } from "@/lib/auth/session";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { PitchVerdictBadge, IdeaVerdictBadge } from "@/components/ui/Badge";
import { PrintButton } from "@/components/pitch/PrintButton";
import { pitchVerdictLabels, ideaVerdictLabels, label } from "@/lib/skills/glossary";
import { getServerLocale } from "@/lib/i18n/locale.server";

export default async function JuryPackPage({ params }: { params: Promise<{ pitchId: string }> }) {
  const { pitchId } = await params;
  const { idea, assessment, plan, run, coachReview } = await getPitchViewData(pitchId);
  const user = await requireUser();
  const locale = await getServerLocale();

  const canView = ["jury", "coach", "program_office"].includes(user.role) || idea.ownerId === user.id;
  if (!canView) notFound();
  if (!run || run.verdict === null || !run.actions || !coachReview || coachReview.decision !== "confirmed") {
    return (
      <Card>
        <CardBody className="text-sm text-ink-500">
          {locale === "ar" ? "حزمة لجنة التحكيم متاحة فقط بعد تأكيد المدرّب." : "The jury pack is available only after coach confirmation."}
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900">{idea.title}</h1>
        <PrintButton />
      </div>

      <Card>
        <CardBody className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {assessment && <IdeaVerdictBadge verdict={assessment.verdict} label={label(ideaVerdictLabels[assessment.verdict], locale)} />}
            <PitchVerdictBadge verdict={run.verdict} label={label(pitchVerdictLabels[run.verdict], locale)} />
          </div>
          <p className="text-sm text-ink-700">
            <strong>{locale === "ar" ? "المشكلة" : "Problem"}: </strong>
            {idea.canvas.problem}
          </p>
          <p className="text-sm text-ink-700">
            <strong>{locale === "ar" ? "الحل" : "Solution"}: </strong>
            {idea.canvas.proposedSolution}
          </p>
          <p className="text-sm text-ink-700">
            <strong>{locale === "ar" ? "القيمة المتوقعة" : "Expected value"}: </strong>
            {idea.canvas.expectedValue}
          </p>
        </CardBody>
      </Card>

      {plan && (
        <Card>
          <CardHeader>
            <CardTitle>{locale === "ar" ? "ما تم اختباره" : "What was tested"}</CardTitle>
          </CardHeader>
          <CardBody className="text-sm text-ink-700">
            <p>{plan.primary.type}</p>
            <p className="text-ink-500">
              {locale === "ar" ? "أخطر افتراض" : "Riskiest assumption"}: {plan.riskiestAssumption}
            </p>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{locale === "ar" ? "أعلى الإجراءات المعلقة" : "Top open actions"}</CardTitle>
        </CardHeader>
        <CardBody>
          <ul className="list-disc ps-5 text-sm text-ink-700">
            {run.actions.slice(0, 3).map((a) => (
              <li key={a.priority}>{a.text}</li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="text-xs text-ink-500">
          {locale === "ar" ? "أكّد المدرّب الجاهزية" : "Confirmed ready by coach"}: {coachReview.reason}
        </CardBody>
      </Card>
    </div>
  );
}
