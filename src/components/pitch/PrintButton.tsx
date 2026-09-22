"use client";

import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function PrintButton() {
  const { locale } = useLocale();
  return (
    <Button variant="secondary" className="no-print" onClick={() => window.print()}>
      {locale === "ar" ? "تصدير PDF" : "Export as PDF"}
    </Button>
  );
}
