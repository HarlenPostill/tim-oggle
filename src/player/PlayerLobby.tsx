import type { Room } from '../lib/types';
import { normalizePlayers } from '../lib/util';

export default function PlayerLobby({
  room,
  playerId,
}: {
  room: Room;
  playerId: string;
}) {
  const players = normalizePlayers(room.players);
  const me = players[playerId];
  const count = Object.keys(players).length;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <span className="animate-float-glow text-6xl">🎈</span>
      <h2 className="font-display text-3xl font-bold text-ink">
        You're in, {me?.name ?? 'friend'}!
      </h2>
      <p className="max-w-xs text-grape/80">
        Watch the big screen 📺 — the game starts when the host hits go.
      </p>
      <p className="text-sm text-grape/60">
        {count} {count === 1 ? 'player' : 'players'} in the room
      </p>
    </main>
  );
}
