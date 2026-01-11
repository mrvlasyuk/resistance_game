import type { CaptainTurn, GameState, Mission, Player } from '../types/game';

export type ShotId =
  | 'captain-m4-specialrule'
  | 'team-vote-m4-tension'
  | 'mission-vote-m4-private'
  | 'mission-result-m4-fail-2red';

function basePlayers(): Player[] {
  return [
    { id: 'p1', name: 'Алекс', role: 'spy' },
    { id: 'p2', name: 'Даша', role: 'resistance' },
    { id: 'p3', name: 'Саша', role: 'spy' },
    { id: 'p4', name: 'Катя', role: 'resistance' },
    { id: 'p5', name: 'Илья', role: 'resistance' },
    { id: 'p6', name: 'Маша', role: 'spy' },
    { id: 'p7', name: 'Петя', role: 'resistance' },
  ];
}

function missionsUpTo3(): Mission[] {
  return [
    {
      number: 1,
      team: ['p2', 'p4'],
      votes: [
        { playerId: 'p2', card: 'success' },
        { playerId: 'p4', card: 'success' },
      ],
      result: 'success',
    },
    {
      number: 2,
      team: ['p1', 'p5', 'p7'],
      votes: [
        { playerId: 'p1', card: 'fail' },
        { playerId: 'p5', card: 'success' },
        { playerId: 'p7', card: 'success' },
      ],
      result: 'fail',
    },
    {
      number: 3,
      team: ['p3', 'p2', 'p4'],
      votes: [
        { playerId: 'p3', card: 'success' },
        { playerId: 'p2', card: 'success' },
        { playerId: 'p4', card: 'success' },
      ],
      result: 'success',
    },
  ];
}

function baseCaptainTurns(): CaptainTurn[] {
  return [
    { id: 't1', missionNumber: 1, captainId: 'p6', team: ['p2', 'p4'], status: 'rejected' },
    {
      id: 't2',
      missionNumber: 1,
      captainId: 'p2',
      team: ['p2', 'p4'],
      status: 'mission-success',
      revealed: { success: 2, fail: 0 },
    },
    { id: 't3', missionNumber: 2, captainId: 'p3', team: ['p1', 'p5', 'p7'], status: 'rejected' },
    {
      id: 't4',
      missionNumber: 2,
      captainId: 'p1',
      team: ['p1', 'p5', 'p7'],
      status: 'mission-fail',
      revealed: { success: 2, fail: 1 },
    },
    {
      id: 't5',
      missionNumber: 3,
      captainId: 'p7',
      team: ['p3', 'p2', 'p4'],
      status: 'mission-success',
      revealed: { success: 3, fail: 0 },
    },
  ];
}

function mission4Pending(): Mission {
  return { number: 4, team: [], votes: [], result: 'pending' };
}

function mission5Pending(): Mission {
  return { number: 5, team: [], votes: [], result: 'pending' };
}

export function getShotState(shot: string): GameState | null {
  const shotId = shot as ShotId;
  const players = basePlayers();
  const completedMissions = missionsUpTo3();
  const captainTurns = baseCaptainTurns();

  switch (shotId) {
    case 'captain-m4-specialrule': {
      return {
        phase: 'captain',
        totalPlayers: 7,
        players,
        savedNames: ['Лёша', 'Саня', 'Катюха', 'Машка', 'Илюха'],
        captainTurns: [
          ...captainTurns,
          { id: 't6', missionNumber: 4, captainId: 'p4', team: ['p1', 'p2', 'p6', 'p7'], status: 'rejected' },
          { id: 't7', missionNumber: 4, captainId: 'p5', team: ['p1', 'p3', 'p6', 'p7'], status: 'rejected' },
          { id: 't8', missionNumber: 4, captainId: 'p6', team: ['p2', 'p3', 'p5', 'p6'], status: 'rejected' },
        ],
        captainIndex: 6, // Петя
        missions: [...completedMissions, mission4Pending(), mission5Pending()],
        currentPlayerIndex: 0,
        proposedTeam: [],
        spyRevealIndex: 0,
        language: 'ru',
        rejectedTeamsCount: 3,
        winner: null,
        winReason: null,
      };
    }

    case 'team-vote-m4-tension': {
      const proposedTeam = ['p1', 'p3', 'p6', 'p2'];
      return {
        phase: 'team-vote',
        totalPlayers: 7,
        players,
        savedNames: [],
        captainTurns: [
          ...captainTurns,
          { id: 't6', missionNumber: 4, captainId: 'p5', team: ['p2', 'p3', 'p5', 'p7'], status: 'rejected' },
          { id: 't7', missionNumber: 4, captainId: 'p6', team: ['p1', 'p2', 'p5', 'p7'], status: 'rejected' },
          {
            id: 't8',
            missionNumber: 4,
            captainId: 'p2',
            team: proposedTeam,
            status: 'proposed',
          },
        ],
        captainIndex: 1, // Даша
        missions: [...completedMissions, mission4Pending(), mission5Pending()],
        currentPlayerIndex: 0,
        proposedTeam,
        spyRevealIndex: 0,
        language: 'ru',
        rejectedTeamsCount: 4,
        winner: null,
        winReason: null,
      };
    }

    case 'mission-vote-m4-private': {
      const team = ['p1', 'p3', 'p6', 'p2'];
      return {
        phase: 'mission-vote',
        totalPlayers: 7,
        players,
        savedNames: [],
        captainTurns: [
          ...captainTurns,
          { id: 't6', missionNumber: 4, captainId: 'p2', team, status: 'approved' },
        ],
        captainIndex: 1,
        missions: [
          ...completedMissions,
          { number: 4, team, votes: [], result: 'pending' },
          mission5Pending(),
        ],
        currentPlayerIndex: 1,
        proposedTeam: [],
        spyRevealIndex: 0,
        language: 'ru',
        rejectedTeamsCount: 1,
        winner: null,
        winReason: null,
      };
    }

    case 'mission-result-m4-fail-2red': {
      const team = ['p1', 'p3', 'p6', 'p2'];
      const mission4: Mission = {
        number: 4,
        team,
        votes: [
          { playerId: 'p1', card: 'fail' },
          { playerId: 'p3', card: 'fail' },
          { playerId: 'p6', card: 'fail' },
          { playerId: 'p2', card: 'success' },
        ],
        result: 'fail',
      };

      return {
        phase: 'mission-result',
        totalPlayers: 7,
        players,
        savedNames: [],
        captainTurns: [
          ...captainTurns,
          {
            id: 't6',
            missionNumber: 4,
            captainId: 'p2',
            team,
            status: 'mission-fail',
            revealed: { success: 2, fail: 2 },
          },
        ],
        captainIndex: 1,
        missions: [...completedMissions, mission4, mission5Pending()],
        currentPlayerIndex: 0,
        proposedTeam: [],
        spyRevealIndex: 0,
        language: 'ru',
        rejectedTeamsCount: 0,
        winner: null,
        winReason: null,
      };
    }

    default:
      return null;
  }
}

