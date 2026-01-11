import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useGameStore } from '../store/gameStore';
import { useTranslation } from '../hooks/useTranslation';

export function SpyIntro() {
  const { setPhase } = useGameStore();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 safe-area-padding">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold pm-heading mb-2">
            {t('spyIntro.title')}
          </h1>
          <p className="pm-text-60">
            {t('spyIntro.subtitle')}
          </p>
        </div>

        <Card>
          <div className="space-y-4 pm-text-80">
            <ol className="list-decimal pl-5 space-y-2">
              <li>{t('spyIntro.step1')}</li>
              <li>{t('spyIntro.step2')}</li>
              <li>{t('spyIntro.step3')}</li>
            </ol>
          </div>
        </Card>

        <div className="mt-6">
          <Button
            onClick={() => setPhase('captain')}
            fullWidth
            size="lg"
          >
            {t('spyIntro.continue')}
          </Button>
        </div>
      </div>
    </div>
  );
}
