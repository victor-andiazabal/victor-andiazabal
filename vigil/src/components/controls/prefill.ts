/** Where a prefilled value came from. 'simulated' = the demo's simulated feed; 'saved' = today's saved entry. */
export type Prefill = 'wearable' | 'yesterday' | 'simulated' | 'saved';

export const PREFILL_LABEL: Record<Prefill, string> = {
  wearable: 'from wearable',
  yesterday: 'from yesterday',
  simulated: 'simulated reading',
  saved: 'saved today',
};
