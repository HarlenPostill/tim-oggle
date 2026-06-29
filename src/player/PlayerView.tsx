import { useEffect, useRef, useState } from 'react';
import { firebaseConfigured } from '../lib/firebase';
import { joinRoom, roomExists } from '../lib/game';
import { useRoom } from '../lib/hooks';
import { loadDictionary } from '../lib/dictionary';
import { loadIdentity, saveIdentity } from '../lib/session';
import { genId } from '../lib/util';
import Loading from '../components/Loading';
import { ConfigScreen } from '../components/ConfigWarning';
import PlayerJoin from './PlayerJoin';
import PlayerLobby from './PlayerLobby';
import PlayerPlaying from './PlayerPlaying';
import PlayerReveal from './PlayerReveal';

/** The mobile controller. Joins a room, then mirrors the room status. */
export default function PlayerView({ initialCode }: { initialCode: string | null }) {
  const [code, setCode] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);
  const restoreRef = useRef(false);

  // Start downloading the dictionary immediately so it's ready by game time.
  useEffect(() => {
    loadDictionary();
  }, []);

  // Re-attach to a previous session after a refresh.
  useEffect(() => {
    if (restoreRef.current) return;
    restoreRef.current = true;
    (async () => {
      const id = loadIdentity();
      if (id && !id.isHost && firebaseConfigured) {
        try {
          if (await roomExists(id.roomCode)) {
            setCode(id.roomCode);
            setPlayerId(id.playerId);
          }
        } catch {
          /* fall through to the join form */
        }
      }
      setRestoring(false);
    })();
  }, []);

  const { room, loading } = useRoom(code);

  const handleJoin = async (joinCode: string, name: string) => {
    const id = genId();
    await joinRoom(joinCode, id, name);
    saveIdentity({ roomCode: joinCode, playerId: id, name, isHost: false });
    setPlayerId(id);
    setCode(joinCode);
  };

  if (!firebaseConfigured) return <ConfigScreen />;
  if (restoring) return <Loading label="Reconnecting…" />;
  if (!code || !playerId) {
    return <PlayerJoin initialCode={initialCode} onJoin={handleJoin} />;
  }
  if (loading || !room) return <Loading label="Joining room…" />;

  switch (room.status) {
    case 'PLAYING':
      return <PlayerPlaying code={code} room={room} playerId={playerId} />;
    case 'REVEAL':
      return <PlayerReveal code={code} room={room} playerId={playerId} />;
    default:
      return <PlayerLobby room={room} playerId={playerId} />;
  }
}
