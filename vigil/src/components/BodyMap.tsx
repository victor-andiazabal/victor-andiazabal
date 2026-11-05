import { useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { View } from '../App';
import { BODY_SYSTEMS, HAZARDS, bodySystemById, type BodySystem, type BodySystemId } from '../data/bodySystems';
import { COUNTERMEASURES } from '../data/countermeasures';
import { indicatorById, symptomById } from '../data/indicators';
import { fmt, LEVEL_LABEL } from '../lib/format';
import { systemStatus, worstSystem, type SystemStatus } from '../lib/bodymap';
import { evaluate, type Evaluation } from '../lib/rules';
import type { IndicatorId, Level } from '../lib/types';
import { useStore } from '../state/store';
import { IconChevronRight } from './icons';
import { Pill, SourceLinks } from './ui';
import './bodymap.css';

type Go = (v: View, indicator?: IndicatorId) => void;
type StatusMap = Record<BodySystemId, SystemStatus>;

/* Figure geometry, front view, viewBox 0 0 200 440. Shared by the regions and the radiation halo. */
const CHEST = 'M70 90 Q100 82 130 90 Q138 94 138 106 Q138 138 132 164 L68 164 Q62 138 62 106 Q62 94 70 90 Z';
const ABDOMEN = 'M68 164 L132 164 Q135 198 131 228 Q100 242 69 228 Q65 198 68 164 Z';
const NECK = 'M90 68 L110 68 L112 88 L88 88 Z';
const HEART =
  'M118 134 C110 128 106 123 106 118.5 C106 114.5 109 112 112 112 C114.5 112 116.5 113.5 118 115.5 C119.5 113.5 121.5 112 124 112 C127 112 130 114.5 130 118.5 C130 123 126 128 118 134 Z';
const LIMBS = [
  'M66 98 Q54 104 52 132 L48 186 Q46 212 42 240',
  'M134 98 Q146 104 148 132 L152 186 Q154 212 158 240',
  'M85 230 L81 300 L78 362 L76 418 L66 422',
  'M115 230 L119 300 L122 362 L124 418 L134 422',
];
const VERTEBRAE = Array.from({ length: 13 }, (_, i) => 96 + i * 10);
const LYMPH_NODES: [number, number][] = [[71, 104], [129, 104], [84, 226], [116, 226]];

interface RegionProps {
  id: BodySystemId;
  status: StatusMap;
  active: BodySystemId | null;
  onPick?: (id: BodySystemId) => void;
  children: ReactNode;
}

/** One clickable body system. Without onPick (compact card) it is purely decorative. */
function Region({ id, status, active, onPick, children }: RegionProps) {
  const level = status[id].level;
  const cls = `bm-region ${level}${active === id ? ' is-selected' : ''}`;
  if (!onPick) return <g className={cls}>{children}</g>;
  const onKeyDown = (e: KeyboardEvent<SVGGElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPick(id);
    }
  };
  return (
    <g
      className={cls}
      role="button"
      tabIndex={0}
      aria-label={`${bodySystemById(id).label}: ${LEVEL_LABEL[level]}`}
      aria-pressed={active === id}
      onClick={() => onPick(id)}
      onKeyDown={onKeyDown}
    >
      {children}
    </g>
  );
}

function Figure({ status, active, onPick }: { status: StatusMap; active: BodySystemId | null; onPick?: (id: BodySystemId) => void }) {
  const r = { status, active, onPick };
  return (
    <svg viewBox="0 0 200 440" className="bm-svg" role={onPick ? 'group' : undefined} aria-label={onPick ? 'Body map figure' : undefined} aria-hidden={onPick ? undefined : true}>
      {/* Radiation halo: decorative outline tinted by the radiation status. Not interactive. */}
      <g className={`bm-halo ${status.skinRadiation.level}`} aria-hidden="true">
        <ellipse cx="100" cy="42" rx="23" ry="27" />
        <path d={CHEST} />
        <path d={ABDOMEN} />
        {LIMBS.map((d) => <path key={d} d={d} className="limb" />)}
      </g>
      <Region id="neuroBehavioral" {...r}>
        <ellipse className="bm-shape" cx="100" cy="42" rx="23" ry="27" />
        <path className="bm-icon-line" d="M84 30 Q92 20 100 28 Q108 20 116 30 M92 36 Q100 31 108 36" />
      </Region>
      <Region id="eyes" {...r}>
        {/* Hit area only over the eyes (36x10), so the centre of the head still selects the head. */}
        <rect x="82" y="42" width="36" height="10" rx="5" className="bm-hit" />
        <ellipse className="bm-shape" cx="91" cy="46.5" rx="5.5" ry="3.4" />
        <ellipse className="bm-shape" cx="109" cy="46.5" rx="5.5" ry="3.4" />
        <circle className="bm-icon" cx="91" cy="46.5" r="1.6" />
        <circle className="bm-icon" cx="109" cy="46.5" r="1.6" />
      </Region>
      <Region id="cardio" {...r}>
        <path className="bm-shape" d={CHEST} />
        <path className="bm-icon" d={HEART} />
      </Region>
      <Region id="metabolic" {...r}>
        <path className="bm-shape" d={ABDOMEN} />
        <path className="bm-icon-line" d="M110 178 Q122 180 120 194 Q118 206 104 204 Q94 203 96 212" />
      </Region>
      <Region id="musculoskeletal" {...r}>
        {LIMBS.map((d) => <path key={`e${d}`} d={d} className="bm-limb-edge" />)}
        {LIMBS.map((d) => <path key={`c${d}`} d={d} className="bm-limb-core" />)}
        {VERTEBRAE.map((y) => <rect key={y} className="bm-shape" x="96" y={y} width="8" height="6" rx="2" />)}
      </Region>
      <Region id="immune" {...r}>
        <path className="bm-shape" d={NECK} />
        {LYMPH_NODES.map(([cx, cy]) => <circle key={`${cx}-${cy}`} className="bm-shape" cx={cx} cy={cy} r="4.5" />)}
      </Region>
      <Region id="skinRadiation" {...r}>
        <rect className="bm-shape" x="76" y="110" width="17" height="21" rx="3" />
        <circle className="bm-icon-line" cx="84.5" cy="120.5" r="5" />
        <circle className="bm-icon" cx="84.5" cy="120.5" r="1.6" />
      </Region>
    </svg>
  );
}

function Legend() {
  const levels: Level[] = ['green', 'amber', 'red'];
  return (
    <div className="bm-legend" aria-label="Legend">
      {levels.map((l) => (
        <span key={l}><span className={`dot ${l}`} /> {LEVEL_LABEL[l]}</span>
      ))}
    </div>
  );
}

function IndicatorRows({ sys, ev, go }: { sys: BodySystem; ev: Evaluation; go: Go }) {
  if (!sys.indicators.length) {
    return <p className="muted">No daily measurement for this system; it is followed through the symptoms you report.</p>;
  }
  return (
    <ul className="bm-rows">
      {sys.indicators.map((id) => {
        const def = indicatorById(id);
        const s = ev.byIndicator[id];
        return (
          <li key={id}>
            <span className={`dot ${s.level}`} aria-hidden="true" />
            <span className="bm-row-label">{def.label}</span>
            <span className="mono">{fmt(id, s.value)} <small>{def.unit}</small></span>
            <button type="button" className="btn sm" onClick={() => go('trends', id)} aria-label={`Open ${def.label} trend`}>
              Trend
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function SystemDetail({ sys, st, ev, go }: { sys: BodySystem; st: SystemStatus; ev: Evaluation; go: Go }) {
  const reported = (ev.record?.symptoms ?? []).filter((s) => sys.symptoms.includes(s));
  return (
    <div className="panel bm-detail">
      <h2>
        {sys.label} <Pill level={st.level} />
      </h2>
      <p>{sys.function}</p>

      <h3>Today</h3>
      {st.findings.length === 0 && <p className="muted">Nothing flagged for this system today.</p>}
      {st.findings.map((f) => (
        <div key={f.id} className={`alert ${f.level}`}>
          <div className="head"><Pill level={f.level} /><h3>{f.title}</h3></div>
          <div className="why"><b>Why</b> {f.reason}</div>
        </div>
      ))}
      {st.findings.length > 0 && (
        <button type="button" className="btn sm" onClick={() => go('alerts')}>Open alerts for actions</button>
      )}

      <h3>Linked indicators</h3>
      <IndicatorRows sys={sys} ev={ev} go={go} />
      {sys.symptoms.length > 0 && (
        <p className="muted bm-symptoms">
          Symptoms tracked here: {sys.symptoms.map((s) => symptomById(s)?.label).join(', ')}.
          {reported.length > 0 && <> Reported today: <b>{reported.map((s) => symptomById(s)?.label).join(', ')}</b>.</>}
        </p>
      )}

      <h3>Spaceflight hazards</h3>
      <ul className="bm-hazards">
        {sys.hazards.map((h) => (
          <li key={h.id}>
            <span className="pill neutral">{HAZARDS[h.id].label}</span> {h.effect}
          </li>
        ))}
      </ul>

      <h3>Countermeasure checklists</h3>
      <ul className="bm-checklists">
        {sys.checklists.map((k) => <li key={k}>{COUNTERMEASURES[k]?.title ?? k}</li>)}
      </ul>

      <h3>Sources</h3>
      <SourceLinks ids={sys.sources} />
    </div>
  );
}

function summaryOf(status: StatusMap): string {
  const flagged = BODY_SYSTEMS.filter((s) => status[s.id].level !== 'green');
  if (!flagged.length) return 'All body systems nominal';
  return flagged.map((s) => `${s.label}: ${LEVEL_LABEL[status[s.id].level]}`).join('; ');
}

export function BodyMap({ go, compact = false }: { go: Go; compact?: boolean }) {
  const { selected, settings } = useStore();
  const ev = useMemo(() => evaluate(selected, settings), [selected, settings]);
  const status = useMemo(() => systemStatus(ev), [ev]);
  const [picked, setPicked] = useState<BodySystemId | null>(null);
  const active = picked ?? worstSystem(status);

  if (compact) {
    const summary = summaryOf(status);
    const worst = bodySystemById(active);
    const worstLevel = status[active].level;
    const others = BODY_SYSTEMS.filter((o) => o.id !== active && status[o.id].level !== 'green');
    return (
      <button type="button" className="bm-compact" onClick={() => go('body')} aria-label={`Open body map. ${summary}.`}>
        <Figure status={status} active={null} />
        <span className="bm-compact-text">
          <span className="bm-compact-worst">
            {worstLevel === 'green' ? 'All systems' : worst.label} <Pill level={worstLevel} />
          </span>
          {others.length > 0 && <span className="muted">Also {others.map((o) => `${o.label}: ${LEVEL_LABEL[status[o.id].level]}`).join('; ')}</span>}
          <span className="bm-compact-cta">Open body map <IconChevronRight size={16} /></span>
        </span>
      </button>
    );
  }

  const sys = bodySystemById(active);
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Body map · {selected.callsign}</h1>
          <p>
            Mission day {settings.currentDay}. Select a body region to see what it does, which spaceflight hazards act on it and how
            it is doing today. Colours regroup today's alerts by system; no extra thresholds are added.
          </p>
        </div>
      </div>
      <div className="bm-layout">
        <div className="panel bm-figure">
          <Figure status={status} active={active} onPick={setPicked} />
          <Legend />
          <ul className="bm-list" aria-label="Body systems">
            {BODY_SYSTEMS.map((s) => (
              <li key={s.id}>
                <button type="button" aria-pressed={s.id === active} onClick={() => setPicked(s.id)}>
                  <span className={`dot ${status[s.id].level}`} aria-hidden="true" />
                  {s.label}
                  <span className="lvl">{LEVEL_LABEL[status[s.id].level]}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <SystemDetail sys={sys} st={status[active]} ev={ev} go={go} />
      </div>
    </>
  );
}
