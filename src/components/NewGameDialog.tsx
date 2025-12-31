import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useTranslation } from '../hooks/useTranslation';
import { Button } from './Button';

interface NewGameDialogProps {
  open: boolean;
  onClose: () => void;
}

const HOLD_TO_CONFIRM_MS = 2000;

export function NewGameDialog({ open, onClose }: NewGameDialogProps) {
  const resetGame = useGameStore((state) => state.resetGame);
  const { t } = useTranslation();
  const holdSeconds = useMemo(() => Math.ceil(HOLD_TO_CONFIRM_MS / 1000), []);

  const [holdStartMs, setHoldStartMs] = useState<number | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);

  const cancelHold = () => {
    setHoldStartMs(null);
    setHoldProgress(0);
  };

  useEffect(() => {
    if (!open) {
      cancelHold();
      return;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (holdStartMs === null) return;

    let animationFrameId = 0;

    const tick = () => {
      const elapsed = Date.now() - holdStartMs;
      const progress = Math.min(1, elapsed / HOLD_TO_CONFIRM_MS);
      setHoldProgress(progress);

      if (progress >= 1) {
        resetGame();
        cancelHold();
        onClose();
        return;
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [holdStartMs, onClose, open, resetGame]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950 flex items-center justify-center p-4 safe-area-padding">
      <div className="card w-full max-w-sm">
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">{t('common.newGame')}</h2>
          <p className="text-sm text-white/70">{t('newGame.warning')}</p>
        </div>

        <div className="mt-6 space-y-3">
          <Button onClick={onClose} variant="secondary" fullWidth>
            {t('common.cancel')}
          </Button>

          <div className="space-y-2">
            <button
              type="button"
              onPointerDown={() => setHoldStartMs(Date.now())}
              onPointerUp={cancelHold}
              onPointerLeave={cancelHold}
              onPointerCancel={cancelHold}
              className="w-full rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold py-3 px-6 border border-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 touch-manipulation"
            >
              {t('newGame.holdToConfirm', { seconds: holdSeconds })}
            </button>

            <div className="h-2 w-full rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
              <div
                className="h-full bg-rose-600 transition-[width] duration-75"
                style={{ width: `${Math.round(holdProgress * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

