/*
 * Day strip: one 4px bar per day coloured by that day's level; tap or hover shows the day in a tooltip.
 * Nominal days are neutral; Watch and Act now days are colour at 70% and taller (Act now tallest), so status is shape + colour.
 * Today's bar (the last) is full strength with a 2px underline.
 * Keyboard and screen-reader users get the same days as a list: the tile's button points at it with aria-describedby,
 * so the tile stays one tab stop and focusing it shows the strip.
 * Mechanism ported from "Uptime Card" by kokonutd (21st.dev id 39964), without the magnify swell.
 */
import { useRef, useState, type PointerEvent } from 'react';
import type { Level } from '../../lib/types';
import './controls.css';

interface StatusStripProps {
  days: { day: number; level: Level | null; label: string }[];
  /** Id of the visually hidden day list, for the owner's aria-describedby. */
  summaryId: string;
}

export function StatusStrip({ days, summaryId }: StatusStripProps) {
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

  const shown = active === null ? null : days[active];
  const first = days[0].day;
  const last = days[n - 1].day;
  // A tap focuses the strip (tabindex -1), which keeps an In range tile's strip visible; its blur dismisses the tooltip.
  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      className="strip"
      role="group"
      tabIndex={-1}
      aria-label={`Daily status, days ${first} to ${last}`}
      onBlur={() => setActive(null)}
    >
      {/* Pointer only: the bars are hidden from assistive tech, which reads the list below instead. */}
      <div
        className="strip-bars"
        ref={bars}
        aria-hidden="true"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setActive(null)}
        onPointerCancel={() => setActive(null)}
      >
        {days.map((d, i) => (
          <span key={d.day} className={`strip-bar ${d.level ?? 'none'}${i === active ? ' is-active' : ''}${i === n - 1 ? ' is-today' : ''}`} />
        ))}
      </div>
      <ul id={summaryId} className="sr-only">
        {days.map((d) => (
          <li key={d.day}>{d.label}</li>
        ))}
      </ul>
      {shown && (
        <span className="strip-tip mono" aria-hidden="true">
          {shown.label}
        </span>
      )}
    </div>
  );
}
