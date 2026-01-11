import type { GameState } from '../types/game';
import { getShotState } from './shotStates';

const PERSIST_KEY = 'resistance-game-state';
const PERSIST_VERSION = 4;

function shouldAllowShotSeeding(): boolean {
  const params = new URLSearchParams(window.location.search);
  return !!params.get('shot');
}

export function applyShotFromUrl(): void {
  if (!shouldAllowShotSeeding()) return;

  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (!shot) return;

  const gameState = getShotState(shot);
  if (!gameState) return;

  const persisted: { state: GameState; version: number } = {
    state: gameState,
    version: PERSIST_VERSION,
  };

  localStorage.setItem(PERSIST_KEY, JSON.stringify(persisted));
}
