/** First-run tutorial: the steps (copy from the brief, section 5.6) and the "seen" flag. */

export const TOUR_KEY = 'vigil:tour:v2';

export interface TourStep {
  /** Value of the data-tour attribute on the element to spotlight. */
  target: string;
  title: string;
  body: string;
}

export const TOUR_STEPS: TourStep[] = [
  { target: 'status', title: 'Status readout', body: "This is today's answer: Nominal, Watch or Act now, and the reason." },
  { target: 'next-action', title: 'Next action', body: 'One button always tells you what to do next.' },
  {
    target: 'nav-checkin',
    title: 'Check-in',
    body: 'Every number goes here, in five short steps. Values from your wearable are already filled in; you confirm or correct them.',
  },
  {
    target: 'baseline',
    title: 'Baseline band',
    body: 'The cyan band is your own normal from 14 pre-flight days. VIGIL compares you with yourself, not only with textbook ranges.',
  },
  { target: 'bodymap', title: 'Body map', body: 'Tap a body system to see what space does to it and what to do.' },
  { target: 'nav-alerts', title: 'Alerts', body: 'Every alert says why it fired, what to do now, and the source.' },
  {
    target: 'nav-ground',
    title: 'Ground view',
    body: 'Reports reach the flight surgeon after the real light-time delay. Assess first; the ground confirms later.',
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
