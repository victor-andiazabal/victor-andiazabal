/*
 * Readout where only the digits that change slide (160ms, 6px, no blur); reduced motion swaps instantly.
 * Mechanism ported from "Animate Digits" by unlumen (21st.dev id 20071); rebuilt in plain React + CSS.
 */
import { useState } from 'react';
import './controls.css';

interface AnimateDigitsProps {
  value: string;
  className?: string;
}

const isDigit = (c: string) => c >= '0' && c <= '9';

interface CellState {
  char: string;
  prev: string | null;
  dir: 'up' | 'down';
  /** Bumped on every change so the entering and leaving spans remount and replay their animation. */
  n: number;
}

function Cell({ char }: { char: string }) {
  const [s, setS] = useState<CellState>({ char, prev: null, dir: 'up', n: 0 });
  // Adjusting state while rendering (React's documented pattern for "previous prop") keeps this effect-free.
  if (s.char !== char) {
    const up = isDigit(char) && isDigit(s.char) ? Number(char) > Number(s.char) : true;
    setS({ char, prev: s.char, dir: up ? 'up' : 'down', n: s.n + 1 });
  }
  if (!isDigit(s.char) || s.n === 0) return <span className="digit">{s.char}</span>;
  return (
    <span className="digit-cell">
      {s.prev !== null && (
        <span key={`out${s.n}`} className={`digit digit-out ${s.dir}`}>
          {s.prev}
        </span>
      )}
      <span key={`in${s.n}`} className={`digit digit-in ${s.dir}`}>
        {s.char}
      </span>
    </span>
  );
}

export function AnimateDigits({ value, className }: AnimateDigitsProps) {
  const chars = [...value];
  return (
    <span className={`digits${className ? ` ${className}` : ''}`}>
      <span className="sr-only">{value}</span>
      <span className="digits-row" aria-hidden="true">
        {/* Keyed from the right so the units digit keeps its cell when the length changes (99 to 100). */}
        {chars.map((c, i) => (
          <Cell key={chars.length - i} char={c} />
        ))}
      </span>
    </span>
  );
}
