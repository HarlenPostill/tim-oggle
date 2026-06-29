// Persist who-am-I in a cookie so a disconnect (even a full tab/browser close)
// can re-attach to the same player/host slot while the game is still running.

export interface Identity {
  roomCode: string;
  playerId: string;
  name: string;
  isHost: boolean;
}

const KEY = 'tim_oggle_identity';
const MAX_AGE_DAYS = 1; // a party lasts a night — expire the next day

function writeCookie(value: string): void {
  const expires = new Date(Date.now() + MAX_AGE_DAYS * 864e5).toUTCString();
  document.cookie = `${KEY}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function readCookie(): string | null {
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + KEY + '=([^;]*)'),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function saveIdentity(id: Identity): void {
  try {
    writeCookie(JSON.stringify(id));
  } catch {
    /* cookies may be unavailable (private mode) — non-fatal */
  }
}

export function loadIdentity(): Identity | null {
  try {
    const raw = readCookie();
    return raw ? (JSON.parse(raw) as Identity) : null;
  } catch {
    return null;
  }
}

/** Patch the stored identity in place (e.g. after a name change). */
export function updateIdentity(patch: Partial<Identity>): void {
  const current = loadIdentity();
  if (current) saveIdentity({ ...current, ...patch });
}

export function clearIdentity(): void {
  try {
    document.cookie = `${KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
  } catch {
    /* non-fatal */
  }
}
