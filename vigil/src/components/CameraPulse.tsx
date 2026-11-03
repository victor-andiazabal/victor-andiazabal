import { useEffect, useRef, useState } from 'react';
import { estimatePulse, type PpgResult, type PpgSample } from '../lib/ppg';
import { SourceLinks } from './ui';

type Mode = 'finger' | 'face';
type Phase = 'idle' | 'starting' | 'recording' | 'done' | 'error';
const SECONDS = 20;

export function CameraPulse({ onResult }: { onResult: (bpm: number) => void }) {
  const [mode, setMode] = useState<Mode>('finger');
  const [phase, setPhase] = useState<Phase>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<PpgResult | null>(null);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const samplesRef = useRef<PpgSample[]>([]);
  const startRef = useRef(0);

  const stop = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };
  useEffect(() => stop, []);

  const start = async () => {
    setError('');
    setResult(null);
    setPhase('starting');
    samplesRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode === 'finger' ? 'environment' : 'user', width: { ideal: 320 }, height: { ideal: 240 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      // Try to switch the torch on for fingertip mode; not every device exposes it.
      const track = stream.getVideoTracks()[0];
      if (mode === 'finger') {
        try {
          await track.applyConstraints({ advanced: [{ torch: true } as MediaTrackConstraintSet] });
        } catch {
          /* no torch */
        }
      }
      startRef.current = performance.now();
      setPhase('recording');
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      const tick = () => {
        const now = performance.now();
        const w = (canvas.width = 64);
        const h = (canvas.height = 48);
        ctx.drawImage(video, 0, 0, w, h);
        // Face: central box (forehead/cheeks). Finger: whole frame.
        const roi = mode === 'face' ? { x: Math.round(w * 0.3), y: Math.round(h * 0.2), w: Math.round(w * 0.4), h: Math.round(h * 0.45) } : { x: 0, y: 0, w, h };
        const data = ctx.getImageData(roi.x, roi.y, roi.w, roi.h).data;
        let sum = 0;
        const ch = mode === 'finger' ? 0 : 1; // red for fingertip, green for face
        for (let i = ch; i < data.length; i += 4) sum += data[i];
        samplesRef.current.push({ t: now, v: sum / (data.length / 4) });
        const s = (now - startRef.current) / 1000;
        setElapsed(s);
        if (s >= SECONDS) {
          const r = estimatePulse(samplesRef.current);
          setResult(r);
          setPhase('done');
          stop();
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Camera unavailable');
      setPhase('error');
      stop();
    }
  };

  const cancel = () => {
    stop();
    setPhase('idle');
  };

  const trace = result?.trace ?? [];
  const path = trace.length
    ? trace.map((v, i) => `${i === 0 ? 'M' : 'L'}${((i / (trace.length - 1)) * 300).toFixed(1)},${(30 - Math.max(-2.5, Math.min(2.5, v)) * 10).toFixed(1)}`).join(' ')
    : '';

  return (
    <div className="panel" style={{ background: 'var(--bg-2)' }}>
      <h3 className="camera-pulse-title">Camera pulse <span className="pill neutral">experimental</span></h3>
      <p className="muted" style={{ fontSize: 13 }}>
        Twenty seconds of video, no upload. Fingertip over the camera (with the light on) gives the cleanest signal;
        face mode needs steady, bright, even light.
      </p>
      <div className="scale" style={{ maxWidth: 320, marginBottom: 10 }}>
        <button type="button" className={mode === 'finger' ? 'on' : ''} onClick={() => setMode('finger')} disabled={phase === 'recording'}>Fingertip</button>
        <button type="button" className={mode === 'face' ? 'on' : ''} onClick={() => setMode('face')} disabled={phase === 'recording'}>Face</button>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <video ref={videoRef} muted playsInline style={{ width: 160, height: 120, borderRadius: 10, background: '#000', objectFit: 'cover', display: phase === 'recording' || phase === 'starting' ? 'block' : 'none' }} />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div style={{ flex: 1, minWidth: 220 }}>
          {phase === 'idle' && <button type="button" className="btn" onClick={start}>Start {SECONDS} s measurement</button>}
          {phase === 'starting' && <span className="muted">Waiting for camera permission…</span>}
          {phase === 'recording' && (
            <>
              <div className="progress" style={{ marginBottom: 6 }}><span style={{ width: `${(elapsed / SECONDS) * 100}%` }} /></div>
              <span className="muted mono">{elapsed.toFixed(0)} / {SECONDS} s</span>{' '}
              <button type="button" className="btn sm" onClick={cancel} style={{ marginLeft: 8 }}>Cancel</button>
            </>
          )}
          {phase === 'error' && (
            <>
              <span style={{ color: 'var(--red)' }}>Camera not available: {error}</span>{' '}
              <button type="button" className="btn sm" onClick={() => setPhase('idle')}>Back</button>
            </>
          )}
          {phase === 'done' && result && (
            <>
              <svg viewBox="0 0 300 60" width="100%" height="60" aria-label="Pulse waveform" style={{ background: 'var(--panel)', borderRadius: 8 }}>
                <path d={path} fill="none" stroke="var(--accent)" strokeWidth="1.5" />
              </svg>
              {result.bpm !== null ? (
                <p style={{ margin: '6px 0' }}>
                  <b style={{ fontSize: 22 }}>{result.bpm} bpm</b>{' '}
                  <span className={`pill ${result.quality === 'good' ? 'green' : 'amber'}`}>signal {result.quality}</span>
                </p>
              ) : (
                <p style={{ margin: '6px 0', color: 'var(--amber)' }}>Signal too weak to read a pulse. Cover the lens fully, hold still, add light, and try again.</p>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                {result.bpm !== null && <button type="button" className="btn sm primary" onClick={() => onResult(result.bpm!)}>Use {result.bpm} bpm as heart rate</button>}
                <button type="button" className="btn sm" onClick={() => setPhase('idle')}>Measure again</button>
              </div>
            </>
          )}
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        <SourceLinks ids={['rppg']} compact />
      </div>
    </div>
  );
}
