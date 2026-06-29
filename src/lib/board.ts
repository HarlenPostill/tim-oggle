import type { Board, Tile } from './types';

export const SIZE = 4;

// The classic 16 Boggle dice. Each die has 6 letter faces; "QU" is the
// traditional single tile that counts as two letters in a word.
const DICE: string[][] = [
  ['A', 'A', 'E', 'E', 'G', 'N'],
  ['A', 'B', 'B', 'J', 'O', 'O'],
  ['A', 'C', 'H', 'O', 'P', 'S'],
  ['A', 'F', 'F', 'K', 'P', 'S'],
  ['A', 'O', 'O', 'T', 'T', 'W'],
  ['C', 'I', 'M', 'O', 'T', 'U'],
  ['D', 'E', 'I', 'L', 'R', 'X'],
  ['D', 'E', 'L', 'R', 'V', 'Y'],
  ['D', 'I', 'S', 'T', 'T', 'Y'],
  ['E', 'E', 'G', 'H', 'N', 'W'],
  ['E', 'E', 'I', 'N', 'S', 'U'],
  ['E', 'H', 'R', 'T', 'V', 'W'],
  ['E', 'I', 'O', 'S', 'S', 'T'],
  ['E', 'L', 'R', 'T', 'T', 'Y'],
  ['H', 'I', 'M', 'N', 'QU', 'U'],
  ['H', 'L', 'N', 'N', 'R', 'Z'],
];

// Birthday theme: every tile has this chance of being forced to a T / I / M
// so "TIM" turns up more often than pure chance would allow. "slightly".
const TIM_BOOST = 0.15;
export const BIRTHDAY_LETTERS: Tile[] = ['T', 'I', 'M'];

function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const pick = <T>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

const toGrid = (tiles: Tile[]): Board => [
  tiles.slice(0, 4),
  tiles.slice(4, 8),
  tiles.slice(8, 12),
  tiles.slice(12, 16),
];

/** Generate a fresh 4x4 board using standard dice + the birthday TIM boost. */
export function generateBoard(): Board {
  return toGrid(
    shuffle(DICE).map((die) => {
      if (Math.random() < TIM_BOOST) return pick(BIRTHDAY_LETTERS);
      return pick(die).toUpperCase();
    }),
  );
}

/** The fixed "Tim Time" board: the letters of HAPPYBIRTHDAYTIM, in order,
 *  wrapped left-to-right. No shuffling. */
export function timTimeBoard(): Board {
  return toGrid('HAPPYBIRTHDAYTIM'.split(''));
}

/** Build the board for a given mode. */
export const boardForMode = (mode: 'TIM_TIME' | 'BOGGLE'): Board =>
  mode === 'TIM_TIME' ? timTimeBoard() : generateBoard();

/** Flatten a board into a 16-length, row-major tile list. */
export const flattenBoard = (board: Board): Tile[] => board.flat();

/** index 0..15  ->  [row, col]. */
export const toCoord = (index: number): [number, number] => [
  Math.floor(index / SIZE),
  index % SIZE,
];

/** Two cell indices are adjacent if within one step (incl. diagonal). */
export function areAdjacent(a: number, b: number): boolean {
  if (a === b) return false;
  const [ar, ac] = toCoord(a);
  const [br, bc] = toCoord(b);
  return Math.abs(ar - br) <= 1 && Math.abs(ac - bc) <= 1;
}

/** Build the word string from a path of cell indices over a flat tile list. */
export function wordFromPath(path: number[], tiles: Tile[]): string {
  return path
    .map((i) => tiles[i] ?? '')
    .join('')
    .toUpperCase();
}

/** Is this tile one of the birthday-boosted letters? (used for the glow). */
export const isBirthdayTile = (tile: Tile): boolean =>
  BIRTHDAY_LETTERS.includes(tile.toUpperCase());

/**
 * Find *a* path of cell indices that spells `word` on `board`, following
 * Boggle adjacency (8-way, no tile reused). Used during the reveal to show
 * how each word was traced. Multi-letter tiles like "QU" are matched whole.
 * Returns null if the word can't be formed (shouldn't happen for words that
 * were actually submitted on this board, but we degrade gracefully).
 */
export function findWordPath(word: string, board: Board): number[] | null {
  const tiles = flattenBoard(board).map((t) => t.toUpperCase());
  const target = word.toUpperCase();
  const used = new Array(tiles.length).fill(false);
  const path: number[] = [];

  const dfs = (pos: number, cell: number): boolean => {
    const tile = tiles[cell];
    if (!target.startsWith(tile, pos)) return false;
    used[cell] = true;
    path.push(cell);
    const nextPos = pos + tile.length;
    if (nextPos === target.length) return true;

    const [r, c] = toCoord(cell);
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) continue;
        const ni = nr * SIZE + nc;
        if (!used[ni] && dfs(nextPos, ni)) return true;
      }
    }

    used[cell] = false;
    path.pop();
    return false;
  };

  for (let i = 0; i < tiles.length; i++) {
    if (dfs(0, i)) return path.slice();
  }
  return null;
}
