/*
 * Progress rail for the stepped check-in: numbered square markers joined by a 2px rail that fills as you advance,
 * visited steps clickable, arrow keys move between them, the position announced politely.
 * Mechanism ported from "Wizard Steps" by ddoemonn (21st.dev id 23576); rebuilt in plain React + CSS, no motion library.
 */
import { useRef, type KeyboardEvent } from 'react';
import type { StepDef } from './steps';

interface StepRailProps {
  steps: StepDef[];
  index: number;
  /** Furthest step reached; markers up to it are clickable. */
  furthest: number;
  onGo(index: number): void;
}

function CheckGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M4.5 10.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StepRail({ steps, index, furthest, onGo }: StepRailProps) {
  const list = useRef<HTMLOListElement>(null);
  const total = steps.length;

  const go = (to: number) => {
    onGo(to);
    // Move focus with the selection, as the original does for keyboard travel along the rail.
    requestAnimationFrame(() => list.current?.querySelector<HTMLButtonElement>(`button[data-step="${to}"]`)?.focus());
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const moves: Record<string, number> = { ArrowRight: index + 1, ArrowDown: index + 1, ArrowLeft: index - 1, ArrowUp: index - 1, Home: 0, End: furthest };
    if (!(e.key in moves)) return;
    e.preventDefault();
    const to = Math.max(0, Math.min(furthest, moves[e.key]));
    if (to !== index) go(to);
  };

  return (
    <div className="ci-rail">
      <p className="ci-rail-meta mono">
        <span>about 2 min</span>
        <span aria-hidden="true">·</span>
        <span>
          Step {index + 1} of {total}
        </span>
      </p>
      <p className="sr-only" aria-live="polite">
        {`Step ${index + 1} of ${total}: ${steps[index].label}`}
      </p>
      <ol ref={list} className="ci-rail-list" aria-label="Check-in steps">
        {steps.map((s, i) => {
          const done = i < index;
          const here = i === index;
          const reachable = i <= furthest;
          const marker = (
            <span className={`ci-marker${done ? ' is-done' : ''}${here ? ' is-here' : ''}`} aria-hidden="true">
              {done ? <CheckGlyph /> : i + 1}
            </span>
          );
          return (
            <li key={s.id} className="ci-rail-item">
              {reachable ? (
                <button
                  type="button"
                  className="ci-rail-btn"
                  data-step={i}
                  tabIndex={here ? 0 : -1}
                  aria-current={here ? 'step' : undefined}
                  aria-label={`Step ${i + 1} of ${total}: ${s.label}${done ? ', done' : ''}`}
                  onClick={() => !here && go(i)}
                  onKeyDown={onKeyDown}
                >
                  {marker}
                  <span className="ci-rail-label">{s.label}</span>
                </button>
              ) : (
                <span className="ci-rail-btn is-locked">
                  <span className="sr-only">{`Step ${i + 1} of ${total}: ${s.label}`}</span>
                  {marker}
                  <span className="ci-rail-label" aria-hidden="true">
                    {s.label}
                  </span>
                </span>
              )}
              {i < total - 1 && (
                <span className="ci-rail-line" aria-hidden="true">
                  <span className={`ci-rail-fill${i < index ? ' is-full' : ''}`} />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
