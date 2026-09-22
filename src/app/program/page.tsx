import { requireUser } from "@/lib/auth/session";
import { getServerLocale } from "@/lib/i18n/locale.server";
import { listAllIdeas, getIdeaAssessment, getMentorReview, getLatestPrototypePlan } from "@/lib/db/queries/ideas";
import { listAllPitches, listPitchRuns, getCoachReview } from "@/lib/db/queries/pitches";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, IdeaVerdictBadge, PitchVerdictBadge } from "@/components/ui/Badge";
import { ideaVerdictLabels, pitchVerdictLabels, label } from "@/lib/skills/glossary";
import Link from "next/link";

export default async function ProgramOfficePage() {
  const user = await requireUser();
  const locale = await getServerLocale();

  if (!["program_office", "mentor", "coach"].includes(user.role)) {
    return (
      <Card>
        <CardBody className="text-sm text-ink-500">
          {locale === "ar" ? "هذه اللوحة مخصصة لمكتب البرنامج والموجّهين والمدرّبين." : "This dashboard is for the program office, mentors and coaches."}
        </CardBody>
      </Card>
    );
  }

  const [ideas, pitches] = await Promise.all([listAllIdeas(), listAllPitches()]);

  const ideaRows = await Promise.all(
    ideas.map(async (idea) => {
      const assessment = idea.currentAssessmentVersion > 0 ? await getIdeaAssessment(idea.id, idea.currentAssessmentVersion) : null;
      const review = assessment ? await getMentorReview(idea.id, assessment.version) : null;
      const plan = await getLatestPrototypePlan(idea.id);
      return { idea, assessment, review, plan };
    })
  );

  const pitchRows = await Promise.all(
    pitches.map(async (pitch) => {
      const runs = await listPitchRuns(pitch.id);
      const latest = runs[runs.length - 1] as (typeof runs)[number] | undefined;
      const coachReview = latest ? await getCoachReview(pitch.id, latest.version) : null;
      return { pitch, runs, latest, coachReview };
    })
  );

  const reviewedIdeas = ideaRows.filter((r) => r.review);

  const daysToVerdict = reviewedIdeas.map(
    (r) => (new Date(r.review!.decidedAt).getTime() - new Date(r.idea.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  const avgDaysToVerdict = daysToVerdict.length ? daysToVerdict.reduce((a, b) => a + b, 0) / daysToVerdict.length : null;

  const readyIdeas = reviewedIdeas.filter((r) => r.review!.decision === "ready_to_prototype");
  const readyWithPlan = readyIdeas.filter((r) => r.plan !== null);
  const planShare = readyIdeas.length ? (readyWithPlan.length / readyIdeas.length) * 100 : null;

  const overrideRate = reviewedIdeas.length
    ? (reviewedIdeas.filter((r) => r.review!.overrodeAgent).length / reviewedIdeas.length) * 100
    : null;

  const pitchImprovements = pitchRows
    .map((r) => {
      const completed = r.runs.filter((run) => run.readinessScore !== null);
      if (completed.length < 2) return null;
      return completed[completed.length - 1].readinessScore! - completed[0].readinessScore!;
    })
    .filter((v): v is number => v !== null);
  const avgImprovement = pitchImprovements.length ? pitchImprovements.reduce((a, b) => a + b, 0) / pitchImprovements.length : null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-ink-900">{locale === "ar" ? "مكتب البرنامج" : "Program office"}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={locale === "ar" ? "متوسط الأيام حتى القرار" : "Avg. days to verdict"}
          value={avgDaysToVerdict !== null ? avgDaysToVerdict.toFixed(1) : "—"}
          hint={locale === "ar" ? "الهدف: أقل من 5 أيام" : "Target: under 5 days"}
        />
        <StatCard
          label={locale === "ar" ? "الأفكار الجاهزة بخطة نموذج أولي" : "Ready ideas with a plan"}
          value={planShare !== null ? `${planShare.toFixed(0)}%` : "—"}
        />
        <StatCard
          label={locale === "ar" ? "معدل تجاوز الموجّه" : "Mentor override rate"}
          value={overrideRate !== null ? `${overrideRate.toFixed(0)}%` : "—"}
        />
        <StatCard
          label={locale === "ar" ? "متوسط تحسن جاهزية العرض" : "Avg. readiness improvement"}
          value={avgImprovement !== null ? `+${avgImprovement.toFixed(2)}` : "—"}
          hint={locale === "ar" ? "بين أول وآخر نسخة" : "first version to latest"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{locale === "ar" ? "الأفكار" : "Ideas"}</CardTitle>
        </CardHeader>
        <CardBody className="space-y-2">
          {ideaRows.map(({ idea, assessment }) => (
            <Link key={idea.id} href={`/workspace/${idea.id}`} className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-muted">
              <span className="text-ink-800">{idea.title}</span>
              <div className="flex items-center gap-2">
                <Badge>{idea.stage.replaceAll("_", " ")}</Badge>
                {assessment && <IdeaVerdictBadge verdict={assessment.verdict} label={label(ideaVerdictLabels[assessment.verdict], locale)} />}
              </div>
            </Link>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{locale === "ar" ? "العروض" : "Pitches"}</CardTitle>
        </CardHeader>
        <CardBody className="space-y-2">
          {pitchRows.map(({ pitch, latest, coachReview }) => (
            <Link key={pitch.id} href={`/pitches/${pitch.id}/readiness`} className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-muted">
              <span className="text-ink-800">{pitch.id}</span>
              <div className="flex items-center gap-2">
                <Badge>{pitch.stage.replaceAll("_", " ")}</Badge>
                {latest?.verdict && <PitchVerdictBadge verdict={latest.verdict} label={label(pitchVerdictLabels[latest.verdict], locale)} />}
                {coachReview && <Badge tone={coachReview.decision === "confirmed" ? "good" : "warn"}>{coachReview.decision}</Badge>}
              </div>
            </Link>
          ))}
          {pitchRows.length === 0 && <p className="text-sm text-ink-500">—</p>}
        </CardBody>
      </Card>

      <p className="text-xs text-ink-400">
        {locale === "ar"
          ? "لم يتم جمع تقييمات فائدة المشاركين أو ساعات الموجّه/المدرّب بعد في هذا الإصدار."
          : "Participant usefulness ratings and mentor/coach hours aren't collected yet in this build."}
      </p>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardBody>
        <p className="text-xs text-ink-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-ink-900">{value}</p>
        {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
      </CardBody>
    </Card>
  );
}
