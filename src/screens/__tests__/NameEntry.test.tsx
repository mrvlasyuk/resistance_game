import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { NameEntry } from '../NameEntry';
import { useGameStore } from '../../store/gameStore';
import type { Player } from '../../types/game';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    language: 'en',
    t: (key: string, params?: Record<string, string | number>) => {
      if (key === 'nameEntry.playerNumber') return `Player ${params?.number ?? ''}`;
      const map: Record<string, string> = {
        'nameEntry.title': 'Player Setup',
        'nameEntry.enterName': 'Enter your name',
        'nameEntry.suggestions': 'Suggestions',
        'nameEntry.yourRole': 'Your Role',
        'nameEntry.spy': 'Spy',
        'nameEntry.resistance': 'Resistance',
        'nameEntry.spyList': 'Other Spies:',
        'nameEntry.roleDescription.spy': 'Spy role',
        'nameEntry.roleDescription.resistance': 'Resistance role',
        'nameEntry.autoClose': 'Auto close',
        'common.next': 'Next',
        'common.clearScreen': 'Clear Screen',
      };
      return map[key] ?? key;
    },
  }),
}));

jest.mock('../../components/PrivateScreen', () => ({
  PrivateScreen: ({ children }: { children: any }) => <div>{children}</div>,
}));

function seedNameEntry(params: {
  totalPlayers: number;
  players: Player[];
  savedNames: string[];
}) {
  act(() => {
    useGameStore.setState({
      phase: 'name-entry',
      totalPlayers: params.totalPlayers,
      players: params.players,
      savedNames: params.savedNames,
      captainTurns: [],
      captainIndex: 0,
      missions: [],
      currentPlayerIndex: 0,
      proposedTeam: [],
      language: 'en',
      rejectedTeamsCount: 0,
      winner: null,
      winReason: null,
      history: [],
    } as any);
  });
}

describe('NameEntry suggestions', () => {
  beforeEach(() => {
    localStorage.clear();
    act(() => {
      useGameStore.setState({ savedNames: [] } as any);
      useGameStore.getState().resetGame();
    });
  });

  it('shows suggestions after 2 letters and fills input on click', () => {
    seedNameEntry({
      totalPlayers: 5,
      players: [
        { id: 'p1', name: 'Player 1', role: 'resistance' },
        { id: 'p2', name: 'Player 2', role: 'spy' },
      ],
      savedNames: ['Alice', 'Alina', 'Bob'],
    });

    render(<NameEntry />);

    const input = screen.getByPlaceholderText('Enter your name') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Al' } });

    expect(screen.getByText('Suggestions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Alice' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Alina' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Alice' }));
    expect(input.value).toBe('Alice');
  });
});
