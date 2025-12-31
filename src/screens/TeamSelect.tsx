import { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { MissionProgressIndicator } from '../components/MissionProgressIndicator';
import { useGameStore } from '../store/gameStore';
import { useTranslation } from '../hooks/useTranslation';
import { getTeamSize } from '../utils/gameLogic';

export function TeamSelect() {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const { players, missions, totalPlayers, selectTeam, rejectedTeamsCount } = useGameStore();
  const { t } = useTranslation();

  const currentMission = missions.find(m => m.result === 'pending');
  const missionNumber = currentMission?.number || 1;
  const requiredTeamSize = getTeamSize(missionNumber, totalPlayers);

  const togglePlayer = (playerId: string) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
    } else if (selectedPlayers.length < requiredTeamSize) {
      setSelectedPlayers([...selectedPlayers, playerId]);
    }
  };

  const handleConfirmTeam = () => {
    if (selectedPlayers.length === requiredTeamSize) {
      selectTeam(selectedPlayers);
    }
  };

  const canConfirm = selectedPlayers.length === requiredTeamSize;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 safe-area-padding">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {t('teamSelect.title')}
          </h1>
          <p className="text-white/60">
            {t('teamSelect.missionNumber', { number: missionNumber })}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <span className="pill pill-warning">
              {t('teamSelect.teamSize', { count: requiredTeamSize })}
            </span>
            {rejectedTeamsCount > 0 && (
              <span className="pill pill-danger">
                {t('teamSelect.rejectedTeamsCount', { count: rejectedTeamsCount })}
              </span>
            )}
          </div>
        </div>

        <Card>
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-white/60 mb-4">
                {t('teamSelect.selectedCount', { 
                  selected: selectedPlayers.length, 
                  total: requiredTeamSize 
                })}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white/70 mb-4">
                {t('teamSelect.playerList')}
              </h3>
              <div className="space-y-2">
                {players.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => togglePlayer(player.id)}
                    disabled={
                      !selectedPlayers.includes(player.id) && 
                      selectedPlayers.length >= requiredTeamSize
                    }
                    className={`w-full p-4 rounded-lg font-semibold transition-colors duration-150 text-left border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedPlayers.includes(player.id)
                        ? 'bg-blue-600 text-white border-blue-700'
                        : 'bg-slate-800 text-white/80 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {player.name}
                    {selectedPlayers.includes(player.id) && (
                      <span className="float-right text-white/90">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleConfirmTeam}
                disabled={!canConfirm}
                fullWidth
                size="lg"
              >
                {t('common.confirm')}
              </Button>
            </div>
          </div>
        </Card>

        {/* Mission progress indicator */}
        <div className="mt-6">
          <MissionProgressIndicator 
            currentMissionNumber={missionNumber}
            size="small"
          />
        </div>
      </div>
    </div>
  );
} 
