import { useEffect, useRef, useState } from 'react';
import { firebaseConfigured } from '../lib/firebase';
import { joinRoom, playerExists, roomExists } from '../lib/game';
import { useRoom } from '../lib/hooks';
import { loadDictionary } from '../lib/dictionary';
import { clearIdentity, loadIdentity, saveIdentity } from '../lib/session';
import { genId, normalizePlayers } from '../lib/util';
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

  // Re-attach to a previous session (cookie survives a full disconnect). Only
  // if the room + our player slot still exist, and we weren't sent here to join
  // a *different* room via a scanned QR / link.
  useEffect(() => {
    if (restoreRef.current) return;
    restoreRef.current = true;
    (async () => {
      const id = loadIdentity();
      const wantsOtherRoom = !!initialCode && initialCode !== id?.roomCode;
      if (id && !id.isHost && firebaseConfigured && !wantsOtherRoom) {
        try {
          if (
            (await roomExists(id.roomCode)) &&
            (await playerExists(id.roomCode, id.playerId))
          ) {
            setCode(id.roomCode);
            setPlayerId(id.playerId);
          } else {
            clearIdentity(); // room ended or slot gone — start fresh
          }
        } catch {
          /* fall through to the join form */
        }
      }
      setRestoring(false);
    })();
  }, [initialCode]);

  const { room, loading } = useRoom(code);

  // If our slot disappears while connected (host removed us), drop back to the
  // join screen instead of showing a ghost lobby.
  useEffect(() => {
    if (!code || !playerId || !room) return;
    const players = normalizePlayers(room.players);
    if (!(playerId in players)) {
      clearIdentity();
      setCode(null);
      setPlayerId(null);
    }
  }, [room, code, playerId]);

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
      return <PlayerLobby code={code} room={room} playerId={playerId} />;
  }
}
