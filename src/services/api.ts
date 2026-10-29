import {
  Player,
  Room,
  TournamentSettings,
  DashboardStats,
  TournamentMatchState,
  KillAudit,
  DisqualificationAudit
} from '../types/tournament.ts';

const API_BASE = '/api';

export function getAdminToken(): string | null {
  return localStorage.getItem('ff_admin_token');
}

export function setAdminToken(token: string) {
  localStorage.setItem('ff_admin_token', token);
}

export function clearAdminToken() {
  localStorage.removeItem('ff_admin_token');
}

export function getPlayerToken(): string | null {
  return localStorage.getItem('ff_player_token');
}

export function setPlayerToken(token: string) {
  localStorage.setItem('ff_player_token', token);
}

export function clearPlayerToken() {
  localStorage.removeItem('ff_player_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  // Attach tokens if available
  const adminToken = getAdminToken();
  const playerToken = getPlayerToken();

  if (endpoint.startsWith('/admin') && adminToken) {
    headers['Authorization'] = `Bearer ${adminToken}`;
  } else if (endpoint.startsWith('/players/me') && playerToken) {
    headers['Authorization'] = `Bearer ${playerToken}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data as T;
}

export const api = {
  // Public
  getPublicInfo: () => request<{
    settings: TournamentSettings;
    rooms: Room[];
    stats: DashboardStats;
    matchState: TournamentMatchState;
  }>('/tournament/public-info'),

  getRoomDetails: (roomNumber: number) => request<{
    room: Room;
    players: Player[];
    totalRegistered: number;
    availableSeats: number;
  }>(`/tournament/rooms/${roomNumber}`),

  getLeaderboard: (room?: number) => request<{
    leaderboard: { rank: number; player: Player; isEligible: boolean; isTied: boolean }[];
    tournamentStatus: string;
    matchState: TournamentMatchState;
    tieBreakingRule: string;
  }>(`/tournament/leaderboard${room ? `?room=${room}` : ''}`),

  getMatchStatus: () => request<TournamentMatchState & { elapsedSeconds: number; remainingSeconds: number }>('/tournament/match-status'),

  // Auth
  registerPlayer: (formData: any) => request<{ message: string; player: Player; token: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(formData)
  }),

  playerLogin: (credentials: { loginId: string; password: string }) => request<{
    message: string;
    token: string;
    player: Player & { rank?: number };
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),

  adminLogin: (credentials: { username: string; password: string }) => request<{
    message: string;
    token: string;
    user: { id: string; username: string; role: string };
  }>('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),

  getPlayerMe: () => request<{
    player: Player & { rank?: number };
    room: Room;
    matchState: TournamentMatchState;
    tournamentStatus: string;
  }>('/players/me'),

  // Admin
  getAdminDashboard: () => request<{
    stats: DashboardStats;
    rooms: Room[];
    settings: TournamentSettings;
    recentKillAudits: KillAudit[];
    recentDisqualifications: DisqualificationAudit[];
    recentMatchLogs: any[];
  }>('/admin/dashboard'),

  getAdminPlayers: (params: { page?: number; limit?: number; search?: string; room?: number; status?: string }) => {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.search) q.set('search', params.search);
    if (params.room) q.set('room', String(params.room));
    if (params.status) q.set('status', params.status);
    return request<{
      players: Player[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/admin/players?${q.toString()}`);
  },

  getPlayerDetails: (id: string) => request<{
    player: Player;
    killHistory: KillAudit[];
    statusHistory: DisqualificationAudit[];
  }>(`/admin/players/${id}`),

  updatePlayerKills: (id: string, newKills: number, reason: string) => request<{
    message: string;
    player: Player;
  }>(`/admin/players/${id}/kills`, {
    method: 'PATCH',
    body: JSON.stringify({ newKills, reason })
  }),

  updatePlayerStatus: (id: string, status: string, reason?: string) => request<{
    message: string;
    player: Player;
  }>(`/admin/players/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, reason })
  }),

  movePlayerRoom: (id: string, targetRoomNumber: number) => request<{
    message: string;
    player: Player;
  }>(`/admin/players/${id}/room`, {
    method: 'PATCH',
    body: JSON.stringify({ targetRoomNumber })
  }),

  updatePlayerDetails: (id: string, updates: { playerName?: string; freeFireName?: string; mobileNumber?: string }) => request<{
    message: string;
    player: Player;
  }>(`/admin/players/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  }),

  deletePlayer: (id: string) => request<{ message: string }>(`/admin/players/${id}`, {
    method: 'DELETE'
  }),

  updateRoom: (roomNumber: number, updates: { registrationOpen?: boolean; capacity?: number }) => request<{
    message: string;
    room: Room;
  }>(`/admin/rooms/${roomNumber}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  }),

  createRoom: (capacity?: number) => request<{
    message: string;
    room: Room;
  }>('/admin/rooms', {
    method: 'POST',
    body: JSON.stringify({ capacity })
  }),

  deleteRoom: (roomNumber: number) => request<{ message: string }>(`/admin/rooms/${roomNumber}`, {
    method: 'DELETE'
  }),

  // MATCH CONTROLS (User priority!)
  startMatch: (params: { roomNumber?: number | 'ALL'; durationMinutes?: number; matchTitle?: string }) => request<{
    message: string;
    matchState: TournamentMatchState;
  }>('/admin/tournament/match/start', {
    method: 'POST',
    body: JSON.stringify(params)
  }),

  scheduleMatch: (params: { scheduledTime: string; matchTitle?: string; roomNumber?: number | 'ALL'; durationMinutes?: number }) => request<{
    message: string;
    matchState: TournamentMatchState;
  }>('/admin/tournament/match/schedule', {
    method: 'POST',
    body: JSON.stringify(params)
  }),

  pauseMatch: () => request<{
    message: string;
    matchState: TournamentMatchState;
  }>('/admin/tournament/match/pause', {
    method: 'POST'
  }),

  endMatch: () => request<{
    message: string;
    matchState: TournamentMatchState;
  }>('/admin/tournament/match/end', {
    method: 'POST'
  }),

  updateSettings: (settings: Partial<TournamentSettings>) => request<{
    message: string;
    settings: TournamentSettings;
  }>('/admin/tournament/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings)
  }),

  getAuditLogs: () => request<{
    killAudits: KillAudit[];
    disqualificationAudits: DisqualificationAudit[];
    matchLogs: any[];
  }>('/admin/audit-logs'),

  getReports: () => request<{
    players: Player[];
    leaderboard: any[];
    rooms: Room[];
    settings: TournamentSettings;
  }>('/admin/reports'),

  seedDemoData: () => request<{ message: string; stats: DashboardStats }>('/admin/seed-demo', {
    method: 'POST'
  }),

  resetData: () => request<{ message: string; stats: DashboardStats }>('/admin/reset', {
    method: 'POST'
  })
};
