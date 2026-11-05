import type { Environment } from '../lib/types';

/**
 * One-way signal delay presets for the crew <-> ground comm link.
 * Lunar and Mars figures are the ones quoted by the `comm-delay` source
 * ("Roughly 3-10 s one-way on the lunar surface and 4-24 min one-way for Mars").
 */
export type LinkPresetId = 'leo' | 'moon' | 'marsNear' | 'marsFar';

export interface LinkPreset {
  label: string;
  oneWaySeconds: number;
  note: string;
  sources: string[];
}

export const LINK_PRESETS: Record<LinkPresetId, LinkPreset> = {
  leo: {
    label: 'Low Earth orbit (station)',
    oneWaySeconds: 0.5,
    note: 'Near real time: under 1 s one-way, as listed for the station environment. The comm-delay source only quotes lunar and Mars figures.',
    sources: [],
  },
  moon: {
    label: 'Moon (3-10 s)',
    oneWaySeconds: 10,
    note: 'Upper end of the "roughly 3-10 s one-way on the lunar surface" quoted by NASA Ames.',
    sources: ['comm-delay'],
  },
  marsNear: {
    label: 'Mars, closest (4 min)',
    oneWaySeconds: 4 * 60,
    note: 'Lower end of the "4-24 min one-way for Mars" quoted by NASA Ames.',
    sources: ['comm-delay'],
  },
  marsFar: {
    label: 'Mars, farthest (24 min)',
    oneWaySeconds: 24 * 60,
    note: 'Upper end of the "4-24 min one-way for Mars" quoted by NASA Ames.',
    sources: ['comm-delay'],
  },
};

export const LINK_PRESET_IDS = Object.keys(LINK_PRESETS) as LinkPresetId[];

const DEFAULT_BY_ENV: Record<Environment, LinkPresetId> = {
  station: 'leo',
  // A transit vehicle is bound for Mars; start at the closest-approach delay so the demo plays in seconds.
  transit: 'marsNear',
  rover: 'moon',
  base: 'moon',
};

export function defaultPreset(env: Environment): LinkPresetId {
  return DEFAULT_BY_ENV[env] ?? 'marsNear';
}

export function isLinkPresetId(x: unknown): x is LinkPresetId {
  return typeof x === 'string' && x in LINK_PRESETS;
}
