import { cookies } from "next/headers";
import type { Locale } from "@/lib/types/domain";

const COOKIE_NAME = "tec_locale";

export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  return value === "ar" ? "ar" : "en";
}

export async function setServerLocale(locale: Locale): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, locale, { sameSite: "lax", path: "/" });
}

export const LOCALE_COOKIE_NAME = COOKIE_NAME;
