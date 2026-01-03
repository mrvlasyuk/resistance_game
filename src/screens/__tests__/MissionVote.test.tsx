import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { MissionVote } from '../MissionVote';
import { useGameStore } from '../../store/gameStore';
import type { Mission, Player } from '../../types/game';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    language: 'en',
    t: (key: string, params?: Record<string, string | number>) => {
      const map: Record<string, string> = {
        'common.next': 'Next',
        'common.confirm': 'Confirm',
        'missionVote.title': 'Mission Vote',
        'missionVote.subtitle': 'Pass the device',
        'missionVote.chooseCard': 'Choose your mission card:',
        'missionVote.success': 'Success',
        'missionVote.fail': 'Fail',
        'missionVote.confirmChoice': 'Confirm your choice',
        'missionVote.missionTeam': 'Mission Team',
        'missionVote.resistanceCannotFail': 'Resistance can only vote Success.',
      };

      if (key === 'missionVote.playerTurn') {
        return `${params?.playerName ?? ''}'s Turn`;
      }
      if (key === 'missionVote.progress') {
        return `Player ${params?.current ?? ''} / ${params?.total ?? ''}`;
      }

      return map[key] ?? key;
    },
  }),
}));

function seedMissionVoteState(params: {
  players: Player[];
  teamIds: string[];
  currentPlayerIndex?: number;
  totalPlayers?: number;
}) {
  const makeMission = (number: 1 | 2 | 3 | 4 | 5): Mission => ({
    number,
    team: [...params.teamIds],
    votes: [],
    result: 'pending',
  });

  act(() => {
    useGameStore.setState({
      phase: 'mission-vote',
      totalPlayers: params.totalPlayers ?? params.players.length,
      players: params.players,
      savedNames: [],
      captainTurns: [],
      missions: [makeMission(1), makeMission(2), makeMission(3), makeMission(4), makeMission(5)],
      currentPlayerIndex: params.currentPlayerIndex ?? 0,
      proposedTeam: [],
      captainIndex: 0,
      rejectedTeamsCount: 0,
      winner: null,
      winReason: null,
      language: 'en',
    });
  });
}

describe('MissionVote screen', () => {
  beforeEach(() => {
    localStorage.clear();
    act(() => {
      useGameStore.setState({ savedNames: [] } as any);
      useGameStore.getState().resetGame();
    });
  });

  it('shows two identical cards, but resistance cannot select Fail and sees a message', () => {
    const players: Player[] = [
      { id: 'p1', name: 'R1', role: 'resistance' },
      { id: 'p2', name: 'R2', role: 'resistance' },
    ];

    seedMissionVoteState({ players, teamIds: ['p1', 'p2'], currentPlayerIndex: 0, totalPlayers: 5 });

    render(<MissionVote />);

    // Name is visible before starting the private vote screen
    expect(screen.getAllByText('R1').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    // Name stays visible during card selection
    expect(screen.getAllByText('R1').length).toBeGreaterThan(0);

    // Fail button is present and not disabled (same look/feel as for spies)
    expect(screen.getByRole('button', { name: 'Fail' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Fail' }));

    expect(screen.getByText('Resistance can only vote Success.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Success' }));
    expect(screen.queryByText('Resistance can only vote Success.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });

  it('spy can select Fail and confirm a vote', () => {
    const players: Player[] = [
      { id: 'p1', name: 'S1', role: 'spy' },
      { id: 'p2', name: 'R1', role: 'resistance' },
    ];

    seedMissionVoteState({ players, teamIds: ['p1', 'p2'], currentPlayerIndex: 0, totalPlayers: 5 });

    render(<MissionVote />);

    expect(screen.getAllByText('S1').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getAllByText('S1').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Fail' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    const state = useGameStore.getState();
    expect(state.missions[0].votes).toHaveLength(1);
    expect(state.missions[0].votes[0]).toEqual({ playerId: 'p1', card: 'fail' });
    expect(state.currentPlayerIndex).toBe(1);
  });
});
