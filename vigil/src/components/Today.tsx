import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { ENVIRONMENTS, INDICATORS, type IndicatorDef } from '../data/indicators';
import { routineFor } from '../data/routine';
import { evaluate, trendOf } from '../lib/rules';
import { buildStatusHistory, groupTiles, nextAction, tileSpans } from '../lib/today';
import type { DayRecord, IndicatorId } from '../lib/types';
import type { View } from '../lib/views';
import { useStore } from '../state/store';
import { Avatar } from './Avatar';
import { IconChevronRight } from './icons';
import { IndicatorTile } from './IndicatorTile';
import { tileNote } from '../lib/words';
import { scenarioById } from '../lib/simulate';
import { StatusPanel } from './StatusPanel';
import { Disclaimer, Pill } from './ui';
import './today.css';

const BodyMap = lazy(() => import('./BodyMap').then((m) => ({ default: m.BodyMap })));

type Go = (v: View, indicator?: IndicatorId) => void;

const CAREER_LIMIT_MSV = 600;

/**
 * Last record Today showed per crew member and day. It lives outside the component because Today unmounts while the
 * check-in is open; when it mounts again and the record differs, the check-in was saved and the ring sweeps.
 */
const seenRecords = new Map<string, string>();

function useSaveSweep(crewId: string, day: number, record: DayRecord | null): number {
  const key = `${crewId}:${day}`;
  const sig = record ? JSON.stringify(record) : '';
  const [s, setS] = useState(() => {
    const prev = seenRecords.get(key);
    return { key, sig, n: prev !== undefined && prev !== sig ? 1 : 0 };
  });
  // Same person and day with a different record while mounted is also a save; a new person or day starts still.
  if (s.key !== key || s.sig !== sig) setS({ key, sig, n: s.key === key ? s.n + 1 : 0 });
  useEffect(() => {
    seenRecords.set(key, sig);
  }, [key, sig]);
  return s.key === key && s.sig === sig ? s.n : 0;
}

interface TileGroup {
  id: 'attention' | 'range' | 'unmeasured';
  title: string;
  defs: IndicatorDef[];
  /** Index of the group's first tile in reading order, for the refresh stagger. */
  offset: number;
  spans: { sm: number[]; lg: number[]; xl: number[] };
}

/**
 * Where each tile sat when the latest save sweep started. A tile that later moves group remounts under its new
 * heading; it refreshes only in the place it held at save time, so a move never replays the animation.
 */
function useRefreshPlacement(sweep: number, groups: TileGroup[]): Record<string, TileGroup['id']> {
  const placementOf = () => Object.fromEntries(groups.flatMap((g) => g.defs.map((d) => [d.id, g.id])));
  const [placed, setPlaced] = useState(() => ({ sweep, at: placementOf() }));
  if (placed.sweep !== sweep) setPlaced({ sweep, at: placementOf() });
  return placed.sweep === sweep ? placed.at : placementOf();
}

/** Needs attention first, then In range, then anything without a reading; empty groups are left out. */
function tileGroups(byIndicator: Parameters<typeof groupTiles>[1]): TileGroup[] {
  const g = groupTiles(INDICATORS, byIndicator);
  const parts = [
    { id: 'attention' as const, title: 'Needs attention', defs: g.attention },
    { id: 'range' as const, title: 'In range', defs: g.inRange },
    { id: 'unmeasured' as const, title: 'No reading today', defs: g.unmeasured },
  ].filter((p) => p.defs.length);
  let offset = 0;
  return parts.map((p) => {
    const n = p.defs.length;
    const group = { ...p, offset, spans: { sm: tileSpans(n, 2), lg: tileSpans(n, 3), xl: tileSpans(n, 4) } };
    offset += n;
    return group;
  });
}

export function Today({ go }: { go: Go }) {
  const { crew, selected, settings, manual, routineDone, dispatch } = useStore();
  const evals = useMemo(() => crew.map((c) => ({ crew: c, ev: evaluate(c, settings) })), [crew, settings]);
  const ev = evals.find((e) => e.crew.id === selected.id)!.ev;
  const history = useMemo(() => buildStatusHistory(selected, settings), [selected, settings]);
  const trends = useMemo(
    () => Object.fromEntries(INDICATORS.map((d) => [d.id, trendOf(selected, d.id, settings.currentDay)])) as Record<IndicatorId, ReturnType<typeof trendOf>>,
    [selected, settings.currentDay],
  );
  // The saved entry, not the evaluated record: only a save changes it, while the evaluation can differ between renders.
  const sweep = useSaveSweep(selected.id, settings.currentDay, manual[`${selected.id}:${settings.currentDay}`] ?? null);
  const env = ENVIRONMENTS[settings.environment];
  const action = nextAction({ crewId: selected.id, day: settings.currentDay, manual, routineDone, findings: ev.findings });

  const tasks = routineFor(settings.environment);
  const done = tasks.filter((t) => routineDone[`${selected.id}:${settings.currentDay}:${t.id}`]).length;
  const days = settings.currentDay;
  const meta = `${selected.name}, ${selected.callsign} · ${selected.agency} · ${days} ${days === 1 ? 'day' : 'days'} in space`;
  const surgeonNote = ev.notifySurgeon ? `The flight surgeon should hear about this. One-way delay to the ground: ${env.commDelay}.` : null;
  const others = evals.filter((e) => e.crew.id !== selected.id);
  const groups = useMemo(() => tileGroups(ev.byIndicator), [ev.byIndicator]);
  const refreshed = useRefreshPlacement(sweep, groups);

  return (
    <>
      <div className="today-top">
        <StatusPanel ev={ev} action={action} sweep={sweep} meta={meta} surgeonNote={surgeonNote} portrait={<Avatar crew={selected} size={28} />} go={go} />
        <section className="panel today-body" data-tour="bodymap" aria-labelledby="today-body-title">
          <h2 id="today-body-title">Body map</h2>
          <Suspense fallback={<p className="muted bm-fallback">Loading body map…</p>}>
            <BodyMap go={go} compact />
          </Suspense>
        </section>
      </div>

      <div className="mission-strip" aria-label="Mission context">
        <span className="pill neutral"><span className="k">where</span>{env.label}</span>
        <span className="pill neutral"><span className="k">gravity</span>{env.gravity}</span>
        <span className="pill neutral"><span className="k">signal to Earth</span>{env.commDelay} one way</span>
        <span className="pill neutral"><span className="k">scenario</span>{scenarioById(settings.scenario).label}</span>
        <span className="pill neutral sim">simulated crew, not real people</span>
      </div>

      <section className="today-section" aria-label="Indicators">
        {groups.map((g, gi) => (
          <div key={g.id} className="ind-group" role="group" aria-labelledby={`today-${g.id}-title`}>
            <div className="section-head">
              <h2 id={`today-${g.id}-title`}>
                {g.title} <span className="ind-count mono">{g.defs.length}</span>
              </h2>
              {gi === 0 && (
                <span className="section-hint">
                  <span className="legend-line"><span className="dot green" aria-hidden="true" /> normal for you <span className="dot amber" aria-hidden="true" /> keep an eye on it <span className="dot red" aria-hidden="true" /> do something now</span>
                  Tap a tile for its trend, the day bars for the last 14 days, or <b>i</b> for what it measures.
                </span>
              )}
            </div>
            <div className="ind-grid">
              {g.defs.map((def, i) => {
                const order = g.offset + i;
                return (
                  <IndicatorTile
                    key={sweep ? `${def.id}:${sweep}` : def.id}
                    def={def}
                    status={ev.byIndicator[def.id]}
                    days={history[def.id]}
                    trend={trends[def.id]}
                    order={order}
                    refresh={sweep > 0 && refreshed[def.id] === g.id}
                    note={tileNote(def, ev.byIndicator[def.id], settings.environment)}
                    tourAnchor={order === 0}
                    attention={g.id === 'attention'}
                    spans={{ sm: g.spans.sm[i], lg: g.spans.lg[i], xl: g.spans.xl[i] }}
                    onOpen={() => go('trends', def.id)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <div className="today-bottom">
        <section className="panel" aria-labelledby="today-crew-title">
          <h2 id="today-crew-title">Crew</h2>
          <div className="crew-strip">
            {others.map(({ crew: c, ev: e }) => (
              <button key={c.id} type="button" className="crew-chip" onClick={() => dispatch({ type: 'select', crewId: c.id })} aria-label={`Show ${c.name}, ${c.callsign}`}>
                <Avatar crew={c} size={32} />
                <span className="crew-chip-who">
                  <span className="crew-chip-name">{c.name}</span>
                  <span className="crew-chip-role">{c.callsign} · {c.agency}</span>
                </span>
                <Pill level={e.overall} />
              </button>
            ))}
          </div>
        </section>
        <section className="panel today-mission" aria-labelledby="today-mission-title">
          <h2 id="today-mission-title">Mission</h2>
          <p className="mission-env">
            <span>Environment</span>
            <span>{env.label}</span>
          </p>
          <button type="button" className="mission-row" onClick={() => go('routine')}>
            <span>Today's routine</span>
            <span className="mono">{done} of {tasks.length}</span>
            <IconChevronRight />
          </button>
          <button type="button" className="mission-row" onClick={() => go('trends', 'radDose')}>
            <span>Mission dose</span>
            <span className="mono">{ev.cumulativeDoseMsv.toFixed(1)} of {CAREER_LIMIT_MSV} mSv</span>
            <IconChevronRight />
          </button>
        </section>
      </div>
      <Disclaimer />
    </>
  );
}
