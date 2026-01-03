import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CaptainTurn, GameState, GamePhase } from '../types/game';
import { 
	  createPlayer, 
	  createMission, 
	  dealRoles, 
	  resolveMission, 
	  checkVictory,
	  getTeamSize,
    getPublicMissionVoteCounts
} from '../utils/gameLogic';

interface GameStore extends GameState {
  history: GameState[];
  // Actions
  setTotalPlayers: (count: number) => void;
  addPlayer: (name: string) => void;
  addSavedName: (name: string) => void;
  completeNameEntryTurn: () => void;
  setPhase: (phase: GamePhase) => void;
  canGoBack: () => boolean;
  goBack: () => void;
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
  savedNames: [],
  captainTurns: [],
  captainIndex: 0,
  missions: [],
  currentPlayerIndex: 0,
  proposedTeam: [],
  language: 'en',
  rejectedTeamsCount: 0,
  winner: null,
  winReason: null,
};

function snapshotState(state: GameStore): GameState {
  return {
    phase: state.phase,
    totalPlayers: state.totalPlayers,
    players: state.players,
    savedNames: state.savedNames,
    captainTurns: state.captainTurns,
    captainIndex: state.captainIndex,
    missions: state.missions,
    currentPlayerIndex: state.currentPlayerIndex,
    proposedTeam: state.proposedTeam,
    language: state.language,
    rejectedTeamsCount: state.rejectedTeamsCount,
    winner: state.winner,
    winReason: state.winReason,
  };
}

export const useGameStore = create<GameStore>()(
  persist<GameStore, [], [], GameState>(
    (set, get) => ({
      ...initialState,
      history: [],

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
            history: [],
            savedNames: state.savedNames,
            captainTurns: [],
          phase: 'name-entry',
        });
      },

      addSavedName: (name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        if (/^Player\s+\d+$/i.test(trimmed)) return;

        const state = get();
        const existingIndex = state.savedNames.findIndex(
          (n) => n.toLowerCase() === trimmed.toLowerCase()
        );

        const next = existingIndex === -1
          ? [trimmed, ...state.savedNames]
          : [state.savedNames[existingIndex], ...state.savedNames.filter((_, i) => i !== existingIndex)];

        set({ savedNames: next.slice(0, 200) });
      },

      addPlayer: (name: string) => {
        const state = get();
        const trimmed = name.trim();
        if (!trimmed) return;

        const currentPlayerIndex = state.players.findIndex(p => p.name.startsWith('Player '));
        
        if (currentPlayerIndex !== -1) {
          // Update the placeholder player with the real name
          const updatedPlayers = state.players.map((player, index) => 
            index === currentPlayerIndex 
              ? { ...player, name: trimmed }
              : player
          );
          
          set({
            players: updatedPlayers,
            // Keep `name-entry` so the last player can still see their role before the game starts.
            phase: 'name-entry',
          });

          get().addSavedName(trimmed);
        }
      },

      completeNameEntryTurn: () => {
        const state = get();
        const allPlayersNamed = state.players.length > 0 && !state.players.some(p => p.name.startsWith('Player '));
        if (allPlayersNamed) {
          set({ phase: 'spy-intro' });
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
        const state = get();
        const isUndoableNav =
          state.phase === 'captain' && phase === 'team-select';
        if (isUndoableNav) {
          set({ history: [...state.history, snapshotState(state)], phase });
          return;
        }

        set({ phase });
      },

      canGoBack: () => {
        const state = get();
        if (state.history.length === 0) return false;

        // Never allow going back into role reveal / nickname entry flow
        const last = state.history[state.history.length - 1];
        if (last.phase === 'lobby' || last.phase === 'name-entry') return false;

        // Allowed host phases
        if (state.phase === 'captain' || state.phase === 'team-select' || state.phase === 'team-vote') {
          return true;
        }

        // Allow undo right after approving a team, but only before any mission votes are cast
        if (state.phase === 'mission-vote') {
          const currentMission = state.missions.find(m => m.result === 'pending');
          return !!currentMission && currentMission.votes.length === 0;
        }

        // Allow undo if the game ended by 5 team rejections (host misclick)
        if (state.phase === 'victory' && state.winReason === 'team-rejections') {
          return true;
        }

        return false;
      },

      goBack: () => {
        const state = get();
        if (!get().canGoBack()) return;

        const last = state.history[state.history.length - 1];
        const history = state.history.slice(0, -1);
        set({ ...last, history });
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

          const captainId = state.players[state.captainIndex]?.id;
          const newTurn: CaptainTurn | null = captainId
            ? {
                id: `${currentMission.number}-${state.captainIndex}-${Date.now()}`,
                missionNumber: currentMission.number,
                captainId,
                team: playerIds,
                status: 'proposed',
              }
            : null;

          set({
            history: [...state.history, snapshotState(state)],
            proposedTeam: playerIds,
            captainTurns: newTurn ? [...state.captainTurns, newTurn] : state.captainTurns,
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

        const updatedTurns = [...state.captainTurns];
        for (let i = updatedTurns.length - 1; i >= 0; i--) {
          const turn = updatedTurns[i];
          if (turn.missionNumber === currentMission.number && turn.status === 'proposed') {
            updatedTurns[i] = { ...turn, status: 'approved' };
            break;
          }
        }

        set({
          history: [...state.history, snapshotState(state)],
          missions: state.missions.map(mission =>
            mission.number === currentMission.number
              ? { ...mission, team: state.proposedTeam, votes: [] }
              : mission
          ),
          captainTurns: updatedTurns,
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

        const updatedTurns = [...state.captainTurns];
        for (let i = updatedTurns.length - 1; i >= 0; i--) {
          const turn = updatedTurns[i];
          if (turn.status === 'proposed') {
            updatedTurns[i] = { ...turn, status: 'rejected' };
            break;
          }
        }

        if (newRejectedCount >= 5) {
          set({
            history: [...state.history, snapshotState(state)],
            winner: 'spies',
            winReason: 'team-rejections',
            rejectedTeamsCount: newRejectedCount,
            proposedTeam: [],
            captainTurns: updatedTurns,
            phase: 'victory',
          });
          return;
        }

        const nextCaptainIndex = (state.captainIndex + 1) % totalPlayers;
        set({
          history: [...state.history, snapshotState(state)],
          captainIndex: nextCaptainIndex,
          rejectedTeamsCount: newRejectedCount,
          proposedTeam: [],
          captainTurns: updatedTurns,
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

          const publicCounts = getPublicMissionVoteCounts(
            { ...currentMission, result },
            state.totalPlayers
          );
          const updatedTurns = [...state.captainTurns];
          for (let i = updatedTurns.length - 1; i >= 0; i--) {
            const turn = updatedTurns[i];
            if (turn.missionNumber === currentMission.number && turn.status === 'approved') {
              updatedTurns[i] = {
                ...turn,
                status: result === 'success' ? 'mission-success' : 'mission-fail',
                revealed: publicCounts,
              };
              break;
            }
          }
          
          set({
            missions: updatedMissions,
            winner,
            winReason: winner ? 'missions' : null,
            phase: 'mission-result',
            history: [],
            captainTurns: updatedTurns,
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
          history: [],
        });
      },

      resetGame: () => {
        const state = get();
        set({ ...initialState, history: [], savedNames: state.savedNames, captainTurns: [] });
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
        savedNames: state.savedNames,
        captainTurns: state.captainTurns,
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
          savedNames: rest.savedNames ?? [],
          captainTurns: rest.captainTurns ?? [],
        } as GameState;
      },
    }
  )
); 
