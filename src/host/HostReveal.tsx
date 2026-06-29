import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Room } from '../lib/types';
import type { WordVerdict } from '../lib/scoring';
import { pickWinner, tallyWords, verdictFor } from '../lib/scoring';
import { advanceReveal, playAgain } from '../lib/game';
import { celebrate } from '../lib/confetti';
import { normalizePlayers, toArray } from '../lib/util';
import Podium from '../components/Podium';
import RevealBoard from '../components/RevealBoard';
import Button from '../components/Button';
import AllWordsSidebar from './AllWordsSidebar';

// Auto-play pacing (ms). The "fast" delay kicks in when a phone toggles speed-up.
const DELAY_START = 900;
const DELAY_NORMAL = 2200;
const DELAY_FAST = 700;

export default function HostReveal({ code, room }: { code: string; room: Room }) {
  const players = normalizePlayers(room.players);
  const revealWords = toArray<string>(room.revealWords);
  const total = revealWords.length;
  const idx = room.currentRevealIndex ?? -1;
  const tally = tallyWords(players);
  const finished = total > 0 && idx >= total - 1;
  const winnerId = pickWinner(players);
  const fast = room.revealFast ?? false;
  const word = idx >= 0 ? revealWords[idx] : null;

  const [paused, setPaused] = useState(false);

  // Auto-play: the host advances the reveal on a timer. Re-keying on idx forms
  // a chain (advance -> idx changes -> schedule next). Target is explicit so a
  // double-fire (StrictMode) is idempotent.
  useEffect(() => {
    if (paused || total === 0 || finished) return;
    const target = Math.min(idx + 1, total - 1);
    if (target === idx) return;
    const delay = idx < 0 ? DELAY_START : fast ? DELAY_FAST : DELAY_NORMAL;
    const t = setTimeout(() => {
      advanceReveal(code, target).catch(console.error);
    }, delay);
    return () => clearTimeout(t);
  }, [idx, total, finished, paused, fast, code]);

  // Fire confetti once, the moment the final word is revealed.
  const firedRef = useRef(false);
  useEffect(() => {
    if (finished && !firedRef.current) {
      firedRef.current = true;
      celebrate();
    }
  }, [finished]);

  const nameOf = (id: string) => players[id]?.name ?? 'Player';

  return (
    <div className="flex flex-1 overflow-hidden w-full">
      <main className="flex flex-1 flex-col items-center gap-5 p-6 overflow-y-auto relative">
        <div className="flex items-center gap-3 shrink-0">
        <h2 className="font-display text-2xl text-grape/80">
          {finished ? '🎉 Final Results' : 'Results'}
        </h2>
        {fast && !finished && (
          <span className="rounded-full bg-cyan/15 px-3 py-1 text-xs font-semibold text-cyan">
            ⏩ Sped up
          </span>
        )}
      </div>

      {/* Current word + verdict */}
      <div className="flex min-h-[5rem] flex-col items-center justify-center gap-2">
        {total === 0 ? (
          <p className="text-center text-xl text-grape/70">
            No words found this round 😅
          </p>
        ) : word ? (
          <WordHeadline
            verdict={verdictFor(word, tally)}
            nameOf={nameOf}
            index={idx}
            total={total}
          />
        ) : (
          <p className="text-center text-xl text-ink">Get ready… 👀</p>
        )}
      </div>

      {/* The board showing how the word was traced, above the podium */}
      {room.board && (
        <RevealBoard board={room.board} word={word} className="w-full max-w-sm" />
      )}

      <div className="w-full max-w-2xl">
        <Podium players={players} winnerId={winnerId} celebrate={finished} />
      </div>

      <div className="mt-auto flex items-center gap-3 shrink-0 pb-4">
        {total > 0 && !finished && (
          <>
            <Button variant="secondary" onClick={() => setPaused((p) => !p)}>
              {paused ? '▶ Resume' : '⏸ Pause'}
            </Button>
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
      
      {finished && room.board && (
        <AllWordsSidebar board={room.board} players={room.players} />
      )}
    </div>
  );
}

interface HeadlineProps {
  verdict: WordVerdict;
  nameOf: (id: string) => string;
  index: number;
  total: number;
}

function WordHeadline({ verdict, nameOf, index, total }: HeadlineProps) {
  const dup = !verdict.unique;
  return (
    <motion.div
      key={`${verdict.word}-${index}`}
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="flex flex-col items-center gap-1"
    >
      <span className="text-xs uppercase tracking-widest text-grape/60">
        Word {index + 1} of {total}
      </span>
      <span
        className={`font-display text-4xl font-bold sm:text-5xl ${
          dup ? 'text-grape/50 line-through' : 'text-ink'
        }`}
      >
        {verdict.word}
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
    </motion.div>
  );
}
