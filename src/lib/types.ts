// ------------------------------------------------------------------ //
// The complete shape of the game state that lives under rooms/{code}  //
// in Firebase Realtime Database. Keeping it in one typed file means    //
// every read/write across the app is checked against the same schema.  //
// ------------------------------------------------------------------ //

export type GameStatus = 'LOBBY' | 'PLAYING' | 'REVEAL';

/** One cell of the board. Normally a single letter, but "QU" is a single
 *  Boggle tile that contributes two letters to a word. */
export type Tile = string;

/** 4x4 grid, row-major (board[row][col]). */
export type Board = Tile[][];

export interface Player {
  name: string;
  /** Valid words this player found — de-duplicated, uppercased. */
  words: string[];
  /** Running score, written by the Host during the reveal phase. */
  score: number;
  /** ms epoch — orders the lobby and breaks score ties deterministically. */
  joinedAt: number;
}

export interface Room {
  status: GameStatus;
  /** Which client is the authority (the TV / host). */
  hostId: string;
  createdAt: number;
  /** Length of a round in seconds (host-configurable in the lobby). */
  roundSeconds: number;
  /** Server-resolved timestamp (ms epoch) of when PLAYING began. We derive the
   *  countdown from this + roundSeconds so every client agrees regardless of
   *  device clock skew. null until the host starts. */
  startedAt: number | null;
  /** 4x4 letters, null until the host starts the round. */
  board: Board | null;
  /** playerId -> Player. RTDB drops empty maps, so treat missing as {}. */
  players: Record<string, Player> | null;
  /** Ordered master list of unique words the host reveals one-by-one. */
  revealWords: string[] | null;
  /** Index into revealWords currently being shown. -1 = reveal not started. */
  currentRevealIndex: number;
}
