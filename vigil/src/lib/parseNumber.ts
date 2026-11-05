/** A plain decimal: optional sign, digits with at most one point. Number() alone would also take 0x1F, 1e3 or Infinity. */
const DECIMAL = /^[+-]?(\d+\.?\d*|\.\d+)$/;

/** What a number box holds: null when empty, 'invalid' for text that is not a plain decimal. Accepts a decimal comma. */
export function parseNumberText(t: string): number | null | 'invalid' {
  const s = t.trim().replace(',', '.');
  if (s === '') return null;
  if (!DECIMAL.test(s)) return 'invalid';
  const n = Number(s);
  return Number.isFinite(n) ? n : 'invalid';
}
