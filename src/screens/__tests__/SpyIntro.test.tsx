import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { SpyIntro } from '../SpyIntro';
import { useGameStore } from '../../store/gameStore';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    language: 'en',
    t: (key: string) => {
      const map: Record<string, string> = {
        'spyIntro.title': 'Host Reminder',
        'spyIntro.subtitle': 'Spy introduction before the game starts',
        'spyIntro.step1': 'Step 1',
        'spyIntro.step2': 'Step 2',
        'spyIntro.step3': 'Step 3',
        'spyIntro.continue': 'Continue',
      };
      return map[key] ?? key;
    },
  }),
}));

describe('SpyIntro screen', () => {
  beforeEach(() => {
    localStorage.clear();
    act(() => {
      useGameStore.setState({ savedNames: [] } as any);
      useGameStore.getState().resetGame();
    });
  });

  it('shows reminder and continues to captain', () => {
    act(() => {
      useGameStore.setState({ phase: 'spy-intro', captainTurns: [] } as any);
    });

    render(<SpyIntro />);

    expect(screen.getByText('Host Reminder')).toBeInTheDocument();
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(useGameStore.getState().phase).toBe('captain');
  });
});
