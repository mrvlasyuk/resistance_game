export type Role = 'spy' | 'resistance';

export interface Player {
  id: string;
  name: string;
  role: Role | null;
}

export interface MissionVote {
  playerId: string;
  card: 'success' | 'fail';
}

export interface Mission {
  number: 1 | 2 | 3 | 4 | 5;
  team: string[];
  votes: MissionVote[];
  result: 'pending' | 'success' | 'fail';
}

export type GamePhase =
  | 'lobby'
  | 'name-entry'
  | 'spy-intro'
  | 'captain'
  | 'team-select'
  | 'team-vote'
  | 'mission-vote'
  | 'mission-result'
  | 'victory';

export interface GameState {
  phase: GamePhase;
  totalPlayers: number;
  players: Player[];
  captainIndex: number;
  missions: Mission[];
  currentPlayerIndex: number; // для голосования в миссии
  proposedTeam: string[]; // команда, предложенная капитаном (до утверждения)
  language: 'en' | 'ru';
  rejectedTeamsCount: number; // счетчик отклоненных команд (в текущей миссии)
  winner: 'resistance' | 'spies' | null;
  winReason: 'missions' | 'team-rejections' | null;
}

export type GameAction =
  | { type: 'SET_TOTAL_PLAYERS'; payload: number }
  | { type: 'ADD_PLAYER'; payload: { name: string } }
  | { type: 'SET_PHASE'; payload: GamePhase }
  | { type: 'NEXT_CAPTAIN' }
  | { type: 'SELECT_TEAM'; payload: string[] }
  | { type: 'SUBMIT_VOTE'; payload: { playerId: string; card: 'success' | 'fail' } }
  | { type: 'NEXT_MISSION_VOTER' }
  | { type: 'RESOLVE_MISSION' }
  | { type: 'NEXT_MISSION' }
  | { type: 'RESET_GAME' }
  | { type: 'SET_LANGUAGE'; payload: 'en' | 'ru' };
