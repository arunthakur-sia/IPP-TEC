"use client";

import { Card, CardBody } from "@/components/ui/Card";
import { PrototypePlanView } from "@/components/idea/PrototypePlanView";
import { MentorReviewDecided, MentorReviewPending } from "@/components/idea/MentorReviewPanel";
import { FollowUpPanel } from "@/components/idea/FollowUpPanel";
import { ScorecardExtras } from "@/components/idea/ScorecardView";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { IdeaSessionInterrupt } from "@/lib/agents/idea-validation/runner";
import type { Idea, IdeaAssessment, MentorReview, PrototypePlan } from "@/lib/types/domain";

const copy = {
  empty: {
    en: "Nothing here yet — the prototype plan and mentor review fill in once a scored assessment exists.",
    ar: "لا يوجد شيء هنا بعد — ستظهر خطة النموذج الأولي ومراجعة الموجّه بعد صدور تقييم.",
  },
};

function t(entry: { en: string; ar: string }, locale: "en" | "ar") {
  return locale === "ar" ? entry.ar : entry.en;
}

export function IdeaPlanClient({
  idea,
  assessment,
  prototypePlan,
  mentorReview,
  pendingInterrupt,
  isMentor,
}: {
  idea: Idea;
  assessment: IdeaAssessment | null;
  prototypePlan: PrototypePlan | null;
  mentorReview: MentorReview | null;
  pendingInterrupt: IdeaSessionInterrupt | null;
  isMentor: boolean;
}) {
  const { locale } = useLocale();

  const hasAnything =
    Boolean(prototypePlan) ||
    pendingInterrupt?.type === "mentor_review_pending" ||
    Boolean(mentorReview && assessment) ||
    (idea.stage === "closed" && mentorReview?.decision === "ready_to_prototype") ||
    Boolean(assessment);

  if (!hasAnything) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-ink-600">{t(copy.empty, locale)}</p>
        </CardBody>
      </Card>
    );
  }

  const hasMentorSection =
    pendingInterrupt?.type === "mentor_review_pending" ||
    Boolean(mentorReview && assessment) ||
    (idea.stage === "closed" && mentorReview?.decision === "ready_to_prototype");
  const hasExtras = Boolean(assessment);

  const mentorSection = (
    <>
      {pendingInterrupt?.type === "mentor_review_pending" && (
        <MentorReviewPending
          ideaId={idea.id}
          pointsToProbe={pendingInterrupt.pointsToProbe}
          suggestedVerdict={assessment!.verdict}
          canDecide={isMentor}
        />
      )}
      {mentorReview && assessment && <MentorReviewDecided review={mentorReview} suggestedVerdict={assessment.verdict} />}
      {idea.stage === "closed" && mentorReview?.decision === "ready_to_prototype" && <FollowUpPanel ideaId={idea.id} />}
    </>
  );

  return (
    <div className="space-y-6">
      {prototypePlan && <PrototypePlanView plan={prototypePlan} />}

      {hasMentorSection && hasExtras ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="space-y-4">{mentorSection}</div>
          <div className="space-y-4">{assessment && <ScorecardExtras assessment={assessment} />}</div>
        </div>
      ) : (
        <div className="space-y-4">
          {mentorSection}
          {hasExtras && <ScorecardExtras assessment={assessment!} />}
        </div>
      )}
    </div>
  );
}
