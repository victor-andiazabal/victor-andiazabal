/*
 * Rating scale (KSS 1-9, mood and stress 1-5) as a radio group of 48px options that wraps on narrow screens.
 * Same keyboard model as controls/Segmented (arrows, Home, End); unlike it, an unanswered scale shows nothing selected.
 */
import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { IndicatorDef } from '../../data/indicators';
import { KSS_ANCHORS } from '../../data/indicators';
import { PREFILL_LABEL, type Prefill } from '../controls/prefill';

const SCALE_HINTS: Partial<Record<IndicatorDef['id'], Record<number, string>>> = {
  kss: KSS_ANCHORS,
  mood: { 1: 'very low', 5: 'very good' },
  stress: { 1: 'calm', 5: 'overwhelmed' },
};

const STEP: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

interface ScaleFieldProps {
  def: IndicatorDef;
  value: number | null;
  onChange(v: number): void;
  prefill: Prefill | null;
  children?: ReactNode;
}

export function ScaleField({ def, value, onChange, prefill, children }: ScaleFieldProps) {
  const options = Array.from({ length: def.max - def.min + 1 }, (_, i) => def.min + i);
  const hints = SCALE_HINTS[def.id] ?? {};
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const [peek, setPeek] = useState<number | null>(null);
  const selectedIndex = value === null ? -1 : options.indexOf(value);
  const focusIndex = selectedIndex < 0 ? 0 : selectedIndex;

  const shown = peek ?? value;
  const hint = shown === null ? `Choose ${def.min} to ${def.max}` : `${shown}${hints[shown] ? `, ${hints[shown]}` : ` of ${def.max}`}`;

  const choose = (i: number) => {
    buttons.current[i]?.focus();
    if (options[i] !== value) onChange(options[i]);
  };
  const onKeyDown = (e: KeyboardEvent, i: number) => {
    let to: number | null = null;
    if (e.key in STEP) to = (i + STEP[e.key] + options.length) % options.length;
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = options.length - 1;
    if (to === null) return;
    e.preventDefault();
    choose(to);
  };

  const labelId = `scale-${def.id}-label`;
  return (
    <div className="nf" data-field={def.id}>
      <div className="nf-head">
        <span id={labelId} className="nf-label">
          {def.label}
        </span>
        {prefill && <span className="nf-chip">{PREFILL_LABEL[prefill]}</span>}
      </div>
      <div role="radiogroup" aria-labelledby={labelId} className={`ci-scale ci-scale-${options.length}`}>
        {options.map((n, i) => (
          <button
            key={n}
            ref={(node) => {
              buttons.current[i] = node;
            }}
            type="button"
            role="radio"
            aria-checked={i === selectedIndex}
            aria-label={hints[n] ? `${n}, ${hints[n]}` : String(n)}
            tabIndex={i === focusIndex ? 0 : -1}
            className="ci-scale-opt mono"
            onClick={() => choose(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
            onPointerEnter={() => setPeek(n)}
            onPointerLeave={() => setPeek(null)}
            onFocus={() => setPeek(n)}
            onBlur={() => setPeek(null)}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="ci-scale-hint" aria-live="polite">
        {hint}
      </p>
      {children}
    </div>
  );
}
