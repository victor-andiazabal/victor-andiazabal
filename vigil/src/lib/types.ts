export type IndicatorId =
  | 'hr'
  | 'bpSys'
  | 'bpDia'
  | 'spo2'
  | 'temp'
  | 'glucose'
  | 'weight'
  | 'sleep'
  | 'exercise'
  | 'mood'
  | 'stress'
  | 'kss'
  | 'pvtRt'
  | 'pvtLapses'
  | 'radDose';

export type Level = 'green' | 'amber' | 'red';

export type Environment = 'station' | 'transit' | 'rover' | 'base';

export type ScenarioId = 'nominal' | 'spe' | 'sleepDebt' | 'illness';

export interface DayRecord {
  /** Mission day. Negative or zero values are pre-flight baseline days. */
  day: number;
  values: Partial<Record<IndicatorId, number>>;
  symptoms: string[];
  notes?: string;
  /**
   * 'manual' is a saved daily check-in (or an imported row). 'pvt' is a reaction-test result saved before any check-in
   * that day: its other values are the simulated feed carried over, so it does not count as a check-in.
   */
  source: 'simulated' | 'manual' | 'pvt';
}

export interface CrewMember {
  id: string;
  callsign: string;
  role: string;
  /** Personal resting set-points used by the simulator (simulated person, not a real astronaut). */
  setpoints: Record<IndicatorId, number>;
  records: DayRecord[];
}

export interface Finding {
  id: string;
  crewId: string;
  day: number;
  indicator: IndicatorId | 'symptoms' | 'routine';
  level: Level;
  title: string;
  /** Why the rule fired, in plain language with the numbers that triggered it. */
  reason: string;
  /** What the crew member should do next. */
  action: string;
  /** Whether the flight surgeon on the ground should be notified. */
  notifySurgeon: boolean;
  /** Ids into data/sources.ts */
  sources: string[];
  /** 'reference' = compared with a published range. 'baseline' = compared with the person's own history. */
  basis: 'reference' | 'baseline' | 'symptom' | 'routine';
  /** Key into data/countermeasures.ts for the checklist shown with the alert. */
  checklist?: string;
}

export interface MissionSettings {
  environment: Environment;
  scenario: ScenarioId;
  currentDay: number;
  baselineDays: number;
  seed: number;
}

export interface AppState {
  settings: MissionSettings;
  crew: CrewMember[];
  selectedCrewId: string;
  /** Manual entries keyed by `${crewId}:${day}`; they override simulated values. */
  manual: Record<string, DayRecord>;
  /** Alerts the user has acknowledged, keyed by finding id. */
  acknowledged: Record<string, number>;
  /** Routine task completion keyed by `${crewId}:${day}:${taskId}`. */
  routineDone: Record<string, boolean>;
  /** Flight surgeon notes keyed by crewId. */
  surgeonNotes: Record<string, string>;
}
