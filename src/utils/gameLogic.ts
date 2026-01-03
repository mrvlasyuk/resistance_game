import { v4 as uuidv4 } from 'uuid';
import type { Player, Role, Mission } from '../types/game';

/**
 * Team sizes for each mission based on player count
 */
export const TEAM_SIZES: Record<number, number[]> = {
  5: [2, 3, 2, 3, 3],
  6: [2, 3, 4, 3, 4],
  7: [2, 3, 3, 4, 4],
  8: [3, 4, 4, 5, 5],
  9: [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5],
};

/**
 * Spy count for each player count
 */
export const SPY_COUNT: Record<number, number> = {
  5: 2,
  6: 2,
  7: 3,
  8: 3,
  9: 3,
  10: 4,
};

/**
 * Fail votes required to fail a mission based on mission number and player count
 */
export function getFailThreshold(missionNumber: number, totalPlayers: number): 1 | 2 {
  // Special rule: 4th mission with 7+ players requires 2 fail votes to fail
  if (missionNumber === 4 && totalPlayers >= 7) return 2;
  return 1;
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Deal roles to players based on player count
 */
export function dealRoles(players: Player[]): Player[] {
  const numPlayers = players.length;
  const numSpies = SPY_COUNT[numPlayers];
  
  if (!numSpies) {
    throw new Error(`Invalid player count: ${numPlayers}`);
  }
  
  // Create roles array
  const roles: Role[] = [
    ...Array(numSpies).fill('spy'),
    ...Array(numPlayers - numSpies).fill('resistance'),
  ];
  
  // Shuffle roles
  const shuffledRoles = shuffleArray(roles);
  
  // Assign roles to players
  return players.map((player, index) => ({
    ...player,
    role: shuffledRoles[index],
  }));
}

/**
 * Get spies from players list
 */
export function getSpies(players: Player[]): Player[] {
  return players.filter(player => player.role === 'spy');
}

/**
 * Get resistance members from players list
 */
export function getResistance(players: Player[]): Player[] {
  return players.filter(player => player.role === 'resistance');
}

/**
 * Resolve mission result based on votes
 */
export function resolveMission(mission: Mission, totalPlayers: number): 'success' | 'fail' {
  const failVotes = mission.votes.filter(vote => vote.card === 'fail').length;
  const threshold = getFailThreshold(mission.number, totalPlayers);
  return failVotes >= threshold ? 'fail' : 'success';
}

/**
 * Public mission card counts to reveal.
 * If the mission failed, reveal only the minimum number of fail cards required,
 * and treat any extra fail votes as success for the reveal to avoid leaking spy count.
 */
export function getPublicMissionVoteCounts(
  mission: Mission,
  totalPlayers: number
): { success: number; fail: number } {
  const successVotes = mission.votes.filter(vote => vote.card === 'success').length;
  const failVotes = mission.votes.filter(vote => vote.card === 'fail').length;

  if (mission.result === 'fail') {
    const threshold = getFailThreshold(mission.number, totalPlayers);
    const revealedFail = Math.min(failVotes, threshold);
    const revealedSuccess = Math.max(0, mission.team.length - revealedFail);
    return { success: revealedSuccess, fail: revealedFail };
  }

  return { success: successVotes, fail: failVotes };
}

/**
 * Check if game has ended and determine winner
 */
export function checkVictory(missions: Mission[]): 'resistance' | 'spies' | null {
  const completedMissions = missions.filter(m => m.result !== 'pending');
  
  if (completedMissions.length < 3) {
    return null;
  }
  
  const successCount = completedMissions.filter(m => m.result === 'success').length;
  const failCount = completedMissions.filter(m => m.result === 'fail').length;
  
  if (successCount >= 3) {
    return 'resistance';
  }
  
  if (failCount >= 3) {
    return 'spies';
  }
  
  return null;
}

/**
 * Create a new player
 */
export function createPlayer(name: string): Player {
  return {
    id: uuidv4(),
    name,
    role: null,
  };
}

/**
 * Create a new mission
 */
export function createMission(number: 1 | 2 | 3 | 4 | 5): Mission {
  return {
    number,
    team: [],
    votes: [],
    result: 'pending',
  };
}

/**
 * Get team size for a specific mission and player count
 */
export function getTeamSize(missionNumber: number, totalPlayers: number): number {
  const sizes = TEAM_SIZES[totalPlayers];
  if (!sizes || missionNumber < 1 || missionNumber > 5) {
    throw new Error(`Invalid mission number or player count: ${missionNumber}, ${totalPlayers}`);
  }
  return sizes[missionNumber - 1];
} 
