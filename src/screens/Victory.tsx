import { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { MissionProgressIndicator } from '../components/MissionProgressIndicator';
import { NewGameDialog } from '../components/NewGameDialog';
import { useGameStore } from '../store/gameStore';
import { useTranslation } from '../hooks/useTranslation';
import { getSpies, getResistance } from '../utils/gameLogic';

export function Victory() {
  const [newGameOpen, setNewGameOpen] = useState(false);
  const { missions, players, winner, winReason } = useGameStore();
  const { t } = useTranslation();

  if (!winner) return null;

  const completedMissions = missions.filter(m => m.result !== 'pending');
  const resistanceWins = completedMissions.filter(m => m.result === 'success').length;
  const spyWins = completedMissions.filter(m => m.result === 'fail').length;

  const spies = getSpies(players);
  const resistance = getResistance(players);

  const isResistanceWin = winner === 'resistance';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 safe-area-padding">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-6xl font-bold mb-4" aria-hidden="true">
            {isResistanceWin ? '🛡️' : '🕵️'}
          </div>
          
          <h1 className={`text-4xl font-bold mb-2 ${
            isResistanceWin ? 'text-emerald-700' : 'text-rose-700'
          }`}>
            {isResistanceWin ? t('victory.resistanceWins') : t('victory.spiesWin')}
          </h1>

          {winReason === 'team-rejections' && (
            <p className="pm-text-70">
              {t('victory.spiesWinReasonTeamRejections')}
            </p>
          )}
        </div>

        <Card>
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold pm-text-70 mb-4">
                {t('victory.finalScore')}
              </h3>
              
              <div className="flex justify-center space-x-8 mb-6">
                <div className="text-center">
                  <div className="text-emerald-700 font-semibold">
                    {t('missionResult.resistanceWins')}
                  </div>
                  <div className="text-3xl font-bold text-emerald-700">
                    {resistanceWins}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-rose-700 font-semibold">
                    {t('missionResult.spyWins')}
                  </div>
                  <div className="text-3xl font-bold text-rose-700">
                    {spyWins}
                  </div>
                </div>
              </div>
            </div>

            {/* Mission results summary */}
            <div className="divider pt-6">
              <div className="mb-6">
                <MissionProgressIndicator size="medium" />
              </div>
            </div>

            {/* Player roles reveal */}
            <div className="divider pt-6 space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-emerald-700 mb-2">
                  {t('nameEntry.resistance')}
                </h4>
                <div className="space-y-1">
                  {resistance.map((player) => (
                    <div
                      key={player.id}
                      className="rounded-xl p-3 bg-emerald-50 border border-emerald-200 text-emerald-900"
                    >
                      {player.name}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-rose-700 mb-2">
                  {t('nameEntry.spy')}
                </h4>
                <div className="space-y-1">
                  {spies.map((player) => (
                    <div
                      key={player.id}
                      className="rounded-xl p-3 bg-rose-50 border border-rose-200 text-rose-900"
                    >
                      {player.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={() => setNewGameOpen(true)}
              fullWidth
              size="lg"
              variant="primary"
            >
              {t('common.newGame')}
            </Button>
          </div>
        </Card>

        {/* Confetti effect could be added here */}
        <div className="mt-6 text-center">
          <p className="pm-text-40 text-sm">
            {t('victory.thanks')}
          </p>
        </div>
      </div>

      <NewGameDialog open={newGameOpen} onClose={() => setNewGameOpen(false)} />
    </div>
  );
} 
