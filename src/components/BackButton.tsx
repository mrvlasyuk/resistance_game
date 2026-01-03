import { useGameStore } from '../store/gameStore';
import { useTranslation } from '../hooks/useTranslation';

export function BackButton() {
  const { t } = useTranslation();
  const canGoBack = useGameStore((state) => state.canGoBack());
  const goBack = useGameStore((state) => state.goBack);

  if (!canGoBack) return null;

  return (
    <button
      type="button"
      onClick={goBack}
      className="fixed top-[calc(env(safe-area-inset-top)+16px)] left-[calc(env(safe-area-inset-left)+16px)] z-40 inline-flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
    >
      {t('common.back')}
    </button>
  );
}

