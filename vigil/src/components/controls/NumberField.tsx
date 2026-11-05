/*
 * Number field: a 56px field with 48px square steppers on either side, press-and-hold repeat after 400ms, typing,
 * +/- and arrow keys, and the baseline band live underneath.
 * Mechanism ported from "Number Field" by coss.com (21st.dev id 28180, built on Base UI); rebuilt in plain React + CSS,
 * without the drag-to-scrub area.
 */
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import type { IndicatorDef } from '../../data/indicators';
import type { Baseline } from '../../lib/analytics';
import { bandScale } from '../../lib/today';
import { BaselineBand } from './BaselineBand';
import { PREFILL_LABEL, type Prefill } from './prefill';
import './controls.css';

interface NumberFieldProps {
  id: string;
  label: string;
  value: number | null;
  onChange(v: number | null): void;
  min: number;
  max: number;
  step: number;
  decimals: number;
  unit: string;
  prefill?: Prefill | null;
  baseline?: Baseline | null;
  def: IndicatorDef;
  /** Status line under the band (level preview), supplied by the form. */
  children?: ReactNode;
}

const HOLD_DELAY_MS = 400;
const HOLD_REPEAT_MS = 80;

const format = (v: number | null, decimals: number) => (v === null ? '' : v.toFixed(decimals));

/** null for an empty box, 'invalid' for text that is not a number. Accepts a decimal comma. */
function parseText(t: string): number | null | 'invalid' {
  const s = t.trim().replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : 'invalid';
}

function MinusGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M5 10h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function PlusGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M5 10h10M10 5v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function NumberField({ id, label, value, onChange, min, max, step, decimals, unit, prefill = null, baseline = null, def, children }: NumberFieldProps) {
  const [text, setText] = useState(() => format(value, decimals));
  const [seen, setSeen] = useState(value);
  // Follow outside changes (stepper, camera pulse, confirm) without clobbering what the person is typing.
  if (seen !== value) {
    setSeen(value);
    const typed = parseText(text);
    const keep = typed === value || (typed === 'invalid' && value === null);
    if (!keep) setText(format(value, decimals));
  }

  const current = useRef(value);
  useEffect(() => {
    current.current = value;
  }, [value]);

  const hold = useRef<{ timeout: number | null; interval: number | null }>({ timeout: null, interval: null });
  const endHold = () => {
    if (hold.current.timeout !== null) window.clearTimeout(hold.current.timeout);
    if (hold.current.interval !== null) window.clearInterval(hold.current.interval);
    hold.current = { timeout: null, interval: null };
  };
  useEffect(() => endHold, []);

  const f = 10 ** decimals;
  const bump = (dir: 1 | -1) => {
    const from = current.current ?? baseline?.median ?? (min + max) / 2;
    const next = Math.round(Math.min(max, Math.max(min, from + dir * step)) * f) / f;
    if (next === current.current) {
      endHold(); // at a limit: a disabled stepper may never see its pointerup
      return;
    }
    current.current = next;
    setText(format(next, decimals));
    onChange(next);
  };

  const onStepperDown = (dir: 1 | -1) => (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.preventDefault(); // keep focus where it is and stop text selection while holding
    bump(dir);
    endHold();
    hold.current.timeout = window.setTimeout(() => {
      hold.current.interval = window.setInterval(() => bump(dir), HOLD_REPEAT_MS);
    }, HOLD_DELAY_MS);
  };

  const onType = (t: string) => {
    setText(t);
    const parsed = parseText(t);
    onChange(parsed === 'invalid' ? null : parsed);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const dir = e.key === '+' || e.key === '=' || e.key === 'ArrowUp' ? 1 : e.key === '-' || e.key === 'ArrowDown' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    bump(dir);
  };

  const typed = parseText(text);
  const invalid = typed === 'invalid';
  const outOfRange = typeof typed === 'number' && (typed < min || typed > max);
  const scale = bandScale(value, baseline, { min, max });
  const msgId = `${id}-msg`;
  const hintId = `${id}-hint`;

  return (
    <div className="nf" data-field={def.id}>
      <div className="nf-head">
        <label htmlFor={id} className="nf-label">
          {label}
        </label>
        {prefill && <span className="nf-chip">{PREFILL_LABEL[prefill]}</span>}
      </div>
      <div className={`nf-row${invalid || outOfRange ? ' is-invalid' : ''}`}>
        <button
          type="button"
          className="nf-step"
          aria-label={`Decrease ${label} by ${step}`}
          aria-controls={id}
          disabled={value !== null && value <= min}
          onPointerDown={onStepperDown(-1)}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          onPointerCancel={endHold}
          onClick={(e) => e.detail === 0 && bump(-1)}
        >
          <MinusGlyph />
        </button>
        <div className="nf-box">
          <input
            id={id}
            className="nf-input"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            value={text}
            placeholder="--"
            aria-invalid={invalid || outOfRange}
            aria-describedby={`${hintId}${invalid || outOfRange ? ` ${msgId}` : ''}`}
            onChange={(e) => onType(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => typeof typed === 'number' && setText(format(typed, decimals))}
          />
          {unit && <span className="nf-unit mono">{unit}</span>}
        </div>
        <button
          type="button"
          className="nf-step"
          aria-label={`Increase ${label} by ${step}`}
          aria-controls={id}
          disabled={value !== null && value >= max}
          onPointerDown={onStepperDown(1)}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          onPointerCancel={endHold}
          onClick={(e) => e.detail === 0 && bump(1)}
        >
          <PlusGlyph />
        </button>
      </div>
      <BaselineBand value={typeof typed === 'number' && !outOfRange ? typed : null} baseline={baseline} min={scale.min} max={scale.max} />
      {(invalid || outOfRange) && (
        <p id={msgId} className="nf-msg">
          {invalid ? 'Not a number: check the entry. It will not be saved.' : `Outside ${min}-${max} ${unit}: check the entry. It will not be saved.`}
        </p>
      )}
      {!invalid && !outOfRange && children}
      <p id={hintId} className="nf-hint">
        {def.reference}
      </p>
    </div>
  );
}
