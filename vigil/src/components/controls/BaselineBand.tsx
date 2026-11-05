import type { Baseline } from '../../lib/analytics';
import { BAND_Z } from '../../lib/today';
import './controls.css';

/**
 * The signature detail: a thin cyan band for the person's own normal (baseline median ± BAND_Z typical deviations)
 * on a min..max scale, with a tick where today's value sits.
 */
interface BaselineBandProps {
  value: number | null;
  baseline: Baseline | null;
  min: number;
  max: number;
}

const short = (x: number) => String(Number(x.toPrecision(3)));

export function BaselineBand({ value, baseline, min, max }: BaselineBandProps) {
  const span = max - min || 1;
  const pct = (x: number) => Math.min(100, Math.max(0, ((x - min) / span) * 100));
  const hasValue = value !== null && Number.isFinite(value);

  if (!baseline) {
    return (
      <div className="band" role="img" aria-label={hasValue ? `No baseline yet; today ${short(value)}` : 'No baseline yet'}>
        <span className="band-track" />
        {hasValue && <span className="band-tick" style={{ left: `${pct(value)}%` }} />}
      </div>
    );
  }

  const lo = baseline.median - BAND_Z * baseline.mad;
  const hi = baseline.median + BAND_Z * baseline.mad;
  const label = `Your normal ${short(lo)} to ${short(hi)}${hasValue ? `; today ${short(value)}` : ''}`;
  return (
    <div className="band" role="img" aria-label={label}>
      <span className="band-track" />
      <span className="band-range" style={{ left: `${pct(lo)}%`, width: `${Math.max(1, pct(hi) - pct(lo))}%` }} />
      {hasValue && <span className="band-tick" style={{ left: `${pct(value)}%` }} />}
    </div>
  );
}
