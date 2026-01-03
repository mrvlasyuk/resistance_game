import { renderHook, act } from '@testing-library/react';
import { useGameStore } from '../gameStore';
import { getTeamSize } from '../../utils/gameLogic';
import type { Player } from '../../types/game';

let uuidCounter = 0;

// Mock uuid to make tests deterministic and avoid duplicate IDs
jest.mock('uuid', () => ({
  v4: jest.fn(() => `mock-uuid-${++uuidCounter}`),
}));

describe('gameStore', () => {
  beforeEach(() => {
    uuidCounter = 0;
    localStorage.clear();

    act(() => {
      useGameStore.setState({ savedNames: [] } as any);
      useGameStore.getState().resetGame();
    });
  });

  it('should have correct initial state', () => {
    const { result } = renderHook(() => useGameStore());

    expect(result.current.phase).toBe('lobby');
    expect(result.current.totalPlayers).toBe(5);
    expect(result.current.players).toEqual([]);
    expect(result.current.savedNames).toEqual([]);
    expect(result.current.captainTurns).toEqual([]);
    expect(result.current.captainIndex).toBe(0);
    expect(result.current.missions).toEqual([]);
    expect(result.current.currentPlayerIndex).toBe(0);
    expect(result.current.proposedTeam).toEqual([]);
    expect(result.current.rejectedTeamsCount).toBe(0);
    expect(result.current.winner).toBeNull();
    expect(result.current.winReason).toBeNull();
    expect(result.current.language).toBe('en');
    expect(result.current.history).toEqual([]);
  });

  it('initializeRoles should create players and missions and enter name-entry', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.setTotalPlayers(5);
      result.current.initializeRoles();
    });

    expect(result.current.phase).toBe('name-entry');
    expect(result.current.players).toHaveLength(5);
    expect(result.current.players.every(p => p.role !== null)).toBe(true);
    expect(result.current.missions).toHaveLength(5);
    expect(result.current.captainIndex).toBeGreaterThanOrEqual(0);
    expect(result.current.captainIndex).toBeLessThan(5);
  });

  it('addPlayer should not immediately leave name-entry for the last player', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.setTotalPlayers(5);
      result.current.initializeRoles();
      ['Alice', 'Bob', 'Cara', 'Dan', 'Eve'].forEach(name => result.current.addPlayer(name));
    });

    expect(result.current.players.map(p => p.name)).toEqual(['Alice', 'Bob', 'Cara', 'Dan', 'Eve']);
    expect(result.current.phase).toBe('name-entry');
  });

  it('completeNameEntryTurn should start captain phase after the last role reveal closes', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.setTotalPlayers(5);
      result.current.initializeRoles();
      ['Alice', 'Bob', 'Cara', 'Dan', 'Eve'].forEach(name => result.current.addPlayer(name));
      result.current.completeNameEntryTurn();
    });

    expect(result.current.players.map(p => p.name)).toEqual(['Alice', 'Bob', 'Cara', 'Dan', 'Eve']);
    expect(result.current.phase).toBe('spy-intro');
  });

  it('selectTeam should store proposedTeam and move to team-vote', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.setTotalPlayers(5);
      result.current.initializeRoles();
    });

    const teamSize = getTeamSize(1, 5);
    const proposed = result.current.players.slice(0, teamSize).map(p => p.id);

    act(() => {
      result.current.selectTeam(proposed);
    });

    expect(result.current.phase).toBe('team-vote');
    expect(result.current.proposedTeam).toEqual(proposed);
    expect(result.current.missions[0].team).toEqual([]);
  });

  it('approveTeam should start mission voting and persist the team', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.setTotalPlayers(5);
      result.current.initializeRoles();
      ['A', 'B', 'C', 'D', 'E'].forEach(name => result.current.addPlayer(name));
      useGameStore.setState({ captainIndex: 0 });
    });

    const teamSize = getTeamSize(1, 5);
    const proposed = result.current.players.slice(0, teamSize).map(p => p.id);

    act(() => {
      result.current.selectTeam(proposed);
    });

    act(() => {
      result.current.approveTeam();
    });

    expect(result.current.phase).toBe('mission-vote');
    expect(result.current.proposedTeam).toEqual([]);
    expect(result.current.missions[0].team).toEqual(proposed);
    expect(result.current.rejectedTeamsCount).toBe(0);
    expect(result.current.captainTurns).toHaveLength(1);
  });

  it('rejectTeam should increment counter and pass captain', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.setTotalPlayers(5);
      result.current.initializeRoles();
      ['A', 'B', 'C', 'D', 'E'].forEach(name => result.current.addPlayer(name));
      useGameStore.setState({ captainIndex: 0 });
    });

    const teamSize = getTeamSize(1, 5);
    const proposed = result.current.players.slice(0, teamSize).map(p => p.id);

    act(() => {
      result.current.selectTeam(proposed);
    });

    act(() => {
      result.current.rejectTeam();
    });

    expect(result.current.phase).toBe('captain');
    expect(result.current.rejectedTeamsCount).toBe(1);
    expect(result.current.captainIndex).toBe(1);
    expect(result.current.proposedTeam).toEqual([]);
    expect(result.current.missions[0].team).toEqual([]);
    expect(result.current.captainTurns).toHaveLength(1);
  });

  it('five rejected teams should immediately end the game with spies victory', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.setTotalPlayers(5);
      result.current.initializeRoles();
      ['A', 'B', 'C', 'D', 'E'].forEach(name => result.current.addPlayer(name));
      useGameStore.setState({ captainIndex: 0 });
    });

    const teamSize = getTeamSize(1, 5);
    const proposed = result.current.players.slice(0, teamSize).map(p => p.id);

    for (let attempt = 0; attempt < 5; attempt++) {
      act(() => {
        result.current.selectTeam(proposed);
      });

      act(() => {
        result.current.rejectTeam();
      });
    }

    expect(result.current.phase).toBe('victory');
    expect(result.current.winner).toBe('spies');
    expect(result.current.winReason).toBe('team-rejections');
    expect(result.current.rejectedTeamsCount).toBe(5);
  });

  it('mission vote should only accept team members and force resistance to success', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.setTotalPlayers(5);
      result.current.initializeRoles();
      ['A', 'B', 'C', 'D', 'E'].forEach(name => result.current.addPlayer(name));
    });

    act(() => {
      useGameStore.setState((state) => {
        const updatedPlayers: Player[] = state.players.map((p, idx) => ({
          ...p,
          role: idx === 0 ? 'spy' : 'resistance',
        }));

        const team = [updatedPlayers[0].id, updatedPlayers[1].id];
        const updatedMissions = state.missions.map((m) =>
          m.number === 1 ? { ...m, team, votes: [] } : m
        );

        return {
          players: updatedPlayers,
          missions: updatedMissions,
          phase: 'mission-vote',
        };
      });
    });

    const spyId = useGameStore.getState().players[0].id;
    const resistanceId = useGameStore.getState().players[1].id;
    const outsiderId = useGameStore.getState().players[2].id;

    act(() => {
      result.current.submitVote(outsiderId, 'fail');
      result.current.submitVote(spyId, 'fail');
      result.current.submitVote(resistanceId, 'fail'); // should be recorded as success
    });

    const mission = useGameStore.getState().missions[0];
    expect(mission.votes).toHaveLength(2);
    expect(mission.votes.find(v => v.playerId === spyId)?.card).toBe('fail');
    expect(mission.votes.find(v => v.playerId === resistanceId)?.card).toBe('success');
  });

  it('should save entered player names for future suggestions and keep them on resetGame', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.setTotalPlayers(5);
      result.current.initializeRoles();
      result.current.addPlayer('Alice');
      result.current.addPlayer('Bob');
    });

    expect(useGameStore.getState().savedNames).toEqual(['Bob', 'Alice']);

    const persistedRaw = localStorage.getItem('resistance-game-state');
    expect(persistedRaw).toBeTruthy();
    const persisted = JSON.parse(persistedRaw as string);
    expect(persisted.state.savedNames).toEqual(['Bob', 'Alice']);

    act(() => {
      result.current.resetGame();
    });

    expect(useGameStore.getState().players).toEqual([]);
    expect(useGameStore.getState().savedNames).toEqual(['Bob', 'Alice']);
  });
});
