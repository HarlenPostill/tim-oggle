import type { Player } from './types';

// ------------------------------------------------------------------ //
// The scoring engine. Pure functions — no Firebase here — so the host  //
// can compute (and re-compute) scores deterministically as it advances //
// the reveal index. Determinism makes the reveal robust to a host      //
// refresh: scores are always derived from (revealWords, index).        //
// ------------------------------------------------------------------ //

/** Points for a *unique* word: 3 letters = 1 pt, +1 for each extra letter. */
export const pointsFor = (word: string): number => Math.max(0, word.length - 2);

export interface WordVerdict {
  word: string;
  /** playerIds who found this word. */
  submitters: string[];
  unique: boolean;
  /** 0 if a duplicate (found by >1 player), else pointsFor(word). */
  points: number;
}

/** Map every submitted word -> the players who found it (deduped per player). */
export function tallyWords(
  players: Record<string, Player>,
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const [pid, p] of Object.entries(players)) {
    const seen = new Set<string>();
    for (const raw of p.words ?? []) {
      const w = raw.toUpperCase();
      if (seen.has(w)) continue;
      seen.add(w);
      const arr = map.get(w) ?? [];
      arr.push(pid);
      map.set(w, arr);
    }
  }
  return map;
}

/** Verdict for a single word, given the precomputed tally. */
export function verdictFor(
  word: string,
  tally: Map<string, string[]>,
): WordVerdict {
  const submitters = tally.get(word) ?? [];
  const unique = submitters.length === 1;
  return { word, submitters, unique, points: unique ? pointsFor(word) : 0 };
}

/** Ordered reveal list: reveal duplicates / low-value words first and end on
 *  the single highest-scoring unique word for a dramatic finish. */
export function buildRevealOrder(tally: Map<string, string[]>): string[] {
  return [...tally.keys()].sort((a, b) => {
    const pa = verdictFor(a, tally).points;
    const pb = verdictFor(b, tally).points;
    if (pa !== pb) return pa - pb; // low -> high
    if (a.length !== b.length) return a.length - b.length;
    return a < b ? -1 : 1; // stable alpha tie-break
  });
}

/** Total score for each player after revealing revealWords[0..upTo] inclusive.
 *  Recomputed from scratch on every advance so it is idempotent. */
export function scoresUpTo(
  revealWords: string[],
  upTo: number,
  tally: Map<string, string[]>,
  players: Record<string, Player>,
): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const pid of Object.keys(players)) scores[pid] = 0;
  for (let i = 0; i <= upTo && i < revealWords.length; i++) {
    const v = verdictFor(revealWords[i], tally);
    if (v.unique) {
      const winner = v.submitters[0];
      scores[winner] = (scores[winner] ?? 0) + v.points;
    }
  }
  return scores;
}

/** The current leader: highest score, ties broken by earliest join. Returns
 *  null only when there are no players at all. */
export function pickWinner(players: Record<string, Player>): string | null {
  let best: string | null = null;
  let bestScore = -Infinity;
  let bestJoined = Infinity;
  for (const [pid, p] of Object.entries(players)) {
    const s = p.score ?? 0;
    const j = p.joinedAt ?? 0;
    if (s > bestScore || (s === bestScore && j < bestJoined)) {
      best = pid;
      bestScore = s;
      bestJoined = j;
    }
  }
  return best;
}
