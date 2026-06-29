import type { Room } from '../lib/types';
import { pickWinner, tallyWords, verdictFor } from '../lib/scoring';
import { setRevealSpeed } from '../lib/game';
import { normalizePlayers, toArray } from '../lib/util';
import Podium from '../components/Podium';
import RevealBoard from '../components/RevealBoard';

export default function PlayerReveal({
  code,
  room,
  playerId,
}: {
  code: string;
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
  const fast = room.revealFast ?? false;
  const word = idx >= 0 ? revealWords[idx] : null;

  const myWords = (me?.words ?? []).map((w) => w.toUpperCase());

  return (
    <main className="flex flex-1 flex-col items-center gap-4 p-5 text-center">
      <h2 className="font-display text-2xl text-grape/80">
        {finished
          ? iWon
            ? '🏆 You win, Tim-oggle champion!'
            : 'Final results'
          : 'And the words are… 📺'}
      </h2>

      {/* Shared speed-up toggle — any phone can flip it for everyone. */}
      {!finished && revealWords.length > 0 && (
        <button
          onClick={() => setRevealSpeed(code, !fast)}
          className={`rounded-full px-5 py-2 font-display text-sm font-semibold transition ${
            fast
              ? 'bg-cyan/20 text-cyan ring-2 ring-cyan'
              : 'border border-line bg-surface-2 text-grape/80'
          }`}
        >
          {fast ? '⏩ Speeding up — tap to slow' : '⏩ Speed up the reveal'}
        </button>
      )}

      {/* The synced board: same word the TV is showing, with its path lit up. */}
      {room.board && word && (
        <RevealBoard board={room.board} word={word} className="w-full max-w-xs" />
      )}

      <div className="font-display text-4xl font-bold text-white">
        {me?.score ?? 0} <span className="text-lg text-grape/70">pts</span>
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
