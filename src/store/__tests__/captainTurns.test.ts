import { renderHook, act } from '@testing-library/react';
import { useGameStore } from '../gameStore';
import { getTeamSize } from '../../utils/gameLogic';
import type { Player } from '../../types/game';

let uuidCounter = 0;

jest.mock('uuid', () => ({
  v4: jest.fn(() => `mock-uuid-${++uuidCounter}`),
}));

describe('captainTurns', () => {
  beforeEach(() => {
    uuidCounter = 0;
    localStorage.clear();
    act(() => {
      useGameStore.setState({ savedNames: [] } as any);
      useGameStore.getState().resetGame();
    });
  });

  it('logs proposed -> approved -> mission result with revealed cards', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.setTotalPlayers(5);
      result.current.initializeRoles();
      ['A', 'B', 'C', 'D', 'E'].forEach((name) => result.current.addPlayer(name));
      useGameStore.setState({ captainIndex: 0, phase: 'captain' });
    });

    const teamSize = getTeamSize(1, 5);
    const team = useGameStore.getState().players.slice(0, teamSize).map((p) => p.id);

    act(() => {
      result.current.setPhase('team-select');
      result.current.selectTeam(team);
    });

    expect(useGameStore.getState().captainTurns).toHaveLength(1);
    expect(useGameStore.getState().captainTurns[0].status).toBe('proposed');

    act(() => {
      result.current.approveTeam();
    });

    expect(useGameStore.getState().captainTurns[0].status).toBe('approved');

    // Force one spy on team for deterministic fail
    act(() => {
      useGameStore.setState((state) => {
        const updatedPlayers: Player[] = state.players.map((p, idx) => ({
          ...p,
          role: idx === 0 ? 'spy' : 'resistance',
        }));
        return { players: updatedPlayers };
      });
    });

    act(() => {
      result.current.submitVote(team[0], 'fail');
      result.current.submitVote(team[1], 'success');
    });

    const lastTurn = useGameStore.getState().captainTurns[0];
    expect(lastTurn.status).toBe('mission-fail');
    expect(lastTurn.revealed).toEqual({ success: 1, fail: 1 });
  });
});

