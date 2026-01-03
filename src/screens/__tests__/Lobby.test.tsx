import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { Lobby } from '../Lobby';
import { useGameStore } from '../../store/gameStore';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    language: 'en',
    t: (key: string) => {
      const map: Record<string, string> = {
        'lobby.title': 'The Resistance',
        'lobby.subtitle': 'Secret Helper Device',
        'lobby.playerCount': 'Number of Players',
        'lobby.playerCountHelp': 'Select between 5-10 players',
        'lobby.startGame': 'Start Game',
        'lobby.languageSwitch': 'Switch',
        'lobby.showHowToPlay': 'How to play (tweet thread)',
        'lobby.hideHowToPlay': 'Hide rules',
        'lobby.tweets.1': 'Tweet 1',
        'lobby.tweets.2': 'Tweet 2',
        'lobby.tweets.3': 'Tweet 3',
        'lobby.tweets.4': 'Tweet 4',
        'lobby.tweets.5': 'Tweet 5',
        'lobby.tweets.6': 'Tweet 6',
        'lobby.tweets.7': 'Tweet 7',
      };
      return map[key] ?? key;
    },
  }),
}));

describe('Lobby how-to-play thread', () => {
  beforeEach(() => {
    localStorage.clear();
    act(() => {
      useGameStore.setState({ savedNames: [] } as any);
      useGameStore.getState().resetGame();
    });
  });

  it('toggles tweet thread visibility', () => {
    render(<Lobby />);

    expect(screen.queryByText('Tweet 1')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /How to play/i }));
    expect(screen.getByText('Tweet 1')).toBeInTheDocument();
    expect(screen.getByText('Tweet 7')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Hide rules/i }));
    expect(screen.queryByText('Tweet 1')).not.toBeInTheDocument();
  });
});
