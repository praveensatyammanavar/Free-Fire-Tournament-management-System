export type PlayerStatus = 'Registered' | 'Active' | 'Eliminated' | 'Disqualified';

export interface Player {
  id: string;
  registrationNumber: string; // e.g. "FF-R01-042"
  playerName: string;
  freeFireName: string;
  freeFireUID: string;
  mobileNumber?: string;
  roomId: number; // 1 to 10
  roomName: string;
  totalKills: number;
  status: PlayerStatus;
  rank?: number;
  disqualificationReason?: string;
  disqualifiedAt?: string;
  registrationDate: string;
  updatedAt: string;
}

export interface Room {
  id: number;
  roomNumber: number;
  roomName: string;
  capacity: number;
  registeredCount: number;
  availableSeats: number;
  registrationOpen: boolean;
  matchStatus: 'Waiting' | 'Scheduled' | 'Live' | 'Completed';
  matchStartedAt?: string | null;
  matchDurationMinutes?: number;
  qrImageUrl?: string | null;
}

export interface KillAudit {
  id: string;
  playerId: string;
  playerName: string;
  freeFireUID: string;
  roomNumber: number;
  previousKills: number;
  updatedKills: number;
  reason: string;
  updatedBy: string;
  updatedAt: string;
}

export interface DisqualificationAudit {
  id: string;
  playerId: string;
  playerName: string;
  freeFireUID: string;
  action: 'disqualified' | 'restored';
  reason: string;
  updatedBy: string;
  updatedAt: string;
}

export type TournamentStatus = 'Registration Open' | 'Registration Closed' | 'Match Scheduled' | 'Match Live' | 'Tournament Paused' | 'Tournament Completed';

export interface TournamentMatchState {
  isLive: boolean;
  status: 'SCHEDULED' | 'STARTING_SOON' | 'LIVE' | 'PAUSED' | 'COMPLETED' | 'STANDBY';
  scheduledTime: string | null; // ISO string
  startedAt: string | null; // ISO string
  durationMinutes: number;
  matchTitle: string;
  selectedRoom: number | 'ALL';
  currentPhase: string; // "Drop Phase", "Zone 1 Shrinking", "Zone 2", "Final Circle", "Victory Royale"
}

export interface TournamentSettings {
  tournamentName: string;
  tournamentDescription: string;
  tournamentDate: string;
  tournamentStartTime: string;
  registrationStartTime: string;
  registrationEndTime: string;
  maxPlayers: number;
  numberOfRooms: number;
  roomCapacity: number;
  registrationOpen: boolean;
  tournamentStatus: TournamentStatus;
  killScoringRule: string;
  tieBreakingRule: string;
  finalResultsPublished: boolean;
  matchState: TournamentMatchState;
}

export interface DashboardStats {
  totalCapacity: number;
  totalRegistered: number;
  availableSeats: number;
  totalActive: number;
  totalEliminated: number;
  totalDisqualified: number;
  numberOfRooms: number;
  tournamentStatus: TournamentStatus;
  matchState: TournamentMatchState;
}

export interface AuthUser {
  id: string;
  role: 'admin' | 'player';
  username?: string;
  player?: Player;
  token: string;
}
