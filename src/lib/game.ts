import { ref, get, set, update, serverTimestamp } from 'firebase/database';
import { db } from './firebase';
import type { GameMode, Player, Room } from './types';
import { boardForMode } from './board';
import { buildRevealOrder, scoresUpTo, tallyWords } from './scoring';
import { normalizePlayers, toArray } from './util';

// ------------------------------------------------------------------ //
// The single place that reads from / writes to Firebase. Components    //
// call these intent-named actions instead of touching the DB directly. //
// ------------------------------------------------------------------ //

// Codes shown on a TV and typed on a phone — drop look-alike I/O/0/1.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const ROUND_SECONDS_DEFAULT = 90;

const roomPath = (code: string) => `rooms/${code}`;

function randomCode(): string {
  let c = '';
  for (let i = 0; i < 4; i++) {
    c += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return c;
}

/** Host: allocate a fresh, unused room code and initialise the LOBBY. */
export async function createRoom(hostId: string): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = randomCode();
    const snap = await get(ref(db, `${roomPath(code)}/status`));
    if (snap.exists()) continue; // collision with a live room — try again

    const room: Room = {
      status: 'LOBBY',
      hostId,
      createdAt: Date.now(),
      mode: 'TIM_TIME',
      roundSeconds: ROUND_SECONDS_DEFAULT,
      revealFast: false,
      startedAt: null,
      board: null,
      players: null,
      revealWords: null,
      currentRevealIndex: -1,
    };
    await set(ref(db, roomPath(code)), room);
    return code;
  }
  throw new Error('Could not allocate a room code — please try again.');
}

/** Does a room with this code currently exist? */
export async function roomExists(code: string): Promise<boolean> {
  const snap = await get(ref(db, `${roomPath(code)}/status`));
  return snap.exists();
}

/** Player: write a new player entry into the room. */
export async function joinRoom(
  code: string,
  playerId: string,
  name: string,
): Promise<void> {
  const player: Player = {
    name: name.trim().slice(0, 20) || 'Player',
    words: [],
    score: 0,
    joinedAt: Date.now(),
  };
  await set(ref(db, `${roomPath(code)}/players/${playerId}`), player);
}

/** Player: sync the full found-words list to this player's slot. */
export async function setPlayerWords(
  code: string,
  playerId: string,
  words: string[],
): Promise<void> {
  await set(ref(db, `${roomPath(code)}/players/${playerId}/words`), words);
}

/** Host: generate the board (per mode) and flip everyone into PLAYING. We store
 *  a server-resolved startedAt so all clients run an identical countdown. */
export async function startGame(
  code: string,
  roundSeconds: number,
  mode: GameMode,
): Promise<void> {
  await update(ref(db, roomPath(code)), {
    board: boardForMode(mode),
    mode,
    status: 'PLAYING',
    roundSeconds,
    revealFast: false,
    startedAt: serverTimestamp(),
    revealWords: null,
    currentRevealIndex: -1,
  });
}

/** Any phone: toggle the shared "speed up the reveal" flag. */
export async function setRevealSpeed(
  code: string,
  fast: boolean,
): Promise<void> {
  await set(ref(db, `${roomPath(code)}/revealFast`), fast);
}

/** Host: round is over. Aggregate every word, build the reveal order, and
 *  reset scores to 0 ready to be revealed one at a time. */
export async function goToReveal(code: string): Promise<void> {
  const snap = await get(ref(db, `${roomPath(code)}/players`));
  const players = normalizePlayers(
    snap.val() as Record<string, Player> | null,
  );
  const tally = tallyWords(players);
  const revealWords = buildRevealOrder(tally);

  const updates: Record<string, unknown> = {
    status: 'REVEAL',
    startedAt: null,
    revealWords: revealWords.length ? revealWords : null,
    currentRevealIndex: -1,
  };
  for (const pid of Object.keys(players)) {
    updates[`players/${pid}/score`] = 0;
  }
  await update(ref(db, roomPath(code)), updates);
}

/** Host: reveal the next word (or jump straight to `target`). Recomputes all
 *  scores deterministically from the new index. */
export async function advanceReveal(
  code: string,
  target?: number,
): Promise<void> {
  const snap = await get(ref(db, roomPath(code)));
  const room = snap.val() as Room | null;
  if (!room) return;

  const revealWords = toArray<string>(room.revealWords);
  if (revealWords.length === 0) return;

  const players = normalizePlayers(room.players);
  const last = revealWords.length - 1;
  const next = Math.min(
    target ?? (room.currentRevealIndex ?? -1) + 1,
    last,
  );

  const tally = tallyWords(players);
  const scores = scoresUpTo(revealWords, next, tally, players);

  const updates: Record<string, unknown> = { currentRevealIndex: next };
  for (const [pid, s] of Object.entries(scores)) {
    updates[`players/${pid}/score`] = s;
  }
  await update(ref(db, roomPath(code)), updates);
}

/** Host: start a brand-new round with the same players (words & scores wiped). */
export async function playAgain(code: string): Promise<void> {
  const snap = await get(ref(db, `${roomPath(code)}/players`));
  const players = (snap.val() ?? {}) as Record<string, Player>;

  const updates: Record<string, unknown> = {
    status: 'LOBBY',
    board: null,
    startedAt: null,
    revealFast: false,
    revealWords: null,
    currentRevealIndex: -1,
  };
  for (const pid of Object.keys(players)) {
    updates[`players/${pid}/words`] = null;
    updates[`players/${pid}/score`] = 0;
  }
  await update(ref(db, roomPath(code)), updates);
}
