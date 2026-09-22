interface RadarAxis {
  label: string;
  value: number | null;
}

/**
 * Dependency-free SVG radar chart for the six idea-validation dimensions
 * (or any small fixed set of rated axes). A `null` rating ("insufficient
 * information") is plotted at 0 but marked with a hollow ring instead of a
 * filled dot, so a missing rating never silently reads as "rated 0".
 */
export function RadarChart({ axes, maxValue = 5, size = 280 }: { axes: RadarAxis[]; maxValue?: number; size?: number }) {
  const center = size / 2;
  const radius = size / 2 - 56;
  const angleStep = (2 * Math.PI) / axes.length;

  function pointFor(index: number, value: number) {
    const angle = -Math.PI / 2 + index * angleStep;
    const r = (value / maxValue) * radius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  }

  const dataPoints = axes.map((a, i) => pointFor(i, a.value ?? 0));
  const polygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");
  const rings = [1, 2, 3, 4, 5];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height={size} role="img" aria-label="Rubric radar chart">
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={axes.map((_, i) => { const p = pointFor(i, ring); return `${p.x},${p.y}`; }).join(" ")}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={1}
        />
      ))}
      {axes.map((_, i) => {
        const p = pointFor(i, maxValue);
        return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="var(--color-border)" strokeWidth={1} />;
      })}
      <polygon points={polygon} fill="var(--color-accent-500)" fillOpacity={0.25} stroke="var(--color-accent-600)" strokeWidth={2} />
      {axes.map((a, i) => {
        const p = pointFor(i, a.value ?? 0);
        return a.value === null ? (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill="white" stroke="var(--color-accent-600)" strokeWidth={2} />
        ) : (
          <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="var(--color-accent-600)" />
        );
      })}
      {axes.map((a, i) => {
        const labelPoint = pointFor(i, maxValue + 1.15);
        return (
          <text
            key={i}
            x={labelPoint.x}
            y={labelPoint.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={11}
            fill="var(--color-ink-700)"
          >
            {a.label}
          </text>
        );
      })}
    </svg>
  );
}
