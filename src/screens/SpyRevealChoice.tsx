import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useGameStore } from '../store/gameStore';
import { useTranslation } from '../hooks/useTranslation';

export function SpyRevealChoice() {
  const { chooseSpyRevealMethod } = useGameStore();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 safe-area-padding">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t('spyRevealChoice.title')}</h1>
          <p className="text-white/60">{t('spyRevealChoice.subtitle')}</p>
        </div>

        <Card>
          <div className="space-y-4 text-white/80">
            <p>{t('spyRevealChoice.note')}</p>
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

