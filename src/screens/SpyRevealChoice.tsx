import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useGameStore } from '../store/gameStore';
import { useTranslation } from '../hooks/useTranslation';
import { getFailThreshold } from '../utils/gameLogic';

export function SpyRevealChoice() {
  const { totalPlayers, chooseSpyRevealMethod } = useGameStore();
  const { t } = useTranslation();

  const specialFailMissions = ([1, 2, 3, 4, 5] as const)
    .map((mission) => ({ mission, threshold: getFailThreshold(mission, totalPlayers) }))
    .filter(({ threshold }) => threshold > 1);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 safe-area-padding">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold pm-heading mb-2">{t('spyRevealChoice.title')}</h1>
          <p className="pm-text-60">{t('spyRevealChoice.subtitle')}</p>
        </div>

        <Card>
          <div className="space-y-4 pm-text-80">
            <p>{t('spyRevealChoice.note')}</p>
            {specialFailMissions.map(({ mission, threshold }) => (
              <div key={mission} className="pill pill-info inline-block">
                {t('specialFailRule.message', { mission, threshold })}
              </div>
            ))}
          </div>
        </Card>

        <div className="mt-6 space-y-3">
          <Button onClick={() => chooseSpyRevealMethod('phone')} fullWidth size="lg">
            {t('spyRevealChoice.passPhone')}
          </Button>
          <Button
            onClick={() => chooseSpyRevealMethod('sleep')}
            variant="secondary"
            fullWidth
            size="lg"
          >
            {t('spyRevealChoice.citySleeps')}
          </Button>
        </div>
      </div>
    </div>
  );
}
