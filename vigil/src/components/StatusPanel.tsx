import type { CSSProperties } from 'react';
import { sourceById } from '../data/sources';
import { LEVEL_LABEL } from '../lib/format';
import type { Evaluation } from '../lib/rules';
import { inRangeShare, reasonLine, type NextAction } from '../lib/today';
import type { IndicatorId } from '../lib/types';
import type { View } from '../lib/views';

const R = 72;
const C = 2 * Math.PI * R;
const REMEASURE_SOURCE = 'russell-2023';

/** Status ring: the arc is the share of today's readings inside range; it sweeps from 0 once after a save. */
function Ring({ ev, sweep }: { ev: Evaluation; sweep: number }) {
  const { inRange, measured } = inRangeShare(ev.byIndicator);
  const share = measured ? inRange / measured : 0;
  const offset = C * (1 - share);
  return (
    <div className={`ring ${ev.overall}`}>
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <circle className="ring-track" cx="80" cy="80" r={R} />
        <circle
          key={sweep}
          className={`ring-arc${sweep ? ' sweep' : ''}`}
          cx="80"
          cy="80"
          r={R}
          strokeDasharray={C}
          strokeDashoffset={offset}
          style={{ '--c': C } as CSSProperties}
          transform="rotate(-90 80 80)"
        />
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
  go: (v: View, indicator?: IndicatorId) => void;
}

export function StatusPanel({ ev, action, sweep, meta, surgeonNote, go }: StatusPanelProps) {
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
        <p className="status-meta">{meta}</p>
        {surgeonNote && <p className="status-surgeon">{surgeonNote}</p>}
      </div>
      <div className="status-actions">
        <button type="button" className="btn-primary next-action" data-tour="next-action" onClick={() => go(action.view, action.indicator)}>
          {action.label}
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
