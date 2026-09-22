"use client";

import { Card, CardBody } from "@/components/ui/Card";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { templateSectionLabels, label } from "@/lib/skills/glossary";
import { pitchTemplateSections } from "@/lib/skills/pitchRubric";
import type { Slide, StructureResult } from "@/lib/types/domain";

const copy = {
  missing: { en: "Missing from the deck", ar: "غير موجود في العرض" },
  empty: { en: "No slide mapped here", ar: "لا توجد شريحة هنا" },
  suggestedOrder: { en: "Suggested slide order", ar: "الترتيب المقترح للشرائح" },
};

function t(entry: { en: string; ar: string }, locale: "en" | "ar") {
  return locale === "ar" ? entry.ar : entry.en;
}

export function StructureMap({ structure, slides }: { structure: StructureResult; slides: Slide[] }) {
  const { locale } = useLocale();

  return (
    <div className="space-y-4">
      {structure.missing.length > 0 && (
        <Card>
          <CardBody className="text-sm">
            <span className="font-medium text-verdict-refine">{t(copy.missing, locale)}: </span>
            {structure.missing.map((s) => label(templateSectionLabels[s], locale)).join(", ")}
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {pitchTemplateSections.map((section) => {
          const slideIndices = structure.mapping.filter((m) => m.section === section).map((m) => m.slide);
          return (
            <div key={section} className="space-y-2">
              <h4 className="text-xs font-semibold uppercase text-ink-500">{label(templateSectionLabels[section], locale)}</h4>
              {slideIndices.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-ink-400">
                  {t(copy.empty, locale)}
                </div>
              ) : (
                slideIndices.map((idx) => (
                  <Card key={idx}>
                    <CardBody className="p-2 text-xs">
                      <p className="font-medium text-ink-800">
                        {idx + 1}. {slides[idx]?.title || "—"}
                      </p>
                    </CardBody>
                  </Card>
                ))
              )}
            </div>
          );
        })}
      </div>

      <Card>
        <CardBody className="text-sm">
          <p className="mb-1 font-medium text-ink-800">{t(copy.suggestedOrder, locale)}</p>
          <p className="text-ink-600">{structure.suggestedOrder.map((n) => n + 1).join(" → ")}</p>
        </CardBody>
      </Card>
    </div>
  );
}
