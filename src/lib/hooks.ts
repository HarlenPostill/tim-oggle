import { useEffect, useRef, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { db } from './firebase';
import type { Room } from './types';

// ------------------------------------------------------------------ //
// Realtime + routing hooks.                                            //
// ------------------------------------------------------------------ //

/** Subscribe to a room and re-render on every change. */
export function useRoom(code: string | null): {
  room: Room | null;
  loading: boolean;
} {
  // Track which code the snapshot belongs to so `loading` can be derived in
  // render — no synchronous setState inside the effect.
  const [state, setState] = useState<{
    room: Room | null;
    loadedFor: string | null;
  }>({ room: null, loadedFor: null });

  useEffect(() => {
    if (!code) return;
    const unsub = onValue(ref(db, `rooms/${code}`), (snap) => {
      setState({
        room: snap.exists() ? (snap.val() as Room) : null,
        loadedFor: code,
      });
    });
    return () => unsub();
  }, [code]);

  const settled = code != null && state.loadedFor === code;
  return {
    room: settled ? state.room : null,
    loading: code != null && !settled,
  };
}

/** The difference between server time and this device's clock (ms). Lets us
 *  derive a skew-free countdown from the server-stamped startedAt. */
export function useServerOffset(): number {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const unsub = onValue(ref(db, '.info/serverTimeOffset'), (snap) => {
      setOffset((snap.val() as number) ?? 0);
    });
    return () => unsub();
  }, []);
  return offset;
}

/** Seconds remaining in the round, ticking ~4x/sec. */
export function useCountdown(
  startedAt: number | null,
  roundSeconds: number,
  offset: number,
): number {
  const [remaining, setRemaining] = useState(roundSeconds);

  useEffect(() => {
    // Date.now() lives inside the effect/interval (never during render) so the
    // hook stays pure for the React Compiler.
    const recompute = () => {
      if (startedAt == null) {
        setRemaining(roundSeconds);
        return;
      }
      const ms = startedAt + roundSeconds * 1000 - (Date.now() + offset);
      setRemaining(Math.max(0, Math.ceil(ms / 1000)));
    };
    recompute();
    if (startedAt == null) return;
    const id = setInterval(recompute, 250);
    return () => clearInterval(id);
  }, [startedAt, roundSeconds, offset]);

  return remaining;
}

// ------------------------------------------------------------------ //
// Hash routing — no dependency, deploys to any static host.           //
//   #/            -> landing                                          //
//   #/host        -> TV / host view                                   //
//   #/join?code=X -> mobile controller, optionally pre-filled         //
// ------------------------------------------------------------------ //

export type RouteView = 'landing' | 'host' | 'join';
export interface Route {
  view: RouteView;
  code: string | null;
}

function parseHash(): Route {
  const hash = window.location.hash.replace(/^#/, '');
  const [path, query] = hash.split('?');
  const code = new URLSearchParams(query ?? '').get('code');
  if (path.startsWith('/host')) return { view: 'host', code: null };
  if (path.startsWith('/join')) {
    return { view: 'join', code: code ? code.toUpperCase() : null };
  }
  return { view: 'landing', code: null };
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash());
  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function navigate(view: RouteView, code?: string): void {
  const base = view === 'landing' ? '/' : `/${view}`;
  window.location.hash = code ? `${base}?code=${code}` : base;
}

/** Latest value in a ref — handy for reading current state inside imperative
 *  (non-React) event listeners without re-binding them. The ref is updated in
 *  an effect (after commit) to keep the hook pure. */
export function useLatest<T>(value: T): { current: T } {
  const stored = useRef(value);
  useEffect(() => {
    stored.current = value;
  });
  return stored;
}
