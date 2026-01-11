import { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { MissionProgressIndicator } from '../components/MissionProgressIndicator';
import { useGameStore } from '../store/gameStore';
import { useTranslation } from '../hooks/useTranslation';
import { getPublicMissionVoteCounts } from '../utils/gameLogic';

export function MissionResult() {
  const { forceShowCards, noAnim } = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const allow = !!params.get('shot');
    return {
      forceShowCards: allow && params.get('cards') === '1',
      noAnim: allow && params.get('noAnim') === '1',
    };
  }, []);

  const [showCards, setShowCards] = useState(forceShowCards);
  const { missions, nextMission, setPhase, winner, totalPlayers } = useGameStore();
  const { t } = useTranslation();

  // Находим последнюю завершенную миссию (с результатом и голосами)
  const missionsWithResults = missions.filter(m => m.result !== 'pending' && m.votes.length > 0);
  const currentMission = missionsWithResults[missionsWithResults.length - 1];
  if (!currentMission) return null;

  const missionNumber = currentMission.number;
  const isSuccess = currentMission.result === 'success';
  const publicCounts = getPublicMissionVoteCounts(currentMission, totalPlayers);
  const successVotes = publicCounts.success;
  const failVotes = publicCounts.fail;

  const completedMissions = missions.filter(m => m.result !== 'pending');
  const resistanceWins = completedMissions.filter(m => m.result === 'success').length;
  const spyWins = completedMissions.filter(m => m.result === 'fail').length;

  const isGameOver = winner !== null;

  useEffect(() => {
    if (showCards) return;
    // Show cards after a short delay for dramatic effect
    const timer = setTimeout(() => setShowCards(true), 1000);
    return () => clearTimeout(timer);
  }, [showCards]);

  const handleNext = () => {
    if (isGameOver) {
      setPhase('victory');
    } else {
      nextMission();
    }
  };

  const renderMissionCards = () => {
    const cards = [];
    const flipClass = showCards && !noAnim ? 'animate-card-flip' : '';
    
    // Add success cards
    for (let i = 0; i < successVotes; i++) {
      cards.push(
        <div
          key={`success-${i}`}
          className={`mission-card ${
            showCards ? 'mission-card-success' : 'mission-card-back'
          } ${flipClass}`}
          style={{ animationDelay: `${i * 200}ms` }}
        >
          {showCards ? t('missionVote.success') : '?'}
        </div>
      );
    }
    
    // Add fail cards
    for (let i = 0; i < failVotes; i++) {
      cards.push(
        <div
          key={`fail-${i}`}
          className={`mission-card ${
            showCards ? 'mission-card-fail' : 'mission-card-back'
          } ${flipClass}`}
          style={{ animationDelay: `${(successVotes + i) * 200}ms` }}
        >
          {showCards ? t('missionVote.fail') : '?'}
        </div>
      );
    }
    
    return cards;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 safe-area-padding">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            {t('missionResult.title', { number: missionNumber })}
          </h1>
          
          <div className={`text-6xl font-bold mb-4 ${
            isSuccess ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {isSuccess ? t('missionResult.success') : t('missionResult.fail')}
          </div>
        </div>

        <Card>
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white/70 mb-4">
                {t('missionResult.cardReveal')}
              </h3>
              
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {renderMissionCards()}
              </div>
              
              {showCards && (
                <div className="text-sm text-white/60 space-y-1">
                  <p>{t('missionVote.success')}: {successVotes}</p>
                  <p>{t('missionVote.fail')}: {failVotes}</p>
                </div>
              )}
            </div>

            <div className="divider pt-6">
              <h3 className="text-lg font-semibold text-white/70 mb-4 text-center">
                {t('missionResult.score')}
              </h3>
              
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <div className="text-blue-300 font-semibold">
                    {t('missionResult.resistanceWins')}
                  </div>
                  <div className="text-2xl font-bold text-blue-200">
                    {resistanceWins}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-rose-300 font-semibold">
                    {t('missionResult.spyWins')}
                  </div>
                  <div className="text-2xl font-bold text-rose-200">
                    {spyWins}
                  </div>
                </div>
              </div>
            </div>

            {showCards && (
              <Button
                onClick={handleNext}
                fullWidth
                size="lg"
                variant={isGameOver ? 'success' : 'primary'}
              >
                {isGameOver ? t('missionResult.gameOver') : t('missionResult.nextMission')}
              </Button>
            )}
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
