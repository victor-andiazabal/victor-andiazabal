/*
 * First-run tutorial: dims the app and moves a spotlight across real elements, with a card beside each.
 * Mechanism ported from "Product Tour" by laziekiki (21st.dev id 26918); plain React + CSS, no framer-motion.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { TOUR_STEPS } from '../lib/tour';
import type { View } from '../lib/views';
import { focusPage } from './pageFocus';
import { BtnTrail } from './ui';
import './tour.css';

type Box = { top: number; left: number; width: number; height: number };

const PAD = 8;
const GAP = 16;
const EDGE = 16;
const STACK_BELOW = 640;
const RETRY_MS = 100;
const RETRIES = 20;

/** The first visible element carrying this anchor; the rail and the bottom bar both carry nav anchors. */
function findTarget(id: string): HTMLElement | null {
  const all = document.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`);
  return Array.from(all).find((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }) ?? null;
}

/** Card position: beside the spotlight (right, left, below, above), clamped on screen; stacked on small screens. */
function placeCard(spot: Box | null, card: { w: number; h: number }, vw: number, vh: number): CSSProperties {
  if (vw < STACK_BELOW) {
    const lowTarget = spot !== null && spot.top + spot.height / 2 > vh / 2;
    return lowTarget ? { left: EDGE, right: EDGE, top: EDGE } : { left: EDGE, right: EDGE, bottom: EDGE };
  }
  const clampX = (x: number) => Math.min(Math.max(EDGE, x), vw - EDGE - card.w);
  const clampY = (y: number) => Math.min(Math.max(EDGE, y), vh - EDGE - card.h);
  if (!spot) return { left: clampX((vw - card.w) / 2), top: clampY((vh - card.h) / 2) };
  const right = spot.left + spot.width + GAP;
  if (right + card.w <= vw - EDGE) return { left: right, top: clampY(spot.top) };
  const left = spot.left - GAP - card.w;
  if (left >= EDGE) return { left, top: clampY(spot.top) };
  const below = spot.top + spot.height + GAP;
  if (below + card.h <= vh - EDGE) return { left: clampX(spot.left), top: below };
  return { left: clampX(spot.left), top: clampY(spot.top - GAP - card.h) };
}

interface TourProps {
  onClose: () => void;
  /** Opens a screen; each step names the one it needs. */
  go: (v: View) => void;
}

export function Tour({ onClose, go }: TourProps) {
  const [index, setIndex] = useState(0);
  const [spot, setSpot] = useState<Box | null>(null);
  const [card, setCard] = useState<{ w: number; h: number } | null>(null);
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [gliding, setGliding] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const goRef = useRef(go);
  const step = TOUR_STEPS[index];
  const last = index === TOUR_STEPS.length - 1;

  // The spotlight glides only while moving between steps, so scrolling never makes it lag.
  const next = useCallback(() => {
    if (last) {
      onClose();
      return;
    }
    setGliding(true);
    setIndex((i) => i + 1);
  }, [last, onClose]);
  const back = useCallback(() => {
    setGliding(index > 0);
    setIndex((i) => Math.max(0, i - 1));
  }, [index]);

  useEffect(() => {
    if (!gliding) return;
    const t = window.setTimeout(() => setGliding(false), 520);
    return () => window.clearTimeout(t);
  }, [gliding, index]);

  // Keep the rest of the app out of reach while the tour is open, and give focus back afterwards.
  useEffect(() => {
    const root = document.getElementById('root');
    const before = document.activeElement as HTMLElement | null;
    if (root) root.inert = true;
    return () => {
      if (root) root.inert = false;
      // The tour may have changed screens and removed that element; then the page heading takes focus.
      if (before?.isConnected && before !== document.body) before.focus();
      else focusPage();
    };
  }, []);

  useEffect(() => {
    goRef.current = go;
  });

  // Open the screen this step points at before looking for its element.
  useEffect(() => {
    goRef.current(step.view);
  }, [step.view]);

  // Measure the target once it exists (a screen opened by the step needs a moment), scroll it into view once,
  // and measure again whenever the page moves.
  useEffect(() => {
    let tries = 0;
    let timer = 0;
    let frame = 0;
    let scrolled = false;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const measure = () => {
      // Scrolling calls this every frame; unchanged values keep the previous state so nothing re-renders.
      const w = window.innerWidth;
      const h = window.innerHeight;
      setVp((v) => (v.w === w && v.h === h ? v : { w, h }));
      const el = findTarget(step.target);
      if (!el) {
        setSpot(null);
        if (tries++ < RETRIES) timer = window.setTimeout(measure, RETRY_MS);
        return;
      }
      if (!scrolled) {
        scrolled = true;
        el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
      }
      const r = el.getBoundingClientRect();
      const next = { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
      setSpot((s) => (s && s.top === next.top && s.left === next.left && s.width === next.width && s.height === next.height ? s : next));
    };
    const onMove = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    const settle = window.setTimeout(measure, 360);
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(settle);
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [step.target]);

  useLayoutEffect(() => {
    const r = cardRef.current?.getBoundingClientRect();
    if (r) setCard({ w: r.width, h: r.height });
  }, [index, vp.w]);

  // Each step puts focus on its heading, so a screen reader reads the step number, title and body before the buttons.
  // The card stays hidden until it has been measured, and a hidden element cannot take focus, so wait for that.
  const measured = card !== null;
  useEffect(() => {
    if (measured) titleRef.current?.focus();
  }, [index, measured]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        back();
      } else if (e.key === 'Tab') {
        const items = cardRef.current?.querySelectorAll<HTMLElement>('button');
        if (!items?.length) return;
        const first = items[0];
        const end = items[items.length - 1];
        const active = document.activeElement;
        const inside = cardRef.current?.contains(active);
        if (!inside || (e.shiftKey && (active === first || active === titleRef.current))) {
          e.preventDefault();
          (e.shiftKey ? end : first).focus();
        } else if (!e.shiftKey && document.activeElement === end) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, back, onClose]);

  const cardStyle = { ...placeCard(spot, card ?? { w: 360, h: 200 }, vp.w, vp.h), visibility: card ? 'visible' : 'hidden' } as CSSProperties;
  const spotStyle = spot
    ? ({ transform: `translate(${spot.left}px, ${spot.top}px)`, width: spot.width, height: spot.height } as CSSProperties)
    : undefined;

  return createPortal(
    <div className="tour-layer" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-body">
      {spot ? <div className={`tour-spot${gliding ? ' is-gliding' : ''}`} style={spotStyle} /> : <div className="tour-dim" />}
      <div ref={cardRef} className="tour-card" style={cardStyle} key={index}>
        <h2 id="tour-title" className="tour-title" ref={titleRef} tabIndex={-1} aria-describedby="tour-body">
          <span className="sr-only">Step {index + 1} of {TOUR_STEPS.length}: </span>
          {step.title}
        </h2>
        <p id="tour-body" className="tour-body">{step.body}</p>
        <div className="tour-foot">
          <div className="tour-dots" aria-hidden="true">
            {TOUR_STEPS.map((s, i) => <span key={s.target} className={i === index ? 'is-on' : ''} />)}
          </div>
          <div className="tour-buttons">
            {index > 0 && <button type="button" className="btn" onClick={back}>Back</button>}
            <button type="button" className="btn-primary tour-next" data-primary onClick={next}>{last ? 'Done' : 'Next'}<BtnTrail icon={last ? 'check' : 'arrow'} /></button>
          </div>
        </div>
        <button type="button" className="link-btn tour-skip" onClick={onClose}>Skip tour</button>
      </div>
    </div>,
    document.body,
  );
}
