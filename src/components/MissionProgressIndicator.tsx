import { useGameStore } from '../store/gameStore';
import { getTeamSize } from '../utils/gameLogic';
import type { Mission } from '../types/game';

interface MissionProgressIndicatorProps {
  currentMissionNumber?: number;
  size?: 'small' | 'medium' | 'large';
}

export function MissionProgressIndicator({ 
  currentMissionNumber, 
  size = 'medium' 
}: MissionProgressIndicatorProps) {
  const { missions, totalPlayers } = useGameStore();

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-8 h-8 text-xs';
      case 'large':
        return 'w-12 h-12 text-sm';
      default:
        return 'w-10 h-10 text-sm';
    }
  };

  const getStatusColor = (mission: Mission) => {
    if (mission.result === 'success') {
      return 'bg-emerald-600 text-white';
    }
    if (mission.result === 'fail') {
      return 'bg-rose-600 text-white';
    }
    if (mission.number === currentMissionNumber) {
      return 'bg-amber-400 text-slate-950';
    }
    return 'bg-slate-800 pm-text-70 border border-slate-700';
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-center gap-3">
        {missions.slice(0, 5).map((mission) => (
          <div key={mission.number} className="text-center">
            <div
              className={`${getSizeClasses()} rounded-full flex items-center justify-center font-bold transition-colors ${getStatusColor(mission)}`}
            >
              {mission.number}
            </div>
            <div className="text-xs pm-text-50 mt-1">
              {getTeamSize(mission.number, totalPlayers)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
