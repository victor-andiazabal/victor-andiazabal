import { useMemo, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { LEVEL_LABEL } from '../lib/format';
import { evaluate } from '../lib/rules';
import { useStore } from '../state/store';
import { Segmented } from './controls/Segmented';
import { IconCommander, IconEva, IconHelp, IconMedic, IconScience, Logo } from './icons';

export type Theme = 'dark' | 'light';

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
 * rebuilt as a plain React tablist: roving tabindex, arrow / Home / End keys, selection follows focus.
 */
function CrewTabs() {
  const { crew, selected, settings, dispatch } = useStore();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const levels = useMemo(() => Object.fromEntries(crew.map((c) => [c.id, evaluate(c, settings).overall])), [crew, settings]);
  const count = crew.length;
  const current = Math.max(0, crew.findIndex((c) => c.id === selected.id));

  const choose = (i: number) => {
    tabs.current[i]?.focus();
    if (crew[i].id !== selected.id) dispatch({ type: 'select', crewId: crew[i].id });
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

  return (
    <div role="tablist" aria-label="Crew member" className="crew-tabs">
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
            role="tab"
            id={`crew-tab-${c.id}`}
            aria-selected={on}
            aria-controls="main"
            aria-label={`${c.callsign}, ${LEVEL_LABEL[level]}`}
            tabIndex={on ? 0 : -1}
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
