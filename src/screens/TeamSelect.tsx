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
          <p className="text-gray-400">
            {t('teamSelect.missionNumber', { number: missionNumber })}
          </p>
          <p className="text-blue-400 font-semibold">
            {t('teamSelect.teamSize', { count: requiredTeamSize })}
          </p>
          {rejectedTeamsCount > 0 && (
            <p className="text-red-400 text-sm mt-2">
              {t('teamSelect.rejectedTeamsCount', { count: rejectedTeamsCount })}
            </p>
          )}
        </div>

        <Card>
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-4">
                {t('teamSelect.selectedCount', { 
                  selected: selectedPlayers.length, 
                  total: requiredTeamSize 
                })}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-300 mb-4">
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
                    className={`w-full p-4 rounded-lg font-semibold transition-colors duration-200 text-left ${
                      selectedPlayers.includes(player.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {player.name}
                    {selectedPlayers.includes(player.id) && (
                      <span className="float-right">✓</span>
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
