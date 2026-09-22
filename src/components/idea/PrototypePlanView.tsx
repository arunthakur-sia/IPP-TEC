"use client";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { prototypeCatalogue } from "@/lib/skills/prototypeCatalogue";
import { cn } from "@/lib/utils";
import type { PrototypeOption, PrototypePlan } from "@/lib/types/domain";

const copy = {
  title: { en: "Prototype plan", ar: "خطة النموذج الأولي" },
  ladder: { en: "Fidelity ladder", ar: "سلم درجة الدقة" },
  riskiest: { en: "Riskiest assumption", ar: "أخطر افتراض" },
  primary: { en: "Primary option", ar: "الخيار الأساسي" },
  alternative: { en: "Alternative option", ar: "الخيار البديل" },
  why: { en: "Why not higher fidelity", ar: "لماذا لا نختار دقة أعلى" },
  tools: { en: "Tools", ar: "الأدوات" },
  buildItems: { en: "To build", ar: "ما سيتم بناؤه" },
  effort: { en: "Effort", ar: "الجهد" },
  teamDays: { en: "team-days", ar: "أيام-فريق" },
  test: { en: "Test protocol", ar: "بروتوكول الاختبار" },
  users: { en: "Users", ar: "المستخدمون" },
  metric: { en: "Metric", ar: "المقياس" },
  threshold: { en: "Success threshold", ar: "عتبة النجاح" },
  ifMissed: { en: "If missed", ar: "في حال عدم التحقق" },
};

function t(entry: { en: string; ar: string }, locale: "en" | "ar") {
  return locale === "ar" ? entry.ar : entry.en;
}

function OptionCard({ option, title, locale }: { option: PrototypeOption; title: string; locale: "en" | "ar" }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardBody className="space-y-2 text-sm">
        <p className="font-medium text-ink-900">{option.type}</p>
        <p className="text-ink-600">
          <span className="font-medium">{t(copy.tools, locale)}: </span>
          {option.tools.join(", ")}
        </p>
        <ul className="list-disc ps-5 text-ink-700">
          {option.buildItems.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
        <p className="text-ink-600">
          {t(copy.effort, locale)}: {option.effortTeamDays.min}-{option.effortTeamDays.max} {t(copy.teamDays, locale)}
        </p>
        <div className="rounded-lg bg-muted p-3">
          <p>
            <span className="font-medium">{t(copy.test, locale)}: </span>
            {option.test.protocol}
          </p>
          <p>
            {t(copy.users, locale)}: {option.test.users} · {t(copy.metric, locale)}: {option.test.metric}
          </p>
          <p>
            {t(copy.threshold, locale)}: {option.test.successThreshold}
          </p>
          <p className="text-ink-500">
            {t(copy.ifMissed, locale)}: {option.test.ifMissed}
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

export function PrototypePlanView({ plan }: { plan: PrototypePlan }) {
  const { locale } = useLocale();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t(copy.ladder, locale)}</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="flex items-stretch gap-2">
            {prototypeCatalogue.map((r) => (
              <div
                key={r.rung}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1.5 rounded-lg border p-2 text-center text-xs",
                  r.rung === plan.primary.rung
                    ? "border-accent-500 bg-accent-100 font-semibold text-accent-700"
                    : r.rung === plan.alternative.rung
                      ? "border-ink-400 bg-muted text-ink-700"
                      : "border-border text-ink-400"
                )}
              >
                <div>{r.rung}</div>
                {r.rung === plan.primary.rung && <Badge tone="accent">{t(copy.primary, locale)}</Badge>}
                {r.rung === plan.alternative.rung && <Badge tone="neutral">{t(copy.alternative, locale)}</Badge>}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <p className="text-sm">
            <span className="font-semibold text-ink-800">{t(copy.riskiest, locale)}: </span>
            {plan.riskiestAssumption}
          </p>
          <p className="mt-2 text-sm text-ink-500">
            {t(copy.why, locale)}: {plan.whyNotHigherFidelity}
          </p>
        </CardBody>
      </Card>

      <div className="space-y-4">
        <OptionCard option={plan.primary} title={t(copy.primary, locale)} locale={locale} />
        <OptionCard option={plan.alternative} title={t(copy.alternative, locale)} locale={locale} />
      </div>
    </div>
  );
}
