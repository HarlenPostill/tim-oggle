import { useEffect, useState, useMemo } from "react";
import type { Board, Player } from "../lib/types";
import { findWordPath } from "../lib/board";
import { normalizePlayers } from "../lib/util";

interface Props {
  board: Board;
  players: Record<string, Player> | null;
}

export default function AllWordsSidebar({ board, players }: Props) {
  const [allWords, setAllWords] = useState<string[]>([]);

  // 1. Compute found words directly from props without an effect
  const foundWords = useMemo(() => {
    const p = normalizePlayers(players);
    const found = new Set<string>();
    Object.values(p).forEach((player) => {
      player.words.forEach((w) => found.add(w));
    });
    return found;
  }, [players]);

  useEffect(() => {
    // 2. Find all possible words
    // Fetch the dictionary asynchronously so it's guaranteed to be loaded
    let active = true;
    import("../lib/dictionary").then(({ loadDictionary }) => {
      loadDictionary().then((validSet) => {
        if (!active) return;
        const possible: string[] = [];
        for (const w of validSet) {
          if (findWordPath(w, board)) {
            possible.push(w);
          }
        }

        possible.sort((a, b) => {
          if (b.length !== a.length) return b.length - a.length;
          return a.localeCompare(b);
        });
        setAllWords(possible);
      });
    });

    return () => {
      active = false;
    };
  }, [board]);

  // Duplicated list for seamless scrolling
  const displayList = useMemo(() => {
    return [...allWords, ...allWords];
  }, [allWords]);

  if (allWords.length === 0) {
    return (
      <aside className="w-64 border-l-2 border-line bg-surface/50 p-4 shrink-0 flex items-center justify-center text-grape/50">
        Finding words...
      </aside>
    );
  }

  // Speed: ~2 seconds per word so it's readable (half speed)
  const duration = allWords.length * 2;

  return (
    <aside className="w-64 lg:w-72 border-l-2 border-line bg-surface/80 shadow-inner flex flex-col shrink-0 relative overflow-hidden">
      <div className="bg-surface p-4 border-b-2 border-line shrink-0 z-10 shadow-sm relative text-center">
        <h3 className="font-display text-xl font-bold text-ink">
          All Possible Words
        </h3>
        <p className="text-sm text-grape mt-1">
          <span className="font-semibold text-lime">{foundWords.size}</span>{" "}
          found out of {allWords.length}
        </p>
      </div>

      {/* 
        We use a relative container that hides overflow. 
        The inner div scrolls up using an inline style animation.
        Hovering pauses the animation.
      */}
      <div className="flex-1 overflow-hidden relative group">
        <div
          className="absolute inset-x-0 px-4 py-2 flex flex-col gap-1 group-hover:[animation-play-state:paused]"
          style={{
            animation: `sidebar-scroll-up ${duration}s linear infinite`,
            animationDelay: "5s",
          }}
        >
          {displayList.map((w, i) => {
            const isFound = foundWords.has(w);
            return (
              <div
                key={`${w}-${i}`}
                className={`font-display text-lg tracking-wide px-3 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                  isFound
                    ? "bg-lime/20 text-lime font-bold shadow-sm ring-1 ring-lime/30"
                    : "text-ink/70 bg-black/5"
                }`}
              >
                <span>{w}</span>
                {isFound && <span className="text-sm">✓</span>}
              </div>
            );
          })}
        </div>

        {/* Gradient fades for top and bottom of scroll area */}
        <div className="absolute inset-x-0 top-0 h-8 bg-linear-to-b from-surface/80 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-surface/80 to-transparent pointer-events-none z-10" />
      </div>
    </aside>
  );
}
