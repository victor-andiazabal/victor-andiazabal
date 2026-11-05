/*
 * Day strip: one 4px bar per day coloured by that day's level; tap, hover or arrow keys show the day in a tooltip.
 * Nominal days are muted; Watch and Act now days are full colour, taller and carry a dot, so status is shape + colour.
 * Mechanism ported from "Uptime Card" by kokonutd (21st.dev id 39964), without the magnify swell.
 */
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { LEVEL_LABEL } from '../../lib/format';
import type { Level } from '../../lib/types';
import './controls.css';

interface StatusStripProps {
  days: { day: number; level: Level | null; label: string }[];
}

export function StatusStrip({ days }: StatusStripProps) {
  const [active, setActive] = useState<number | null>(null);
  const bars = useRef<HTMLDivElement>(null);
  const n = days.length;
  if (!n) return null;

  const at = (clientX: number) => {
    const r = bars.current?.getBoundingClientRect();
    if (!r || !r.width) return n - 1;
    return Math.min(n - 1, Math.max(0, Math.floor(((clientX - r.left) / r.width) * n)));
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') e.currentTarget.setPointerCapture(e.pointerId);
    setActive(at(e.clientX));
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' || e.currentTarget.hasPointerCapture(e.pointerId)) setActive(at(e.clientX));
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const from = active ?? n - 1;
    const moves: Record<string, number> = { ArrowLeft: from - 1, ArrowRight: from + 1, Home: 0, End: n - 1 };
    if (e.key === 'Escape') {
      setActive(null);
      return;
    }
    if (!(e.key in moves)) return;
    e.preventDefault();
    setActive(Math.min(n - 1, Math.max(0, moves[e.key])));
  };

  const shown = active === null ? null : days[active];
  const first = days[0].day;
  const last = days[n - 1].day;
  return (
    <div
      className="strip"
      role="slider"
      tabIndex={0}
      aria-label={`Daily status, days ${first} to ${last}. Arrow keys move between days.`}
      aria-valuemin={first}
      aria-valuemax={last}
      aria-valuenow={shown?.day ?? last}
      aria-valuetext={(shown ?? days[n - 1]).label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setActive(null)}
      onKeyDown={onKeyDown}
      onFocus={() => setActive((a) => a ?? n - 1)}
      onBlur={() => setActive(null)}
    >
      <div className="strip-bars" ref={bars}>
        {days.map((d, i) => (
          <span
            key={d.day}
            role="img"
            aria-label={`Day ${d.day}: ${d.level ? LEVEL_LABEL[d.level] : 'no reading'}`}
            className={`strip-bar ${d.level ?? 'none'}${i === active ? ' is-active' : ''}`}
          />
        ))}
      </div>
      {shown && (
        <span className="strip-tip mono" aria-hidden="true">
          {shown.label}
        </span>
      )}
    </div>
  );
}
