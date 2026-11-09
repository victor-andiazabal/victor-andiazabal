import { afterEach, describe, expect, it, vi } from 'vitest';
import { LINK_PRESETS, defaultPreset } from '../../data/comm';
import {
  COMM_KEY,
  MAX_MESSAGES,
  buildReport,
  createMessage,
  effectiveDelayMs,
  inboxFor,
  loadMessages,
  mergeMessages,
  messageState,
  outboxFor,
  parseStore,
  progress,
  saveMessages,
  type CommMessage,
} from '../comm';
import { evaluate } from '../rules';
import { simulateCrew } from '../simulate';
import type { MissionSettings } from '../types';

const T0 = 1_800_000_000_000;

function msg(over: Partial<CommMessage> = {}): CommMessage {
  return {
    id: 'm1', from: 'crew', crewId: 'cdr', kind: 'report', subject: 's', body: 'b',
    sentAt: T0, arrivesAt: T0 + 10_000, missionDay: 30, ...over,
  };
}

describe('delay model', () => {
  it('quotes the comm-delay figures and picks a default per environment', () => {
    expect(LINK_PRESETS.moon.oneWaySeconds).toBe(10);
    expect(LINK_PRESETS.marsNear.oneWaySeconds).toBe(240);
    expect(LINK_PRESETS.marsFar.oneWaySeconds).toBe(1440);
    expect(LINK_PRESETS.leo.oneWaySeconds).toBeLessThan(1);
    expect(defaultPreset('station')).toBe('leo');
    expect(defaultPreset('transit')).toBe('marsNear');
    expect(defaultPreset('rover')).toBe('moon');
    expect(defaultPreset('base')).toBe('moon');
  });

  it('compresses one minute of light time into one second', () => {
    expect(effectiveDelayMs(720, true)).toBe(12_000);
    expect(effectiveDelayMs(720, false)).toBe(720_000);
    expect(effectiveDelayMs(240, true)).toBe(4_000);
    expect(effectiveDelayMs(-5, false)).toBe(0);
  });
});

describe('message state and progress', () => {
  const m = msg();
  it('is in transit until arrivesAt, delivered from arrivesAt on', () => {
    expect(messageState(m, T0)).toBe('in-transit');
    expect(messageState(m, T0 + 9_999)).toBe('in-transit');
    expect(messageState(m, T0 + 10_000)).toBe('delivered');
    expect(messageState(m, T0 + 60_000)).toBe('delivered');
  });

  it('progress runs 0..1 and is clamped', () => {
    expect(progress(m, T0 - 1_000)).toBe(0);
    expect(progress(m, T0)).toBe(0);
    expect(progress(m, T0 + 5_000)).toBeCloseTo(0.5);
    expect(progress(m, T0 + 20_000)).toBe(1);
    expect(progress(msg({ arrivesAt: T0 }), T0)).toBe(1);
  });

  it('createMessage stamps id, sentAt and arrivesAt', () => {
    const a = createMessage({ from: 'crew', crewId: 'fe1', kind: 'report', subject: 'x', body: 'y', missionDay: 29 }, 4_000, T0);
    const b = createMessage({ from: 'crew', crewId: 'fe1', kind: 'report', subject: 'x', body: 'y', missionDay: 29 }, 4_000, T0);
    expect(a.id).toBeTruthy();
    expect(a.id).not.toBe(b.id);
    expect(a.sentAt).toBe(T0);
    expect(a.arrivesAt).toBe(T0 + 4_000);
    expect(a.missionDay).toBe(29);
  });
});

describe('inbox and outbox', () => {
  const report = msg({ id: 'r', from: 'crew', arrivesAt: T0 + 10_000 });
  const late = msg({ id: 'late', from: 'crew', sentAt: T0 + 1_000, arrivesAt: T0 + 240_000 });
  const reply = msg({ id: 'p', from: 'ground', kind: 'reply', sentAt: T0 + 20_000, arrivesAt: T0 + 30_000, replyTo: 'r' });
  const all = [late, reply, report];

  it('hides undelivered messages from the receiver', () => {
    expect(inboxFor('ground', all, T0 + 5_000)).toEqual([]);
    expect(inboxFor('ground', all, T0 + 10_000).map((m) => m.id)).toEqual(['r']);
    expect(inboxFor('ground', all, T0 + 240_000).map((m) => m.id)).toEqual(['r', 'late']);
    expect(inboxFor('crew', all, T0 + 25_000)).toEqual([]);
    expect(inboxFor('crew', all, T0 + 30_000).map((m) => m.id)).toEqual(['p']);
  });

  it('outbox lists everything the side sent, delivered or not', () => {
    expect(outboxFor('crew', all).map((m) => m.id)).toEqual(['r', 'late']);
    expect(outboxFor('ground', all).map((m) => m.id)).toEqual(['p']);
  });
});

describe('merge by id', () => {
  it('unions without duplicates and never drops messages from the other side', () => {
    const a = [msg({ id: 'a', sentAt: T0 }), msg({ id: 'b', sentAt: T0 + 1 })];
    const b = [msg({ id: 'b', sentAt: T0 + 1 }), msg({ id: 'c', sentAt: T0 + 2 })];
    expect(mergeMessages(a, b).map((m) => m.id)).toEqual(['a', 'b', 'c']);
    // A stale array merged in later cannot remove 'c'.
    expect(mergeMessages(mergeMessages(a, b), a).map((m) => m.id)).toEqual(['a', 'b', 'c']);
  });

  it('drops messages sent before the clear tombstone and caps the log', () => {
    const list = [msg({ id: 'old', sentAt: T0 }), msg({ id: 'new', sentAt: T0 + 10 })];
    expect(mergeMessages([], list, T0 + 5).map((m) => m.id)).toEqual(['new']);
    const many = Array.from({ length: MAX_MESSAGES + 20 }, (_, i) => msg({ id: `m${i}`, sentAt: T0 + i, arrivesAt: T0 + i }));
    const capped = mergeMessages([], many);
    expect(capped).toHaveLength(MAX_MESSAGES);
    expect(capped[0].id).toBe('m20');
  });
});

describe('storage', () => {
  afterEach(() => vi.unstubAllGlobals());

  function fakeStorage(initial: Record<string, string> = {}) {
    const data = new Map(Object.entries(initial));
    return {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
      data,
    };
  }

  it('parseStore rejects malformed data', () => {
    expect(parseStore(null).messages).toEqual([]);
    expect(parseStore('not json').messages).toEqual([]);
    expect(parseStore('[1,2,3]').messages).toEqual([]);
    expect(parseStore('{"messages":"nope"}').messages).toEqual([]);
    const mixed = JSON.stringify({
      clearedAt: 0,
      messages: [msg({ id: 'ok' }), { id: 'bad' }, { ...msg({ id: 'x' }), from: 'mars' }, { ...msg({ id: 'y' }), arrivesAt: T0 - 1 }, null],
    });
    expect(parseStore(mixed).messages.map((m) => m.id)).toEqual(['ok']);
  });

  it('loadMessages returns [] on malformed storage and survives a throwing localStorage', () => {
    vi.stubGlobal('localStorage', fakeStorage({ [COMM_KEY]: '{oops' }));
    expect(loadMessages()).toEqual([]);
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } });
    expect(loadMessages()).toEqual([]);
    expect(() => saveMessages([msg()])).not.toThrow();
  });

  it('saveMessages merges with what another tab stored instead of overwriting it', () => {
    const ls = fakeStorage();
    vi.stubGlobal('localStorage', ls);
    saveMessages([msg({ id: 'tabA', sentAt: T0 })]);
    saveMessages([msg({ id: 'tabB', sentAt: T0 + 1 })]);
    expect(loadMessages().map((m) => m.id)).toEqual(['tabA', 'tabB']);
    expect(ls.data.has('vigil:v1')).toBe(false);
  });
});

describe('buildReport', () => {
  it('includes the day and every flagged finding for an illness-scenario crew member', () => {
    const s: MissionSettings = { environment: 'transit', scenario: 'illness', currentDay: 29, baselineDays: 14, seed: 20261114 };
    const fe1 = simulateCrew(s)[1];
    const ev = evaluate(fe1, s);
    const r = buildReport(fe1, ev, s);
    expect(ev.findings.some((f) => f.title === 'Fever')).toBe(true);
    expect(r.findingIds).toEqual(ev.findings.map((f) => f.id));
    expect(r.subject).toContain(fe1.callsign);
    expect(r.subject).toContain('day 29');
    expect(r.body).toContain('PRIVATE MEDICAL CONFERENCE REQUEST');
    expect(r.body).toContain(`From: ${fe1.name}, ${fe1.callsign} (${fe1.role}), ${fe1.agency}`);
    expect(r.body).toContain('Mission day 29');
    expect(r.body).toContain('one-way delay 4-24 min (Mars)');
    expect(r.body).toContain(`Overall status: ${ev.overall.toUpperCase()}`);
    for (const f of ev.findings) expect(r.body).toContain(`- [${f.level.toUpperCase()}] ${f.title}: ${f.reason}`);
    expect(r.body).toContain("Today's values:");
    expect(r.body).toContain('Cumulative mission dose:');
  });
});
