import type { Player } from './types';

/** A short unique id (room-scoped player/host identity). */
export function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** RTDB returns dense arrays as arrays, but sparse ones (e.g. after a delete)
 *  as objects keyed by index. Coerce either shape to a clean array. */
export function toArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value.filter((v) => v != null) as T[];
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, T>).filter((v) => v != null);
  }
  return [];
}

/** Normalise the players map so every Player has safe, fully-typed fields
 *  (RTDB omits empty arrays / zero-ish values, which we backfill here). */
export function normalizePlayers(
  players: Record<string, Player> | null | undefined,
): Record<string, Player> {
  const out: Record<string, Player> = {};
  for (const [pid, p] of Object.entries(players ?? {})) {
    out[pid] = {
      name: p?.name ?? 'Player',
      words: toArray<string>(p?.words).map((w) => w.toUpperCase()),
      score: p?.score ?? 0,
      joinedAt: p?.joinedAt ?? 0,
    };
  }
  return out;
}

/** Format seconds as M:SS for the countdown clock. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}
