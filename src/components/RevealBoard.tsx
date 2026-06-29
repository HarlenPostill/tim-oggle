import { motion } from 'framer-motion';
import type { Board } from '../lib/types';
import { findWordPath, toCoord } from '../lib/board';

interface Props {
  board: Board;
  /** The word currently being revealed (UPPERCASE), or null before it starts. */
  word: string | null;
  className?: string;
}

/**
 * The reveal-stage board: shows the grid with the current word's path lit up
 * and numbered, plus an animated trail, so everyone can see how it was made.
 */
export default function RevealBoard({ board, word, className = '' }: Props) {
  const tiles = board.flat();
  const path = word ? findWordPath(word, board) : null;

  const order = new Map<number, number>();
  path?.forEach((cell, i) => order.set(cell, i));

  const trail = (path ?? []).map((idx) => {
    const [r, c] = toCoord(idx);
    return { x: ((c + 0.5) / 4) * 100, y: ((r + 0.5) / 4) * 100 };
  });

  return (
    <div className={`relative grid grid-cols-4 gap-2 sm:gap-3 ${className}`}>
      {tiles.map((tile, i) => {
        const rawStep = order.get(i);
        const inPath = rawStep !== undefined;
        const step = rawStep ?? 0;
        return (
          <motion.div
            // Re-key on word so the pop animation replays for each new word.
            key={`${word ?? ''}-${i}`}
            initial={inPath ? { scale: 0.78 } : false}
            animate={inPath ? { scale: 1 } : {}}
            transition={{
              delay: inPath ? step * 0.08 : 0,
              type: 'spring',
              stiffness: 320,
              damping: 20,
            }}
            className={`relative grid aspect-square place-items-center rounded-2xl font-display text-2xl font-bold sm:text-4xl ${
              inPath
                ? 'z-10 bg-magenta/25 text-white ring-4 ring-magenta shadow-lg shadow-magenta/40'
                : 'border border-line bg-surface-2 text-white/25'
            }`}
          >
            {tile === 'QU' ? 'Qu' : tile}
            {inPath && (
              <span className="absolute -left-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-magenta text-[10px] font-bold text-white sm:h-6 sm:w-6 sm:text-xs">
                {step + 1}
              </span>
            )}
          </motion.div>
        );
      })}

      {trail.length > 1 && (
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
        >
          <motion.polyline
            key={word ?? ''}
            points={trail.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#ff3da6"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0.3 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: Math.min(0.9, trail.length * 0.12) }}
            style={{ filter: 'drop-shadow(0 0 3px rgba(255,61,166,0.8))' }}
          />
        </svg>
      )}
    </div>
  );
}
