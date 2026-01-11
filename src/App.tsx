import { useEffect, useState } from 'react';
import { useGameStore } from './store/gameStore';
import { useTranslation } from './hooks/useTranslation';
import { Lobby } from './screens/Lobby';
import { NameEntry } from './screens/NameEntry';
import { SpyRevealChoice } from './screens/SpyRevealChoice';
import { SpyReveal } from './screens/SpyReveal';
import { SpyIntro } from './screens/SpyIntro';
import { Captain } from './screens/Captain';
import { TeamSelect } from './screens/TeamSelect';
import { TeamVote } from './screens/TeamVote';
import { MissionVote } from './screens/MissionVote';
import { MissionResult } from './screens/MissionResult';
import { Victory } from './screens/Victory';
import { NewGameButton } from './components/NewGameButton';
import { BackButton } from './components/BackButton';

function App() {
  const [hasHydrated, setHasHydrated] = useState(useGameStore.persist.hasHydrated());
  const phase = useGameStore((state) => state.phase);
  const { t } = useTranslation();

  useEffect(() => {
    const unsubscribe = useGameStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    setHasHydrated(useGameStore.persist.hasHydrated());

    return unsubscribe;
  }, []);

  if (!hasHydrated) {
    return (
      <div className="app-shell">
        <div className="app-shell__content min-h-screen flex items-center justify-center p-4 safe-area-padding">
          <div className="card text-center space-y-4 w-full max-w-sm">
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full border-2 border-slate-300 border-t-[color:var(--pm-accent)] animate-spin" />
            </div>
            <div className="pm-text-70">{t('common.loading')}</div>
          </div>
        </div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (phase) {
      case 'lobby':
        return <Lobby />;
      case 'name-entry':
        return <NameEntry />;
      case 'spy-reveal-choice':
        return <SpyRevealChoice />;
      case 'spy-reveal':
        return <SpyReveal />;
      case 'spy-intro':
        return <SpyIntro />;
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
    <div className="app-shell">
      <div className="app-shell__content">{renderScreen()}</div>
      <BackButton />
      {phase !== 'lobby' && phase !== 'victory' && <NewGameButton />}
    </div>
  );
}

export default App; 
