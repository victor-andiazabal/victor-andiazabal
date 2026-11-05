/*
 * Segmented control: an accessible radio group with a sliding thumb.
 * Mechanism ported from "Segmented Control" by ddoemonn (21st.dev id 23552); rebuilt in plain React + CSS.
 */
import { useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import './controls.css';

export interface SegmentedOption {
  value: string;
  label: ReactNode;
  /** Short explanation, shown under the control for the focused/hovered option, else the selected one. */
  hint?: string;
}

interface SegmentedProps {
  label: string;
  options: SegmentedOption[];
  value: string;
  onChange(v: string): void;
  size?: 'md' | 'lg';
}

const STEP: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

export function Segmented({ label, options, value, onChange, size = 'md' }: SegmentedProps) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const [peek, setPeek] = useState<number | null>(null);
  const count = options.length;
  const found = options.findIndex((o) => o.value === value);
  const index = found < 0 ? 0 : found;
  const hasHints = options.some((o) => o.hint);
  const hint = options[peek ?? index]?.hint ?? '';

  const choose = (i: number) => {
    buttons.current[i]?.focus();
    if (options[i].value !== value) onChange(options[i].value);
  };

  const onKeyDown = (e: KeyboardEvent, i: number) => {
    let to: number | null = null;
    if (e.key in STEP) to = (i + STEP[e.key] + count) % count;
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = count - 1;
    if (to === null) return;
    e.preventDefault();
    choose(to);
  };

  const style = { '--count': count, '--index': index } as CSSProperties;
  return (
    <div className={`seg seg-${size}`}>
      <div role="radiogroup" aria-label={label} className="seg-track" style={style}>
        <span className="seg-thumb" aria-hidden="true" />
        {options.map((o, i) => (
          <button
            key={o.value}
            ref={(node) => {
              buttons.current[i] = node;
            }}
            type="button"
            role="radio"
            aria-checked={i === index}
            tabIndex={i === index ? 0 : -1}
            className="seg-option"
            title={o.hint}
            onClick={() => choose(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
            onPointerEnter={() => setPeek(i)}
            onPointerLeave={() => setPeek(null)}
            onFocus={() => setPeek(i)}
            onBlur={() => setPeek(null)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {hasHints && (
        <p className="seg-hint" aria-live="polite">
          {hint}
        </p>
      )}
    </div>
  );
}
