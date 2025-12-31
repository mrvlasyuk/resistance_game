import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { MissionProgressIndicator } from '../components/MissionProgressIndicator';
import { useGameStore } from '../store/gameStore';
import { useTranslation } from '../hooks/useTranslation';
import { getSpies, getResistance } from '../utils/gameLogic';

export function Victory() {
  const { missions, players, resetGame, winner, winReason } = useGameStore();
  const { t } = useTranslation();

  if (!winner) return null;

  const completedMissions = missions.filter(m => m.result !== 'pending');
  const resistanceWins = completedMissions.filter(m => m.result === 'success').length;
  const spyWins = completedMissions.filter(m => m.result === 'fail').length;

  const spies = getSpies(players);
  const resistance = getResistance(players);

  const isResistanceWin = winner === 'resistance';

  const handleNewGame = () => {
    resetGame();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 safe-area-padding">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className={`text-6xl font-bold mb-4 ${
            isResistanceWin ? 'text-blue-500' : 'text-red-500'
          }`}>
            🎉
          </div>
          
          <h1 className={`text-4xl font-bold mb-2 ${
            isResistanceWin ? 'text-blue-400' : 'text-red-400'
          }`}>
            {isResistanceWin ? t('victory.resistanceWins') : t('victory.spiesWin')}
          </h1>

          {winReason === 'team-rejections' && (
            <p className="text-gray-300">
              {t('victory.spiesWinReasonTeamRejections')}
            </p>
          )}
        </div>

        <Card>
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-300 mb-4">
                {t('victory.finalScore')}
              </h3>
              
              <div className="flex justify-center space-x-8 mb-6">
                <div className="text-center">
                  <div className="text-blue-400 font-semibold">
                    {t('missionResult.resistanceWins')}
                  </div>
                  <div className="text-3xl font-bold text-blue-500">
                    {resistanceWins}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-red-400 font-semibold">
                    {t('missionResult.spyWins')}
                  </div>
                  <div className="text-3xl font-bold text-red-500">
                    {spyWins}
                  </div>
                </div>
              </div>
            </div>

            {/* Mission results summary */}
            <div className="border-t border-gray-700 pt-6">
              <div className="mb-6">
                <MissionProgressIndicator size="medium" />
              </div>
            </div>

            {/* Player roles reveal */}
            <div className="border-t border-gray-700 pt-6 space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-blue-400 mb-2">
                  {t('nameEntry.resistance')}
                </h4>
                <div className="space-y-1">
                  {resistance.map((player) => (
                    <div
                      key={player.id}
                      className="bg-blue-900/30 rounded-lg p-2 text-blue-300"
                    >
                      {player.name}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-red-400 mb-2">
                  {t('nameEntry.spy')}
                </h4>
                <div className="space-y-1">
                  {spies.map((player) => (
                    <div
                      key={player.id}
                      className="bg-red-900/30 rounded-lg p-2 text-red-300"
                    >
                      {player.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={handleNewGame}
              fullWidth
              size="lg"
              variant="primary"
            >
              {t('victory.playAgain')}
            </Button>
          </div>
        </Card>

        {/* Confetti effect could be added here */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Thanks for playing The Resistance!
          </p>
        </div>
      </div>
    </div>
  );
} 
