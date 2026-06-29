import { firebaseConfigured } from '../lib/firebase';

/** Inline banner shown on the landing screen when keys are missing. */
export function ConfigWarning() {
  if (firebaseConfigured) return null;
  return (
    <div className="mx-auto max-w-md rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      ⚠️ Firebase isn't configured yet. Add your keys to{' '}
      <code className="rounded bg-ink/10 px-1">.env</code> (see{' '}
      <code className="rounded bg-ink/10 px-1">SETUP.md</code>). Multiplayer
      sync won't work until you do.
    </div>
  );
}

/** Full-screen stand-in shown on /host and /join before keys are added, since
 *  those views can't function without a database connection. */
export function ConfigScreen() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 p-6 text-center">
      <span className="text-5xl">🔌</span>
      <h2 className="font-display text-2xl font-bold text-ink">
        Connect Firebase to play
      </h2>
      <div className="max-w-md text-grape/80">
        Add your Realtime Database keys to a{' '}
        <code className="rounded bg-ink/10 px-1">.env</code> file in the
        project root, then restart the dev server. Step-by-step instructions are
        in <code className="rounded bg-ink/10 px-1">SETUP.md</code>.
      </div>
      <a
        href="#/"
        className="font-display text-grape underline-offset-4 hover:underline"
      >
        ← Back
      </a>
    </main>
  );
}
