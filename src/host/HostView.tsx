import { useEffect, useRef, useState } from 'react';
import { firebaseConfigured } from '../lib/firebase';
import { createRoom, roomExists } from '../lib/game';
import { useRoom, useServerOffset } from '../lib/hooks';
import { loadIdentity, saveIdentity } from '../lib/session';
import { genId } from '../lib/util';
import Loading from '../components/Loading';
import { ConfigScreen } from '../components/ConfigWarning';
import HostLobby from './HostLobby';
import HostPlaying from './HostPlaying';
import HostReveal from './HostReveal';

/** The TV / authority client. Owns the room, runs the timer, drives the reveal. */
export default function HostView() {
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (!firebaseConfigured || initRef.current) return;
    initRef.current = true; // guard against StrictMode double-mount
    (async () => {
      try {
        const existing = loadIdentity();
        if (existing?.isHost && (await roomExists(existing.roomCode))) {
          setCode(existing.roomCode); // resume the same room after a refresh
          return;
        }
        const hostId = genId();
        const newCode = await createRoom(hostId);
        saveIdentity({
          roomCode: newCode,
          playerId: hostId,
          name: 'HOST',
          isHost: true,
        });
        setCode(newCode);
      } catch (e) {
        console.error(e);
        setError('Could not reach Firebase. Check your keys and connection.');
      }
    })();
  }, []);

  const { room } = useRoom(code);
  const offset = useServerOffset();

  if (!firebaseConfigured) return <ConfigScreen />;
  if (error) return <ErrorScreen message={error} />;
  if (!code || !room) return <Loading label="Setting up the party…" />;

  switch (room.status) {
    case 'PLAYING':
      return <HostPlaying code={code} room={room} offset={offset} />;
    case 'REVEAL':
      return <HostReveal code={code} room={room} />;
    default:
      return <HostLobby code={code} room={room} />;
  }
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="text-5xl">😬</span>
      <p className="max-w-md text-lg text-red-300">{message}</p>
      <a
        href="#/"
        className="font-display text-grape underline-offset-4 hover:underline"
      >
        ← Back
      </a>
    </main>
  );
}
