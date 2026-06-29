import Wordmark from './Wordmark';
import Button from './Button';
import { ConfigWarning } from './ConfigWarning';
import { navigate } from '../lib/hooks';

export default function Landing() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 p-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <span className="animate-float-glow text-5xl">🎉🎂🎈</span>
        <Wordmark size="xl" />
        <p className="max-w-md text-lg text-grape/80">
          A multiplayer Boggle party for Tim's birthday. One screen hosts —
          everyone else plays on their phones.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-4">
        <Button
          variant="primary"
          className="w-full"
          onClick={() => navigate('host')}
        >
          📺 Host on this screen
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => navigate('join')}
        >
          📱 Join a game
        </Button>
      </div>

      <ConfigWarning />
    </main>
  );
}
