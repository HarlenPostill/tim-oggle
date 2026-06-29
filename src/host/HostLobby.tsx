import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Room } from '../lib/types';
import { startGame } from '../lib/game';
import { normalizePlayers } from '../lib/util';
import Button from '../components/Button';
import Wordmark from '../components/Wordmark';

const ROUND_OPTIONS: { s: number; label: string }[] = [
  { s: 60, label: '1:00' },
  { s: 90, label: '1:30' },
  { s: 120, label: '2:00' },
  { s: 180, label: '3:00' },
];

export default function HostLobby({ code, room }: { code: string; room: Room }) {
  const players = normalizePlayers(room.players);
  const entries = Object.entries(players).sort(
    (a, b) => a[1].joinedAt - b[1].joinedAt,
  );
  const [seconds, setSeconds] = useState(room.roundSeconds ?? 90);
  const [copied, setCopied] = useState(false);

  const joinUrl = `${window.location.origin}${window.location.pathname}#/join?code=${code}`;
  const where = window.location.host;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be blocked — the URL is on screen anyway */
    }
  };

  return (
    <main className="flex flex-1 flex-col items-center gap-8 p-6">
      <Wordmark size="md" />

      <div className="flex flex-col items-center gap-3">
        <p className="text-grape/80">
          Join at <span className="font-semibold text-white">{where}</span> with
          code
        </p>
        <div className="flex gap-2 sm:gap-3">
          {code.split('').map((ch, i) => (
            <div
              key={i}
              className="grid h-16 w-14 place-items-center rounded-2xl border border-line bg-surface-2 font-display text-4xl font-bold text-white shadow-lg shadow-magenta/10 sm:h-20 sm:w-16 sm:text-5xl"
            >
              {ch}
            </div>
          ))}
        </div>
        <button
          onClick={copy}
          className="text-sm text-grape underline-offset-4 hover:underline"
        >
          {copied ? 'Copied! ✓' : 'Copy join link'}
        </button>
      </div>

      <div className="w-full max-w-2xl">
        <h3 className="mb-3 text-center font-display text-xl text-white">
          Players <span className="text-grape/70">({entries.length})</span>
        </h3>
        {entries.length === 0 ? (
          <p className="text-center text-grape/60">
            Waiting for friends to join…
          </p>
        ) : (
          <div className="flex flex-wrap justify-center gap-2">
            <AnimatePresence>
              {entries.map(([id, p]) => (
                <motion.div
                  key={id}
                  layout
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  className="rounded-full border border-grape/40 bg-grape/15 px-4 py-2 font-display text-white"
                >
                  {p.name}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="mt-auto flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-grape/70">Round:</span>
          {ROUND_OPTIONS.map(({ s, label }) => (
            <button
              key={s}
              onClick={() => setSeconds(s)}
              className={`rounded-full px-3 py-1 font-display text-sm transition ${
                seconds === s
                  ? 'bg-magenta text-white'
                  : 'border border-line bg-surface-2 text-grape/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <Button
          variant="gold"
          disabled={entries.length === 0}
          onClick={() => startGame(code, seconds)}
        >
          🎲 Start Tim-oggle!
        </Button>
      </div>
    </main>
  );
}
