import type { Room } from '../lib/types';
import { pickWinner, tallyWords, verdictFor } from '../lib/scoring';
import { normalizePlayers, toArray } from '../lib/util';
import Podium from '../components/Podium';

export default function PlayerReveal({
  room,
  playerId,
}: {
  room: Room;
  playerId: string;
}) {
  const players = normalizePlayers(room.players);
  const me = players[playerId];
  const tally = tallyWords(players);
  const revealWords = toArray<string>(room.revealWords);
  const idx = room.currentRevealIndex ?? -1;
  const finished = revealWords.length > 0 && idx >= revealWords.length - 1;
  const winnerId = pickWinner(players);
  const iWon = finished && winnerId === playerId;

  const myWords = (me?.words ?? []).map((w) => w.toUpperCase());

  return (
    <main className="flex flex-1 flex-col items-center gap-5 p-5 text-center">
      <h2 className="font-display text-2xl text-grape/80">
        {finished
          ? iWon
            ? '🏆 You win, Tim-oggle champion!'
            : 'Final results'
          : 'Look at the big screen 📺'}
      </h2>

      <div className="font-display text-5xl font-bold text-white">
        {me?.score ?? 0} <span className="text-xl text-grape/70">pts</span>
      </div>

      <div className="w-full max-w-md">
        <Podium players={players} winnerId={winnerId} celebrate={finished} />
      </div>

      <div className="w-full max-w-md">
        <h3 className="mb-2 font-display text-grape/80">Your words</h3>
        <div className="flex flex-wrap justify-center gap-2">
          {myWords.length === 0 ? (
            <span className="text-grape/50">No words this round</span>
          ) : (
            myWords.map((w) => {
              const v = verdictFor(w, tally);
              return (
                <span
                  key={w}
                  className={`rounded-full px-3 py-1 font-display text-sm ${
                    v.unique
                      ? 'bg-lime/15 text-lime'
                      : 'bg-grape/15 text-grape/60 line-through'
                  }`}
                >
                  {w} {v.unique ? `+${v.points}` : '0'}
                </span>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
