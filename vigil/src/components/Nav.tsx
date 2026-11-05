import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
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
    <span className={`nav-badge ${level} mono`}>
      {count}
      <span className="sr-only"> open alerts</span>
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
  const barRef = useRef<HTMLElement>(null);
  const inSheet = IN_SHEET.some((n) => n.id === view);

  const returnFocus = useRef(false);
  const close = () => {
    returnFocus.current = true;
    setSheet(false);
  };

  // A modal sheet: the page behind it is inert, Tab cycles inside it, and Escape closes it and gives focus back to
  // More. The bottom bar stays live because it sits above the scrim and More (or any destination) closes the sheet.
  useEffect(() => {
    if (!sheet) return;
    const bar = barRef.current;
    const more = moreRef.current;
    const behind = bar?.parentElement ? Array.from(bar.parentElement.children).filter((el): el is HTMLElement => el !== bar && el instanceof HTMLElement) : [];
    for (const el of behind) el.inert = true;
    sheetRef.current?.querySelector<HTMLElement>('button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        returnFocus.current = true;
        setSheet(false);
        return;
      }
      if (e.key !== 'Tab') return;
      const items = sheetRef.current?.querySelectorAll<HTMLElement>('button');
      if (!items?.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!sheetRef.current?.contains(active) || (e.shiftKey && active === first)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      for (const el of behind) el.inert = false;
      if (returnFocus.current) {
        returnFocus.current = false;
        more?.focus();
      }
    };
  }, [sheet]);

  const pick = (id: View) => {
    if (id === view) {
      close(); // same screen: nothing re-renders the page, so focus goes back to More
      return;
    }
    setSheet(false);
    go(id); // a new screen moves focus to its heading
  };

  return (
    <>
      <nav ref={barRef} className="bottombar" aria-label="Main">
        {BOTTOM.map((id) => {
          const n = PRIMARY.find((p) => p.id === id)!;
          const { Icon } = n;
          return (
            <button key={id} type="button" className="bb-item" aria-current={view === id ? 'page' : undefined} data-tour={n.tour} onClick={() => { setSheet(false); go(id); }}>
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
      {sheet && createPortal(
        <div className="sheet-layer">
          {/* Pointer shortcut only; keyboard users close with Escape. */}
          <div className="sheet-scrim" aria-hidden="true" role="presentation" onClick={close} />
          <div id="more-sheet" ref={sheetRef} className="sheet" role="dialog" aria-modal="true" aria-label="More">
            {IN_SHEET.map((n) => {
              const { Icon } = n;
              return (
                <button key={n.id} type="button" className="rail-row" aria-current={view === n.id ? 'page' : undefined} onClick={() => pick(n.id)}>
                  <Icon />
                  <span>{n.label}</span>
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
