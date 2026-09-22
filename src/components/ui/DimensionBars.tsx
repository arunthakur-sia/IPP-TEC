export function DimensionBars({ rows, max = 5 }: { rows: { label: string; value: number | null }[]; max?: number }) {
  return (
    <div className="space-y-3.5">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="text-ink-600">{row.label}</span>
            <span className="font-medium text-ink-900">{row.value ?? "—"}/5</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-ink-700 transition-all duration-300"
              style={{ width: `${((row.value ?? 0) / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
