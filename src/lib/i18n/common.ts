import type { Locale, Role } from "@/lib/types/domain";

export const common = {
  appName: { en: "TEC Innovation Program", ar: "برنامج المجلس التنفيذي للابتكار" },
  save: { en: "Save", ar: "حفظ" },
  cancel: { en: "Cancel", ar: "إلغاء" },
  continueLabel: { en: "Continue", ar: "متابعة" },
  back: { en: "Back", ar: "رجوع" },
  loading: { en: "Loading…", ar: "جارٍ التحميل…" },
  submit: { en: "Submit", ar: "إرسال" },
  export: { en: "Export", ar: "تصدير" },
  signOut: { en: "Sign out", ar: "تسجيل الخروج" },
  language: { en: "Language", ar: "اللغة" },
  ideas: { en: "Ideas", ar: "الأفكار" },
  pitches: { en: "Pitches", ar: "العروض" },
  programOffice: { en: "Program office", ar: "مكتب البرنامج" },
  newIdea: { en: "New idea", ar: "فكرة جديدة" },
  dashboard: { en: "Dashboard", ar: "لوحة المعلومات" },
} as const;

export const roleLabels: Record<Role, { en: string; ar: string }> = {
  participant: { en: "Participant", ar: "مشارك" },
  mentor: { en: "Mentor", ar: "موجّه" },
  coach: { en: "Coach", ar: "مدرّب" },
  program_office: { en: "Program office", ar: "مكتب البرنامج" },
  jury: { en: "Jury", ar: "لجنة التحكيم" },
};

export function t(entry: { en: string; ar: string }, locale: Locale): string {
  return locale === "ar" ? entry.ar : entry.en;
}
