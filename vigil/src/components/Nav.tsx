import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import type { Level } from '../lib/types';
import type { View } from '../lib/views';
import {
  IconAlerts, IconBody, IconCheckin, IconGround, IconLearn, IconMore, IconReaction, IconRoutine, IconSettings, IconToday, IconTrends,
} from './icons';

interface NavItem {
  id: View;
  label: string;
  /** Shorter label for the bottom bar. */
  short?: string;
  Icon: ComponentType<{ size?: number }>;
  /** Tutorial anchor (see Tour.tsx). */
  tour?: string;
}

const PRIMARY: NavItem[] = [
  { id: 'today', label: 'Today', Icon: IconToday },
  { id: 'checkin', label: 'Check-in', Icon: IconCheckin, tour: 'nav-checkin' },
  { id: 'body', label: 'Body map', short: 'Body', Icon: IconBody },
  { id: 'trends', label: 'Trends', Icon: IconTrends },
  { id: 'alerts', label: 'Alerts', Icon: IconAlerts, tour: 'nav-alerts' },
];
const SECONDARY: NavItem[] = [
  { id: 'routine', label: 'Routine', Icon: IconRoutine },
  { id: 'pvt', label: 'Reaction test', Icon: IconReaction },
  { id: 'ground', label: 'Ground view', Icon: IconGround, tour: 'nav-ground' },
  { id: 'learn', label: 'Learn', Icon: IconLearn },
  { id: 'settings', label: 'Settings', Icon: IconSettings },
];
const BOTTOM: View[] = ['today', 'checkin', 'body', 'alerts'];
const IN_SHEET = [...PRIMARY, ...SECONDARY].filter((n) => !BOTTOM.includes(n.id));

interface NavProps {
  view: View;
  go: (v: View) => void;
  openAlerts: number;
  alertLevel: Level;
}

function Badge({ count, level }: { count: number; level: Level }) {
  if (count <= 0) return null;
  return (
    <span className={`nav-badge ${level} mono`} aria-label={`${count} open`}>
      {count}
    </span>
  );
}

function RailRow({ item, view, go, badge }: { item: NavItem; view: View; go: (v: View) => void; badge?: ReactNode }) {
  const { Icon } = item;
  return (
    <button type="button" className="rail-row" aria-current={view === item.id ? 'page' : undefined} data-tour={item.tour} onClick={() => go(item.id)}>
      <Icon />
      <span>{item.label}</span>
      {badge}
    </button>
  );
}

/** Left rail, shown at 1024px and wider. */
export function Rail({ view, go, openAlerts, alertLevel }: NavProps) {
  const badge = (id: View) => (id === 'alerts' ? <Badge count={openAlerts} level={alertLevel} /> : undefined);
  return (
    <nav className="rail" aria-label="Main">
      {PRIMARY.map((n) => <RailRow key={n.id} item={n} view={view} go={go} badge={badge(n.id)} />)}
      <hr className="rail-rule" />
      {SECONDARY.map((n) => <RailRow key={n.id} item={n} view={view} go={go} />)}
      <p className="rail-foot">NASA Space Apps 2026<br />Les Tigres de Bethesda</p>
    </nav>
  );
}

/** Bottom bar under 1024px: four destinations plus More, which opens a sheet with the rest. */
export function BottomBar({ view, go, openAlerts, alertLevel }: NavProps) {
  const [sheet, setSheet] = useState(false);
  const moreRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const inSheet = IN_SHEET.some((n) => n.id === view);

  const close = () => {
    setSheet(false);
    moreRef.current?.focus();
  };

  useEffect(() => {
    if (!sheet) return;
    sheetRef.current?.querySelector<HTMLElement>('button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSheet(false);
        moreRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheet]);

  return (
    <>
      <nav className="bottombar" aria-label="Main">
        {BOTTOM.map((id) => {
          const n = PRIMARY.find((p) => p.id === id)!;
          const { Icon } = n;
          return (
            <button key={id} type="button" className="bb-item" aria-current={view === id ? 'page' : undefined} data-tour={n.tour} onClick={() => go(id)}>
              <span className="bb-icon"><Icon />{id === 'alerts' && <Badge count={openAlerts} level={alertLevel} />}</span>
              <span>{n.short ?? n.label}</span>
            </button>
          );
        })}
        <button
          ref={moreRef}
          type="button"
          className="bb-item"
          aria-current={inSheet ? 'page' : undefined}
          aria-expanded={sheet}
          aria-controls="more-sheet"
          data-tour="nav-ground"
          onClick={() => setSheet((s) => !s)}
        >
          <span className="bb-icon"><IconMore /></span>
          <span>More</span>
        </button>
      </nav>
      {sheet && (
        <div className="sheet-layer">
          <div className="sheet-scrim" onClick={close} />
          <div id="more-sheet" ref={sheetRef} className="sheet" role="dialog" aria-modal="true" aria-label="More">
            {IN_SHEET.map((n) => {
              const { Icon } = n;
              return (
                <button key={n.id} type="button" className="rail-row" aria-current={view === n.id ? 'page' : undefined} onClick={() => { setSheet(false); go(n.id); }}>
                  <Icon />
                  <span>{n.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
