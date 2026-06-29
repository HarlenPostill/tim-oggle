import { useState } from 'react';
import type { FormEvent } from 'react';
import { roomExists } from '../lib/game';
import Button from '../components/Button';
import Wordmark from '../components/Wordmark';

interface Props {
  initialCode: string | null;
  onJoin: (code: string, name: string) => Promise<void>;
}

export default function PlayerJoin({ initialCode, onJoin }: Props) {
  const [code, setCode] = useState((initialCode ?? '').toUpperCase());
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const c = code.trim().toUpperCase();
    const n = name.trim();
    if (c.length !== 4) return setError('Room code is 4 letters');
    if (!n) return setError('Enter your name');

    setBusy(true);
    try {
      if (!(await roomExists(c))) {
        setError("That room doesn't exist");
        setBusy(false);
        return;
      }
      await onJoin(c, n);
    } catch (err) {
      console.error(err);
      setError('Could not join — try again');
      setBusy(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <Wordmark size="lg" />
      <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-grape/70">Room code</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
            placeholder="ABCD"
            autoCapitalize="characters"
            autoCorrect="off"
            autoComplete="off"
            className="rounded-2xl border border-line bg-surface-2 px-4 py-4 text-center font-display text-3xl tracking-[0.5em] text-ink outline-none focus:border-magenta"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-grape/70">Your name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            placeholder="e.g. Tim"
            className="rounded-2xl border border-line bg-surface-2 px-4 py-4 font-display text-xl text-ink outline-none focus:border-magenta"
          />
        </label>
        {error && <p className="text-center text-sm text-red-500">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Joining…' : 'Join the party 🎈'}
        </Button>
      </form>
      <a
        href="#/"
        className="text-sm text-grape underline-offset-4 hover:underline"
      >
        ← Back
      </a>
    </main>
  );
}
