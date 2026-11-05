/** Every screen of the app. 'today' replaced 'dashboard'; the old name still works as a ?view= alias. */
export const VIEWS = ['today', 'body', 'checkin', 'pvt', 'trends', 'alerts', 'routine', 'ground', 'learn', 'settings'] as const;

export type View = (typeof VIEWS)[number];

const ALIASES: Record<string, View> = { dashboard: 'today' };

/** Screen names as the navigation shows them; used for the document title. */
export const VIEW_LABEL: Record<View, string> = {
  today: 'Today',
  body: 'Body map',
  checkin: 'Check-in',
  pvt: 'Reaction test',
  trends: 'Trends',
  alerts: 'Alerts',
  routine: 'Routine',
  ground: 'Ground view',
  learn: 'Learn',
  settings: 'Settings',
};

/** "Check-in · VIGIL": the page title for a screen. */
export function viewTitle(view: View): string {
  return `${VIEW_LABEL[view]} · VIGIL`;
}

export type Theme = 'dark' | 'light';

/** A stored theme value, or dark when it is missing or not one we know. */
export function parseTheme(stored: string | null): Theme {
  return stored === 'light' || stored === 'dark' ? stored : 'dark';
}

/** `?view=ground` opens the ground console directly (used by the crew-side link to a second window). */
export function viewFromQuery(search: string): View {
  const wanted = new URLSearchParams(search).get('view') ?? '';
  const view = ALIASES[wanted] ?? wanted;
  return (VIEWS as readonly string[]).includes(view) ? (view as View) : 'today';
}
