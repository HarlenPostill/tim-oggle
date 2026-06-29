import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameMode, Room } from "../lib/types";
import { QRCodeSVG } from "qrcode.react";
import { removePlayer, startGame } from "../lib/game";
import { normalizePlayers } from "../lib/util";
import Button from "../components/Button";
import Wordmark from "../components/Wordmark";

const ROUND_OPTIONS: { s: number; label: string }[] = [
  { s: 60, label: "1:00" },
  { s: 90, label: "1:30" },
  { s: 120, label: "2:00" },
  { s: 180, label: "3:00" },
];

const MODE_OPTIONS: { mode: GameMode; label: string; blurb: string }[] = [
  {
    mode: "TIM_TIME",
    label: "🎂 Tim-oggle Time",
    blurb: "Special birthday board",
  },
  { mode: "BOGGLE", label: "🎲 Boggle", blurb: "The classic gamemode" },
];

export default function HostLobby({
  code,
  room,
}: {
  code: string;
  room: Room;
}) {
  const players = normalizePlayers(room.players);
  const entries = Object.entries(players).sort(
    (a, b) => a[1].joinedAt - b[1].joinedAt,
  );
  const [seconds, setSeconds] = useState(room.roundSeconds ?? 90);
  const [mode, setMode] = useState<GameMode>(room.mode ?? "TIM_TIME");
  const [copied, setCopied] = useState(false);

  const joinUrl = `${window.location.origin}${window.location.pathname}#/join?code=${code}`;
  const where = window.location.host;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be blocked — the URL is on screen anyway */
    }
  };

  return (
    <main className="flex flex-1 flex-col items-center gap-8 p-6">
      <Wordmark size="md" />

      <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-3xl border-2 border-ink bg-white p-3 shadow-sm">
            <QRCodeSVG
              value={joinUrl}
              size={176}
              level="M"
              marginSize={1}
              bgColor="#ffffff"
              fgColor="#0c2340"
            />
          </div>
          <p className="font-display text-sm text-grape/80">Scan to join</p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className="text-grape/80">
            …or go to <span className="font-semibold text-ink">{where}</span>{" "}
            and enter
          </p>
          <div className="flex gap-2 sm:gap-3">
            {code.split("").map((ch, i) => (
              <div
                key={i}
                className="grid h-16 w-14 place-items-center rounded-2xl border-2 border-ink bg-white font-display text-4xl font-bold text-ink shadow-sm sm:h-20 sm:w-16 sm:text-5xl"
              >
                {ch}
              </div>
            ))}
          </div>
          <button
            onClick={copy}
            className="text-sm text-grape underline-offset-4 hover:underline"
          >
            {copied ? "Copied! ✓" : "Copy join link"}
          </button>
        </div>
      </div>

      <div className="w-full max-w-2xl">
        <h3 className="mb-1 text-center font-display text-xl text-ink">
          Players <span className="text-grape/70">({entries.length})</span>
        </h3>
        {entries.length === 0 ? (
          <p className="text-center text-grape/60">
            Waiting for friends to join…
          </p>
        ) : (
          <>
            <p className="mb-3 text-center text-xs text-grape/60">
              Hover a name to remove a player
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <AnimatePresence>
                {entries.map(([id, p]) => (
                  <motion.div
                    key={id}
                    layout
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    className="group relative rounded-full border border-magenta/40 bg-magenta/10 px-4 py-2 font-display text-ink"
                  >
                    {p.name}
                    <button
                      onClick={() => removePlayer(code, id)}
                      title={`Remove ${p.name}`}
                      aria-label={`Remove ${p.name}`}
                      className="absolute -right-2 -top-2 hidden h-6 w-6 place-items-center rounded-full bg-red-500 text-sm font-bold leading-none text-white shadow group-hover:grid"
                    >
                      ×
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      <div className="mt-auto flex flex-col items-center gap-4">
        <div className="flex flex-wrap justify-center gap-3">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.mode}
              onClick={() => setMode(opt.mode)}
              className={`flex flex-col items-center rounded-2xl px-5 py-3 transition ${
                mode === opt.mode
                  ? "bg-magenta/15 text-ink ring-2 ring-magenta"
                  : "border border-line bg-surface-2 text-grape/80"
              }`}
            >
              <span className="font-display text-lg font-semibold">
                {opt.label}
              </span>
              <span className="text-xs text-grape/60">{opt.blurb}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-grape/70">Round:</span>
          {ROUND_OPTIONS.map(({ s, label }) => (
            <button
              key={s}
              onClick={() => setSeconds(s)}
              className={`rounded-full px-3 py-1 font-display text-sm transition ${
                seconds === s
                  ? "bg-magenta text-white"
                  : "border border-line bg-surface-2 text-grape/80"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <Button
          variant="gold"
          disabled={entries.length === 0}
          onClick={() => startGame(code, seconds, mode)}
        >
          Start Tim-oggle!
        </Button>
      </div>
    </main>
  );
}
