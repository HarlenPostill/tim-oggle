import { useEffect, useRef } from 'react';
import type { Room } from '../lib/types';
import { useCountdown } from '../lib/hooks';
import { goToReveal } from '../lib/game';
import { formatClock, normalizePlayers } from '../lib/util';
import BoardView from '../components/BoardView';
import Button from '../components/Button';

interface Props {
  code: string;
  room: Room;
  offset: number;
}

export default function HostPlaying({ code, room, offset }: Props) {
  const remaining = useCountdown(room.startedAt, room.roundSeconds, offset);
  const players = normalizePlayers(room.players);
  const entries = Object.entries(players).sort(
    (a, b) => (b[1].words?.length ?? 0) - (a[1].words?.length ?? 0),
  );

  // The host is the authority: when the clock hits zero, it moves everyone to
  // the reveal. Guarded so it only fires once.
  const endedRef = useRef(false);
  useEffect(() => {
    if (remaining <= 0 && !endedRef.current) {
      endedRef.current = true;
      goToReveal(code).catch(console.error);
    }
  }, [remaining, code]);

  const low = remaining <= 10;

  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-6">
      <div
        className={`font-display text-7xl font-bold tabular-nums ${
          low ? 'animate-pulse text-red-400' : 'text-white'
        }`}
      >
        {formatClock(remaining)}
      </div>

      {room.board && <BoardView board={room.board} className="w-full max-w-md" />}

      <div className="w-full max-w-md">
        <h3 className="mb-2 font-display text-grape/80">Words found</h3>
        <div className="flex flex-col gap-1">
          {entries.map(([id, p]) => (
            <div
              key={id}
              className="flex items-center justify-between rounded-xl bg-surface px-4 py-2"
            >
              <span className="font-display text-white">{p.name}</span>
              <span className="font-display text-magenta">
                {p.words?.length ?? 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Button
        variant="secondary"
        className="mt-auto"
        onClick={() => goToReveal(code)}
      >
        End round now
      </Button>
    </main>
  );
}
