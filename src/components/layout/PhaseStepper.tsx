"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import { label, programPhaseLabels } from "@/lib/skills/glossary";
import { cn } from "@/lib/utils";

/** 1-indexed: which of the program's 7 phases (see plan §"Where the agents sit in the program") is active. */
export function PhaseStepper({ activePhase }: { activePhase: number }) {
  const { locale } = useLocale();
  return (
    <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-xs">
      {programPhaseLabels.map((phase, i) => {
        const n = i + 1;
        const state = n < activePhase ? "done" : n === activePhase ? "active" : "upcoming";
        return (
          <li key={n} className="flex items-center gap-1.5">
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold transition-colors",
                state === "done" && "bg-ink-800 text-white",
                state === "active" && "bg-accent-500 text-white ring-4 ring-accent-100",
                state === "upcoming" && "bg-muted text-ink-400"
              )}
            >
              {n}
            </span>
            <span className={cn(state === "active" ? "font-medium text-ink-900" : "text-ink-500")}>
              {label(phase, locale)}
            </span>
            {n < programPhaseLabels.length && <span className="mx-1 text-ink-400">→</span>}
          </li>
        );
      })}
    </ol>
  );
}
