import { useMemo, useRef, useState, type FocusEvent, type KeyboardEvent, type ReactNode } from 'react';
import { LEVEL_LABEL } from '../lib/format';
import { evaluate } from '../lib/rules';
import type { Theme } from '../lib/views';
import { useStore } from '../state/store';
import { Segmented } from './controls/Segmented';
import { IconCommander, IconEva, IconHelp, IconMedic, IconScience, Logo } from './icons';

export type { Theme } from '../lib/views';

const THEMES = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

/** One role icon per crew seat; anything unknown falls back to the commander star. */
const ROLE_ICON: Record<string, () => ReactNode> = {
  cdr: () => <IconCommander />,
  fe1: () => <IconMedic />,
  fe2: () => <IconEva />,
  ms1: () => <IconScience />,
};

/** "CDR, pilot" -> "CDR": the seat code is the first token of the role. */
function shortCallsign(role: string, fallback: string): string {
  const code = role.split(',')[0]?.trim();
  return code || fallback;
}

const STEP: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

/**
 * Crew switcher as icon tabs (T4). Mechanism ported from "Tabs with Icons" by cnippet-dev (21st.dev id 24990),
 * rebuilt as a radio group, because it switches the whole app to another person rather than showing a panel.
 * Roving tabindex; arrow / Home / End keys move focus only, and Enter, Space or a click selects (manual
 * activation), so passing over a crew member never reloads every screen.
 */
function CrewTabs() {
  const { crew, selected, settings, dispatch } = useStore();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const levels = useMemo(() => Object.fromEntries(crew.map((c) => [c.id, evaluate(c, settings).overall])), [crew, settings]);
  const count = crew.length;
  const current = Math.max(0, crew.findIndex((c) => c.id === selected.id));
  // The key the arrows last moved to; it holds the tab stop until focus leaves the group.
  const [focused, setFocused] = useState<number | null>(null);
  const rove = focused ?? current;

  const choose = (i: number) => {
    setFocused(null);
    if (crew[i].id !== selected.id) dispatch({ type: 'select', crewId: crew[i].id });
  };

  const onKeyDown = (e: KeyboardEvent, i: number) => {
    let to: number | null = null;
    if (e.key in STEP) to = (i + STEP[e.key] + count) % count;
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = count - 1;
    if (to === null) return;
    e.preventDefault();
    setFocused(to);
    tabs.current[to]?.focus();
  };

  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(null);
  };

  return (
    <div role="radiogroup" aria-label="Crew member" className="crew-tabs" onBlur={onBlur}>
      {crew.map((c, i) => {
        const level = levels[c.id];
        const on = i === current;
        return (
          <button
            key={c.id}
            ref={(node) => {
              tabs.current[i] = node;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={`${c.callsign}, ${LEVEL_LABEL[level]}`}
            tabIndex={i === rove ? 0 : -1}
            title={`${c.callsign} · ${c.role}`}
            className="crew-tab"
            onClick={() => choose(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            <span className="crew-tab-icon" aria-hidden="true">{(ROLE_ICON[c.id] ?? ROLE_ICON.cdr)()}</span>
            <span className="crew-tab-call" aria-hidden="true">{shortCallsign(c.role, c.callsign)}</span>
            <span className={`dot ${level}`} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

interface TopBarProps {
  theme: Theme;
  setTheme: (t: Theme) => void;
  onHelp: () => void;
}

/** 64px bar: mark, crew tabs, mission day, tutorial, theme. */
export function TopBar({ theme, setTheme, onHelp }: TopBarProps) {
  const { settings } = useStore();
  return (
    <header className="topbar">
      <div className="brand">
        <Logo />
        <span className="brand-name">VIGIL</span>
      </div>
      <CrewTabs />
      <div className="topbar-spacer" />
      <span className="pill neutral day-pill mono" title="Mission day">
        <span className="sr-only">Mission </span>Day {settings.currentDay}
      </span>
      <button type="button" className="icon-btn" onClick={onHelp} aria-label="Show the tutorial">
        <IconHelp />
      </button>
      <div className="topbar-theme">
        <Segmented label="Theme" options={THEMES} value={theme} onChange={(v) => setTheme(v as Theme)} />
      </div>
    </header>
  );
}
