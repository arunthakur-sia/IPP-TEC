import { cn } from "@/lib/utils";
import type { IdeaVerdict, PitchVerdict } from "@/lib/types/domain";

export function Badge({
  className,
  children,
  tone = "neutral",
}: {
  className?: string;
  children: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad" | "accent";
}) {
  const toneClasses: Record<string, string> = {
    neutral: "bg-muted text-ink-700",
    good: "bg-verdict-ready-bg text-verdict-ready",
    warn: "bg-verdict-refine-bg text-verdict-refine",
    bad: "bg-verdict-pivot-bg text-verdict-pivot",
    accent: "bg-accent-100 text-accent-700",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ring-current/10", toneClasses[tone], className)}>
      {children}
    </span>
  );
}

const ideaVerdictTone: Record<IdeaVerdict, "good" | "warn" | "bad"> = {
  ready_to_prototype: "good",
  refine_and_resubmit: "warn",
  pivot: "bad",
};

const pitchVerdictTone: Record<PitchVerdict, "good" | "warn" | "bad"> = {
  ready_for_demo_day: "good",
  rehearse: "warn",
  rework: "bad",
};

export function IdeaVerdictBadge({ verdict, label }: { verdict: IdeaVerdict; label: string }) {
  return <Badge tone={ideaVerdictTone[verdict]}>{label}</Badge>;
}

export function PitchVerdictBadge({ verdict, label }: { verdict: PitchVerdict; label: string }) {
  return <Badge tone={pitchVerdictTone[verdict]}>{label}</Badge>;
}

export function PriorityBadge({ priority, label }: { priority: "high" | "medium" | "low"; label: string }) {
  const tone = priority === "high" ? "bad" : priority === "medium" ? "warn" : "neutral";
  return <Badge tone={tone}>{label}</Badge>;
}
