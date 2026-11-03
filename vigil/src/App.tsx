import { useEffect, useMemo, useState } from 'react';
import { Alerts } from './components/Alerts';
import { CheckIn } from './components/CheckIn';
import { Dashboard } from './components/Dashboard';
import { Learn } from './components/Learn';
import { ReactionTest } from './components/ReactionTest';
import { Routine } from './components/Routine';
import { Settings } from './components/Settings';
import { Trends } from './components/Trends';
import { evaluate } from './lib/rules';
import type { IndicatorId } from './lib/types';
import { useStore } from './state/store';

export type View = 'dashboard' | 'checkin' | 'pvt' | 'trends' | 'alerts' | 'routine' | 'learn' | 'settings';

const NAV: { id: View; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '◉' },
  { id: 'checkin', label: 'Check-in', icon: '✎' },
  { id: 'pvt', label: 'Reaction test', icon: '⚡' },
  { id: 'trends', label: 'Trends', icon: '📈' },
  { id: 'alerts', label: 'Alerts', icon: '⚠' },
  { id: 'routine', label: 'Routine', icon: '☑' },
  { id: 'learn', label: 'Learn', icon: '📖' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return (localStorage.getItem('vigil:theme') as 'dark' | 'light') || 'dark';
    } catch {
      return 'dark';
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('vigil:theme', theme); } catch { /* ignore */ }
  }, [theme]);
  return [theme, setTheme] as const;
}

export default function App() {
  const { crew, selected, settings, dispatch, acknowledged } = useStore();
  const [view, setView] = useState<View>('dashboard');
  const [trendIndicator, setTrendIndicator] = useState<IndicatorId | undefined>();
  const [theme, setTheme] = useTheme();

  const go = (v: View, indicator?: IndicatorId) => {
    if (indicator) setTrendIndicator(indicator);
    setView(v);
    window.scrollTo({ top: 0 });
  };

  const ev = useMemo(() => evaluate(selected, settings), [selected, settings]);
  const openAlerts = ev.findings.filter((f) => !acknowledged[f.id]).length;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <svg className="logo" viewBox="0 0 32 32" aria-hidden="true">
            <circle cx="16" cy="16" r="14" fill="none" stroke="var(--accent)" strokeWidth="2.5" />
            <path d="M6 17 L11 17 L13 11 L16 23 L19 14 L21 17 L26 17" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>VIGIL</span>
          <small className="muted">crew health self-assessment</small>
        </div>
        <div className="spacer" />
        <label className="muted" style={{ fontSize: 13 }} htmlFor="crew-select">Crew member</label>
        <select id="crew-select" value={selected.id} onChange={(e) => dispatch({ type: 'select', crewId: e.target.value })}>
          {crew.map((c) => (
            <option key={c.id} value={c.id}>{c.callsign}</option>
          ))}
        </select>
        <span className={`pill ${ev.overall}`}><span className={`dot ${ev.overall}`} />day {settings.currentDay}</span>
      </header>

      <nav className="sidenav" aria-label="Main">
        {NAV.map((n) => (
          <button key={n.id} className={view === n.id ? 'active' : ''} onClick={() => go(n.id)}>
            <span aria-hidden="true">{n.icon}</span>
            {n.label}
            {n.id === 'alerts' && openAlerts > 0 && <span className={`pill ${ev.overall} badge`}>{openAlerts}</span>}
          </button>
        ))}
        <div className="foot">
          NASA Space Apps 2026<br />Les Tigres de Bethesda
        </div>
      </nav>

      <nav className="mobile-nav" aria-label="Main (mobile)">
        {NAV.map((n) => (
          <button key={n.id} className={view === n.id ? 'active' : ''} onClick={() => go(n.id)}>
            {n.label}{n.id === 'alerts' && openAlerts > 0 ? ` (${openAlerts})` : ''}
          </button>
        ))}
      </nav>

      <main>
        {view === 'dashboard' && <Dashboard go={go} />}
        {view === 'checkin' && <CheckIn key={`${selected.id}:${settings.currentDay}`} go={go} />}
        {view === 'pvt' && <ReactionTest go={go} />}
        {view === 'trends' && <Trends key={trendIndicator ?? 'default'} initial={trendIndicator} />}
        {view === 'alerts' && <Alerts />}
        {view === 'routine' && <Routine go={go} />}
        {view === 'learn' && <Learn />}
        {view === 'settings' && <Settings theme={theme} setTheme={setTheme} />}
      </main>
    </div>
  );
}
