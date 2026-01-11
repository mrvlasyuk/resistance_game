import { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { NewGameDialog } from './NewGameDialog';

export function NewGameButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed top-[calc(env(safe-area-inset-top)+16px)] right-[calc(env(safe-area-inset-right)+16px)] z-40 inline-flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 text-sm font-semibold pm-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
      >
        {t('common.newGame')}
      </button>

      <NewGameDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
