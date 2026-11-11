import type { CSSProperties } from 'react';
import { INDICATORS } from '../data/indicators';
import { sourceById } from '../data/sources';
import { LEVEL_LABEL } from '../lib/format';
import type { Evaluation } from '../lib/rules';
import { groupTiles, inRangeShare, reasonLine, type NextAction } from '../lib/today';
import type { IndicatorId } from '../lib/types';
import type { View } from '../lib/views';
import { BtnTrail } from './ui';

const REMEASURE_SOURCE = 'russell-2023';

/* Ring geometry in the 160 x 160 box: segments run from the inner radius out; flagged ones reach 4px further. */
const CX = 80;
const R_IN = 69;
const R_OUT = 75;
const R_OUT_FLAGGED = 79;
/** 2px gap between segments, measured at the middle of the band. */
const GAP = 2 / ((R_IN + R_OUT) / 2);

function point(r: number, a: number): string {
  return `${(CX + r * Math.cos(a)).toFixed(2)} ${(CX + r * Math.sin(a)).toFixed(2)}`;
}

/** Annular sector from angle a0 to a1 (radians, 0 = 3 o'clock, clockwise). */
function sector(a0: number, a1: number, rOut: number): string {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${point(rOut, a0)}A${rOut} ${rOut} 0 ${large} 1 ${point(rOut, a1)}L${point(R_IN, a1)}A${R_IN} ${R_IN} 0 ${large} 0 ${point(R_IN, a0)}Z`;
}

/**
 * Status ring: one segment per indicator, in the same order as the tiles (flagged first), coloured by its status.
 * Watch and Act now segments are longer, so the ring carries status by shape as well as colour.
 * After a save the segments sweep in clockwise, staggered across 700ms.
 */
function Ring({ ev, sweep }: { ev: Evaluation; sweep: number }) {
  const { inRange, measured } = inRangeShare(ev.byIndicator);
  const g = groupTiles(INDICATORS, ev.byIndicator);
  const ordered = [...g.attention, ...g.inRange, ...g.unmeasured];
  const step = (2 * Math.PI) / ordered.length;
  return (
    <div className={`ring ${ev.overall}`}>
      <svg viewBox="0 0 160 160" aria-hidden="true" key={sweep} className={sweep ? 'sweep' : undefined}>
        {ordered.map((def, i) => {
          const st = ev.byIndicator[def.id];
          const tone = st.value === null && st.level === 'green' ? 'none' : st.level;
          const a0 = -Math.PI / 2 + i * step + GAP / 2;
          const a1 = a0 + step - GAP;
          return (
            <path
              key={def.id}
              className={`ring-seg ${tone}`}
              d={sector(a0, a1, tone === 'amber' || tone === 'red' ? R_OUT_FLAGGED : R_OUT)}
              style={{ '--n': i } as CSSProperties}
            />
          );
        })}
      </svg>
      <span className="ring-text">
        <span className="ring-count mono">{inRange}/{measured}</span>
        <span className="ring-cap">in range</span>
      </span>
    </div>
  );
}

interface StatusPanelProps {
  ev: Evaluation;
  action: NextAction;
  sweep: number;
  meta: string;
  surgeonNote: string | null;
  /** Portrait shown beside the name line. */
  portrait?: React.ReactNode;
  go: (v: View, indicator?: IndicatorId) => void;
}

export function StatusPanel({ ev, action, sweep, meta, surgeonNote, portrait, go }: StatusPanelProps) {
  const src = sourceById(REMEASURE_SOURCE);
  return (
    <section className="panel status-panel" data-tour="status" aria-labelledby="status-word">
      <Ring ev={ev} sweep={sweep} />
      <div className="status-text">
        <h1 id="status-word" key={sweep} className={`status-word ${ev.overall}${sweep ? ' sweep' : ''}`}>
          <span className="sr-only">Today's status: </span>
          {LEVEL_LABEL[ev.overall]}
        </h1>
        <p className="status-reason">{reasonLine(ev.findings)}</p>
        <p className="status-meta">{portrait && <span className="status-portrait">{portrait}</span>}{meta}</p>
        {surgeonNote && <p className="status-surgeon">{surgeonNote}</p>}
      </div>
      <div className="status-actions">
        <button type="button" className="btn-primary next-action" data-tour="next-action" onClick={() => go(action.view, action.indicator)}>
          {action.label}
          <BtnTrail />
        </button>
        {action.kind === 'remeasure' && (
          <p className="remeasure-note">
            Repeat the flagged reading about 30 minutes after acting. NASA's decision-support concept for Mars missions re-checks the
            crew member 30 minutes after an alert (scenario in Russell 2023).{' '}
            {src && (
              <a href={src.url} target="_blank" rel="noopener noreferrer">
                {src.org}
              </a>
            )}
          </p>
        )}
        <button type="button" className="link-btn" onClick={() => go('checkin')}>
          Open check-in
        </button>
      </div>
    </section>
  );
}
