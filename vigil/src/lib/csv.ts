import { INDICATORS } from '../data/indicators';
import type { DayRecord, IndicatorId } from './types';

/** Split one CSV line, honouring double quotes and doubled quotes inside them. */
export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

export function csvCell(v: string | number | undefined): string {
  if (v === undefined || v === null) return '';
  const s = String(v).replace(/\r?\n/g, ' ');
  return /[",]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Parse the CSV this app exports: crew, day, source, one column per indicator, symptoms (| separated), notes.
 * Every row imports as a manual record, except 'pvt' rows, which keep that source.
 */
export function parseCsv(text: string, knownCrew: string[]): { records: { crewId: string; record: DayRecord }[]; skipped: number } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { records: [], skipped: 0 };
  const head = lines[0].split(',').map((h) => h.trim());
  const ids = new Set(INDICATORS.map((i) => i.id as string));
  const out: { crewId: string; record: DayRecord }[] = [];
  let skipped = 0;
  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    head.forEach((h, i) => { row[h] = (cells[i] ?? '').trim(); });
    const day = Number(row.day);
    const crewId = row.crew;
    if (!knownCrew.includes(crewId) || !Number.isInteger(day)) { skipped++; continue; }
    const values: Partial<Record<IndicatorId, number>> = {};
    for (const h of head) {
      if (!ids.has(h) || row[h] === '') continue;
      const n = Number(row[h]);
      if (Number.isFinite(n)) values[h as IndicatorId] = n;
    }
    const notes = row.notes ?? '';
    // A reaction-test-only row stays one, so the import does not mark that day's check-in as done.
    const source = row.source === 'pvt' ? 'pvt' : 'manual';
    out.push({ crewId, record: { day, values, symptoms: row.symptoms ? row.symptoms.split('|').filter(Boolean) : [], notes: notes || undefined, source } });
  }
  return { records: out, skipped };
}
