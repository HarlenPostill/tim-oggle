import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Room } from '../lib/types';
import { useCountdown, useServerOffset } from '../lib/hooks';
import {
  MIN_WORD_LENGTH,
  isDictionaryFallback,
  isWord,
  loadDictionary,
} from '../lib/dictionary';
import { pointsFor } from '../lib/scoring';
import { setPlayerWords } from '../lib/game';
import { formatClock, normalizePlayers } from '../lib/util';
import InteractiveBoard from '../components/InteractiveBoard';

type FeedbackKind = 'valid' | 'invalid' | 'dupe' | 'short';
interface Feedback {
  kind: FeedbackKind;
  word: string;
  key: number;
}

export default function PlayerPlaying({
  code,
  room,
  playerId,
}: {
  code: string;
  room: Room;
  playerId: string;
}) {
  const offset = useServerOffset();
  const remaining = useCountdown(room.startedAt, room.roundSeconds, offset);

  // Seed from Firebase so a refresh keeps the words already found this round.
  const [found, setFound] = useState<string[]>(
    () => normalizePlayers(room.players)[playerId]?.words ?? [],
  );
  const [live, setLive] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [dictReady, setDictReady] = useState(false);
  const fbKey = useRef(0);

  useEffect(() => {
    loadDictionary().then(() => setDictReady(true));
  }, []);

  const timeUp = remaining <= 0;
  const disabled = timeUp || !dictReady;

  const flash = (kind: FeedbackKind, word: string) => {
    fbKey.current += 1;
    setFeedback({ kind, word, key: fbKey.current });
  };

  const handleWord = (word: string) => {
    if (word.length < MIN_WORD_LENGTH) return flash('short', word);
    if (found.includes(word)) return flash('dupe', word);
    if (!isWord(word)) return flash('invalid', word);
    const next = [...found, word];
    setFound(next);
    flash('valid', word);
    setPlayerWords(code, playerId, next).catch(console.error);
  };

  const potential = found.reduce((sum, w) => sum + pointsFor(w), 0);

  return (
    <main className="flex flex-1 flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <div className="font-display text-sm text-grape/70">
          {found.length} {found.length === 1 ? 'word' : 'words'} • up to{' '}
          {potential} pts
        </div>
        <div
          className={`font-display text-2xl font-bold tabular-nums ${
            remaining <= 10 ? 'animate-pulse text-red-400' : 'text-white'
          }`}
        >
          {formatClock(remaining)}
        </div>
      </div>

      <WordBar live={live} feedback={feedback} disabled={timeUp} />

      {room.board ? (
        <InteractiveBoard
          board={room.board}
          disabled={disabled}
          onWord={handleWord}
          onDraw={setLive}
        />
      ) : (
        <p className="text-center text-grape/70">Waiting for board…</p>
      )}

      {dictReady && isDictionaryFallback() && (
        <p className="text-center text-xs text-gold/80">
          Using the fallback word list — add public/dictionary.txt for the full
          set.
        </p>
      )}

      <div className="mt-1 flex flex-wrap content-start gap-2 overflow-y-auto">
        {[...found].reverse().map((w) => (
          <span
            key={w}
            className="rounded-full bg-grape/15 px-3 py-1 font-display text-sm text-white"
          >
            {w} <span className="text-lime">+{pointsFor(w)}</span>
          </span>
        ))}
      </div>

      {timeUp && (
        <p className="text-center font-display text-lg text-magenta">
          Time's up! Look at the big screen 📺
        </p>
      )}
    </main>
  );
}

function WordBar({
  live,
  feedback,
  disabled,
}: {
  live: string;
  feedback: Feedback | null;
  disabled: boolean;
}) {
  if (disabled) {
    return (
      <div className="grid h-14 place-items-center rounded-2xl bg-surface font-display text-xl text-grape/60">
        Round over
      </div>
    );
  }

  // While a finger is down we show the live word being traced.
  if (live) {
    return (
      <div className="grid h-14 place-items-center rounded-2xl bg-surface-2 font-display text-2xl tracking-[0.3em] text-white">
        {live}
      </div>
    );
  }

  if (feedback) {
    const style: Record<FeedbackKind, string> = {
      valid: 'bg-lime/15 text-lime',
      invalid: 'bg-red-500/15 text-red-300',
      dupe: 'bg-gold/15 text-gold',
      short: 'bg-red-500/15 text-red-300',
    };
    const label: Record<FeedbackKind, string> = {
      valid: `${feedback.word}  ✓ +${pointsFor(feedback.word)}`,
      invalid: `${feedback.word}  ✗ not a word`,
      dupe: `${feedback.word}  already found`,
      short: `too short (min ${MIN_WORD_LENGTH} letters)`,
    };
    const isError = feedback.kind !== 'valid';
    return (
      <motion.div
        key={feedback.key}
        initial={isError ? { x: 0 } : { scale: 0.92, opacity: 0 }}
        animate={
          // The shake — visual spam-block for invalid / duplicate submissions.
          isError ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { scale: 1, opacity: 1 }
        }
        transition={{ duration: isError ? 0.45 : 0.25 }}
        className={`grid h-14 place-items-center rounded-2xl font-display text-xl ${style[feedback.kind]}`}
      >
        {label[feedback.kind]}
      </motion.div>
    );
  }

  return (
    <div className="grid h-14 place-items-center rounded-2xl bg-surface font-display text-lg text-grape/50">
      Draw a word ✍️
    </div>
  );
}
