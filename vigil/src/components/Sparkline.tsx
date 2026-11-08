/** Tiny inline chart of the last few mission days, with the baseline band behind it. */
export function Sparkline({
  points,
  baseline,
  level,
  width = 120,
  height = 34,
}: {
  points: number[];
  baseline?: { median: number; mad: number } | null;
  level: 'green' | 'amber' | 'red';
  width?: number;
  height?: number;
}) {
  if (points.length < 2) return <svg width={width} height={height} aria-hidden="true" />;
  const lo0 = Math.min(...points, baseline ? baseline.median - 2 * baseline.mad : Infinity);
  const hi0 = Math.max(...points, baseline ? baseline.median + 2 * baseline.mad : -Infinity);
  const pad = (hi0 - lo0) * 0.15 || 1;
  const lo = lo0 - pad;
  const hi = hi0 + pad;
  const x = (i: number) => (i / (points.length - 1)) * (width - 6) + 3;
  const y = (v: number) => height - 3 - ((v - lo) / (hi - lo)) * (height - 6);
  const d = points.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const color = level === 'green' ? 'var(--green)' : level === 'amber' ? 'var(--amber)' : 'var(--red)';
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="spark">
      {baseline && (
        <rect
          x={0}
          y={y(baseline.median + 2 * baseline.mad)}
          width={width}
          height={Math.max(1, y(baseline.median - 2 * baseline.mad) - y(baseline.median + 2 * baseline.mad))}
          fill="var(--accent)"
          opacity={0.12}
        />
      )}
      {baseline && <line x1={0} x2={width} y1={y(baseline.median)} y2={y(baseline.median)} stroke="var(--accent)" strokeDasharray="2 3" opacity={0.6} />}
      <path d={d} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(points.length - 1)} cy={y(points[points.length - 1])} r={2.6} fill={color} />
    </svg>
  );
}
