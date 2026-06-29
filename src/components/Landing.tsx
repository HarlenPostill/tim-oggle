import Wordmark from "./Wordmark";
import Button from "./Button";
import { ConfigWarning } from "./ConfigWarning";
import { navigate } from "../lib/hooks";

export default function Landing() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 p-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <span className="animate-float-glow text-5xl">🎉🎂🎈</span>
        <Wordmark size="xl" />
      </div>

      <div className="flex w-full max-w-xs flex-col gap-4">
        <Button
          variant="primary"
          className="w-full"
          onClick={() => navigate("host")}
        >
          Host a party on screen
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => navigate("join")}
        >
          Join the party
        </Button>
      </div>

      <ConfigWarning />
    </main>
  );
}
