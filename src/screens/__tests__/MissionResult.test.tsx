import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { MissionResult } from '../MissionResult';
import { useGameStore } from '../../store/gameStore';
import type { Mission } from '../../types/game';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    language: 'en',
    t: (key: string, params?: Record<string, string | number>) => {
      if (key === 'missionResult.title') return `Mission ${params?.number ?? ''} Result`;
      const map: Record<string, string> = {
        'missionResult.success': 'SUCCESS',
        'missionResult.fail': 'FAILED',
        'missionResult.cardReveal': 'Mission Cards:',
        'missionResult.score': 'Current Score',
        'missionResult.resistanceWins': 'Resistance Victories',
        'missionResult.spyWins': 'Spy Victories',
        'missionResult.nextMission': 'Next Mission',
        'missionResult.gameOver': 'Game Over',
        'missionVote.success': 'Success',
        'missionVote.fail': 'Fail',
      };
      return map[key] ?? key;
    },
  }),
}));

function seedMissionResult(params: {
  totalPlayers: number;
  missionNumber: 1 | 2 | 3 | 4 | 5;
  teamIds: string[];
  votes: Mission['votes'];
  result: 'success' | 'fail';
}) {
  const makeMission = (number: 1 | 2 | 3 | 4 | 5): Mission => ({
    number,
    team: number === params.missionNumber ? [...params.teamIds] : [],
    votes: number === params.missionNumber ? [...params.votes] : [],
    result: number === params.missionNumber ? params.result : 'pending',
  });

  act(() => {
    useGameStore.setState({
      phase: 'mission-result',
      totalPlayers: params.totalPlayers,
      players: [],
      missions: [makeMission(1), makeMission(2), makeMission(3), makeMission(4), makeMission(5)],
      captainIndex: 0,
      currentPlayerIndex: 0,
      proposedTeam: [],
      rejectedTeamsCount: 0,
      winner: null,
      winReason: null,
      language: 'en',
    });
  });
}

describe('MissionResult screen', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
    act(() => {
      useGameStore.getState().resetGame();
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('caps revealed Fail cards to 1 on failed missions where threshold is 1', () => {
    seedMissionResult({
      totalPlayers: 5,
      missionNumber: 1,
      teamIds: ['a', 'b', 'c'],
      votes: [
        { playerId: 'a', card: 'fail' },
        { playerId: 'b', card: 'fail' },
        { playerId: 'c', card: 'success' },
      ],
      result: 'fail',
    });

    render(<MissionResult />);

    act(() => {
      jest.advanceTimersByTime(1100);
    });

    // Reveal shows 1 Fail (threshold) and the rest as Success
    expect(screen.getAllByText('Fail')).toHaveLength(1);
    expect(screen.getAllByText('Success')).toHaveLength(2);
  });

  it('caps revealed Fail cards to 2 on mission 4 failed with 7+ players', () => {
    seedMissionResult({
      totalPlayers: 7,
      missionNumber: 4,
      teamIds: ['a', 'b', 'c', 'd', 'e'],
      votes: [
        { playerId: 'a', card: 'fail' },
        { playerId: 'b', card: 'fail' },
        { playerId: 'c', card: 'fail' },
        { playerId: 'd', card: 'success' },
        { playerId: 'e', card: 'success' },
      ],
      result: 'fail',
    });

    render(<MissionResult />);

    act(() => {
      jest.advanceTimersByTime(1100);
    });

    expect(screen.getAllByText('Fail')).toHaveLength(2);
    expect(screen.getAllByText('Success')).toHaveLength(3);
  });

  it('does not cap Fail cards when mission did not fail', () => {
    seedMissionResult({
      totalPlayers: 7,
      missionNumber: 4,
      teamIds: ['a', 'b', 'c', 'd'],
      votes: [
        { playerId: 'a', card: 'success' },
        { playerId: 'b', card: 'fail' },
        { playerId: 'c', card: 'success' },
        { playerId: 'd', card: 'success' },
      ],
      result: 'success',
    });

    render(<MissionResult />);

    act(() => {
      jest.advanceTimersByTime(1100);
    });

    expect(screen.getAllByText('Fail')).toHaveLength(1);
    expect(screen.getAllByText('Success')).toHaveLength(3);
  });
});

