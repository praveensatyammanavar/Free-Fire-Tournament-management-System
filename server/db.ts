import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { EventEmitter } from 'events';
import {
  Player,
  Room,
  KillAudit,
  DisqualificationAudit,
  TournamentSettings,
  DashboardStats,
  PlayerStatus
} from '../src/types/tournament.ts';

export const dbEvents = new EventEmitter();

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'tournament_data.json');

export interface StoredPlayer extends Player {
  passwordHash: string;
}

export interface StoredAdmin {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin';
  createdAt: string;
}

export interface MatchLog {
  id: string;
  action: 'STARTED' | 'SCHEDULED' | 'PAUSED' | 'RESUMED' | 'ENDED';
  timestamp: string;
  details: string;
  initiatedBy: string;
}

export interface TournamentData {
  settings: TournamentSettings;
  rooms: Room[];
  players: StoredPlayer[];
  admins: StoredAdmin[];
  killAudits: KillAudit[];
  disqualificationAudits: DisqualificationAudit[];
  matchLogs: MatchLog[];
}

function getInitialRooms(count = 20, capacity = 48): Room[] {
  const rooms: Room[] = [];
  for (let i = 1; i <= count; i++) {
    rooms.push({
      id: i,
      roomNumber: i,
      roomName: `Room ${i}`,
      capacity: capacity,
      registeredCount: 0,
      availableSeats: capacity,
      registrationOpen: true,
      matchStatus: 'Waiting',
      matchStartedAt: null,
      matchDurationMinutes: 20,
      qrImageUrl: null
    });
  }
  return rooms;
}

function getInitialSettings(): TournamentSettings {
  return {
    tournamentName: "FREE FIRE BATTLEGROUNDS CHAMPIONSHIP 2026",
    tournamentDescription: "Official Free Fire Esports Battle Royale Tournament. 20 Battle Rooms, 48 Players per Room. Survive to conquer Bermuda Island.",
    tournamentDate: new Date().toISOString().split('T')[0],
    tournamentStartTime: "18:00",
    registrationStartTime: "09:00",
    registrationEndTime: "17:30",
    maxPlayers: 960,
    numberOfRooms: 20,
    roomCapacity: 48,
    registrationOpen: true,
    tournamentStatus: "Registration Open",
    killScoringRule: "1 Kill = 1 Point. Placement points awarded to top 3 survivor teams.",
    tieBreakingRule: "Highest total kills across rounds, followed by earliest survival time.",
    finalResultsPublished: false,
    matchState: {
      isLive: false,
      status: "STANDBY",
      scheduledTime: null,
      startedAt: null,
      durationMinutes: 20,
      matchTitle: "Match 1 - Bermuda Battle Royale",
      selectedRoom: "ALL",
      currentPhase: "Standby - Ready for Match Start / Schedule"
    }
  };
}

class TournamentDB {
  private data: TournamentData;

  constructor() {
    this.ensureDataDirectory();
    this.data = this.loadData();
  }

  private ensureDataDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): TournamentData {
    if (fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure at least 20 rooms exist and have qrImageUrl property
        if (!parsed.rooms || parsed.rooms.length < 20) {
          const currentRooms = parsed.rooms || [];
          const capacity = parsed.settings?.roomCapacity || 48;
          for (let i = currentRooms.length + 1; i <= 20; i++) {
            currentRooms.push({
              id: i,
              roomNumber: i,
              roomName: `Room ${i}`,
              capacity: capacity,
              registeredCount: 0,
              availableSeats: capacity,
              registrationOpen: true,
              matchStatus: 'Waiting',
              matchStartedAt: null,
              matchDurationMinutes: 20,
              qrImageUrl: null
            });
          }
          parsed.rooms = currentRooms;
          if (parsed.settings) {
            parsed.settings.numberOfRooms = parsed.rooms.length;
            parsed.settings.maxPlayers = parsed.rooms.reduce((acc: number, r: any) => acc + (r.capacity || 48), 0);
          }
        }
        // Ensure qrImageUrl key on all rooms
        for (const room of parsed.rooms) {
          if (room.qrImageUrl === undefined) {
            room.qrImageUrl = null;
          }
        }
        return parsed;
      } catch (err) {
        console.error('Error reading tournament data file, re-initializing:', err);
      }
    }

    // Default admin: username: admin / password: password123
    const defaultPasswordHash = bcrypt.hashSync('password123', 10);
    const initialData: TournamentData = {
      settings: getInitialSettings(),
      rooms: getInitialRooms(20, 48),
      players: [],
      admins: [
        {
          id: 'admin-1',
          username: 'admin',
          passwordHash: defaultPasswordHash,
          role: 'admin',
          createdAt: new Date().toISOString()
        }
      ],
      killAudits: [],
      disqualificationAudits: [],
      matchLogs: [
        {
          id: 'log-init',
          action: 'SCHEDULED',
          timestamp: new Date().toISOString(),
          details: 'Tournament initialized with 20 rooms and match scheduled',
          initiatedBy: 'System'
        }
      ]
    };

    this.saveDataDirect(initialData);
    return initialData;
  }

  private saveDataDirect(data: TournamentData) {
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DATA_FILE);
  }

  public save() {
    this.recalculateRoomCounts();
    this.saveDataDirect(this.data);
    dbEvents.emit('change', { timestamp: Date.now() });
  }

  private recalculateRoomCounts() {
    for (const room of this.data.rooms) {
      const roomPlayers = this.data.players.filter(p => p.roomId === room.roomNumber);
      room.registeredCount = roomPlayers.length;
      room.availableSeats = Math.max(0, room.capacity - room.registeredCount);
    }
  }

  public getSettings(): TournamentSettings {
    return this.data.settings;
  }

  public updateSettings(updates: Partial<TournamentSettings>): TournamentSettings {
    this.data.settings = { ...this.data.settings, ...updates };
    
    // If room count or capacity changed
    if (updates.numberOfRooms !== undefined || updates.roomCapacity !== undefined) {
      const newRoomCount = updates.numberOfRooms ?? this.data.settings.numberOfRooms;
      const newCapacity = updates.roomCapacity ?? this.data.settings.roomCapacity;
      
      while (this.data.rooms.length < newRoomCount) {
        const nextNum = this.data.rooms.length + 1;
        this.data.rooms.push({
          id: nextNum,
          roomNumber: nextNum,
          roomName: `Room ${nextNum}`,
          capacity: newCapacity,
          registeredCount: 0,
          availableSeats: newCapacity,
          registrationOpen: true,
          matchStatus: 'Waiting',
          matchStartedAt: null,
          matchDurationMinutes: 20
        });
      }
      
      for (const r of this.data.rooms) {
        r.capacity = newCapacity;
      }
      this.data.settings.maxPlayers = newRoomCount * newCapacity;
    }

    this.save();
    return this.data.settings;
  }

  public getRooms(): Room[] {
    this.recalculateRoomCounts();
    return this.data.rooms;
  }

  public getRoom(roomNumber: number): Room | undefined {
    this.recalculateRoomCounts();
    return this.data.rooms.find(r => r.roomNumber === roomNumber);
  }

  public updateRoom(roomNumber: number, updates: Partial<Room>): Room | undefined {
    const room = this.data.rooms.find(r => r.roomNumber === roomNumber);
    if (!room) return undefined;
    Object.assign(room, updates);
    this.save();
    return room;
  }

  public getPlayers(): StoredPlayer[] {
    return this.data.players;
  }

  public getPlayerById(id: string): StoredPlayer | undefined {
    return this.data.players.find(p => p.id === id);
  }

  public getPlayerByUID(uid: string): StoredPlayer | undefined {
    return this.data.players.find(p => p.freeFireUID.trim().toLowerCase() === uid.trim().toLowerCase());
  }

  public getPlayerByMobile(mobile: string): StoredPlayer | undefined {
    if (!mobile) return undefined;
    return this.data.players.find(p => p.mobileNumber && p.mobileNumber.trim() === mobile.trim());
  }

  public getAdminByUsername(username: string): StoredAdmin | undefined {
    return this.data.admins.find(a => a.username.toLowerCase() === username.toLowerCase());
  }

  public addRoom(capacity = 48): Room {
    const nextNum = this.data.rooms.length > 0
      ? Math.max(...this.data.rooms.map(r => r.roomNumber)) + 1
      : 1;
    const newRoom: Room = {
      id: nextNum,
      roomNumber: nextNum,
      roomName: `Room ${nextNum}`,
      capacity: capacity || 48,
      registeredCount: 0,
      availableSeats: capacity || 48,
      registrationOpen: true,
      matchStatus: 'Waiting',
      matchStartedAt: null,
      matchDurationMinutes: 20
    };
    this.data.rooms.push(newRoom);
    this.data.settings.numberOfRooms = this.data.rooms.length;
    this.data.settings.maxPlayers = this.data.rooms.reduce((acc, r) => acc + r.capacity, 0);
    this.save();
    return newRoom;
  }

  public deleteRoom(roomNumber: number): { success: boolean; error?: string } {
    const room = this.getRoom(roomNumber);
    if (!room) return { success: false, error: 'Room not found' };
    const roomPlayers = this.data.players.filter(p => p.roomId === roomNumber);
    if (roomPlayers.length > 0) {
      return { success: false, error: `Cannot delete Room ${roomNumber} because it has ${roomPlayers.length} registered players. Move or remove players first.` };
    }
    this.data.rooms = this.data.rooms.filter(r => r.roomNumber !== roomNumber);
    this.data.settings.numberOfRooms = this.data.rooms.length;
    this.data.settings.maxPlayers = this.data.rooms.reduce((acc, r) => acc + r.capacity, 0);
    this.save();
    return { success: true };
  }

  public registerPlayer(params: {
    playerName: string;
    freeFireName: string;
    freeFireUID: string;
    roomNumber: number;
    mobileNumber?: string;
    password?: string;
  }): { player?: Player; error?: string } {
    if (!this.data.settings.registrationOpen) {
      return { error: 'Registration is currently closed for this tournament.' };
    }

    const room = this.getRoom(params.roomNumber);
    if (!room) {
      return { error: `Room ${params.roomNumber} does not exist.` };
    }

    if (!room.registrationOpen) {
      return { error: `Registration for Room ${params.roomNumber} is currently paused.` };
    }

    // Check capacity (48 players per room)
    const currentCount = this.data.players.filter(p => p.roomId === params.roomNumber).length;
    if (currentCount >= room.capacity) {
      return { error: `Room ${params.roomNumber} has reached its maximum capacity of ${room.capacity} players.` };
    }

    // Check duplicate Free Fire UID
    if (this.getPlayerByUID(params.freeFireUID)) {
      return { error: `Free Fire UID "${params.freeFireUID}" is already registered in the tournament.` };
    }

    // Check duplicate Mobile if provided
    if (params.mobileNumber && params.mobileNumber.trim().length > 0 && this.getPlayerByMobile(params.mobileNumber)) {
      return { error: `Mobile number "${params.mobileNumber}" is already registered.` };
    }

    const regNumber = `FF-R${String(params.roomNumber).padStart(2, '0')}-${String(currentCount + 1).padStart(3, '0')}`;
    const passwordHash = params.password
      ? bcrypt.hashSync(params.password, 10)
      : bcrypt.hashSync(params.freeFireUID.trim(), 10);
    const now = new Date().toISOString();

    const newPlayer: StoredPlayer = {
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      registrationNumber: regNumber,
      playerName: params.playerName.trim(),
      freeFireName: params.freeFireName.trim(),
      freeFireUID: params.freeFireUID.trim(),
      mobileNumber: params.mobileNumber?.trim() || '',
      roomId: params.roomNumber,
      roomName: `Room ${params.roomNumber}`,
      totalKills: 0,
      status: 'Active',
      registrationDate: now,
      updatedAt: now,
      passwordHash
    };

    this.data.players.push(newPlayer);
    this.save();

    // Return sanitized player (no passwordHash)
    const { passwordHash: _, ...sanitized } = newPlayer;
    return { player: sanitized };
  }

  public updatePlayerKills(playerId: string, newKills: number, reason: string, adminUser = 'Admin'): { success: boolean; error?: string; player?: Player } {
    if (newKills < 0 || !Number.isInteger(newKills)) {
      return { success: false, error: 'Kills must be a non-negative integer.' };
    }

    const player = this.getPlayerById(playerId);
    if (!player) {
      return { success: false, error: 'Player not found.' };
    }

    const oldKills = player.totalKills;
    player.totalKills = newKills;
    player.updatedAt = new Date().toISOString();

    // Log kill audit
    const audit: KillAudit = {
      id: `ka-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      playerId: player.id,
      playerName: player.playerName,
      freeFireUID: player.freeFireUID,
      roomNumber: player.roomId,
      previousKills: oldKills,
      updatedKills: newKills,
      reason: reason || 'Manual score correction by tournament referee',
      updatedBy: adminUser,
      updatedAt: new Date().toISOString()
    };
    this.data.killAudits.unshift(audit);

    this.save();
    const { passwordHash: _, ...sanitized } = player;
    return { success: true, player: sanitized };
  }

  public updatePlayerStatus(playerId: string, newStatus: PlayerStatus, reason?: string, adminUser = 'Admin'): { success: boolean; error?: string; player?: Player } {
    const player = this.getPlayerById(playerId);
    if (!player) {
      return { success: false, error: 'Player not found.' };
    }

    const prevStatus = player.status;
    player.status = newStatus;
    player.updatedAt = new Date().toISOString();

    if (newStatus === 'Disqualified') {
      player.disqualificationReason = reason || 'Violation of tournament rules / third-party tools';
      player.disqualifiedAt = new Date().toISOString();

      const audit: DisqualificationAudit = {
        id: `da-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        playerId: player.id,
        playerName: player.playerName,
        freeFireUID: player.freeFireUID,
        action: 'disqualified',
        reason: reason || 'Disqualified by tournament official',
        updatedBy: adminUser,
        updatedAt: new Date().toISOString()
      };
      this.data.disqualificationAudits.unshift(audit);
    } else if (prevStatus === 'Disqualified') {
      player.disqualificationReason = undefined;
      player.disqualifiedAt = undefined;

      const audit: DisqualificationAudit = {
        id: `da-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        playerId: player.id,
        playerName: player.playerName,
        freeFireUID: player.freeFireUID,
        action: 'restored',
        reason: reason || 'Player restored after official review',
        updatedBy: adminUser,
        updatedAt: new Date().toISOString()
      };
      this.data.disqualificationAudits.unshift(audit);
    }

    this.save();
    const { passwordHash: _, ...sanitized } = player;
    return { success: true, player: sanitized };
  }

  public movePlayerRoom(playerId: string, newRoomNumber: number, adminUser = 'Admin'): { success: boolean; error?: string; player?: Player } {
    const player = this.getPlayerById(playerId);
    if (!player) return { success: false, error: 'Player not found' };

    const targetRoom = this.getRoom(newRoomNumber);
    if (!targetRoom) return { success: false, error: `Room ${newRoomNumber} not found` };

    const targetRoomCount = this.data.players.filter(p => p.roomId === newRoomNumber).length;
    if (targetRoomCount >= targetRoom.capacity) {
      return { success: false, error: `Room ${newRoomNumber} is full (${targetRoom.capacity}/${targetRoom.capacity})` };
    }

    player.roomId = newRoomNumber;
    player.roomName = `Room ${newRoomNumber}`;
    player.updatedAt = new Date().toISOString();

    this.save();
    const { passwordHash: _, ...sanitized } = player;
    return { success: true, player: sanitized };
  }

  public deletePlayer(playerId: string): { success: boolean; error?: string } {
    const idx = this.data.players.findIndex(p => p.id === playerId);
    if (idx === -1) return { success: false, error: 'Player not found' };
    this.data.players.splice(idx, 1);
    this.save();
    return { success: true };
  }

  public updatePlayerDetails(playerId: string, updates: { playerName?: string; freeFireName?: string; mobileNumber?: string }): { success: boolean; error?: string; player?: Player } {
    const player = this.getPlayerById(playerId);
    if (!player) return { success: false, error: 'Player not found' };

    if (updates.playerName) player.playerName = updates.playerName.trim();
    if (updates.freeFireName) player.freeFireName = updates.freeFireName.trim();
    if (updates.mobileNumber) player.mobileNumber = updates.mobileNumber.trim();
    player.updatedAt = new Date().toISOString();

    this.save();
    const { passwordHash: _, ...sanitized } = player;
    return { success: true, player: sanitized };
  }

  // MATCH CONTROL: Start Match, Set Match Time, End Match
  public startMatch(params: {
    roomNumber?: number | 'ALL';
    durationMinutes?: number;
    matchTitle?: string;
    initiatedBy?: string;
  }) {
    const duration = params.durationMinutes || 20;
    const now = new Date();
    const nowIso = now.toISOString();
    const roomTarget = params.roomNumber || 'ALL';
    const title = params.matchTitle || `Match 1 - ${roomTarget === 'ALL' ? 'All Rooms Championship' : `Room ${roomTarget} Battle Royale`}`;

    this.data.settings.matchState = {
      isLive: true,
      status: 'LIVE',
      scheduledTime: null,
      startedAt: nowIso,
      durationMinutes: duration,
      matchTitle: title,
      selectedRoom: roomTarget,
      currentPhase: 'Live Battle - Zone 1 Shrinking'
    };
    this.data.settings.tournamentStatus = 'Match Live';

    // Update rooms
    for (const room of this.data.rooms) {
      if (roomTarget === 'ALL' || room.roomNumber === roomTarget) {
        room.matchStatus = 'Live';
        room.matchStartedAt = nowIso;
        room.matchDurationMinutes = duration;
      }
    }

    this.data.matchLogs.unshift({
      id: `ml-${Date.now()}`,
      action: 'STARTED',
      timestamp: nowIso,
      details: `Live match started: ${title} (${duration} minutes)`,
      initiatedBy: params.initiatedBy || 'Admin'
    });

    this.save();
    return this.data.settings.matchState;
  }

  public scheduleMatch(params: {
    scheduledTime: string; // ISO string
    matchTitle?: string;
    roomNumber?: number | 'ALL';
    durationMinutes?: number;
    initiatedBy?: string;
  }) {
    const targetRoom = params.roomNumber || 'ALL';
    const title = params.matchTitle || `Scheduled Match - ${targetRoom === 'ALL' ? 'Grand Final' : `Room ${targetRoom}`}`;

    this.data.settings.matchState = {
      isLive: false,
      status: 'SCHEDULED',
      scheduledTime: params.scheduledTime,
      startedAt: null,
      durationMinutes: params.durationMinutes || 20,
      matchTitle: title,
      selectedRoom: targetRoom,
      currentPhase: 'Scheduled / Countdown'
    };
    this.data.settings.tournamentStatus = 'Match Scheduled';

    for (const room of this.data.rooms) {
      if (targetRoom === 'ALL' || room.roomNumber === targetRoom) {
        room.matchStatus = 'Scheduled';
      }
    }

    this.data.matchLogs.unshift({
      id: `ml-${Date.now()}`,
      action: 'SCHEDULED',
      timestamp: new Date().toISOString(),
      details: `Match scheduled for ${params.scheduledTime} (${title})`,
      initiatedBy: params.initiatedBy || 'Admin'
    });

    this.save();
    return this.data.settings.matchState;
  }

  public pauseMatch(initiatedBy = 'Admin') {
    const isPaused = this.data.settings.matchState.status === 'PAUSED';
    const newStatus = isPaused ? 'LIVE' : 'PAUSED';
    this.data.settings.matchState.status = newStatus;
    this.data.settings.matchState.isLive = !isPaused;
    this.data.settings.tournamentStatus = isPaused ? 'Match Live' : 'Tournament Paused';

    this.data.matchLogs.unshift({
      id: `ml-${Date.now()}`,
      action: isPaused ? 'RESUMED' : 'PAUSED',
      timestamp: new Date().toISOString(),
      details: isPaused ? 'Match resumed by admin' : 'Match paused by referee',
      initiatedBy
    });

    this.save();
    return this.data.settings.matchState;
  }

  public endMatch(initiatedBy = 'Admin') {
    this.data.settings.matchState = {
      ...this.data.settings.matchState,
      isLive: false,
      status: 'COMPLETED',
      currentPhase: 'Match Concluded - Final Scores Locked'
    };
    this.data.settings.tournamentStatus = 'Tournament Completed';

    for (const room of this.data.rooms) {
      room.matchStatus = 'Completed';
    }

    this.data.matchLogs.unshift({
      id: `ml-${Date.now()}`,
      action: 'ENDED',
      timestamp: new Date().toISOString(),
      details: 'Match concluded and scores recorded',
      initiatedBy
    });

    this.save();
    return this.data.settings.matchState;
  }

  public getDashboardStats(): DashboardStats {
    this.recalculateRoomCounts();
    const totalCapacity = this.data.rooms.reduce((acc, r) => acc + r.capacity, 0);
    const totalRegistered = this.data.players.length;
    const availableSeats = Math.max(0, totalCapacity - totalRegistered);
    const totalActive = this.data.players.filter(p => p.status === 'Active').length;
    const totalEliminated = this.data.players.filter(p => p.status === 'Eliminated').length;
    const totalDisqualified = this.data.players.filter(p => p.status === 'Disqualified').length;

    return {
      totalCapacity,
      totalRegistered,
      availableSeats,
      totalActive,
      totalEliminated,
      totalDisqualified,
      numberOfRooms: this.data.rooms.length,
      tournamentStatus: this.data.settings.tournamentStatus,
      matchState: this.data.settings.matchState
    };
  }

  public getLeaderboard(roomFilter?: number): {
    rank: number;
    player: Player;
    isEligible: boolean;
    isTied: boolean;
  }[] {
    let pool = [...this.data.players];
    if (roomFilter && roomFilter > 0) {
      pool = pool.filter(p => p.roomId === roomFilter);
    }

    // Sort by totalKills DESC, then alphabetically by name
    pool.sort((a, b) => {
      if (b.totalKills !== a.totalKills) {
        return b.totalKills - a.totalKills;
      }
      return a.playerName.localeCompare(b.playerName);
    });

    let currentEligibleRank = 1;
    const result: {
      rank: number;
      player: Player;
      isEligible: boolean;
      isTied: boolean;
    }[] = [];

    for (let i = 0; i < pool.length; i++) {
      const p = pool[i];
      const isEligible = p.status !== 'Disqualified';
      const prevEligible = pool.slice(0, i).filter(x => x.status !== 'Disqualified').pop();
      const isTied = isEligible && prevEligible ? prevEligible.totalKills === p.totalKills : false;

      let rank = 0;
      if (isEligible) {
        rank = currentEligibleRank++;
      }

      const { passwordHash: _, ...sanitized } = p;
      result.push({
        rank,
        player: sanitized,
        isEligible,
        isTied
      });
    }

    return result;
  }

  public getAudits() {
    return {
      killAudits: this.data.killAudits,
      disqualificationAudits: this.data.disqualificationAudits,
      matchLogs: this.data.matchLogs
    };
  }

  public seedDemoData() {
    const firstNames = ['Rahul', 'Kiran', 'Arjun', 'Vijay', 'Sanjay', 'Rohit', 'Aman', 'Vikas', 'Deepak', 'Manish', 'Aditya', 'Harsh', 'Sameer', 'Pooja', 'Neha', 'Priya', 'Kavita', 'Ravi', 'Gaurav', 'Ankit', 'Vivek', 'Rohan', 'Ashok', 'Karan', 'Sumit'];
    const ffPrefixes = ['Shadow', 'Fire', 'Thunder', 'Ghost', 'Viper', 'Phoenix', 'Ninja', 'Reaper', 'Sniper', 'Apex', 'Titan', 'Blaze', 'Venom', 'Cyber', 'Legend'];
    
    this.data.players = [];
    let regCounter = 1;

    for (let r = 1; r <= 20; r++) {
      const countForRoom = Math.floor(Math.random() * 6) + 3; // 3 to 8 players per room for realistic test
      for (let c = 1; c <= countForRoom; c++) {
        const fn = firstNames[(regCounter * 3) % firstNames.length];
        const prefix = ffPrefixes[(regCounter * 7) % ffPrefixes.length];
        const uid = `8${Math.floor(100000000 + Math.random() * 900000000)}`;
        const mobile = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
        const kills = Math.floor(Math.random() * 18);
        
        // Some eliminated, 1-2 disqualified for testing
        let status: PlayerStatus = 'Active';
        let disqReason: string | undefined = undefined;
        if (regCounter % 7 === 0) {
          status = 'Eliminated';
        } else if (regCounter === 13 || regCounter === 29) {
          status = 'Disqualified';
          disqReason = 'Detected unauthorized emulator script';
        }

        const player: StoredPlayer = {
          id: `demo-${regCounter}-${Date.now()}`,
          registrationNumber: `FF-R${String(r).padStart(2, '0')}-${String(c).padStart(3, '0')}`,
          playerName: `${fn} Kumar`,
          freeFireName: `${prefix}_${fn.toUpperCase()}`,
          freeFireUID: uid,
          mobileNumber: mobile,
          roomId: r,
          roomName: `Room ${r}`,
          totalKills: kills,
          status,
          disqualificationReason: disqReason,
          disqualifiedAt: disqReason ? new Date().toISOString() : undefined,
          registrationDate: new Date(Date.now() - 3600000 * (48 - regCounter)).toISOString(),
          updatedAt: new Date().toISOString(),
          passwordHash: bcrypt.hashSync('player123', 10)
        };

        this.data.players.push(player);
        regCounter++;
      }
    }

    this.save();
    return { count: this.data.players.length };
  }

  public setRoomQrImage(roomNumber: number, qrImageUrl: string | null): Room | undefined {
    const room = this.getRoom(roomNumber);
    if (!room) return undefined;
    room.qrImageUrl = qrImageUrl;
    this.save();
    return room;
  }

  public resetAllData() {
    this.data.players = [];
    this.data.killAudits = [];
    this.data.disqualificationAudits = [];
    this.data.rooms = getInitialRooms(20, 48);
    this.data.settings = getInitialSettings();
    this.data.matchLogs = [];
    this.save();
  }
}

export const db = new TournamentDB();
