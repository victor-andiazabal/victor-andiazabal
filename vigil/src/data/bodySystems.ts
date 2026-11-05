import type { IndicatorId } from '../lib/types';

/**
 * Body systems shown on the interactive body map. Each one links the NASA HRP hazards that act on it,
 * the daily indicators and symptoms already tracked by VIGIL, and the countermeasure checklists.
 * No thresholds live here: status comes from the existing rules (see lib/bodymap.ts).
 * Every hazard effect is backed by one of the ids in `sources`.
 */
export type HazardId = 'radiation' | 'isolation' | 'distance' | 'gravity' | 'closedEnv';

export type BodySystemId = 'cardio' | 'musculoskeletal' | 'neuroBehavioral' | 'immune' | 'eyes' | 'metabolic' | 'skinRadiation';

/** The five hazards of human spaceflight, as named by NASA HRP (source: hrp-hazards). */
export const HAZARDS: Record<HazardId, { label: string; short: string }> = {
  radiation: { label: 'Space radiation', short: 'Radiation' },
  isolation: { label: 'Isolation and confinement', short: 'Isolation' },
  distance: { label: 'Distance from Earth', short: 'Distance' },
  gravity: { label: 'Gravity fields', short: 'Gravity' },
  closedEnv: { label: 'Hostile, closed environment', short: 'Closed cabin' },
};

export interface BodySystem {
  id: BodySystemId;
  label: string;
  /** What the system does, in plain language. */
  function: string;
  /** effect = one plain-language sentence linking the hazard to this system. */
  hazards: { id: HazardId; effect: string }[];
  indicators: IndicatorId[];
  /** Ids from SYMPTOMS in data/indicators.ts. */
  symptoms: string[];
  /** Keys of COUNTERMEASURES in data/countermeasures.ts. */
  checklists: string[];
  /** Ids in data/sources.ts. */
  sources: string[];
}

export const BODY_SYSTEMS: BodySystem[] = [
  {
    id: 'neuroBehavioral',
    label: 'Brain and behavior',
    function:
      'The brain runs attention, reaction time, memory, mood and sleep. Small drops in alertness show up in reaction time before you feel tired.',
    hazards: [
      { id: 'isolation', effect: 'Months in a small, confined crew with little privacy strain mood, sleep and team relations.' },
      { id: 'distance', effect: 'Communication delays mean the crew has to solve problems on its own, which adds workload and stress.' },
      { id: 'closedEnv', effect: 'Higher cabin CO2 makes headaches more likely: on the ISS, each 1 mmHg rise doubled the odds of a reported headache.' },
    ],
    indicators: ['sleep', 'kss', 'pvtRt', 'pvtLapses', 'mood', 'stress'],
    symptoms: ['headache', 'fatigue', 'sleepTrouble', 'severeHeadache', 'confusion'],
    checklists: ['sleep', 'alertness', 'mood'],
    sources: ['hrp-hazards', 'hfbp', 'comm-delay', 'law-co2', 'barger-2014', 'pvt-b', 'kaida-2006'],
  },
  {
    id: 'eyes',
    label: 'Eyes and vision',
    function:
      'The eyes focus light onto the retina and the optic nerve carries the image to the brain. Sharp near vision depends on the eyeball keeping its normal shape.',
    hazards: [
      { id: 'gravity', effect: 'Long stays in weightlessness can swell the optic disc, flatten the back of the eye and fold the retina (SANS), shifting near vision.' },
      { id: 'radiation', effect: 'Astronauts whose eye lenses received higher radiation doses developed cataracts more often and earlier.' },
    ],
    indicators: [],
    symptoms: ['eyeStrain', 'visionLoss'],
    checklists: ['symptoms', 'redFlag'],
    sources: ['lee-sans', 'cucinotta-cataract'],
  },
  {
    id: 'immune',
    label: 'Immune system',
    function:
      'White blood cells, lymph nodes, the thymus and the spleen find and fight infection and keep dormant viruses in check. Fever is often the first visible sign that they are at work.',
    hazards: [
      { id: 'closedEnv', effect: 'Microbes pass more easily between people in a sealed habitat, so one infection can reach the whole crew.' },
      { id: 'radiation', effect: 'In orbit the immune system is already dysregulated, latent viruses reactivate and some crew get persistent rashes or allergies; deep-space radiation may add to this.' },
    ],
    indicators: ['temp'],
    symptoms: ['congestion', 'skin'],
    checklists: ['fever', 'symptoms'],
    sources: ['crucian-immune', 'hrp-hazards', 'cdc-fever'],
  },
  {
    id: 'cardio',
    label: 'Heart, vessels and lungs',
    function:
      'The heart pumps blood through the vessels to every organ, and the lungs load that blood with oxygen. Pulse, blood pressure and oxygen saturation show how well it is working.',
    hazards: [
      { id: 'gravity', effect: 'Without the head-to-foot pull of gravity, pressure in the arteries changes; after six months on the ISS, crews came home with carotid arteries 17-30% stiffer.' },
      { id: 'closedEnv', effect: 'Every breath of cabin air comes from life support, so an atmosphere fault would show first as falling oxygen saturation or breathlessness.' },
      { id: 'distance', effect: 'Far from Earth a heart problem cannot be evacuated quickly, and advice from the ground arrives minutes late.' },
    ],
    indicators: ['hr', 'bpSys', 'bpDia', 'spo2'],
    symptoms: ['chestPain', 'breath', 'faint', 'dizziness'],
    checklists: ['bp', 'hr', 'spo2', 'redFlag'],
    sources: ['hughson-2016', 'hrp-hazards', 'comm-delay', 'aha-bp', 'aha-hr', 'mayo-spo2'],
  },
  {
    id: 'metabolic',
    label: 'Digestion and metabolism',
    function:
      'The gut and liver turn food into fuel and keep blood sugar steady between meals. Body mass shows whether what you eat matches what you burn.',
    hazards: [
      { id: 'gravity', effect: 'With weightlessness and less daily movement the body handles sugar less well: an index of insulin resistance rose in flight on the ISS.' },
      { id: 'distance', effect: 'With no resupply, the food on board has to cover every calorie and nutrient for the whole mission, so a shortfall cannot wait for a delivery.' },
    ],
    indicators: ['glucose', 'weight'],
    symptoms: ['nausea', 'appetite'],
    checklists: ['glucoseLow', 'glucoseHigh', 'weight'],
    sources: ['hughson-2016', 'hrp-hazards', 'ada-glucose'],
  },
  {
    id: 'musculoskeletal',
    label: 'Bones, muscles and spine',
    function:
      'Bones, muscles and the spine hold you up, protect the organs, store calcium and let you move and work. Both bone and muscle are kept up by load; without it they weaken.',
    hazards: [
      { id: 'gravity', effect: 'Bones that no longer carry body weight lose density, especially in the hips and spine, and resistive exercise only partly prevents it.' },
      { id: 'distance', effect: 'With no quick way home, a fracture or back injury has to be managed with the on-board medical kit.' },
    ],
    indicators: ['exercise', 'weight'],
    symptoms: ['backPain'],
    checklists: ['exercise', 'weight'],
    sources: ['sibonga-2019', 'iss-exercise', 'hrp-hazards'],
  },
  {
    id: 'skinRadiation',
    label: 'Skin and radiation dose',
    function:
      'Skin is the body\'s outer barrier, but space radiation passes through it and through the cabin walls. The personal dosimeter measures the dose the whole body receives.',
    hazards: [
      { id: 'radiation', effect: 'Charged particles pass through the hull and the body and raise lifetime cancer risk, which is why NASA caps the career dose at 600 mSv.' },
      { id: 'distance', effect: 'Beyond Earth\'s magnetic field there is no natural shield: on the way to Mars the measured dose was about 1.84 mSv a day.' },
    ],
    indicators: ['radDose'],
    symptoms: [],
    checklists: ['radiation'],
    sources: ['ochmo-radiation', 'rad-cruise', 'hrp-hazards'],
  },
];

export const bodySystemById = (id: BodySystemId): BodySystem => BODY_SYSTEMS.find((s) => s.id === id)!;
