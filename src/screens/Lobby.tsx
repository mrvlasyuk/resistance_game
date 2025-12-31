import { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useGameStore } from '../store/gameStore';
import { useTranslation } from '../hooks/useTranslation';

export function Lobby() {
  const [selectedPlayers, setSelectedPlayers] = useState(5);
  const { setTotalPlayers, initializeRoles, setLanguage, language } = useGameStore();
  const { t } = useTranslation();

  const handleStartGame = () => {
    setTotalPlayers(selectedPlayers);
    initializeRoles();
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ru' : 'en');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 safe-area-padding">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {t('lobby.title')}
          </h1>
          <p className="text-white/60">
            {t('lobby.subtitle')}
          </p>
        </div>

        <Card>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-3">
                {t('lobby.playerCount')}
              </label>
              <p className="text-xs text-white/40 mb-4">
                {t('lobby.playerCountHelp')}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[5, 6, 7, 8, 9, 10].map((count) => (
                  <button
                    key={count}
                    onClick={() => setSelectedPlayers(count)}
                    className={`p-3 rounded-lg font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 border ${
                      selectedPlayers === count
                        ? 'bg-blue-600 text-white border-blue-700'
                        : 'bg-slate-800 hover:bg-slate-700 text-white/80 border-slate-700'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleStartGame}
              fullWidth
              size="lg"
            >
              {t('lobby.startGame')}
            </Button>

            <Button
              onClick={toggleLanguage}
              variant="secondary"
              fullWidth
            >
              {t('lobby.languageSwitch')}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
} 
