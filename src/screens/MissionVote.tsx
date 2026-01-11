import { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { PrivateScreen } from '../components/PrivateScreen';
import { MissionProgressIndicator } from '../components/MissionProgressIndicator';
import { useGameStore } from '../store/gameStore';
import { useTranslation } from '../hooks/useTranslation';
import { getFailThreshold } from '../utils/gameLogic';

export function MissionVote() {
  const [selectedCard, setSelectedCard] = useState<'success' | 'fail' | null>(null);
  const [showVoteScreen, setShowVoteScreen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const allow = !!params.get('shot');
    return allow && params.get('vote') === '1';
  });
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const { 
    players, 
    missions, 
    currentPlayerIndex, 
    totalPlayers,
    submitVote, 
    nextMissionVoter 
  } = useGameStore();
  const { t } = useTranslation();

  const currentMission = missions.find(m => m.result === 'pending');
  if (!currentMission) return null;
  const failThreshold = getFailThreshold(currentMission.number, totalPlayers);

  const teamPlayers = currentMission.team.map(id => 
    players.find(p => p.id === id)
  ).filter(Boolean);

  const currentPlayer = teamPlayers[currentPlayerIndex];
  const isLastPlayer = currentPlayerIndex === teamPlayers.length - 1;

  const handleStartVote = () => {
    setShowVoteScreen(true);
    setInfoMessage(null);
  };

  const handleSelectCard = (card: 'success' | 'fail') => {
    if (card === 'fail' && currentPlayer?.role !== 'spy') {
      setInfoMessage(t('missionVote.resistanceCannotFail'));
      return;
    }
    setInfoMessage(null);
    setSelectedCard(card);
  };

  const handleConfirmVote = () => {
    if (selectedCard && currentPlayer) {
      submitVote(currentPlayer.id, selectedCard);
      setSelectedCard(null);
      setShowVoteScreen(false);
      setInfoMessage(null);
      
      if (isLastPlayer) {
        // All players have voted, proceed to results
        // The store will handle the transition
      } else {
        nextMissionVoter();
      }
    }
  };

  const handleCloseVoteScreen = () => {
    setShowVoteScreen(false);
    setSelectedCard(null);
    setInfoMessage(null);
  };

  if (showVoteScreen && currentPlayer) {
    return (
      <PrivateScreen 
        onClose={handleCloseVoteScreen}
        showCloseButton={false}
        autoCloseSeconds={0}
      >
        <div className="text-center space-y-8">
          <div>
            <h2 className="text-2xl font-bold pm-heading mb-2">
              {t('missionVote.title')}
            </h2>
            <p className="pm-text-60">
              {t('missionVote.playerTurn', { playerName: currentPlayer.name })}
            </p>
            {failThreshold > 1 && (
              <div className="mt-3 flex justify-center">
                <span className="pill pill-info">
                  {t('specialFailRule.message', { mission: currentMission.number, threshold: failThreshold })}
                </span>
              </div>
            )}
          </div>

          <div className="rounded-xl p-4 bg-amber-400 border border-amber-500">
            <div className="text-2xl font-extrabold text-black tracking-tight">
              {currentPlayer.name}
            </div>
          </div>

          <div>
            <p className="text-lg pm-text-80 mb-6">
              {t('missionVote.chooseCard')}
            </p>
            
            <div className="flex justify-center space-x-4">
              {/* Success Card */}
              <button
                onClick={() => handleSelectCard('success')}
                className={`mission-card ${
                  selectedCard === 'success' 
                    ? 'mission-card-success ring-4 ring-emerald-200/80 scale-[1.02]' 
                    : 'mission-card-success'
                }`}
              >
                {t('missionVote.success')}
              </button>

              {/* Fail Card - shown for everyone, selectable only by spies */}
              <button
                onClick={() => handleSelectCard('fail')}
                className={`mission-card ${
                  selectedCard === 'fail' 
                    ? 'mission-card-fail ring-4 ring-rose-200/80 scale-[1.02]' 
                    : 'mission-card-fail'
                }`}
              >
                {t('missionVote.fail')}
              </button>
            </div>
          </div>

          {infoMessage && (
            <div className="flex justify-center">
              <div className="pill pill-warning">
                {infoMessage}
              </div>
            </div>
          )}

          {selectedCard && (
            <div className="space-y-4">
              <p className="text-sm pm-text-60">
                {t('missionVote.confirmChoice')}
              </p>
              <Button
                onClick={handleConfirmVote}
                variant="primary"
                size="lg"
              >
                {t('common.confirm')}
              </Button>
            </div>
          )}
        </div>
      </PrivateScreen>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 safe-area-padding">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold pm-heading mb-2">
            {t('missionVote.title')}
          </h1>
          <p className="pm-text-60">
            {t('missionVote.subtitle')}
          </p>
          {failThreshold > 1 && (
            <div className="mt-3 flex justify-center">
              <span className="pill pill-info">
                {t('specialFailRule.message', { mission: currentMission.number, threshold: failThreshold })}
              </span>
            </div>
          )}
        </div>

        <Card>
          <div className="text-center space-y-6">
            <div className="rounded-xl p-6 bg-amber-400 border border-amber-500">
              <div className="text-2xl font-extrabold text-black tracking-tight">
                {currentPlayer?.name}
              </div>
              <p className="text-black/70 mt-2">
                {t('missionVote.playerTurn', { playerName: currentPlayer?.name || '' })}
              </p>
            </div>

            <div className="flex justify-center">
              <span className="pill">
                {t('missionVote.progress', { current: currentPlayerIndex + 1, total: teamPlayers.length })}
              </span>
            </div>

            <Button
              onClick={handleStartVote}
              fullWidth
              size="lg"
            >
              {t('common.next')}
            </Button>
          </div>
        </Card>

        {/* Team members list */}
        <Card className="mt-6 p-4">
          <h3 className="text-lg font-semibold pm-text-70 mb-3">
            {t('missionVote.missionTeam')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {teamPlayers.map((player, index) => (
              <div
                key={player?.id}
                className={`px-3 py-1 rounded-full text-sm font-medium border ${
                  index === currentPlayerIndex
                    ? 'bg-amber-400 text-black border-amber-500'
                    : index < currentPlayerIndex
                    ? 'bg-emerald-600 text-white border-emerald-700'
                    : 'bg-slate-800 pm-text-70 border-slate-700'
                }`}
              >
                {player?.name}
                {index < currentPlayerIndex && ' ✓'}
              </div>
            ))}
          </div>
        </Card>

        <div className="mt-6">
          <MissionProgressIndicator
            currentMissionNumber={currentMission.number}
            size="small"
          />
        </div>
      </div>
    </div>
  );
} 
