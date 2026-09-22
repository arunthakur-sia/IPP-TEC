import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function formatDateTime(iso: string, locale: "en" | "ar"): string {
  return new Date(iso).toLocaleString(locale === "ar" ? "ar-AE" : "en-AE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function round1(n: number): string {
  return n.toFixed(1);
}
