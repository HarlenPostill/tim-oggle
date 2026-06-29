# Tim-oggle — Setup

Two things to do before the party: **add Firebase keys** and **drop in the word list**. Both take ~5 minutes.

---

## 1. Firebase Realtime Database (required)

The whole game syncs through one free Firebase Realtime Database. No backend, no Firestore.

1. Go to the [Firebase console](https://console.firebase.google.com/) → **Add project** (any name, e.g. `tim-oggle`). You can disable Google Analytics.
2. In the left sidebar, open **Build → Realtime Database** → **Create Database**.
   - Pick a location.
   - Start in **Test mode** (fine for a one-night birthday party — see the security note below).
3. Register a web app: **Project settings (gear icon) → General → Your apps → Web (`</>`)**. Give it a nickname, **don't** enable Hosting yet. Firebase shows you a `firebaseConfig` object.
4. Copy `.env.example` to `.env` in the project root and fill in the values from that config object:

   ```bash
   cp .env.example .env
   ```

   The most important one is **`VITE_FIREBASE_DATABASE_URL`** — it ends in `firebaseio.com` (or `firebasedatabase.app`). Grab it from the Realtime Database page header if it isn't in the snippet.

5. Restart the dev server (`npm run dev`). The "Connect Firebase" screen disappears once a real database URL is present.

### Test-mode rules (default, open for 30 days)

Test mode is enough to play tonight. If you want the database locked to just this app's shape, paste these rules into **Realtime Database → Rules**:

```json
{
  "rules": {
    "rooms": {
      "$code": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

> ⚠️ These rules are open (anyone with a room code can read/write). That's deliberate for a zero-auth party game. Don't reuse this database for anything sensitive, and feel free to delete the project afterwards.

---

## 2. The dictionary (recommended)

Word validation reads a **UK Scrabble word list** at runtime.

- Put your file at **`public/dictionary.txt`** — one word per line (case-insensitive).
- It's fetched on demand and loaded into a `Set`; it is **never bundled into the JS**.
- Until the file exists, the app uses a small built-in fallback list and shows a gold "using fallback" note. Everything still works — players just have a smaller valid-word set.

A common source is the **SOWPODS / Collins** list (~270k words). Any newline-delimited list works.

---

## 3. Run it

```bash
npm install      # already done if you're reading this
npm run dev      # local dev at http://localhost:5173
npm run build    # production build into dist/
npm run preview  # serve the production build locally
```

- **Host / TV:** open the app and click **📺 Host on this screen**.
- **Players:** open the same site on phones, click **📱 Join a game**, enter the 4-letter code.

For a real party, deploy `dist/` to any static host (Vercel, Netlify, Firebase Hosting, GitHub Pages) so phones can reach it. Hash routing means **no rewrite/redirect config is needed** — it just works.
