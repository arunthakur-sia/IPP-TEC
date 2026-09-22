import { NextResponse } from "next/server";
import { setServerLocale } from "@/lib/i18n/locale.server";

export async function POST(request: Request) {
  const body = (await request.json()) as { locale?: string };
  const locale = body.locale === "ar" ? "ar" : "en";
  await setServerLocale(locale);
  return NextResponse.json({ ok: true, locale });
}
