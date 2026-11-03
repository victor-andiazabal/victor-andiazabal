import { indicatorById } from '../data/indicators';
import { sourceById } from '../data/sources';
import type { IndicatorId, Level } from '../lib/types';

export const LEVEL_LABEL: Record<Level, string> = { green: 'Nominal', amber: 'Watch', red: 'Act now' };

export function Pill({ level, children }: { level: Level | 'neutral'; children?: React.ReactNode }) {
  return (
    <span className={`pill ${level}`}>
      {level !== 'neutral' && <span className={`dot ${level}`} />}
      {children ?? (level !== 'neutral' ? LEVEL_LABEL[level] : '')}
    </span>
  );
}

export function fmt(id: IndicatorId, v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '--';
  return v.toFixed(indicatorById(id).decimals);
}

export function SourceLinks({ ids, compact = false }: { ids: string[]; compact?: boolean }) {
  const srcs = ids.map(sourceById).filter(Boolean);
  if (!srcs.length) return null;
  if (compact) {
    return (
      <span className="muted" style={{ fontSize: 12 }}>
        Sources:{' '}
        {srcs.map((s, i) => (
          <span key={s!.id}>
            <a href={s!.url} target="_blank" rel="noreferrer">
              {s!.org}
            </a>
            {i < srcs.length - 1 ? '; ' : ''}
          </span>
        ))}
      </span>
    );
  }
  return (
    <ul className="src-list">
      {srcs.map((s) => (
        <li key={s!.id}>
          <a href={s!.url} target="_blank" rel="noreferrer">
            {s!.title}
          </a>{' '}
          <span className="muted">({s!.org})</span>
        </li>
      ))}
    </ul>
  );
}

export function Disclaimer() {
  return (
    <div className="disclaimer">
      VIGIL is a decision-support prototype built for the 2026 NASA Space Apps Challenge. It is not a medical device and
      does not diagnose. All crew data shown is simulated unless you enter it yourself. Reference ranges are quoted from
      the public sources linked in Learn; operational limits are set by each mission's flight surgeon.
    </div>
  );
}

export function Trend({ dir }: { dir: 'up' | 'down' | 'flat' | null }) {
  if (!dir || dir === 'flat') return <span className="trend muted">→</span>;
  return <span className={`trend ${dir}`}>{dir === 'up' ? '↑' : '↓'}</span>;
}
