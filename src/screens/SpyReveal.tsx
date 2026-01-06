import { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { PrivateScreen } from '../components/PrivateScreen';
import { useGameStore } from '../store/gameStore';
import { useTranslation } from '../hooks/useTranslation';
import { getSpies } from '../utils/gameLogic';

const MIN_READ_SECONDS = 7;

export function SpyReveal() {
  const { players, spyRevealIndex, advanceSpyRevealTurn } = useGameStore();
  const { t } = useTranslation();
  const [showPrivate, setShowPrivate] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(MIN_READ_SECONDS);

  const currentPlayer = players[spyRevealIndex];

  const otherSpies = useMemo(() => {
    if (!currentPlayer) return [];
    return getSpies(players).filter((spy) => spy.id !== currentPlayer.id);
  }, [players, currentPlayer]);

  useEffect(() => {
    if (!showPrivate) return;
    setSecondsLeft(MIN_READ_SECONDS);

    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [showPrivate, currentPlayer?.id]);

  if (!currentPlayer) return null;

  const isSpy = currentPlayer.role === 'spy';

  const handleContinue = () => {
    setShowPrivate(false);
    advanceSpyRevealTurn();
  };

  if (showPrivate) {
    return (
      <PrivateScreen onClose={() => {}} showCloseButton={false} autoCloseSeconds={0}>
        <div className="text-center space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{t('spyReveal.title')}</h2>
            <p className="text-white/60">{t('spyReveal.playerTurn', { playerName: currentPlayer.name })}</p>
          </div>

          {isSpy && otherSpies.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-left">
              <h3 className="text-lg font-semibold text-rose-300 mb-2">{t('spyReveal.spyList')}</h3>
              <ul className="text-white space-y-1">
                {otherSpies.map((spy) => (
                  <li key={spy.id} className="font-medium">
                    {spy.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="text-white/80 font-semibold mb-2">{t('spyReveal.poemTitle')}</div>
            <div className="text-white/70 whitespace-pre-line">{t('spyReveal.poemBody')}</div>
            <div className="mt-3 text-sm text-white/60">
              {secondsLeft > 0
                ? t('spyReveal.wait', { seconds: secondsLeft })
                : t('spyReveal.ready')}
            </div>
          </div>

          <Button onClick={handleContinue} disabled={secondsLeft > 0} size="lg">
            {t('spyReveal.continue')}
          </Button>
        </div>
      </PrivateScreen>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 safe-area-padding">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t('spyReveal.title')}</h1>
          <p className="text-white/60">{t('spyReveal.subtitle')}</p>
        </div>

        <Card>
          <div className="text-center space-y-6">
            <div className="rounded-xl p-6 bg-amber-400 border border-amber-500">
              <div className="text-2xl font-extrabold text-black tracking-tight">{currentPlayer.name}</div>
              <p className="text-black/70 mt-2">
                {t('spyReveal.playerTurn', { playerName: currentPlayer.name })}
              </p>
            </div>

            <div className="flex justify-center">
              <span className="pill">
                {t('spyReveal.progress', { current: spyRevealIndex + 1, total: players.length })}
              </span>
            </div>

            <Button onClick={() => setShowPrivate(true)} fullWidth size="lg">
              {t('common.next')}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

