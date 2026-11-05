import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Alerts } from './components/Alerts';
import { CheckIn } from './components/CheckIn';
import { Ground } from './components/Ground';
import { Learn } from './components/Learn';
import { BottomBar, Rail } from './components/Nav';
import { ReactionTest } from './components/ReactionTest';
import { Routine } from './components/Routine';
import { Settings } from './components/Settings';
import { Today } from './components/Today';
import { TopBar, type Theme } from './components/TopBar';
import { Tour } from './components/Tour';
import { evaluate } from './lib/rules';
import { markTourSeen, tourSeen } from './lib/tour';
import type { IndicatorId } from './lib/types';
import { viewFromQuery, type View } from './lib/views';
import { useStore } from './state/store';
import './components/shell.css';

const Trends = lazy(() => import('./components/Trends').then((m) => ({ default: m.Trends })));
const BodyMap = lazy(() => import('./components/BodyMap').then((m) => ({ default: m.BodyMap })));

export type { View } from './lib/views';

function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem('vigil:theme') as Theme) || 'dark';
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

const startView = viewFromQuery(window.location.search);

export default function App() {
  const { selected, settings, acknowledged } = useStore();
  const [view, setView] = useState<View>(startView);
  const [trendIndicator, setTrendIndicator] = useState<IndicatorId | undefined>();
  // Only "Re-measure in 30 min" opens the check-in with an indicator; any other way in starts at step 1.
  const [checkinFocus, setCheckinFocus] = useState<IndicatorId | undefined>();
  const [theme, setTheme] = useTheme();
  // First run shows the tutorial, but not when a deep link (for example the ?view=ground console) opened the app.
  const [tourOpen, setTourOpen] = useState(() => startView === 'today' && !tourSeen());

  const go = (v: View, indicator?: IndicatorId) => {
    if (indicator) setTrendIndicator(indicator);
    if (v === 'checkin') setCheckinFocus(indicator);
    setView(v);
    window.scrollTo({ top: 0 });
  };

  const startTour = () => {
    go('today');
    setTourOpen(true);
  };
  const endTour = () => {
    markTourSeen();
    setTourOpen(false);
    go('today');
  };

  const ev = useMemo(() => evaluate(selected, settings), [selected, settings]);
  const openAlerts = ev.findings.filter((f) => !acknowledged[f.id]).length;
  const nav = { view, go, openAlerts, alertLevel: ev.overall };

  return (
    <div className="app">
      <TopBar theme={theme} setTheme={setTheme} onHelp={startTour} />
      <Rail {...nav} />

      <main id="main" className="main">
        <div className="main-inner">
          {view === 'today' && <Today go={go} />}
          {view === 'body' && (
            <Suspense fallback={<p className="muted">Loading body map…</p>}>
              <BodyMap go={go} />
            </Suspense>
          )}
          {view === 'checkin' && <CheckIn key={`${selected.id}:${settings.currentDay}:${checkinFocus ?? ''}`} go={go} focus={checkinFocus} />}
          {view === 'pvt' && <ReactionTest go={go} />}
          {view === 'trends' && (
            <Suspense fallback={<p className="muted">Loading charts…</p>}>
              <Trends key={trendIndicator ?? 'default'} initial={trendIndicator} />
            </Suspense>
          )}
          {view === 'alerts' && <Alerts />}
          {view === 'routine' && <Routine go={go} />}
          {view === 'ground' && <Ground go={go} />}
          {view === 'learn' && <Learn go={go} />}
          {view === 'settings' && <Settings theme={theme} setTheme={setTheme} onReplayTour={startTour} />}
        </div>
      </main>

      <BottomBar {...nav} />
      {tourOpen && <Tour onClose={endTour} go={go} />}
    </div>
  );
}
