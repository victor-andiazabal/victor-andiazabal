import { useStore } from '../state/store';
import { Segmented } from './controls/Segmented';
import { IconHelp, Logo } from './icons';

export type Theme = 'dark' | 'light';

const THEMES = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

interface TopBarProps {
  theme: Theme;
  setTheme: (t: Theme) => void;
  onHelp: () => void;
}

/** 64px bar: mark, crew member, mission day, tutorial, theme. */
export function TopBar({ theme, setTheme, onHelp }: TopBarProps) {
  const { crew, selected, settings, dispatch } = useStore();
  return (
    <header className="topbar">
      <div className="brand">
        <Logo />
        <span className="brand-name">VIGIL</span>
      </div>
      <div className="topbar-spacer" />
      <label className="sr-only" htmlFor="crew-select">Crew member</label>
      <select id="crew-select" className="crew-select" value={selected.id} onChange={(e) => dispatch({ type: 'select', crewId: e.target.value })}>
        {crew.map((c) => (
          <option key={c.id} value={c.id}>{c.callsign}</option>
        ))}
      </select>
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
