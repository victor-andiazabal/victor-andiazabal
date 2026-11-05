import { sourceById } from '../data/sources';
import type { SelectHTMLAttributes } from 'react';
import { LEVEL_LABEL } from '../lib/format';
import type { Level } from '../lib/types';
import { IconArrowRight, IconCheckCircle, IconChevronDown } from './icons';

/** The one select: a native control (keyboard and mobile pickers keep working) with the line chevron drawn on top. */
export function Select({ className = '', children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="select">
      <select className={`select-input ${className}`.trim()} {...rest}>{children}</select>
      <IconChevronDown className="select-chev" />
    </span>
  );
}

/** Trailing 20px icon for a primary button, set off by a 1px divider (styles.css .btn-trail). */
export function BtnTrail({ icon = 'arrow' }: { icon?: 'arrow' | 'check' }) {
  return <span className="btn-trail" aria-hidden="true">{icon === 'check' ? <IconCheckCircle /> : <IconArrowRight />}</span>;
}

export function Pill({ level, children }: { level: Level | 'neutral'; children?: React.ReactNode }) {
  return (
    <span className={`pill ${level}`}>
      {level !== 'neutral' && <span className={`dot ${level}`} />}
      {children ?? (level !== 'neutral' ? LEVEL_LABEL[level] : '')}
    </span>
  );
}

export function SourceLinks({ ids, compact = false }: { ids: string[]; compact?: boolean }) {
  const srcs = ids.map(sourceById).filter(Boolean);
  if (!srcs.length) return null;
  if (compact) {
    // Two documents from one body would read as a repeated name, so those are labelled by title.
    const orgCount = (org: string) => srcs.filter((o) => o!.org === org).length;
    return (
      <span className="muted" style={{ fontSize: 13 }}>
        Sources:{' '}
        {srcs.map((s, i) => (
          <span key={s!.id}>
            <a href={s!.url} target="_blank" rel="noreferrer">
              {orgCount(s!.org) > 1 ? s!.title : s!.org}
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
