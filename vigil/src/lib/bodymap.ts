import { BODY_SYSTEMS, type BodySystem, type BodySystemId } from '../data/bodySystems';
import { symptomById } from '../data/indicators';
import { maxLevel, type Evaluation } from './rules';
import type { Finding, Level } from './types';

export interface SystemStatus {
  level: Level;
  findings: Finding[];
}

/**
 * Symptom ids that a symptom finding is about. The rules list the symptom labels in the reason text,
 * so a symptom counts when it was reported today and its label appears in that reason.
 * Matching is case-sensitive, so 'Headache' does not match inside 'Worst-ever headache'.
 */
export function symptomsInFinding(f: Finding, todaySymptoms: string[]): string[] {
  if (f.indicator !== 'symptoms') return [];
  return todaySymptoms.filter((id) => {
    const label = symptomById(id)?.label;
    return label ? f.reason.includes(label) : false;
  });
}

function belongsTo(sys: BodySystem, f: Finding, todaySymptoms: string[]): boolean {
  if (f.indicator === 'routine') return false;
  if (f.indicator === 'symptoms') return symptomsInFinding(f, todaySymptoms).some((s) => sys.symptoms.includes(s));
  return sys.indicators.includes(f.indicator);
}

/**
 * Re-aggregates an existing evaluation by body system. No new thresholds: the level is the worst of
 * the system's indicator levels and of the findings that concern it.
 */
export function systemStatus(ev: Evaluation): Record<BodySystemId, SystemStatus> {
  const today = ev.record?.symptoms ?? [];
  const entries = BODY_SYSTEMS.map((sys): [BodySystemId, SystemStatus] => {
    const findings = ev.findings.filter((f) => belongsTo(sys, f, today));
    const level = maxLevel([...sys.indicators.map((i) => ev.byIndicator[i].level), ...findings.map((f) => f.level)]);
    return [sys.id, { level, findings }];
  });
  return Object.fromEntries(entries) as Record<BodySystemId, SystemStatus>;
}

const RANK: Record<Level, number> = { green: 0, amber: 1, red: 2 };

/** The most urgent system, in BODY_SYSTEMS order on ties; used as the default selection. */
export function worstSystem(status: Record<BodySystemId, SystemStatus>): BodySystemId {
  return BODY_SYSTEMS.reduce<BodySystemId>(
    (best, s) => (RANK[status[s.id].level] > RANK[status[best].level] ? s.id : best),
    BODY_SYSTEMS[0].id,
  );
}
