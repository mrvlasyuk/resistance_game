import { useEffect, useState } from 'react';
import { useGameStore } from './store/gameStore';
import { Lobby } from './screens/Lobby';
import { NameEntry } from './screens/NameEntry';
import { Captain } from './screens/Captain';
import { TeamSelect } from './screens/TeamSelect';
import { TeamVote } from './screens/TeamVote';
import { MissionVote } from './screens/MissionVote';
import { MissionResult } from './screens/MissionResult';
import { Victory } from './screens/Victory';

function App() {
  const [hasHydrated, setHasHydrated] = useState(useGameStore.persist.hasHydrated());
  const phase = useGameStore((state) => state.phase);

  useEffect(() => {
    const unsubscribe = useGameStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    setHasHydrated(useGameStore.persist.hasHydrated());

    return unsubscribe;
  }, []);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (phase) {
      case 'lobby':
        return <Lobby />;
      case 'name-entry':
        return <NameEntry />;
      case 'captain':
        return <Captain />;
      case 'team-select':
        return <TeamSelect />;
      case 'team-vote':
        return <TeamVote />;
      case 'mission-vote':
        return <MissionVote />;
      case 'mission-result':
        return <MissionResult />;
      case 'victory':
        return <Victory />;
      default:
        return <Lobby />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {renderScreen()}
    </div>
  );
}

export default App; 
