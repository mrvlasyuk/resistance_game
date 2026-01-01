import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { GameState, GamePhase } from '../types/game';
import { 
	  createPlayer, 
	  createMission, 
	  dealRoles, 
	  resolveMission, 
	  checkVictory,
	  getTeamSize
} from '../utils/gameLogic';

interface GameStore extends GameState {
  // Actions
  setTotalPlayers: (count: number) => void;
  addPlayer: (name: string) => void;
  completeNameEntryTurn: () => void;
  setPhase: (phase: GamePhase) => void;
  nextCaptain: () => void;
  selectTeam: (playerIds: string[]) => void;
  approveTeam: () => void;
  rejectTeam: () => void;
  submitVote: (playerId: string, card: 'success' | 'fail') => void;
  nextMissionVoter: () => void;
  resolveMissionResult: () => void;
  nextMission: () => void;
  resetGame: () => void;
  setLanguage: (language: 'en' | 'ru') => void;
  // New actions for role management
  initializeRoles: () => void;
  getCurrentPlayerRole: () => 'spy' | 'resistance' | null;
}

const initialState: GameState = {
  phase: 'lobby',
  totalPlayers: 5,
  players: [],
  captainIndex: 0,
  missions: [],
  currentPlayerIndex: 0,
  proposedTeam: [],
  language: 'en',
  rejectedTeamsCount: 0,
  winner: null,
  winReason: null,
};

export const useGameStore = create<GameStore>()(
  persist<GameStore, [], [], GameState>(
    (set, get) => ({
      ...initialState,

      setTotalPlayers: (count: number) => {
        set({ totalPlayers: count });
      },

      initializeRoles: () => {
        const state = get();
        // Create placeholder players with roles
        const placeholderPlayers = Array.from({ length: state.totalPlayers }, (_, i) => 
          createPlayer(`Player ${i + 1}`)
        );
        const playersWithRoles = dealRoles(placeholderPlayers);
        
        const missions = [
          createMission(1),
          createMission(2),
          createMission(3),
          createMission(4),
          createMission(5),
        ];

        const randomCaptainIndex =
          playersWithRoles.length > 0
            ? Math.floor(Math.random() * playersWithRoles.length)
            : 0;
        
	        set({
	          players: playersWithRoles,
	          missions,
	          captainIndex: randomCaptainIndex,
	          proposedTeam: [],
	          rejectedTeamsCount: 0,
	          winner: null,
	          winReason: null,
	          currentPlayerIndex: 0,
          phase: 'name-entry',
        });
      },

      addPlayer: (name: string) => {
        const state = get();
        const currentPlayerIndex = state.players.findIndex(p => p.name.startsWith('Player '));
        
        if (currentPlayerIndex !== -1) {
          // Update the placeholder player with the real name
          const updatedPlayers = state.players.map((player, index) => 
            index === currentPlayerIndex 
              ? { ...player, name }
              : player
          );
          
          set({
            players: updatedPlayers,
            // Keep `name-entry` so the last player can still see their role before the game starts.
            phase: 'name-entry',
          });
        }
      },

      completeNameEntryTurn: () => {
        const state = get();
        const allPlayersNamed = state.players.length > 0 && !state.players.some(p => p.name.startsWith('Player '));
        if (allPlayersNamed) {
          set({ phase: 'captain' });
        } else {
          set({ phase: 'name-entry' });
        }
      },

      getCurrentPlayerRole: () => {
        const state = get();
        const currentPlayerIndex = state.players.findIndex(p => p.name.startsWith('Player '));
        return currentPlayerIndex !== -1 ? state.players[currentPlayerIndex].role : null;
      },

      setPhase: (phase: GamePhase) => {
        set({ phase });
      },

      nextCaptain: () => {
        const state = get();
        const nextIndex = (state.captainIndex + 1) % state.players.length;
        set({ captainIndex: nextIndex });
      },

      selectTeam: (playerIds: string[]) => {
        const state = get();
        const currentMission = state.missions.find(m => m.result === 'pending');
        
        if (currentMission) {
          const requiredTeamSize = getTeamSize(currentMission.number, state.totalPlayers);
          if (playerIds.length !== requiredTeamSize) return;

          set({
            proposedTeam: playerIds,
            phase: 'team-vote',
          });
        }
      },

      approveTeam: () => {
        const state = get();
        if (state.phase !== 'team-vote') return;
        if (state.proposedTeam.length === 0) return;

        const currentMission = state.missions.find(m => m.result === 'pending');
        if (!currentMission) return;

        set({
          missions: state.missions.map(mission =>
            mission.number === currentMission.number
              ? { ...mission, team: state.proposedTeam, votes: [] }
              : mission
          ),
          proposedTeam: [],
          phase: 'mission-vote',
          currentPlayerIndex: 0,
        });
      },

      rejectTeam: () => {
        const state = get();
        if (state.phase !== 'team-vote') return;
        if (state.proposedTeam.length === 0) return;

        const totalPlayers = state.players.length;
        if (totalPlayers === 0) return;

        const newRejectedCount = state.rejectedTeamsCount + 1;

        if (newRejectedCount >= 5) {
          set({
            winner: 'spies',
            winReason: 'team-rejections',
            rejectedTeamsCount: newRejectedCount,
            proposedTeam: [],
            phase: 'victory',
          });
          return;
        }

        const nextCaptainIndex = (state.captainIndex + 1) % totalPlayers;
        set({
          captainIndex: nextCaptainIndex,
          rejectedTeamsCount: newRejectedCount,
          proposedTeam: [],
          phase: 'captain',
        });
      },

      submitVote: (playerId: string, card: 'success' | 'fail') => {
        const state = get();
        const currentMission = state.missions.find(m => m.result === 'pending');
        
        if (state.phase !== 'mission-vote') return;
        if (!currentMission) return;

        // Only approved team members may vote on the mission
        if (!currentMission.team.includes(playerId)) return;
        // Prevent double-voting
        if (currentMission.votes.some(v => v.playerId === playerId)) return;

        const player = state.players.find(p => p.id === playerId);
        if (!player?.role) return;

        const normalizedCard: 'success' | 'fail' =
          player.role === 'spy' ? card : 'success';

        const vote = { playerId, card: normalizedCard };
          const updatedMissions = state.missions.map(mission =>
            mission.number === currentMission.number
              ? { ...mission, votes: [...mission.votes, vote] }
              : mission
          );
          
          set({ missions: updatedMissions });
          
          // Check if all team members have voted
          const updatedMission = updatedMissions.find(m => m.number === currentMission.number);
          if (updatedMission && updatedMission.votes.length === updatedMission.team.length) {
            // All players have voted, resolve mission immediately
            get().resolveMissionResult();
          }
      },

      nextMissionVoter: () => {
        const state = get();
        const currentMission = state.missions.find(m => m.result === 'pending');
        
        if (currentMission) {
          const nextIndex = state.currentPlayerIndex + 1;
          
          if (nextIndex >= currentMission.team.length) {
            // All players have voted, resolve mission
            get().resolveMissionResult();
          } else {
            set({ currentPlayerIndex: nextIndex });
          }
        }
      },

      resolveMissionResult: () => {
        const state = get();
        const currentMission = state.missions.find(m => m.result === 'pending');
        
        if (currentMission) {
          const result = resolveMission(currentMission, state.totalPlayers);
          const updatedMissions = state.missions.map(mission =>
            mission.number === currentMission.number
              ? { ...mission, result }
              : mission
          );
          
          const winner = checkVictory(updatedMissions);
          
          set({
            missions: updatedMissions,
            winner,
            winReason: winner ? 'missions' : null,
            phase: 'mission-result',
          });
        }
      },

      nextMission: () => {
        get().nextCaptain();
        set({ 
          phase: 'captain',
          rejectedTeamsCount: 0, // Сбрасываем счетчик при переходе к новой миссии
          proposedTeam: [],
          currentPlayerIndex: 0,
          winner: null,
          winReason: null,
        });
      },

      resetGame: () => {
        set(initialState);
      },

      setLanguage: (language: 'en' | 'ru') => {
        set({ language });
      },
    }),
    {
      name: 'resistance-game-state',
      version: 3,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        phase: state.phase,
        totalPlayers: state.totalPlayers,
        players: state.players,
        captainIndex: state.captainIndex,
        missions: state.missions,
        currentPlayerIndex: state.currentPlayerIndex,
        proposedTeam: state.proposedTeam,
        language: state.language,
        rejectedTeamsCount: state.rejectedTeamsCount,
        winner: state.winner,
        winReason: state.winReason,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Failed to rehydrate game state', error);
          return;
        }

        const currentMission = state?.missions.find(m => m.result === 'pending');
        if (
          state?.phase === 'mission-vote' &&
          currentMission &&
          currentMission.team.length > 0 &&
          currentMission.votes.length === currentMission.team.length
        ) {
          state.resolveMissionResult();
        }
      },
      migrate: (persistedState: unknown) => {
        const state = persistedState as Partial<GameState> & { teamVotes?: unknown };
        const { teamVotes: _teamVotes, ...rest } = state as Partial<GameState> & { teamVotes?: unknown };

        return {
          ...initialState,
          ...rest,
          proposedTeam: rest.proposedTeam ?? [],
          rejectedTeamsCount: rest.rejectedTeamsCount ?? 0,
          winner: rest.winner ?? null,
          winReason: rest.winReason ?? null,
        } as GameState;
      },
    }
  )
); 
