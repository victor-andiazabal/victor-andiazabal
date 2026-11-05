import { useEffect, useMemo, useRef, useState } from 'react';
import { PVT_TASK_ID } from '../data/routine';
import { evaluate } from '../lib/rules';
import { isCheckin } from '../lib/today';
import { useStore } from '../state/store';
import { BtnTrail, SourceLinks } from './ui';
import type { View } from '../lib/views';
import './screens.css';
import './reaction.css';

const TEST_SECONDS = 60;
const LAPSE_MS = 355; // PVT-B lapse threshold (Basner, Mollicone and Dinges 2011)
const MIN_ISI = 1000;
const MAX_ISI = 4000; // PVT-B uses 1-4 s inter-stimulus intervals

const RESPONSE_GAP_MS = 600; // pause after a response before the next wait starts
const FALSE_START_GAP_MS = 800; // longer pause after a false start, so "Too early" can be read

type Phase = 'idle' | 'armed' | 'go' | 'false' | 'done';

/** Every timer the test runs, one handle each, so a new run or leaving the screen clears them all. */
interface Timers {
  isi: number | null;
  tick: number | null;
  counter: number | null;
  end: number | null;
  gap: number | null;
}

const NO_TIMERS: Timers = { isi: null, tick: null, counter: null, end: null, gap: null };

function clearAll(t: Timers): Timers {
  for (const id of Object.values(t)) {
    if (id !== null) {
      window.clearTimeout(id);
      window.clearInterval(id);
    }
  }
  return NO_TIMERS;
}

/** What the target zone says in each phase: a word, so the state never rests on colour. */
function stageCopy(phase: Phase, running: boolean, display: string): { word: string; readout: string } {
  const ms = /^\d+$/.test(display) ? `${display} ms` : '·';
  if (phase === 'done') return { word: 'Test finished', readout: ms };
  if (!running) return { word: 'Press start', readout: '·' };
  if (phase === 'go') return { word: 'Tap', readout: ms };
  if (phase === 'false') return { word: 'Too early', readout: '·' };
  if (phase === 'armed') return { word: 'Wait', readout: '·' };
  return { word: 'Last response', readout: ms };
}

export function ReactionTest({ go }: { go: (v: View) => void }) {
  const { selected, settings, dispatch } = useStore();
  const [phase, setPhase] = useState<Phase>('idle');
  const [rts, setRts] = useState<number[]>([]);
  const [falseStarts, setFalseStarts] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [display, setDisplay] = useState('');
  const [saved, setSaved] = useState(false);

  const startedAt = useRef(0);
  const stimulusAt = useRef(0);
  const timers = useRef<Timers>(NO_TIMERS);
  const phaseRef = useRef<Phase>('idle');
  const runningRef = useRef(false);
  const mounted = useRef(true);
  const setPhaseBoth = (p: Phase) => { phaseRef.current = p; setPhase(p); };
  const setTimer = (name: keyof Timers, id: number | null) => { timers.current = { ...timers.current, [name]: id }; };
  const clearTimer = (name: keyof Timers) => {
    const id = timers.current[name];
    if (id !== null) { window.clearTimeout(id); window.clearInterval(id); }
    setTimer(name, null);
  };

  const scheduleStimulus = () => {
    if (!mounted.current || !runningRef.current) return;
    clearTimer('isi');
    clearTimer('counter');
    clearTimer('gap');
    const isi = MIN_ISI + Math.random() * (MAX_ISI - MIN_ISI);
    setPhaseBoth('armed');
    setDisplay('');
    setTimer('isi', window.setTimeout(() => {
      stimulusAt.current = performance.now();
      setPhaseBoth('go');
      setTimer('counter', window.setInterval(() => {
        setDisplay(String(Math.round(performance.now() - stimulusAt.current)));
      }, 16));
    }, isi));
  };

  /** The next wait starts after a short pause: one pending pause at most, cleared with every other timer. */
  const scheduleAfter = (ms: number) => {
    clearTimer('gap');
    setTimer('gap', window.setTimeout(() => {
      setTimer('gap', null);
      scheduleStimulus();
    }, ms));
  };

  const start = () => {
    timers.current = clearAll(timers.current);
    setRts([]);
    setFalseStarts(0);
    setElapsed(0);
    setSaved(false);
    startedAt.current = performance.now();
    runningRef.current = true;
    setTimer('tick', window.setInterval(() => setElapsed((performance.now() - startedAt.current) / 1000), 200));
    setTimer('end', window.setTimeout(() => {
      timers.current = clearAll(timers.current);
      runningRef.current = false;
      setPhaseBoth('done');
    }, TEST_SECONDS * 1000));
    scheduleStimulus();
  };

  const respond = () => {
    const p = phaseRef.current;
    if (p === 'go') {
      const rt = performance.now() - stimulusAt.current;
      clearTimer('counter');
      setRts((r) => [...r, rt]);
      setDisplay(String(Math.round(rt)));
      setPhaseBoth('idle');
      scheduleAfter(RESPONSE_GAP_MS);
    } else if (p === 'armed') {
      clearTimer('isi');
      setFalseStarts((n) => n + 1);
      setDisplay('too early');
      setPhaseBoth('false');
      scheduleAfter(FALSE_START_GAP_MS);
    }
  };

  // The window listener is added once and calls the latest respond through a ref.
  const respondRef = useRef(respond);
  useEffect(() => {
    respondRef.current = respond;
  });

  useEffect(() => {
    mounted.current = true;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && runningRef.current) { e.preventDefault(); respondRef.current(); }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      mounted.current = false;
      runningRef.current = false;
      window.removeEventListener('keydown', onKey);
      timers.current = clearAll(timers.current);
    };
  }, []);

  const mean = rts.length ? rts.reduce((a, b) => a + b, 0) / rts.length : 0;
  const lapses = rts.filter((r) => r >= LAPSE_MS).length;
  const median = rts.length ? [...rts].sort((a, b) => a - b)[Math.floor(rts.length / 2)] : 0;
  const running = phase !== 'idle' && phase !== 'done' ? true : elapsed > 0 && phase !== 'done';

  const ev = useMemo(() => evaluate(selected, settings), [selected, settings]);
  const b = ev.byIndicator.pvtRt.baseline;

  const save = () => {
    const today = selected.records.find((r) => r.day === settings.currentDay);
    dispatch({
      type: 'manual',
      crewId: selected.id,
      record: {
        day: settings.currentDay,
        values: { ...(today?.values ?? {}), pvtRt: Math.round(mean), pvtLapses: lapses },
        symptoms: today?.symptoms ?? [],
        notes: today?.notes,
        // On top of a check-in it stays one; on its own it is a reaction-test record and the check-in is still due.
        source: isCheckin(today) ? 'manual' : 'pvt',
      },
    });
    // The check-in prefills pvtRt from the simulated wearable, so the badge counts this tick instead of the value.
    dispatch({ type: 'routine', key: `${selected.id}:${settings.currentDay}:${PVT_TASK_ID}`, done: true });
    setSaved(true);
  };

  const copy = stageCopy(phase, running, display);
  const stats = [
    { n: String(rts.length), label: 'responses' },
    { n: rts.length ? String(Math.round(mean)) : '--', label: 'mean ms' },
    { n: rts.length ? String(Math.round(median)) : '--', label: 'median ms' },
    { n: String(lapses), label: `lapses ≥ ${LAPSE_MS} ms` },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Reaction self-test</h1>
          <p>
            A 60-second version of the brief psychomotor vigilance test (PVT-B) ISS crews run as the Reaction Self Test. Tap the box or press
            Space as soon as the counter appears.
          </p>
        </div>
      </div>

      <div className="split">
        <div>
          <div
            className={`pvt-stage ${phase}${running ? ' live' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={`Reaction test area. ${copy.word}`}
            onPointerDown={(e) => { e.preventDefault(); if (running) respond(); }}
          >
            <span className="pvt-word">{copy.word}</span>
            <span className="pvt-readout mono">{copy.readout}</span>
            {phase === 'false' && <span className="pvt-sub">Wait for the counter, then tap</span>}
          </div>
          <div className="pvt-actions">
            {!running && phase !== 'done' && (
              <button type="button" className="btn-primary" onClick={start}>Start 60 s test<BtnTrail /></button>
            )}
            {phase === 'done' && (
              <>
                <button type="button" className="btn-primary" onClick={save} disabled={rts.length === 0}>{saved ? 'Result saved for today' : 'Save result'}<BtnTrail icon="check" /></button>
                <button type="button" className="btn" onClick={start}>Run again</button>
                {saved && <button type="button" className="btn" onClick={() => go('today')}>Back to Today</button>}
              </>
            )}
            <span className="muted mono pvt-clock">{Math.min(TEST_SECONDS, elapsed).toFixed(0)} / {TEST_SECONDS} s</span>
          </div>
          <dl className="pvt-stats">
            {stats.map((s) => (
              <div key={s.label} className="pvt-stat">
                <dt>{s.label}</dt>
                <dd className="mono">{s.n}</dd>
              </div>
            ))}
          </dl>
          {falseStarts > 0 && <p className="small-note">{falseStarts} false start{falseStarts > 1 ? 's' : ''} (pressed before the counter).</p>}
        </div>
        <div className="panel">
          <h2>How to read it</h2>
          <p>
            Your pre-flight baseline: <b className="mono">{b ? `${Math.round(b.median)} ms` : 'not available'}</b>
            {b && <span className="mono"> (typical spread ±{Math.round(b.mad)} ms)</span>}.
          </p>
          <p>
            Response time slows and lapses increase with sleep loss, often before you feel tired. VIGIL flags a mean 15% slower than your
            baseline as Watch, and 35% slower or 6 extra lapses as Act now.
          </p>
          <p className="small-note">
            The full PVT-B lasts 3 minutes; this 60-second version is for the prototype and keeps the same 355 ms lapse threshold and 1-4 s
            random wait.
          </p>
          <SourceLinks ids={['pvt-b', 'reaction-self-test']} />
        </div>
      </div>
    </>
  );
}
