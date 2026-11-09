import { LINK_PRESETS } from '../data/comm';
import { createMessage, effectiveDelayMs, type CommMessage, type UseComm } from '../lib/comm';
import { useStore } from '../state/store';

/** What a caller supplies; the id, send time, arrival time, mission day and light time are filled in at send. */
export type CommDraft = Omit<CommMessage, 'id' | 'sentAt' | 'arrivesAt' | 'oneWaySeconds' | 'missionDay'>;

/**
 * Returns a function that stamps a draft with the wall clock and the current link preset, then puts it on the link.
 * Called from event handlers only, so Date.now() never runs during render.
 */
export function useCommSender(comm: UseComm): (draft: CommDraft) => CommMessage {
  const { settings } = useStore();
  return (draft) => {
    const preset = LINK_PRESETS[comm.preset];
    const delayMs = effectiveDelayMs(preset.oneWaySeconds, comm.compressed);
    const message = createMessage({ ...draft, missionDay: settings.currentDay, oneWaySeconds: preset.oneWaySeconds }, delayMs, Date.now());
    comm.send(message);
    return message;
  };
}
