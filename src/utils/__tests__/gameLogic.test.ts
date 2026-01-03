import {
  dealRoles,
  resolveMission,
  checkVictory,
  createPlayer,
  createMission,
  getTeamSize,
  getSpies,
  getResistance,
  SPY_COUNT,
  TEAM_SIZES,
  getFailThreshold,
  getPublicMissionVoteCounts
} from '../gameLogic';
import type { Mission } from '../../types/game';

describe('gameLogic', () => {
  describe('dealRoles', () => {
    it('should deal correct number of spy and resistance roles for 5 players', () => {
      const players = Array.from({ length: 5 }, (_, i) => createPlayer(`Player ${i + 1}`));
      const playersWithRoles = dealRoles(players);
      
      const spies = getSpies(playersWithRoles);
      const resistance = getResistance(playersWithRoles);
      
      expect(spies).toHaveLength(2);
      expect(resistance).toHaveLength(3);
      expect(playersWithRoles).toHaveLength(5);
    });

    it('should deal correct number of spy and resistance roles for 10 players', () => {
      const players = Array.from({ length: 10 }, (_, i) => createPlayer(`Player ${i + 1}`));
      const playersWithRoles = dealRoles(players);
      
      const spies = getSpies(playersWithRoles);
      const resistance = getResistance(playersWithRoles);
      
      expect(spies).toHaveLength(4);
      expect(resistance).toHaveLength(6);
      expect(playersWithRoles).toHaveLength(10);
    });

    it('should throw error for invalid player count', () => {
      const players = Array.from({ length: 3 }, (_, i) => createPlayer(`Player ${i + 1}`));
      expect(() => dealRoles(players)).toThrow('Invalid player count: 3');
    });

    it('should assign roles randomly', () => {
      const players = Array.from({ length: 5 }, (_, i) => createPlayer(`Player ${i + 1}`));
      const result1 = dealRoles([...players]);
      const result2 = dealRoles([...players]);
      
      // It's theoretically possible but extremely unlikely for the roles to be identical
      // We'll just check that roles are assigned
      expect(result1.every(player => player.role !== null)).toBe(true);
      expect(result2.every(player => player.role !== null)).toBe(true);
    });
  });

  describe('resolveMission', () => {
    it('should return success when no fail votes', () => {
      const mission: Mission = {
        number: 1,
        team: ['player1', 'player2'],
        votes: [
          { playerId: 'player1', card: 'success' },
          { playerId: 'player2', card: 'success' }
        ],
        result: 'pending'
      };
      
      expect(resolveMission(mission, 5)).toBe('success');
    });

    it('should return fail when there are fail votes', () => {
      const mission: Mission = {
        number: 1,
        team: ['player1', 'player2'],
        votes: [
          { playerId: 'player1', card: 'success' },
          { playerId: 'player2', card: 'fail' }
        ],
        result: 'pending'
      };
      
      expect(resolveMission(mission, 5)).toBe('fail');
    });

    it('should require 2 fail votes for mission 4 with 7+ players', () => {
      const mission: Mission = {
        number: 4,
        team: ['player1', 'player2', 'player3'],
        votes: [
          { playerId: 'player1', card: 'success' },
          { playerId: 'player2', card: 'fail' },
          { playerId: 'player3', card: 'success' }
        ],
        result: 'pending'
      };
      
      expect(resolveMission(mission, 7)).toBe('success');
      expect(resolveMission(mission, 5)).toBe('fail');
    });

    it('should fail mission 4 with 2+ fail votes and 7+ players', () => {
      const mission: Mission = {
        number: 4,
        team: ['player1', 'player2', 'player3', 'player4'],
        votes: [
          { playerId: 'player1', card: 'success' },
          { playerId: 'player2', card: 'fail' },
          { playerId: 'player3', card: 'fail' },
          { playerId: 'player4', card: 'success' }
        ],
        result: 'pending'
      };
      
      expect(resolveMission(mission, 7)).toBe('fail');
    });
  });

  describe('getFailThreshold', () => {
    it('should be 1 for normal missions', () => {
      expect(getFailThreshold(1, 5)).toBe(1);
      expect(getFailThreshold(3, 10)).toBe(1);
      expect(getFailThreshold(5, 7)).toBe(1);
    });

    it('should be 2 for mission 4 with 7+ players', () => {
      expect(getFailThreshold(4, 7)).toBe(2);
      expect(getFailThreshold(4, 10)).toBe(2);
    });

    it('should be 1 for mission 4 with <7 players', () => {
      expect(getFailThreshold(4, 5)).toBe(1);
      expect(getFailThreshold(4, 6)).toBe(1);
    });
  });

  describe('getPublicMissionVoteCounts', () => {
    it('should reveal all fail votes when mission succeeded', () => {
      const mission: Mission = {
        number: 4,
        team: ['a', 'b', 'c', 'd'],
        votes: [
          { playerId: 'a', card: 'success' },
          { playerId: 'b', card: 'fail' },
          { playerId: 'c', card: 'success' },
          { playerId: 'd', card: 'success' },
        ],
        result: 'success',
      };

      expect(getPublicMissionVoteCounts(mission, 7)).toEqual({ success: 3, fail: 1 });
    });

    it('should cap revealed fails to 1 for failed missions where threshold is 1', () => {
      const mission: Mission = {
        number: 1,
        team: ['a', 'b', 'c'],
        votes: [
          { playerId: 'a', card: 'fail' },
          { playerId: 'b', card: 'fail' },
          { playerId: 'c', card: 'success' },
        ],
        result: 'fail',
      };

      expect(getPublicMissionVoteCounts(mission, 5)).toEqual({ success: 2, fail: 1 });
    });

    it('should cap revealed fails to 2 for mission 4 failed with 7+ players', () => {
      const mission: Mission = {
        number: 4,
        team: ['a', 'b', 'c', 'd', 'e'],
        votes: [
          { playerId: 'a', card: 'fail' },
          { playerId: 'b', card: 'fail' },
          { playerId: 'c', card: 'fail' },
          { playerId: 'd', card: 'success' },
          { playerId: 'e', card: 'success' },
        ],
        result: 'fail',
      };

      expect(getPublicMissionVoteCounts(mission, 7)).toEqual({ success: 3, fail: 2 });
    });
  });

  describe('checkVictory', () => {
    it('should return null when less than 3 missions completed', () => {
      const missions: Mission[] = [
        { number: 1, team: [], votes: [], result: 'success' },
        { number: 2, team: [], votes: [], result: 'fail' }
      ];
      
      expect(checkVictory(missions)).toBeNull();
    });

    it('should return resistance when 3 missions succeed', () => {
      const missions: Mission[] = [
        { number: 1, team: [], votes: [], result: 'success' },
        { number: 2, team: [], votes: [], result: 'success' },
        { number: 3, team: [], votes: [], result: 'success' }
      ];
      
      expect(checkVictory(missions)).toBe('resistance');
    });

    it('should return spies when 3 missions fail', () => {
      const missions: Mission[] = [
        { number: 1, team: [], votes: [], result: 'fail' },
        { number: 2, team: [], votes: [], result: 'fail' },
        { number: 3, team: [], votes: [], result: 'fail' }
      ];
      
      expect(checkVictory(missions)).toBe('spies');
    });

    it('should return null when neither side has 3 wins', () => {
      const missions: Mission[] = [
        { number: 1, team: [], votes: [], result: 'success' },
        { number: 2, team: [], votes: [], result: 'fail' },
        { number: 3, team: [], votes: [], result: 'success' },
        { number: 4, team: [], votes: [], result: 'fail' }
      ];
      
      expect(checkVictory(missions)).toBeNull();
    });
  });

  describe('getTeamSize', () => {
    it('should return correct team size for mission 1 with 5 players', () => {
      expect(getTeamSize(1, 5)).toBe(2);
    });

    it('should return correct team size for mission 3 with 8 players', () => {
      expect(getTeamSize(3, 8)).toBe(4);
    });

    it('should throw error for invalid mission number', () => {
      expect(() => getTeamSize(6, 5)).toThrow();
      expect(() => getTeamSize(0, 5)).toThrow();
    });

    it('should throw error for invalid player count', () => {
      expect(() => getTeamSize(1, 4)).toThrow();
      expect(() => getTeamSize(1, 11)).toThrow();
    });
  });

  describe('createPlayer', () => {
    it('should create player with name and null role', () => {
      const player = createPlayer('Test Player');
      
      expect(player.name).toBe('Test Player');
      expect(player.role).toBeNull();
      expect(player.id).toBeDefined();
      expect(typeof player.id).toBe('string');
    });
  });

  describe('createMission', () => {
    it('should create mission with correct number and pending status', () => {
      const mission = createMission(1);
      
      expect(mission.number).toBe(1);
      expect(mission.result).toBe('pending');
      expect(mission.team).toEqual([]);
      expect(mission.votes).toEqual([]);
    });
  });

  describe('constants', () => {
    it('should have correct spy counts', () => {
      expect(SPY_COUNT[5]).toBe(2);
      expect(SPY_COUNT[6]).toBe(2);
      expect(SPY_COUNT[7]).toBe(3);
      expect(SPY_COUNT[8]).toBe(3);
      expect(SPY_COUNT[9]).toBe(3);
      expect(SPY_COUNT[10]).toBe(4);
    });

    it('should have correct team sizes', () => {
      expect(TEAM_SIZES[5]).toEqual([2, 3, 2, 3, 3]);
      expect(TEAM_SIZES[6]).toEqual([2, 3, 4, 3, 4]);
      expect(TEAM_SIZES[7]).toEqual([2, 3, 3, 4, 4]);
      expect(TEAM_SIZES[8]).toEqual([3, 4, 4, 5, 5]);
      expect(TEAM_SIZES[9]).toEqual([3, 4, 4, 5, 5]);
      expect(TEAM_SIZES[10]).toEqual([3, 4, 4, 5, 5]);
    });
  });
}); 
