import { describe, expect, it } from 'vitest';
import { csvCell, parseCsv, splitCsvLine } from '../csv';

describe('CSV import', () => {
  it('round-trips the export layout', () => {
    const csv = ['crew,day,source,hr,bpSys,bpDia,spo2,temp,sleep,symptoms,notes', 'cdr,12,manual,64,118,76,97,36.8,6.9,headache|nausea,"cuff export"', 'zzz,3,manual,60,,,,,,,', 'fe1,x,manual,60,,,,,,,'].join('\n');
    const { records, skipped } = parseCsv(csv, ['cdr', 'fe1']);
    expect(records).toHaveLength(1);
    expect(skipped).toBe(2);
    expect(records[0].crewId).toBe('cdr');
    expect(records[0].record.day).toBe(12);
    expect(records[0].record.values).toEqual({ hr: 64, bpSys: 118, bpDia: 76, spo2: 97, temp: 36.8, sleep: 6.9 });
    expect(records[0].record.symptoms).toEqual(['headache', 'nausea']);
    expect(records[0].record.notes).toBe('cuff export');
    expect(records[0].record.source).toBe('manual');
  });

  it('round-trips notes that contain commas, quotes and newlines', () => {
    const note = 'cuff reading, arm "supported"\nsecond line';
    const line = ['cdr', 5, 'manual', 70, 'headache', csvCell(note)].join(',');
    const cells = splitCsvLine(line);
    expect(cells).toHaveLength(6);
    expect(cells[5]).toBe('cuff reading, arm "supported" second line');
    const { records } = parseCsv(`crew,day,source,hr,symptoms,notes\n${line}`, ['cdr']);
    expect(records[0].record.values.hr).toBe(70);
    expect(records[0].record.notes).toBe('cuff reading, arm "supported" second line');
  });

  it('keeps a reaction-test-only row as one, so it does not count as a check-in', () => {
    const csv = ['crew,day,source,pvtRt,pvtLapses,symptoms,notes', 'cdr,30,pvt,262,1,,', 'cdr,29,manual,250,0,,', 'cdr,28,simulated,240,0,,'].join('\n');
    const { records } = parseCsv(csv, ['cdr']);
    expect(records.map((r) => r.record.source)).toEqual(['pvt', 'manual', 'manual']);
    expect(records[0].record.values).toEqual({ pvtRt: 262, pvtLapses: 1 });
  });

  it('ignores unknown columns and empty files', () => {
    expect(parseCsv('', ['cdr']).records).toHaveLength(0);
    const { records } = parseCsv('crew,day,foo,hr\ncdr,1,bar,70', ['cdr']);
    expect(records[0].record.values).toEqual({ hr: 70 });
  });
});
