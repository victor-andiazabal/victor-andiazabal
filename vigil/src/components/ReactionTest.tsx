import { useEffect, useRef, useState } from 'react';
import { evaluate } from '../lib/rules';
import { useStore } from '../state/store';
import { SourceLinks } from './ui';
import type { View } from '../App';

const TEST_SECONDS = 60;
const LAPSE_MS = 355; // PVT-B lapse threshold (Basner, Mollicone and Dinges 2011)
const MIN_ISI = 1000;
const MAX_ISI = 4000; // PVT-B uses 1-4 s inter-stimulus intervals

type Phase = 'idle' | 'armed' | 'go' | 'false' | 'done';

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
  const isiTimer = useRef<number | null>(null);
  const tick = useRef<number | null>(null);
  const counter = useRef<number | null>(null);
  const endTimer = useRef<number | null>(null);
  const phaseRef = useRef<Phase>('idle');
  const runningRef = useRef(false);
  const setPhaseBoth = (p: Phase) => { phaseRef.current = p; setPhase(p); };

  const clearTimers = () => {
    for (const r of [isiTimer, tick, counter, endTimer]) {
      if (r.current !== null) { window.clearTimeout(r.current); window.clearInterval(r.current); r.current = null; }
    }
  };

  const scheduleStimulus = () => {
    const isi = MIN_ISI + Math.random() * (MAX_ISI - MIN_ISI);
    setPhaseBoth('armed');
    setDisplay('');
    isiTimer.current = window.setTimeout(() => {
      stimulusAt.current = performance.now();
      setPhaseBoth('go');
      counter.current = window.setInterval(() => {
        setDisplay(String(Math.round(performance.now() - stimulusAt.current)));
      }, 16);
    }, isi);
  };

  const start = () => {
    clearTimers();
    setRts([]);
    setFalseStarts(0);
    setElapsed(0);
    setSaved(false);
    startedAt.current = performance.now();
    runningRef.current = true;
    tick.current = window.setInterval(() => setElapsed((performance.now() - startedAt.current) / 1000), 200);
    endTimer.current = window.setTimeout(() => {
      clearTimers();
      runningRef.current = false;
      setPhaseBoth('done');
    }, TEST_SECONDS * 1000);
    scheduleStimulus();
  };

  const respond = () => {
    const p = phaseRef.current;
    if (p === 'go') {
      const rt = performance.now() - stimulusAt.current;
      if (counter.current !== null) { window.clearInterval(counter.current); counter.current = null; }
      setRts((r) => [...r, rt]);
      setDisplay(String(Math.round(rt)));
      setPhaseBoth('idle');
      window.setTimeout(() => { if (phaseRef.current !== 'done') scheduleStimulus(); }, 600);
    } else if (p === 'armed') {
      if (isiTimer.current !== null) { window.clearTimeout(isiTimer.current); isiTimer.current = null; }
      setFalseStarts((n) => n + 1);
      setDisplay('too early');
      setPhaseBoth('false');
      window.setTimeout(() => { if (phaseRef.current !== 'done') scheduleStimulus(); }, 800);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && runningRef.current) { e.preventDefault(); respond(); }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); clearTimers(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mean = rts.length ? rts.reduce((a, b) => a + b, 0) / rts.length : 0;
  const lapses = rts.filter((r) => r >= LAPSE_MS).length;
  const median = rts.length ? [...rts].sort((a, b) => a - b)[Math.floor(rts.length / 2)] : 0;
  const running = phase !== 'idle' && phase !== 'done' ? true : elapsed > 0 && phase !== 'done';

  const ev = evaluate(selected, settings);
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
        source: 'manual',
      },
    });
    setSaved(true);
  };

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

      <div className="grid cols-3">
        <div style={{ gridColumn: 'span 2' }}>
          <div
            className={`pvt-stage ${phase}`}
            role="button"
            tabIndex={0}
            aria-label="Reaction test area"
            onPointerDown={(e) => { e.preventDefault(); if (running) respond(); }}
          >
            {phase === 'done' ? 'done' : running ? (display || '·') : 'press start'}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {!running && phase !== 'done' && (
              <button className="btn primary" onClick={start}>Start 60 s test</button>
            )}
            {phase === 'done' && (
              <>
                <button className="btn primary" onClick={save} disabled={rts.length === 0}>{saved ? 'Saved to today\'s check-in' : 'Save result'}</button>
                <button className="btn" onClick={start}>Run again</button>
                {saved && <button className="btn" onClick={() => go('dashboard')}>Back to dashboard</button>}
              </>
            )}
            <span className="muted mono">{Math.min(TEST_SECONDS, elapsed).toFixed(0)} / {TEST_SECONDS} s</span>
          </div>
          <div className="pvt-stats">
            <div className="panel"><div className="n">{rts.length}</div><small>responses</small></div>
            <div className="panel"><div className="n">{rts.length ? Math.round(mean) : '--'}</div><small>mean ms</small></div>
            <div className="panel"><div className="n">{rts.length ? Math.round(median) : '--'}</div><small>median ms</small></div>
            <div className="panel"><div className="n">{lapses}</div><small>lapses ≥ {LAPSE_MS} ms</small></div>
          </div>
          {falseStarts > 0 && <p className="muted" style={{ marginTop: 8 }}>{falseStarts} false start{falseStarts > 1 ? 's' : ''} (pressed before the counter).</p>}
        </div>
        <div className="panel">
          <h3>How to read it</h3>
          <p>
            Your pre-flight baseline: <b>{b ? `${Math.round(b.median)} ms` : 'not available'}</b>
            {b && ` (typical spread ±${Math.round(b.mad)} ms)`}.
          </p>
          <p>
            Response time slows and lapses increase with sleep loss, often before you feel tired. Space Vigil flags a mean 15% slower than your
            baseline as Watch, and 35% slower or 6 extra lapses as Act now.
          </p>
          <p className="muted" style={{ fontSize: 13 }}>
            The full PVT-B lasts 3 minutes; this 60-second version is for the prototype and keeps the same 355 ms lapse threshold and 1-4 s
            random wait.
          </p>
          <SourceLinks ids={['pvt-b', 'reaction-self-test']} />
        </div>
      </div>
    </>
  );
}
