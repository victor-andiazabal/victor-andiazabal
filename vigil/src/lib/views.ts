/** Every screen of the app. 'today' replaced 'dashboard'; the old name still works as a ?view= alias. */
export const VIEWS = ['today', 'body', 'checkin', 'pvt', 'trends', 'alerts', 'routine', 'ground', 'learn', 'settings'] as const;

export type View = (typeof VIEWS)[number];

const ALIASES: Record<string, View> = { dashboard: 'today' };

/** `?view=ground` opens the ground console directly (used by the crew-side link to a second window). */
export function viewFromQuery(search: string): View {
  const wanted = new URLSearchParams(search).get('view') ?? '';
  const view = ALIASES[wanted] ?? wanted;
  return (VIEWS as readonly string[]).includes(view) ? (view as View) : 'today';
}
