import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Room } from '../lib/types';
import type { WordVerdict } from '../lib/scoring';
import { pickWinner, tallyWords, verdictFor } from '../lib/scoring';
import { advanceReveal, playAgain } from '../lib/game';
import { celebrate } from '../lib/confetti';
import { normalizePlayers, toArray } from '../lib/util';
import Podium from '../components/Podium';
import Button from '../components/Button';

export default function HostReveal({ code, room }: { code: string; room: Room }) {
  const players = normalizePlayers(room.players);
  const revealWords = toArray<string>(room.revealWords);
  const total = revealWords.length;
  const idx = room.currentRevealIndex ?? -1;
  const tally = tallyWords(players);
  const finished = total > 0 && idx >= total - 1;
  const winnerId = pickWinner(players);

  // Fire the confetti once, the moment the final word is revealed.
  const firedRef = useRef(false);
  useEffect(() => {
    if (finished && !firedRef.current) {
      firedRef.current = true;
      celebrate();
    }
  }, [finished]);

  const nameOf = (id: string) => players[id]?.name ?? 'Player';

  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-6">
      <h2 className="font-display text-2xl text-grape/80">
        {finished ? '🎉 Final Results' : 'Results'}
      </h2>

      <div className="flex min-h-[8rem] w-full max-w-xl flex-col items-center justify-center gap-3">
        {total === 0 ? (
          <p className="text-center text-xl text-grape/70">
            No words found this round 😅
          </p>
        ) : idx < 0 ? (
          <>
            <p className="text-center text-xl text-white">
              {total} {total === 1 ? 'word' : 'words'} to reveal
            </p>
            <Button onClick={() => advanceReveal(code)}>
              Start the reveal ▶
            </Button>
          </>
        ) : (
          <RevealCard
            word={revealWords[idx]}
            verdict={verdictFor(revealWords[idx], tally)}
            nameOf={nameOf}
            index={idx}
            total={total}
          />
        )}
      </div>

      <div className="w-full max-w-2xl">
        <Podium players={players} winnerId={winnerId} celebrate={finished} />
      </div>

      <div className="mt-auto flex items-center gap-3">
        {total > 0 && idx >= 0 && !finished && (
          <>
            <Button onClick={() => advanceReveal(code)}>Next word ▶</Button>
            <Button
              variant="ghost"
              onClick={() => advanceReveal(code, total - 1)}
            >
              Skip to end ⏭
            </Button>
          </>
        )}
        {(finished || total === 0) && (
          <Button variant="gold" onClick={() => playAgain(code)}>
            Play again 🔁
          </Button>
        )}
      </div>
    </main>
  );
}

interface CardProps {
  word: string;
  verdict: WordVerdict;
  nameOf: (id: string) => string;
  index: number;
  total: number;
}

function RevealCard({ word, verdict, nameOf, index, total }: CardProps) {
  const dup = !verdict.unique;
  return (
    <motion.div
      key={`${word}-${index}`}
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="flex w-full flex-col items-center gap-2 rounded-3xl border border-line bg-surface px-6 py-5"
    >
      <span className="text-xs uppercase tracking-widest text-grape/60">
        Word {index + 1} of {total}
      </span>
      <span
        className={`font-display text-5xl font-bold ${
          dup ? 'text-grape/50 line-through' : 'text-white'
        }`}
      >
        {word}
      </span>
      {dup ? (
        <span className="rounded-full bg-grape/15 px-3 py-1 text-sm text-grape/80">
          Found by {verdict.submitters.length} players — 0 pts
        </span>
      ) : (
        <span className="rounded-full bg-lime/15 px-3 py-1 text-sm text-lime">
          +{verdict.points} {verdict.points === 1 ? 'pt' : 'pts'} to{' '}
          {nameOf(verdict.submitters[0])}
        </span>
      )}
      <div className="text-sm text-grape/60">
        {verdict.submitters.map(nameOf).join(', ')}
      </div>
    </motion.div>
  );
}
