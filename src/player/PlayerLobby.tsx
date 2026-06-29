import { lazy, Suspense, useState } from "react";
import type { Room } from "../lib/types";
import { setPlayerName } from "../lib/game";
import { updateIdentity } from "../lib/session";
import { normalizePlayers } from "../lib/util";
import Button from "../components/Button";

// Lazy so matter-js only downloads for players who actually reach the lobby.
const SuikaGame = lazy(() => import("../components/SuikaGame"));

export default function PlayerLobby({
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
  const count = Object.keys(players).length;

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(me?.name ?? "");
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setName(me?.name ?? "");
    setEditing(true);
  };

  const save = async () => {
    const clean = name.trim().slice(0, 20);
    if (!clean) return;
    setSaving(true);
    try {
      await setPlayerName(code, playerId, clean);
      updateIdentity({ name: clean });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col items-center gap-4 p-4 text-center">
      <span className="animate-float-glow text-5xl">🎈</span>

      {editing ? (
        <div className="flex w-full max-w-xs flex-col gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            autoFocus
            className="rounded-2xl border-2 border-line bg-white px-4 py-3 text-center font-display text-2xl text-ink outline-none focus:border-magenta"
          />
          <div className="flex gap-2">
            <Button
              onClick={save}
              disabled={saving || !name.trim()}
              className="flex-1"
            >
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setEditing(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <h2 className="font-display text-3xl font-bold text-ink">
            You're in, {me?.name ?? "friend"}!
          </h2>
          <button
            onClick={startEdit}
            className="text-sm text-magenta underline-offset-4 hover:underline"
          >
            ✏️ Edit name
          </button>
        </>
      )}

      <p className="max-w-xs text-grape/80">
        Watch the big screen and admire the logo.
      </p>
      <p className="text-sm text-grape/60">
        {count} {count === 1 ? "player" : "players"} in the room
      </p>

      <div className="mt-1 w-full max-w-sm border-t border-line pt-3">
        <p className="mb-2 font-display text-grape/80">While you wait… 🍉</p>
        <Suspense
          fallback={
            <p className="py-8 text-center text-grape/50">Loading mini-game…</p>
          }
        >
          <SuikaGame />
        </Suspense>
      </div>
    </main>
  );
}
