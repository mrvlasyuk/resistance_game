import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { MissionProgressIndicator } from '../components/MissionProgressIndicator';
import { useGameStore } from '../store/gameStore';
import { useTranslation } from '../hooks/useTranslation';

export function Captain() {
  const { players, captainIndex, missions, setPhase } = useGameStore();
  const { t } = useTranslation();

  const currentCaptain = players[captainIndex];
  const currentMission = missions.find(m => m.result === 'pending');
  const missionNumber = currentMission?.number || 1;

  const handleNext = () => {
    setPhase('team-select');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 safe-area-padding">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {t('captain.title', { number: missionNumber })}
          </h1>
        </div>

        <Card>
          <div className="text-center space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-300 mb-4">
                {t('captain.currentCaptain')}
              </h2>
              <div className="bg-blue-600 rounded-lg p-6">
                <div className="text-3xl font-bold text-white">
                  {currentCaptain?.name}
                </div>
              </div>
            </div>

            <p className="text-gray-400">
              {t('captain.selectTeam')}
            </p>

            <Button
              onClick={handleNext}
              fullWidth
              size="lg"
            >
              {t('common.next')}
            </Button>
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