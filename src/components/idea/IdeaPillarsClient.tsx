"use client";

import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { ScorecardDimensions } from "@/components/idea/ScorecardView";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { IdeaAssessment } from "@/lib/types/domain";

const copy = {
  title: { en: "6 pillars", ar: "الركائز الست" },
  empty: {
    en: "Run a validation session from the Overview tab to see the six pillar ratings.",
    ar: "شغّل جلسة تحقق من تبويب النظرة العامة لعرض تقييمات الركائز الست.",
  },
  backLink: { en: "Go to overview", ar: "الذهاب إلى النظرة العامة" },
};

function t(entry: { en: string; ar: string }, locale: "en" | "ar") {
  return locale === "ar" ? entry.ar : entry.en;
}

export function IdeaPillarsClient({ ideaId, assessment }: { ideaId: string; assessment: IdeaAssessment | null }) {
  const { locale } = useLocale();

  if (!assessment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t(copy.title, locale)}</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <p className="text-sm text-ink-600">{t(copy.empty, locale)}</p>
          <Link href={`/workspace/${ideaId}`} className="text-sm font-medium text-accent-700 underline">
            {t(copy.backLink, locale)}
          </Link>
        </CardBody>
      </Card>
    );
  }

  return <ScorecardDimensions ideaId={ideaId} assessment={assessment} />;
}
