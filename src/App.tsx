import PartyBackground from './components/PartyBackground';
import Landing from './components/Landing';
import HostView from './host/HostView';
import PlayerView from './player/PlayerView';
import { useHashRoute } from './lib/hooks';

export default function App() {
  const route = useHashRoute();

  return (
    <>
      <PartyBackground />
      {route.view === 'host' ? (
        <HostView />
      ) : route.view === 'join' ? (
        <PlayerView initialCode={route.code} />
      ) : (
        <Landing />
      )}
    </>
  );
}
