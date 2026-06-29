# 🎉 Tim-oggle

A celebratory, multiplayer **Jackbox-style Boggle** game for Tim's birthday.
One screen hosts (the "TV"); everyone else plays on their phones by dragging
across the board to spell words. Fully serverless — state syncs through
**Firebase Realtime Database**.

> **First time here? Read [SETUP.md](./SETUP.md)** — add your Firebase keys and
> the word list (~5 min), then `npm run dev`.

## How it plays

1. **Host** opens the app → _📺 Host on this screen_. A 4-letter room code appears.
2. **Players** open the same URL on their phones → _📱 Join a game_ → type the code + a name.
3. Host hits **Start**: a 4×4 board (boosted for **T / I / M** 🎂) appears for everyone.
4. Players **drag their finger** across adjacent tiles to form words. Valid words
   bank instantly; invalid ones **shake** to block spamming. Words sync live.
5. When the timer hits zero, the host walks through every word one-by-one. Unique
   words score (3 letters = 1 pt, +1 per extra letter); duplicates are crossed out.
   The **Framer Motion podium** re-orders live, and the final word triggers a
   full-screen **confetti** blast over the winner. 🏆

## Tech

| Concern        | Choice                                              |
| -------------- | --------------------------------------------------- |
| Build / UI     | Vite + React 19 (React Compiler) + TypeScript       |
| Styling        | Tailwind CSS v4 (dark, festive theme in `index.css`)|
| Realtime state | Firebase Realtime Database (`rooms/{code}`)         |
| Animation      | Framer Motion (podium, reveal) + canvas-confetti    |
| Routing        | Hash routes (`#/host`, `#/join?code=…`) — no deps   |

## Project map

```
src/
  lib/
    types.ts        DB schema (rooms/{code})
    firebase.ts     init from .env (placeholder-safe)
    game.ts         all reads/writes to Firebase (the "actions" layer)
    board.ts        Boggle dice + TIM boost + adjacency
    dictionary.ts   loads public/dictionary.txt into a Set (+ fallback)
    scoring.ts      pure scoring engine (points, reveal order, winner)
    hooks.ts        useRoom, useServerOffset, useCountdown, hash router
    session.ts      refresh-resilient identity (sessionStorage)
    util.ts         id gen, RTDB array coercion, clock format
  components/       Board, InteractiveBoard, Podium, Wordmark, Button, …
  host/             HostView → HostLobby / HostPlaying / HostReveal
  player/           PlayerView → PlayerJoin / Lobby / Playing / Reveal
```

## Scripts

```bash
npm run dev       # local dev server
npm run build     # typecheck + production build → dist/
npm run preview   # serve the production build
npm run lint      # eslint
```

Deploy `dist/` to any static host — hash routing needs **no** redirect config.
