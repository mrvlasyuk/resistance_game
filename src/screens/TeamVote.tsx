import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useGameStore } from '../store/gameStore';
import { useTranslation } from '../hooks/useTranslation';

export function TeamVote() {
  const {
    players,
    missions,
    proposedTeam,
    rejectedTeamsCount,
    approveTeam,
    rejectTeam,
  } = useGameStore();
  const { t } = useTranslation();

  const currentMission = missions.find(m => m.result === 'pending');
  if (!currentMission) return null;

  if (proposedTeam.length === 0) return null;

  const teamPlayers = proposedTeam
    .map((id) => players.find(p => p.id === id))
    .filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 safe-area-padding">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {t('teamVote.title', { number: currentMission.number })}
          </h1>
          <p className="text-gray-400">
            {t('teamVote.subtitle')}
          </p>
          {rejectedTeamsCount > 0 && (
            <p className="text-red-400 text-sm mt-2">
              {t('teamSelect.rejectedTeamsCount', { count: rejectedTeamsCount })}
            </p>
          )}
        </div>

        <Card>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-300 mb-3">
                {t('teamVote.proposedTeam')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {teamPlayers.map((player) => (
                  <div
                    key={player!.id}
                    className="px-3 py-1 rounded-full text-sm bg-gray-700 text-gray-200"
                  >
                    {player!.name}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={approveTeam}
                fullWidth
                size="lg"
                variant="success"
              >
                {t('teamVote.approve')}
              </Button>

              <Button
                onClick={rejectTeam}
                fullWidth
                size="lg"
                variant="danger"
              >
                {t('teamVote.reject')}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

