"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/LocaleProvider";

const copy = {
  delete: { en: "Delete", ar: "حذف" },
  deleting: { en: "Deleting…", ar: "جارٍ الحذف…" },
  failed: { en: "Couldn't delete. Try again.", ar: "تعذر الحذف. حاول مرة أخرى." },
};

function t(entry: { en: string; ar: string }, locale: "en" | "ar") {
  return locale === "ar" ? entry.ar : entry.en;
}

export function DeleteButton({
  deleteUrl,
  confirmMessage,
  redirectTo,
  className,
}: {
  deleteUrl: string;
  confirmMessage: { en: string; ar: string };
  redirectTo?: string;
  className?: string;
}) {
  const { locale } = useLocale();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(t(confirmMessage, locale))) return;
    setDeleting(true);
    const res = await fetch(deleteUrl, { method: "DELETE" });
    if (!res.ok) {
      setDeleting(false);
      window.alert(t(copy.failed, locale));
      return;
    }
    if (redirectTo) router.push(redirectTo);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className={className ?? "text-sm font-medium text-verdict-pivot hover:opacity-80 disabled:opacity-50"}
    >
      {deleting ? t(copy.deleting, locale) : t(copy.delete, locale)}
    </button>
  );
}
