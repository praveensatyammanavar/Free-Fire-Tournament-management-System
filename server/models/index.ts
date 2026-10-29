/**
 * MongoDB / Mongoose Schema Specifications for Production Deployment
 * Matches Section 16: Database Design
 */

export interface IMongoPlayer {
  registrationNumber: string;
  playerName: string;
  freeFireName: string;
  freeFireUID: string;
  mobileNumber: string;
  passwordHash: string;
  roomId: number;
  totalKills: number;
  status: 'Registered' | 'Active' | 'Eliminated' | 'Disqualified';
  disqualificationReason?: string;
  registrationDate: Date;
  updatedAt: Date;
}

export interface IMongoRoom {
  roomNumber: number;
  roomName: string;
  capacity: number;
  registrationOpen: boolean;
  matchStatus: 'Waiting' | 'Scheduled' | 'Live' | 'Completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface IMongoAdmin {
  username: string;
  passwordHash: string;
  role: 'admin';
  createdAt: Date;
}

export interface IMongoKillAudit {
  playerId: string;
  playerName: string;
  previousKills: number;
  updatedKills: number;
  reason: string;
  updatedBy: string;
  updatedAt: Date;
}

export interface IMongoDisqualificationAudit {
  playerId: string;
  playerName: string;
  freeFireUID: string;
  reason: string;
  action: 'disqualified' | 'restored';
  updatedBy: string;
  updatedAt: Date;
}

export interface IMongoTournament {
  tournamentName: string;
  tournamentDate: Date;
  registrationStatus: string;
  tournamentStatus: string;
  maxPlayers: number;
  roomCapacity: number;
  numberOfRooms: number;
  finalResultsPublished: boolean;
  scheduledMatchTime?: Date;
  isMatchLive: boolean;
  matchDurationMinutes: number;
}
