import type { Board } from '../lib/types';
import { isBirthdayTile } from '../lib/board';

interface Props {
  board: Board;
  className?: string;
}

/** Read-only board, used on the TV/host screen. "QU" renders as "Qu". */
export default function BoardView({ board, className = '' }: Props) {
  return (
    <div className={`grid grid-cols-4 gap-2 sm:gap-3 ${className}`}>
      {board.flat().map((tile, i) => {
        const birthday = isBirthdayTile(tile);
        return (
          <div
            key={i}
            className={`grid aspect-square place-items-center rounded-2xl font-display text-3xl font-bold sm:text-5xl ${
              birthday
                ? 'bg-surface-2 text-gold ring-2 ring-gold/60 shadow-[0_0_24px_-6px_rgba(251,191,36,0.6)]'
                : 'border border-line bg-surface-2 text-white'
            }`}
          >
            {tile === 'QU' ? 'Qu' : tile}
          </div>
        );
      })}
    </div>
  );
}
