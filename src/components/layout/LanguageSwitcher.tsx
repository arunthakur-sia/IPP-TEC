"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";

export function LanguageSwitcher() {
  const { locale, setLocale, isPending } = useLocale();
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
      className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-ink-700 shadow-sm transition-colors hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/40 focus-visible:ring-offset-2"
    >
      {locale === "ar" ? "English" : "العربية"}
    </button>
  );
}
