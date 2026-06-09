// Mini-graphiques sans dépendance (SVG / CSS), rendus côté serveur.

/**
 * Sparkline : courbe + aire à partir d'une série de valeurs.
 */
export function Sparkline({
  values,
  width = 560,
  height = 80,
  stroke = "#3B7BF8",
}: {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
}) {
  const n = values.length;
  const max = Math.max(1, ...values);
  const pad = 4;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const xy = (v: number, i: number) => {
    const x = n <= 1 ? pad : pad + (i / (n - 1)) * innerW;
    const y = pad + innerH - (v / max) * innerH;
    return [x, y] as const;
  };

  const points = values.map((v, i) => xy(v, i));
  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area =
    `${pad},${height - pad} ` +
    line +
    ` ${(width - pad).toFixed(1)},${height - pad}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="h-20 w-full"
    >
      <polygon points={area} fill={stroke} opacity={0.1} />
      <polyline
        points={line}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === n - 1 ? 3 : 0} fill={stroke} />
      ))}
    </svg>
  );
}

/**
 * Barres horizontales (répartition par catégorie).
 */
export function HBars({
  items,
}: {
  items: { label: string; value: number; color: string }[];
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const total = items.reduce((a, b) => a + b.value, 0);

  return (
    <div className="space-y-3">
      {items.map((it) => (
        <div key={it.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-semibold text-fg">{it.label}</span>
            <span className="text-muted">
              {it.value}
              {total > 0 && (
                <span className="text-subtle">
                  {" "}
                  · {Math.round((it.value / total) * 100)}%
                </span>
              )}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-raised">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(it.value / max) * 100}%`,
                backgroundColor: it.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
