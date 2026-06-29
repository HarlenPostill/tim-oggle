import { motion } from 'framer-motion';
import type { Player } from '../lib/types';

interface Props {
  players: Record<string, Player>;
  /** Highlight this player as the winner (gold + crown). */
  winnerId?: string | null;
  /** When true the winner styling/crown is shown (i.e. reveal is finished). */
  celebrate?: boolean;
}

const MEDALS = ['🥇', '🥈', '🥉'];
const RANK_BAR = [
  'bg-linear-to-t from-magenta to-cyan',
  'bg-linear-to-t from-cyan to-magenta',
  'bg-linear-to-t from-grape to-cyan',
];

/** Leaderboard podium. Bars animate height as scores change, and the whole
 *  columns re-order with a spring (Framer `layout`) as standings shift. */
export default function Podium({ players, winnerId, celebrate = false }: Props) {
  const rows = Object.entries(players)
    .map(([id, p]) => {
      const wordList = p.words ? [...p.words] : [];
      // Sort longest to shortest, then alphabetically
      wordList.sort((a, b) => b.length - a.length || a.localeCompare(b));
      
      return {
        id,
        name: p.name ?? 'Player',
        score: p.score ?? 0,
        joinedAt: p.joinedAt ?? 0,
        words: wordList.length,
        wordList,
      };
    })
    .sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt);

  const max = Math.max(1, ...rows.map((r) => r.score));

  if (rows.length === 0) {
    return (
      <p className="text-center text-grape/70">Waiting for players…</p>
    );
  }

  return (
    <div className="flex items-end justify-center gap-3 overflow-x-auto px-2 pb-1 pt-20 sm:gap-5">
      {rows.map((r, idx) => {
        const pct = max > 0 ? (r.score / max) * 100 : 0;
        const isWinner = celebrate && r.id === winnerId;
        return (
          <motion.div
            key={r.id}
            layout
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="flex w-16 shrink-0 flex-col items-center sm:w-24"
          >
            {/* Fixed-height track so the name labels line up across columns. */}
            <div className="flex h-40 w-full items-end sm:h-56">
              <motion.div
                layout
                initial={false}
                animate={{ height: `${pct}%` }}
                transition={{ type: 'spring', stiffness: 200, damping: 24 }}
                style={{ minHeight: 10 }}
                className={`relative w-full rounded-t-2xl ${
                  isWinner
                    ? 'bg-linear-to-t from-gold to-magenta shadow-[0_0_30px_-4px_rgba(255,176,46,0.75)]'
                    : RANK_BAR[idx] ?? 'bg-linear-to-t from-magenta/60 to-magenta'
                }`}
              >
                <span className="absolute -top-7 inset-x-0 text-center font-display text-lg font-bold text-ink sm:text-xl">
                  {r.score}
                </span>
                {isWinner && (
                  <span className="absolute -top-16 inset-x-0 animate-bounce text-center text-4xl">
                    👑
                  </span>
                )}
              </motion.div>
            </div>

            <div className="mt-2 flex flex-col items-center gap-0.5">
              <span className="text-xl">{MEDALS[idx] ?? '🎲'}</span>
              <span
                className={`max-w-[5.5rem] truncate text-center font-display text-sm font-semibold sm:text-base ${
                  isWinner ? 'text-amber-600' : 'text-ink/90'
                }`}
                title={r.name}
              >
                {r.name}
              </span>
              {celebrate && (
                <>
                  <span className="text-xs font-medium text-grape/80 mt-1">
                    {r.words} {r.words === 1 ? 'word' : 'words'}
                  </span>
                  <div className="mt-2 relative w-full flex flex-col items-center h-24 sm:h-32 overflow-hidden">
                    <div className="flex flex-col gap-0.5 text-center w-full">
                      {r.wordList.map((w, i) => (
                        <span key={i} className="text-[10px] sm:text-xs font-display font-semibold tracking-wide text-grape/60 truncate px-1">
                          {w}
                        </span>
                      ))}
                    </div>
                    {/* Fading gradient to match the background color (--color-sky) */}
                    <div className="absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-sky to-transparent pointer-events-none" />
                  </div>
                </>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
