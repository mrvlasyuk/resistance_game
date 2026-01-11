import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { useTranslation } from '../hooks/useTranslation';

function cardsEmoji(success: number, fail: number) {
  return `${'🟩'.repeat(success)}${'🟥'.repeat(fail)}`;
}

function statusEmoji(status: string) {
  switch (status) {
    case 'proposed':
      return '🗳️';
    case 'rejected':
      return '❌';
    case 'approved':
      return '✅';
    case 'mission-success':
      return '🟩';
    case 'mission-fail':
      return '🟥';
    default:
      return '•';
  }
}

export function CaptainTimeline() {
  const { t } = useTranslation();
  const players = useGameStore((s) => s.players);
  const captainIndex = useGameStore((s) => s.captainIndex);
  const captainTurns = useGameStore((s) => s.captainTurns);
  const rejectedTeamsCount = useGameStore((s) => s.rejectedTeamsCount);

  const currentCaptain = players[captainIndex];

  const nextCaptains = useMemo(() => {
    if (players.length === 0) return [];
    return [1, 2, 3].map((offset) => players[(captainIndex + offset) % players.length]);
  }, [players, captainIndex]);

  const remainingRejections = Math.max(0, 5 - rejectedTeamsCount);

  if (!currentCaptain) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm pm-text-70">
          <span className="pm-text-50">{t('captainTimeline.captain')}: </span>
          <span className="font-semibold pm-text-80">{currentCaptain.name}</span>
        </div>
        <div className="text-sm pm-text-70">
          <span className="pm-text-50">{t('captainTimeline.remaining')}: </span>
          <span className="font-semibold pm-text-80">{remainingRejections}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 items-center">
        <span className="pill">
          {t('captainTimeline.next')}: {nextCaptains.map((p) => p?.name).filter(Boolean).join(' → ')}
        </span>
      </div>

      {captainTurns.length > 0 && (
        <div className="mt-3">
          <div className="text-xs pm-text-50 mb-2">{t('captainTimeline.history')}</div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {captainTurns.map((turn) => {
              const captainName =
                players.find((p) => p.id === turn.captainId)?.name ?? '—';
              const label = turn.revealed
                ? `${captainName} ${cardsEmoji(turn.revealed.success, turn.revealed.fail)}`
                : `${statusEmoji(turn.status)} ${captainName}`;

              return (
                <div
                  key={turn.id}
                  className="shrink-0 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs pm-text-80"
                  title={label}
                >
                  <div className="font-semibold">{captainName}</div>
                  <div className="pm-text-60">
                    {turn.revealed
                      ? cardsEmoji(turn.revealed.success, turn.revealed.fail)
                      : statusEmoji(turn.status)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
