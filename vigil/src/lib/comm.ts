import { useCallback, useEffect, useRef, useState } from 'react';
import { defaultPreset, type LinkPresetId } from '../data/comm';
import { ENVIRONMENTS, indicatorById } from '../data/indicators';
import { fmt } from './format';
import { useStore } from '../state/store';
import type { Evaluation } from './rules';
import type { CrewMember, IndicatorId, MissionSettings } from './types';

/**
 * Delay-tolerant crew <-> ground link. Store-and-forward queue kept in its own
 * localStorage key and synced between tabs; it never touches the main `vigil:v1` blob.
 */
export const COMM_KEY = 'vigil:comm';
export const COMM_CHANNEL = 'vigil-comm';
export const MAX_MESSAGES = 200;
const TICK_FAST_MS = 250;
const TICK_SLOW_MS = 1000;

export type Side = 'crew' | 'ground';

export interface CommMessage {
  id: string;
  from: Side;
  crewId: string;
  kind: 'report' | 'reply';
  subject: string;
  body: string;
  findingIds?: string[];
  /** Epoch ms. */
  sentAt: number;
  /** Epoch ms, fixed at send time so every tab agrees on delivery. */
  arrivesAt: number;
  missionDay: number;
  /** Id of the message this one answers (ground replies). */
  replyTo?: string;
  /** Modelled one-way light time, for the "light time left" readout. */
  oneWaySeconds?: number;
}

export type MessageState = 'in-transit' | 'delivered';

/** Stored envelope. `clearedAt` is a tombstone so a cleared log is not resurrected by another tab's merge. */
export interface CommStore {
  clearedAt: number;
  messages: CommMessage[];
}

export function messageState(m: CommMessage, now: number): MessageState {
  return now >= m.arrivesAt ? 'delivered' : 'in-transit';
}

export function progress(m: CommMessage, now: number): number {
  const span = m.arrivesAt - m.sentAt;
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, (now - m.sentAt) / span));
}

/** Demo compression plays one minute of light time in one second. */
export function effectiveDelayMs(oneWaySeconds: number, compressed: boolean): number {
  const secs = Math.max(0, oneWaySeconds);
  return Math.round(compressed ? (secs / 60) * 1000 : secs * 1000);
}

function newId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createMessage(input: Omit<CommMessage, 'id' | 'sentAt' | 'arrivesAt'>, delayMs: number, now: number): CommMessage {
  return { ...input, id: newId(), sentAt: now, arrivesAt: now + Math.max(0, delayMs) };
}

/** Delivered messages addressed to `side`, oldest arrival first. */
export function inboxFor(side: Side, msgs: CommMessage[], now: number): CommMessage[] {
  return msgs.filter((m) => m.from !== side && messageState(m, now) === 'delivered').sort((a, b) => a.arrivesAt - b.arrivesAt);
}

/** Everything `side` has sent, delivered or not, oldest first. */
export function outboxFor(side: Side, msgs: CommMessage[]): CommMessage[] {
  return msgs.filter((m) => m.from === side).sort((a, b) => a.sentAt - b.sentAt);
}

/** Union by id, drops anything sent before the tombstone, keeps the newest MAX_MESSAGES. */
export function mergeMessages(a: CommMessage[], b: CommMessage[], clearedAt = 0): CommMessage[] {
  const byId = new Map<string, CommMessage>();
  for (const m of [...a, ...b]) if (m.sentAt > clearedAt && !byId.has(m.id)) byId.set(m.id, m);
  return [...byId.values()].sort((x, y) => x.sentAt - y.sentAt).slice(-MAX_MESSAGES);
}

const isStr = (x: unknown): x is string => typeof x === 'string';
const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);

export function isCommMessage(x: unknown): x is CommMessage {
  if (!x || typeof x !== 'object') return false;
  const m = x as Record<string, unknown>;
  return (
    isStr(m.id) && m.id.length > 0 &&
    (m.from === 'crew' || m.from === 'ground') &&
    isStr(m.crewId) &&
    (m.kind === 'report' || m.kind === 'reply') &&
    isStr(m.subject) && isStr(m.body) &&
    isNum(m.sentAt) && isNum(m.arrivesAt) && m.arrivesAt >= m.sentAt &&
    isNum(m.missionDay) &&
    (m.findingIds === undefined || (Array.isArray(m.findingIds) && m.findingIds.every(isStr))) &&
    (m.replyTo === undefined || isStr(m.replyTo)) &&
    (m.oneWaySeconds === undefined || isNum(m.oneWaySeconds))
  );
}

/** Parse the raw stored value; malformed data yields an empty store, bad entries are dropped. */
export function parseStore(raw: string | null): CommStore {
  const empty: CommStore = { clearedAt: 0, messages: [] };
  if (!raw) return empty;
  try {
    const p: unknown = JSON.parse(raw);
    if (!p || typeof p !== 'object' || Array.isArray(p)) return empty;
    const o = p as Record<string, unknown>;
    const clearedAt = isNum(o.clearedAt) ? o.clearedAt : 0;
    const list = Array.isArray(o.messages) ? o.messages.filter(isCommMessage) : [];
    return { clearedAt, messages: mergeMessages([], list, clearedAt) };
  } catch {
    return empty;
  }
}

function readStore(): CommStore {
  try {
    return parseStore(localStorage.getItem(COMM_KEY));
  } catch {
    return { clearedAt: 0, messages: [] };
  }
}

function writeStore(s: CommStore): void {
  try {
    localStorage.setItem(COMM_KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable (private window, quota): the BroadcastChannel still carries messages this session */
  }
}

export function loadMessages(): CommMessage[] {
  return readStore().messages;
}

/** Merges with what is already stored, so a stale array can never drop another tab's messages. */
export function saveMessages(m: CommMessage[]): void {
  const cur = readStore();
  writeStore({ clearedAt: cur.clearedAt, messages: mergeMessages(cur.messages, m, cur.clearedAt) });
}

function clearStore(at: number): void {
  writeStore({ clearedAt: at, messages: [] });
}

/**
 * Text of the "Message to the flight surgeon" (components/Alerts.tsx), extracted as a pure function.
 * `body` is line-for-line what Alerts.tsx builds.
 */
export function buildReport(crew: CrewMember, ev: Evaluation, settings: MissionSettings): { subject: string; body: string; findingIds: string[] } {
  const env = ENVIRONMENTS[settings.environment];
  const lines = [
    `PRIVATE MEDICAL CONFERENCE REQUEST`,
    `From: ${crew.name}, ${crew.callsign} (${crew.role}), ${crew.agency}`,
    `Mission day ${settings.currentDay} · ${env.label} · one-way delay ${env.commDelay}`,
    `Overall status: ${ev.overall.toUpperCase()}`,
    ``,
    `Flags:`,
    ...ev.findings.map((f) => `- [${f.level.toUpperCase()}] ${f.title}: ${f.reason}`),
    ``,
    `Today's values:`,
    ...Object.entries(ev.record?.values ?? {}).map(([k, v]) => {
      const def = indicatorById(k as IndicatorId);
      return `- ${def.label}: ${fmt(def.id, v as number)} ${def.unit}`;
    }),
    ev.record?.symptoms.length ? `Symptoms: ${ev.record.symptoms.join(', ')}` : `Symptoms: none`,
    ev.record?.notes ? `Notes: ${ev.record.notes}` : '',
    ``,
    `Cumulative mission dose: ${ev.cumulativeDoseMsv.toFixed(1)} mSv`,
    `Generated by Space Vigil (prototype, simulated data unless entered by crew).`,
  ];
  const surgeon = ev.findings.filter((f) => f.notifySurgeon).length;
  const subject = `${crew.callsign} · day ${settings.currentDay} health report · ${ev.overall.toUpperCase()}${surgeon ? ` · ${surgeon} for the surgeon` : ''}`;
  return { subject, body: lines.join('\n'), findingIds: ev.findings.map((f) => f.id) };
}

type Wire = { type: 'messages'; messages: unknown[] } | { type: 'clear'; clearedAt: number };

function openChannel(): BroadcastChannel | null {
  try {
    return typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(COMM_CHANNEL);
  } catch {
    return null;
  }
}

export interface UseComm {
  messages: CommMessage[];
  now: number;
  send(m: CommMessage): void;
  clear(): void;
  preset: LinkPresetId;
  setPreset(p: LinkPresetId): void;
  compressed: boolean;
  setCompressed(b: boolean): void;
}

/**
 * Comm link state for one tab. Cross-tab events only ever update this hook's local state and
 * `vigil:comm`; nothing here dispatches to the main store.
 */
export function useComm(): UseComm {
  const { settings } = useStore();
  const [store, setStore] = useState<CommStore>(readStore);
  const [now, setNow] = useState(() => Date.now());
  const [preset, setPreset] = useState<LinkPresetId>(() => defaultPreset(settings.environment));
  const [compressed, setCompressed] = useState(true);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const absorb = useCallback((incoming: CommMessage[], clearedAt: number) => {
    setStore((s) => {
      const tomb = Math.max(s.clearedAt, clearedAt);
      return { clearedAt: tomb, messages: mergeMessages(s.messages, incoming, tomb) };
    });
  }, []);

  useEffect(() => {
    const onWire = (e: MessageEvent<Wire>) => {
      const d = e.data;
      if (d?.type === 'clear' && isNum(d.clearedAt)) absorb([], d.clearedAt);
      else if (d?.type === 'messages' && Array.isArray(d.messages)) absorb(d.messages.filter(isCommMessage), 0);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== COMM_KEY) return;
      const disk = parseStore(e.newValue);
      absorb(disk.messages, disk.clearedAt);
    };
    // Created inside the effect so StrictMode's mount/unmount/mount never leaves a closed channel behind.
    const channel = openChannel();
    channelRef.current = channel;
    channel?.addEventListener('message', onWire);
    window.addEventListener('storage', onStorage);
    return () => {
      channel?.removeEventListener('message', onWire);
      channel?.close();
      channelRef.current = null;
      window.removeEventListener('storage', onStorage);
    };
  }, [absorb]);

  const inTransit = store.messages.some((m) => messageState(m, now) === 'in-transit');
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), inTransit ? TICK_FAST_MS : TICK_SLOW_MS);
    return () => clearInterval(t);
  }, [inTransit]);

  const post = useCallback((w: Wire) => {
    try {
      channelRef.current?.postMessage(w);
    } catch {
      /* channel closed or unavailable: the storage event still reaches other tabs */
    }
  }, []);

  const send = useCallback(
    (m: CommMessage) => {
      absorb([m], 0);
      saveMessages([m]);
      post({ type: 'messages', messages: [m] });
      setNow(Date.now());
    },
    [absorb, post],
  );

  const clear = useCallback(() => {
    const at = Date.now();
    absorb([], at);
    clearStore(at);
    post({ type: 'clear', clearedAt: at });
  }, [absorb, post]);

  return { messages: store.messages, now, send, clear, preset, setPreset, compressed, setCompressed };
}
