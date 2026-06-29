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
            className={`grid aspect-square place-items-center rounded-2xl border-2 font-display text-3xl font-bold shadow-sm sm:text-5xl ${
              birthday
                ? 'border-gold bg-gold/15 text-ink shadow-[0_0_24px_-6px_rgba(255,176,46,0.7)]'
                : 'border-ink bg-white text-ink'
            }`}
          >
            {tile === 'QU' ? 'Qu' : tile}
          </div>
        );
      })}
    </div>
  );
}
