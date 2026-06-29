// Persist who-am-I in sessionStorage so a mid-game refresh re-attaches to the
// same player/host slot instead of orphaning it.

export interface Identity {
  roomCode: string;
  playerId: string;
  name: string;
  isHost: boolean;
}

const KEY = 'tim-oggle:identity';

export function saveIdentity(id: Identity): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(id));
  } catch {
    /* storage may be unavailable (private mode) — non-fatal */
  }
}

export function loadIdentity(): Identity | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Identity) : null;
  } catch {
    return null;
  }
}

export function clearIdentity(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* non-fatal */
  }
}
