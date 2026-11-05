import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearDraft, DRAFTS_KEY, draftKey, editsOf, getDraft, putDraft, resetDraftCache, type StoredDraft } from '../draftStore';

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() { return data.size; },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => { data.delete(k); },
    setItem: (k, v) => { data.set(k, String(v)); },
  };
}

const sample: StoredDraft = { edits: { hr: 72, temp: null }, symptoms: ['headache'], notes: 'tired', step: 2, furthest: 3 };

describe('draft store', () => {
  beforeEach(() => {
    vi.stubGlobal('sessionStorage', memoryStorage());
    resetDraftCache();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    resetDraftCache();
  });

  it('keys drafts by crew member and day', () => {
    expect(draftKey('cdr', 30)).toBe('cdr:30');
  });

  it('keeps a draft per key and mirrors it to sessionStorage', () => {
    putDraft('cdr:30', sample);
    putDraft('fe1:30', { ...sample, step: 0 });
    expect(getDraft('cdr:30')).toEqual(sample);
    expect(getDraft('fe1:30')?.step).toBe(0);
    expect(getDraft('cdr:29')).toBeNull();
    // A fresh read (as after a reload in the same tab) comes back from sessionStorage.
    resetDraftCache();
    expect(getDraft('cdr:30')).toEqual(sample);
  });

  it('clears only the saved key', () => {
    putDraft('cdr:30', sample);
    putDraft('fe1:30', sample);
    clearDraft('cdr:30');
    expect(getDraft('cdr:30')).toBeNull();
    expect(getDraft('fe1:30')).toEqual(sample);
    resetDraftCache();
    expect(getDraft('cdr:30')).toBeNull();
  });

  it('ignores unreadable storage and still works in memory when storage throws', () => {
    sessionStorage.setItem(DRAFTS_KEY, '{not json');
    resetDraftCache();
    expect(getDraft('cdr:30')).toBeNull();

    vi.stubGlobal('sessionStorage', {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
    });
    resetDraftCache();
    expect(() => putDraft('cdr:30', sample)).not.toThrow();
    expect(getDraft('cdr:30')).toEqual(sample);
  });
});

describe('editsOf', () => {
  it('keeps only the values that differ from the prefill, including cleared ones', () => {
    expect(editsOf({ hr: 72, temp: 36.8, sleep: null, kss: 4 }, { hr: 64, temp: 36.8, sleep: 7 })).toEqual({ hr: 72, sleep: null, kss: 4 });
    expect(editsOf({ hr: 64 }, { hr: 64 })).toEqual({});
  });
});
