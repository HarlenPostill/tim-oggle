import { useEffect, useRef, useState } from 'react';
import type { Board } from '../lib/types';
import {
  areAdjacent,
  flattenBoard,
  isBirthdayTile,
  toCoord,
  wordFromPath,
} from '../lib/board';
import { useLatest } from '../lib/hooks';

interface Props {
  board: Board;
  disabled?: boolean;
  /** Called once per completed drag with the assembled (UPPERCASE) word. */
  onWord: (word: string) => void;
  /** Called continuously with the word currently being traced ('' when idle). */
  onDraw?: (word: string) => void;
}

/**
 * The mobile drag-to-draw board.
 *
 * Touch handling is done with raw, non-passive listeners (not React's
 * synthetic events) so we can call preventDefault() during a drag — that is
 * what stops the page from scrolling / pull-to-refreshing under the finger.
 * Pixel→cell mapping uses document.elementFromPoint, which is far more robust
 * across mobile browsers than hand-rolled bounding-box math.
 */
export default function InteractiveBoard({
  board,
  disabled = false,
  onWord,
  onDraw,
}: Props) {
  const tiles = flattenBoard(board);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [path, setPath] = useState<number[]>([]);
  const pathRef = useRef<number[]>([]);
  const drawingRef = useRef(false);

  // Refs mirror the latest props/state so the once-bound listeners never read
  // stale closures.
  const tilesRef = useLatest(tiles);
  const onWordRef = useLatest(onWord);
  const onDrawRef = useLatest(onDraw);
  const disabledRef = useLatest(disabled);

  // Report the live word (for the player's word bar) whenever the path changes.
  useEffect(() => {
    onDrawRef.current?.(wordFromPath(path, tilesRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  const setPathBoth = (next: number[]) => {
    pathRef.current = next;
    setPath(next);
  };

  // Resolve a screen point to a cell index via the tile's data-idx attribute.
  const cellAt = (x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y);
    const cell = (el as Element | null)?.closest('[data-idx]') as
      | HTMLElement
      | null;
    if (!cell) return null;
    const idx = Number(cell.dataset.idx);
    return Number.isNaN(idx) ? null : idx;
  };

  // Apply Boggle path rules: adjacency, no reuse, and backtracking support.
  const visit = (idx: number | null) => {
    if (idx == null) return;
    const prev = pathRef.current;
    if (prev.length === 0) {
      setPathBoth([idx]);
      return;
    }
    const last = prev[prev.length - 1];
    if (idx === last) return;
    // Stepping back onto the previous tile pops the head — natural correction.
    if (prev.length >= 2 && idx === prev[prev.length - 2]) {
      setPathBoth(prev.slice(0, -1));
      return;
    }
    if (prev.includes(idx)) return; // each tile used at most once
    if (!areAdjacent(last, idx)) return; // must be a neighbouring tile
    setPathBoth([...prev, idx]);
  };

  const begin = (x: number, y: number) => {
    if (disabledRef.current) return;
    const idx = cellAt(x, y);
    if (idx == null) return;
    drawingRef.current = true;
    setPathBoth([idx]);
  };

  const move = (x: number, y: number) => {
    if (!drawingRef.current) return;
    visit(cellAt(x, y));
  };

  const end = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const finalPath = pathRef.current;
    if (finalPath.length >= 1) {
      onWordRef.current(wordFromPath(finalPath, tilesRef.current));
    }
    setPathBoth([]);
  };

  // Bind raw listeners once. Handlers read refs, so [] deps are correct.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (disabledRef.current) return;
      const t = e.touches[0];
      if (!t) return;
      e.preventDefault(); // block double-tap zoom / scroll start
      begin(t.clientX, t.clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!drawingRef.current) return;
      e.preventDefault(); // block page scroll / pull-to-refresh mid-drag
      const t = e.touches[0];
      if (t) move(t.clientX, t.clientY);
    };
    const onTouchEnd = () => end();

    const onMouseDown = (e: MouseEvent) => begin(e.clientX, e.clientY);
    const onMouseMove = (e: MouseEvent) => move(e.clientX, e.clientY);
    const onMouseUp = () => end();

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedSet = new Set(path);

  // Trail points in a 0..100 viewBox so the SVG scales with the board.
  const trail = path.map((idx) => {
    const [r, c] = toCoord(idx);
    return { x: ((c + 0.5) / 4) * 100, y: ((r + 0.5) / 4) * 100 };
  });

  return (
    <div
      ref={containerRef}
      className="touch-none-select-none relative grid grid-cols-4 gap-2 sm:gap-3"
    >
      {tiles.map((tile, i) => {
        const selected = selectedSet.has(i);
        const birthday = isBirthdayTile(tile);
        return (
          <div
            key={i}
            data-idx={i}
            className={`grid aspect-square place-items-center rounded-2xl border-2 font-display text-3xl font-bold shadow-sm transition-transform duration-100 sm:text-4xl ${
              selected
                ? 'z-10 scale-105 border-magenta bg-magenta/15 text-ink ring-4 ring-magenta/40 shadow-lg shadow-magenta/30'
                : birthday
                  ? 'border-gold bg-gold/15 text-ink'
                  : 'border-ink bg-white text-ink'
            }`}
          >
            {/* pointer-events-none so elementFromPoint always hits the tile. */}
            <span className="pointer-events-none">
              {tile === 'QU' ? 'Qu' : tile}
            </span>
          </div>
        );
      })}

      {trail.length > 0 && (
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
        >
          {trail.length > 1 && (
            <polyline
              points={trail.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#0a84ff"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 3px rgba(10,132,255,0.7))' }}
            />
          )}
          {trail.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={1.8} fill="#0a84ff" />
          ))}
        </svg>
      )}
    </div>
  );
}
