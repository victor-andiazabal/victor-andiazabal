import { describe, expect, it } from 'vitest';
import { parseNumberText } from '../parseNumber';

describe('parseNumberText', () => {
  it('reads plain decimals, with a point or a comma', () => {
    expect(parseNumberText('72')).toBe(72);
    expect(parseNumberText(' 36.8 ')).toBe(36.8);
    expect(parseNumberText('36,8')).toBe(36.8);
    expect(parseNumberText('.5')).toBe(0.5);
    expect(parseNumberText('7.')).toBe(7);
    expect(parseNumberText('-3')).toBe(-3);
  });

  it('is null for an empty box', () => {
    expect(parseNumberText('')).toBeNull();
    expect(parseNumberText('   ')).toBeNull();
  });

  it('rejects what Number() would otherwise accept or misread', () => {
    for (const t of ['0x1F', '1e3', 'Infinity', '7..2', '1.2.3', 'abc', '72 bpm', '+', '.']) {
      expect(parseNumberText(t), t).toBe('invalid');
    }
  });
});
