import { renderHook, act } from '@testing-library/react';
import { useGameStore } from '../gameStore';
import { getTeamSize } from '../../utils/gameLogic';
import type { GameState, Player } from '../../types/game';

let uuidCounter = 0;

jest.mock('uuid', () => ({
  v4: jest.fn(() => `mock-uuid-${++uuidCounter}`),
}));

function seedNamedGame(totalPlayers: number, names?: string[]) {
  const { result } = renderHook(() => useGameStore());

  act(() => {
    result.current.setTotalPlayers(totalPlayers);
    result.current.initializeRoles();
  });

  const playerNames =
    names ?? Array.from({ length: totalPlayers }, (_, i) => `P${i + 1}`);

  act(() => {
    playerNames.forEach((name) => result.current.addPlayer(name));
    result.current.completeNameEntryTurn();
  });

  // Skip the spy intro / reveal screens for mechanics tests
  act(() => {
    useGameStore.setState({ phase: 'captain' });
  });

  return result;
}

function forceRolesByIndex(rolesByIndex: Array<'spy' | 'resistance'>) {
  act(() => {
    useGameStore.setState((state) => {
      const updatedPlayers: Player[] = state.players.map((player, index) => ({
        ...player,
        role: rolesByIndex[index] ?? player.role,
      }));

      return { players: updatedPlayers };
    });
  });
}

function selectApproveMissionTeam(result: ReturnType<typeof seedNamedGame>, teamIds: string[]) {
  act(() => {
    result.current.selectTeam(teamIds);
  });
  act(() => {
    result.current.approveTeam();
  });
}

function voteAll(teamIds: string[], cards: Array<'success' | 'fail'>) {
  const store = useGameStore.getState();
  teamIds.forEach((playerId, idx) => {
    act(() => {
      store.submitVote(playerId, cards[idx] ?? 'success');
    });
  });
}

describe('gameStore mechanics', () => {
  beforeEach(() => {
    uuidCounter = 0;
    localStorage.clear();
    act(() => {
      useGameStore.setState({ savedNames: [] } as any);
      useGameStore.getState().resetGame();
    });
  });

  it('getCurrentPlayerRole should follow the next unnamed placeholder', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.setTotalPlayers(5);
      result.current.initializeRoles();
    });

    const firstRole = result.current.getCurrentPlayerRole();
    expect(firstRole).not.toBeNull();

    act(() => {
      result.current.addPlayer('Alice');
    });

    const secondRole = result.current.getCurrentPlayerRole();
    expect(secondRole).not.toBeNull();
    // Extremely unlikely but allowed: roles can match. We just ensure it advanced to a different player.
    expect(useGameStore.getState().players[0].name).toBe('Alice');
  });

  it('nextCaptain should wrap around', () => {
    const result = seedNamedGame(5);

    act(() => {
      useGameStore.setState({ captainIndex: 4 });
      result.current.nextCaptain();
    });

    expect(useGameStore.getState().captainIndex).toBe(0);
  });

  it('selectTeam should ignore incorrect team size', () => {
    const result = seedNamedGame(5);
    act(() => useGameStore.setState({ phase: 'captain' }));

    const wrongSizeTeam = [useGameStore.getState().players[0].id];
    act(() => {
      result.current.selectTeam(wrongSizeTeam);
    });

    expect(useGameStore.getState().phase).toBe('captain');
    expect(useGameStore.getState().proposedTeam).toEqual([]);
  });

  it('approveTeam and rejectTeam should be no-ops outside team-vote', () => {
    const result = seedNamedGame(5);
    act(() => useGameStore.setState({ phase: 'captain' }));

    act(() => {
      result.current.approveTeam();
      result.current.rejectTeam();
    });

    expect(useGameStore.getState().phase).toBe('captain');
    expect(useGameStore.getState().rejectedTeamsCount).toBe(0);
  });

  it('submitVote should prevent double-voting', () => {
    const result = seedNamedGame(5);
    const teamSize = getTeamSize(1, 5);
    const teamIds = useGameStore.getState().players.slice(0, teamSize).map((p) => p.id);

    act(() => {
      useGameStore.setState((state) => {
        const updatedMissions = state.missions.map((m) =>
          m.number === 1 ? { ...m, team: teamIds, votes: [] } : m
        );
        return { phase: 'mission-vote', missions: updatedMissions };
      });
    });

    const voterId = teamIds[0];
    act(() => {
      result.current.submitVote(voterId, 'success');
      result.current.submitVote(voterId, 'fail');
    });

    const mission = useGameStore.getState().missions[0];
    expect(mission.votes.filter((v) => v.playerId === voterId)).toHaveLength(1);
  });

  it('rejectedTeamsCount should persist within mission and reset on nextMission', () => {
    const result = seedNamedGame(5);
    act(() => useGameStore.setState({ captainIndex: 0 }));

    const teamSize = getTeamSize(1, 5);
    const proposed = useGameStore.getState().players.slice(0, teamSize).map((p) => p.id);

    // Reject twice
    for (let i = 0; i < 2; i++) {
      act(() => result.current.selectTeam(proposed));
      act(() => result.current.rejectTeam());
    }

    expect(useGameStore.getState().rejectedTeamsCount).toBe(2);

    // Then approve and complete mission
    act(() => result.current.selectTeam(proposed));
    act(() => result.current.approveTeam());
    expect(useGameStore.getState().phase).toBe('mission-vote');
    expect(useGameStore.getState().rejectedTeamsCount).toBe(2);

    // Force all resistance so mission always succeeds
    forceRolesByIndex(['resistance', 'resistance', 'resistance', 'resistance', 'resistance']);
    voteAll(proposed, proposed.map(() => 'success'));

    expect(useGameStore.getState().phase).toBe('mission-result');

    act(() => result.current.nextMission());
    expect(useGameStore.getState().rejectedTeamsCount).toBe(0);
    expect(useGameStore.getState().phase).toBe('captain');
  });

  it('should progress missions and declare spies winner after 3 failed missions', () => {
    const result = seedNamedGame(5, ['A', 'B', 'C', 'D', 'E']);
    act(() => useGameStore.setState({ captainIndex: 0 }));

    // Force 2 spies at indices 0 and 1 for determinism
    forceRolesByIndex(['spy', 'spy', 'resistance', 'resistance', 'resistance']);

    for (let missionNumber = 1; missionNumber <= 3; missionNumber++) {
      const teamSize = getTeamSize(missionNumber, 5);
      const teamIds = useGameStore.getState().players.slice(0, teamSize).map((p) => p.id);
      selectApproveMissionTeam(result, teamIds);

      // One spy fails every mission
      const cards = teamIds.map((id) => (id === useGameStore.getState().players[0].id ? 'fail' : 'success'));
      voteAll(teamIds, cards);

      const state = useGameStore.getState();
      expect(state.phase).toBe('mission-result');
      expect(state.missions.find((m) => m.number === missionNumber)?.result).toBe('fail');

      if (missionNumber < 3) {
        expect(state.winner).toBeNull();
        act(() => result.current.nextMission());
        expect(useGameStore.getState().phase).toBe('captain');
      }
    }

    expect(useGameStore.getState().winner).toBe('spies');
    expect(useGameStore.getState().winReason).toBe('missions');
  });

  it('should progress missions and declare resistance winner after 3 successful missions', () => {
    const result = seedNamedGame(5);
    act(() => useGameStore.setState({ captainIndex: 0 }));

    forceRolesByIndex(['resistance', 'resistance', 'resistance', 'resistance', 'resistance']);

    for (let missionNumber = 1; missionNumber <= 3; missionNumber++) {
      const teamSize = getTeamSize(missionNumber, 5);
      const teamIds = useGameStore.getState().players.slice(0, teamSize).map((p) => p.id);
      selectApproveMissionTeam(result, teamIds);
      voteAll(teamIds, teamIds.map(() => 'success'));

      const state = useGameStore.getState();
      expect(state.phase).toBe('mission-result');
      expect(state.missions.find((m) => m.number === missionNumber)?.result).toBe('success');

      if (missionNumber < 3) {
        expect(state.winner).toBeNull();
        act(() => result.current.nextMission());
      }
    }

    expect(useGameStore.getState().winner).toBe('resistance');
    expect(useGameStore.getState().winReason).toBe('missions');
  });

  it('mission 4 should require 2 fails to fail for 7+ players (store integration)', () => {
    const result = seedNamedGame(7);
    act(() => useGameStore.setState({ captainIndex: 0 }));
    forceRolesByIndex(['spy', 'spy', 'spy', 'resistance', 'resistance', 'resistance', 'resistance']);

    // Pre-complete first 3 missions so mission 4 is pending
    act(() => {
      useGameStore.setState((state) => {
        const updated = state.missions.map((m) =>
          m.number === 1
            ? { ...m, result: 'success' as const }
            : m.number === 2
              ? { ...m, result: 'fail' as const }
              : m.number === 3
                ? { ...m, result: 'success' as const }
                : m
        );
        return { missions: updated };
      });
    });

    const teamSize = getTeamSize(4, 7);
    const teamIds = useGameStore.getState().players.slice(0, teamSize).map((p) => p.id);
    selectApproveMissionTeam(result, teamIds);

    // Only one spy votes fail => mission should still succeed for 7+ players on mission 4
    const cards = teamIds.map((id) => (id === useGameStore.getState().players[0].id ? 'fail' : 'success'));
    voteAll(teamIds, cards);

    const mission4 = useGameStore.getState().missions.find((m) => m.number === 4);
    expect(mission4?.result).toBe('success');
  });

  it('goBack should undo host navigation and team approval/rejection, but never undo votes', () => {
    const result = seedNamedGame(5, ['A', 'B', 'C', 'D', 'E']);
    act(() => useGameStore.setState({ captainIndex: 0 }));

    // captain -> team-select (undoable)
    act(() => {
      result.current.setPhase('team-select');
    });
    expect(useGameStore.getState().phase).toBe('team-select');
    expect(useGameStore.getState().canGoBack()).toBe(true);

    act(() => {
      result.current.goBack();
    });
    expect(useGameStore.getState().phase).toBe('captain');

    // team-select -> team-vote (undoable)
    act(() => {
      result.current.setPhase('team-select');
    });
    const teamSize = getTeamSize(1, 5);
    const proposed = useGameStore.getState().players.slice(0, teamSize).map((p) => p.id);
    act(() => {
      result.current.selectTeam(proposed);
    });
    expect(useGameStore.getState().phase).toBe('team-vote');
    expect(useGameStore.getState().proposedTeam).toEqual(proposed);

    act(() => {
      result.current.goBack();
    });
    expect(useGameStore.getState().phase).toBe('team-select');
    expect(useGameStore.getState().proposedTeam).toEqual([]);

    // team-vote reject -> captain, and undo should restore team-vote
    act(() => {
      result.current.selectTeam(proposed);
      result.current.rejectTeam();
    });
    expect(useGameStore.getState().phase).toBe('captain');
    expect(useGameStore.getState().rejectedTeamsCount).toBe(1);
    expect(useGameStore.getState().captainIndex).toBe(1);

    act(() => {
      result.current.goBack();
    });
    expect(useGameStore.getState().phase).toBe('team-vote');
    expect(useGameStore.getState().rejectedTeamsCount).toBe(0);
    expect(useGameStore.getState().captainIndex).toBe(0);
    expect(useGameStore.getState().proposedTeam).toEqual(proposed);

    // approve -> mission-vote, undo is allowed only before any votes are cast
    act(() => {
      result.current.approveTeam();
    });
    expect(useGameStore.getState().phase).toBe('mission-vote');
    expect(useGameStore.getState().canGoBack()).toBe(true);

    act(() => {
      result.current.goBack();
    });
    expect(useGameStore.getState().phase).toBe('team-vote');
    expect(useGameStore.getState().proposedTeam).toEqual(proposed);

    // approve again, cast a vote, and ensure we cannot undo
    act(() => {
      result.current.approveTeam();
    });
    const voterId = proposed[0];
    act(() => {
      result.current.submitVote(voterId, 'success');
    });
    expect(useGameStore.getState().phase).toBe('mission-vote');
    expect(useGameStore.getState().canGoBack()).toBe(false);

    act(() => {
      result.current.goBack();
    });
    expect(useGameStore.getState().phase).toBe('mission-vote');
    expect(useGameStore.getState().missions[0].votes).toHaveLength(1);
  });

		  it('goBack should never allow returning to name-entry (role reveal)', () => {
		    const snapshot: GameState = {
		      phase: 'captain',
		      totalPlayers: 5,
		      players: [],
		      savedNames: [],
		      captainTurns: [],
		      captainIndex: 0,
		      missions: [],
		      currentPlayerIndex: 0,
		      proposedTeam: [],
          spyRevealIndex: 0,
		      language: 'en',
	      rejectedTeamsCount: 0,
	      winner: null,
	      winReason: null,
	    };

    act(() => {
      useGameStore.setState({
        ...snapshot,
        phase: 'name-entry',
        history: [snapshot],
      } as any);
    });

    expect(useGameStore.getState().canGoBack()).toBe(false);
    act(() => {
      useGameStore.getState().goBack();
    });
    expect(useGameStore.getState().phase).toBe('name-entry');
  });
});
