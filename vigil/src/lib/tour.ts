/** First-run tutorial: the steps (copy from the brief, section 5.6) and the "seen" flag. */

import type { View } from './views';

export const TOUR_KEY = 'vigil:tour:v2';

export interface TourStep {
  /** Value of the data-tour attribute on the element to spotlight. */
  target: string;
  /** The screen this step needs on display; the tour opens it before measuring. */
  view: View;
  title: string;
  body: string;
}

/**
 * Seven steps. The first four stay on Today, the next two open the check-in so the tutorial can point at a real
 * field, and the last one points at the Alerts row, which is in the navigation on every screen.
 */
export const TOUR_STEPS: TourStep[] = [
  { target: 'status', view: 'today', title: 'Status readout', body: "This is today's answer: Nominal, Watch or Act now, and the reason." },
  { target: 'next-action', view: 'today', title: 'Next action', body: 'One button always tells you what to do next.' },
  { target: 'bodymap', view: 'today', title: 'Body map', body: 'Tap a body system to see what space does to it and what to do.' },
  {
    target: 'nav-checkin',
    view: 'today',
    title: 'Check-in',
    body: 'Every number you enter lives here, in five short steps: vitals, body, sleep, symptoms, review. We will open it next.',
  },
  {
    target: 'field',
    view: 'checkin',
    title: 'Where the numbers go',
    body: 'Type the number, or use + and −. A chip saying from wearable means the value is already filled in: check it, then tap Confirm all on this step.',
  },
  {
    target: 'band',
    view: 'checkin',
    title: 'Baseline band',
    body: 'The cyan band is your own normal from 14 pre-flight days, and the tick is the value you are entering. VIGIL compares you with yourself, not only with textbook ranges.',
  },
  {
    target: 'nav-alerts',
    view: 'checkin',
    title: 'Alerts and ground',
    body: 'Every alert says why it fired, what to do now, and the source. Reports reach the flight surgeon after the real light-time delay: assess first; the ground confirms later.',
  },
];

export function tourSeen(): boolean {
  try {
    return localStorage.getItem(TOUR_KEY) === 'done';
  } catch {
    return false;
  }
}

export function markTourSeen() {
  try {
    localStorage.setItem(TOUR_KEY, 'done');
  } catch {
    /* storage unavailable: the tour shows again next time, which is harmless */
  }
}
