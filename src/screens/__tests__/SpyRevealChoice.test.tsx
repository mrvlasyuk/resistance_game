import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { SpyRevealChoice } from '../SpyRevealChoice';
import { useGameStore } from '../../store/gameStore';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    language: 'en',
    t: (key: string) => {
      const map: Record<string, string> = {
        'spyRevealChoice.title': 'Spy Intro',
        'spyRevealChoice.subtitle': 'How should spies learn each other?',
        'spyRevealChoice.note': 'Note',
        'spyRevealChoice.passPhone': 'Pass',
        'spyRevealChoice.citySleeps': 'Sleep',
      };
      return map[key] ?? key;
    },
  }),
}));

describe('SpyRevealChoice screen', () => {
  beforeEach(() => {
    localStorage.clear();
    act(() => {
      useGameStore.setState({ savedNames: [] } as any);
      useGameStore.getState().resetGame();
    });
  });

  it('routes to spy-reveal or spy-intro', () => {
    act(() => {
      useGameStore.setState({
        phase: 'spy-reveal-choice',
        players: [
          { id: 'p1', name: 'A', role: 'resistance' },
          { id: 'p2', name: 'B', role: 'spy' },
        ],
        spyRevealIndex: 0,
      } as any);
    });

    render(<SpyRevealChoice />);

    fireEvent.click(screen.getByRole('button', { name: 'Pass' }));
    expect(useGameStore.getState().phase).toBe('spy-reveal');

    act(() => {
      useGameStore.setState({ phase: 'spy-reveal-choice' } as any);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sleep' }));
    expect(useGameStore.getState().phase).toBe('spy-intro');
  });
});

