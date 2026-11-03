import { describe, expect, it } from 'vitest';
import { parseCsv } from '../../components/Settings';

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

  it('ignores unknown columns and empty files', () => {
    expect(parseCsv('', ['cdr']).records).toHaveLength(0);
    const { records } = parseCsv('crew,day,foo,hr\ncdr,1,bar,70', ['cdr']);
    expect(records[0].record.values).toEqual({ hr: 70 });
  });
});
