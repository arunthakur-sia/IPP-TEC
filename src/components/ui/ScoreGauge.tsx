interface Zone {
  from: number;
  to: number;
  color: string;
  label: string;
}

/**
 * A horizontal, zoned score gauge (1-5) with a marker for the current
 * score. Used for both the idea weighted score and the pitch readiness
 * score — a plain filled-arc gauge would need to hardcode one rubric's
 * thresholds, so this takes the zones as data instead.
 */
export function ScoreGauge({ score, zones, min = 1, max = 5 }: { score: number; zones: Zone[]; min?: number; max?: number }) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const markerPct = Math.max(0, Math.min(100, pct(score)));

  return (
    <div>
      <div className="relative h-4 w-full overflow-hidden rounded-full">
        {zones.map((z) => (
          <div
            key={z.label}
            className="absolute inset-y-0"
            style={{ left: `${pct(z.from)}%`, width: `${pct(z.to) - pct(z.from)}%`, background: z.color }}
          />
        ))}
      </div>
      <div className="relative mt-1 h-4">
        <div
          className="absolute -top-5 flex -translate-x-1/2 flex-col items-center"
          style={{ left: `${markerPct}%` }}
        >
          <div className="h-3 w-3 rotate-45 bg-ink-900" />
        </div>
      </div>
      <div className="mt-3 flex justify-between text-xs text-ink-500">
        {zones.map((z) => (
          <span key={z.label}>{z.label}</span>
        ))}
      </div>
    </div>
  );
}
