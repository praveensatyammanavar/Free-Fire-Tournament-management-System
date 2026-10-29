import React, { useState, useEffect } from 'react';
import {
  Shield,
  LogIn,
  Users,
  Crosshair,
  QrCode,
  Trophy,
  Settings,
  FileText,
  AlertTriangle,
  Play,
  Calendar,
  Layers,
  Activity,
  UserX,
  UserCheck,
  CheckCircle,
  Clock,
  Radio
} from 'lucide-react';
import {
  DashboardStats,
  Room,
  Player,
  TournamentSettings,
  TournamentMatchState,
  KillAudit,
  DisqualificationAudit
} from '../types/tournament.ts';
import { api, getAdminToken, setAdminToken, clearAdminToken } from '../services/api.ts';
import { LiveMatchBanner } from './LiveMatchBanner.tsx';
import { ScheduleMatchModal } from './ScheduleMatchModal.tsx';
import { StartMatchModal } from './StartMatchModal.tsx';
import { UpdateKillsModal } from './UpdateKillsModal.tsx';
import { DisqualifyModal } from './DisqualifyModal.tsx';
import { MoveRoomModal } from './MoveRoomModal.tsx';
import { PlayerManagement } from './PlayerManagement.tsx';
import { QuickKillUpdater } from './QuickKillUpdater.tsx';
import { RoomManagement } from './RoomManagement.tsx';
import { QRManagement } from './QRManagement.tsx';
import { LeaderboardView } from './LeaderboardView.tsx';
import { AdminReports } from './AdminReports.tsx';
import { TournamentSettingsView } from './TournamentSettingsView.tsx';

interface AdminDashboardProps {
  adminUser: { username: string } | null;
  onAdminLoginSuccess: (user: { username: string }) => void;
  onAdminLogout: () => void;
  onSelectRoomRegister: (roomNumber: number) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminUser,
  onAdminLoginSuccess,
  onAdminLogout,
  onSelectRoomRegister
}) => {
  // Login form state
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Admin state
  const [activeTab, setActiveTab] = useState<'overview' | 'players' | 'quick-kills' | 'rooms' | 'qrs' | 'leaderboard' | 'disqualified' | 'reports' | 'settings'>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [settings, setSettings] = useState<TournamentSettings | null>(null);
  const [recentKillAudits, setRecentKillAudits] = useState<KillAudit[]>([]);
  const [recentDisqualifications, setRecentDisqualifications] = useState<DisqualificationAudit[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);

  // Modals state
  const [isStartMatchModalOpen, setIsStartMatchModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedKillPlayer, setSelectedKillPlayer] = useState<Player | null>(null);
  const [selectedDisqPlayer, setSelectedDisqPlayer] = useState<Player | null>(null);
  const [selectedMovePlayer, setSelectedMovePlayer] = useState<Player | null>(null);

  const fetchDashboardData = async () => {
    try {
      const data = await api.getAdminDashboard();
      setStats(data.stats);
      setRooms(data.rooms);
      setSettings(data.settings);
      setRecentKillAudits(data.recentKillAudits);
      setRecentDisqualifications(data.recentDisqualifications);

      const lbRes = await api.getLeaderboard();
      setLeaderboardData(lbRes.leaderboard);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (adminUser) {
      fetchDashboardData();

      // Periodic auto-refresh every 2.5 seconds to sync data across all admins
      const interval = setInterval(fetchDashboardData, 2500);

      // Real-time EventSource listener: updates immediately when any admin makes a change
      let eventSource: EventSource | null = null;
      try {
        eventSource = new EventSource('/api/events');
        eventSource.onmessage = () => {
          fetchDashboardData();
        };
      } catch (e) {
        console.warn('SSE not available, relying on auto-polling:', e);
      }

      return () => {
        clearInterval(interval);
        if (eventSource) {
          eventSource.close();
        }
      };
    }
  }, [adminUser]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      setIsLoggingIn(true);
      const res = await api.adminLogin({ username: username.trim(), password });
      setAdminToken(res.token);
      onAdminLoginSuccess({ username: res.user.username });
    } catch (err: any) {
      setLoginError(err.message || 'Invalid admin credentials');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Match control actions (Primary user feature!)
  const handleStartMatch = async (params: { roomNumber: number | 'ALL'; durationMinutes: number; matchTitle: string }) => {
    await api.startMatch(params);
    fetchDashboardData();
  };

  const handleScheduleMatch = async (params: { scheduledTime: string; matchTitle: string; roomNumber: number | 'ALL'; durationMinutes: number }) => {
    await api.scheduleMatch(params);
    fetchDashboardData();
  };

  const handlePauseMatch = async () => {
    await api.pauseMatch();
    fetchDashboardData();
  };

  const handleEndMatch = async () => {
    await api.endMatch();
    fetchDashboardData();
  };

  // Kill update action
  const handleSaveKills = async (playerId: string, newKills: number, reason: string) => {
    await api.updatePlayerKills(playerId, newKills, reason);
    fetchDashboardData();
  };

  // Disqualify action
  const handleConfirmDisqualify = async (playerId: string, reason: string) => {
    await api.updatePlayerStatus(playerId, 'Disqualified', reason);
    fetchDashboardData();
  };

  // Move room action
  const handleConfirmMoveRoom = async (playerId: string, targetRoomNumber: number) => {
    await api.movePlayerRoom(playerId, targetRoomNumber);
    fetchDashboardData();
  };

  // If not logged in as Admin, show login form
  if (!adminUser) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-[#ff6b00] flex items-center justify-center text-white mx-auto shadow-lg shadow-[#ff6b00]/30">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="font-display font-bold text-2xl text-white uppercase tracking-wide">
              Tournament Organizer Admin
            </h2>
            <p className="text-xs text-slate-400">
              Authorized personnel login to manage 600 players, rooms, kills & match clocks
            </p>
          </div>

          <div className="bg-[#0b1020] p-3 rounded-xl border border-[#24304f] text-[11px] text-slate-400 space-y-1">
            <div>Default Admin Credentials:</div>
            <div className="text-slate-200 font-mono-num">Username: <strong>admin</strong> | Password: <strong>password123</strong></div>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                Admin Username:
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-[#0b1020] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                Password:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#0b1020] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 px-4 rounded-xl bg-[#ff6b00] hover:bg-[#ff7b1a] text-white font-display font-bold text-sm uppercase tracking-wider shadow-lg shadow-[#ff6b00]/30 transition-transform hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              {isLoggingIn ? 'Verifying...' : 'ACCESS ADMIN PANEL'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-6">
      {/* Top Match Command Center Banner (Always Visible in Admin) */}
      {settings && (
        <LiveMatchBanner
          matchState={settings.matchState}
          isAdmin={true}
          onOpenStartModal={() => setIsStartMatchModalOpen(true)}
          onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
          onPauseMatch={handlePauseMatch}
          onEndMatch={handleEndMatch}
        />
      )}

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#24304f] no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-[#ff6b00] text-white shadow-md shadow-[#ff6b00]/20'
              : 'text-slate-300 hover:text-white hover:bg-[#151c2f]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Dashboard Overview
        </button>

        <button
          onClick={() => setActiveTab('players')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'players'
              ? 'bg-[#ff6b00] text-white shadow-md shadow-[#ff6b00]/20'
              : 'text-slate-300 hover:text-white hover:bg-[#151c2f]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          All Players ({stats?.totalRegistered || 0})
        </button>

        <button
          onClick={() => setActiveTab('quick-kills')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'quick-kills'
              ? 'bg-[#ff6b00] text-white shadow-md shadow-[#ff6b00]/20'
              : 'text-slate-300 hover:text-white hover:bg-[#151c2f]'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5 text-amber-400" />
          Quick Kill Updater
        </button>

        <button
          onClick={() => setActiveTab('rooms')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'rooms'
              ? 'bg-[#ff6b00] text-white shadow-md shadow-[#ff6b00]/20'
              : 'text-slate-300 hover:text-white hover:bg-[#151c2f]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Rooms ({rooms.length})
        </button>

        <button
          onClick={() => setActiveTab('qrs')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'qrs'
              ? 'bg-[#ff6b00] text-white shadow-md shadow-[#ff6b00]/20'
              : 'text-slate-300 hover:text-white hover:bg-[#151c2f]'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          QR Codes (10)
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'leaderboard'
              ? 'bg-[#ff6b00] text-white shadow-md shadow-[#ff6b00]/20'
              : 'text-slate-300 hover:text-white hover:bg-[#151c2f]'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          Leaderboard
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'reports'
              ? 'bg-[#ff6b00] text-white shadow-md shadow-[#ff6b00]/20'
              : 'text-slate-300 hover:text-white hover:bg-[#151c2f]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Reports & CSV
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'settings'
              ? 'bg-[#ff6b00] text-white shadow-md shadow-[#ff6b00]/20'
              : 'text-slate-300 hover:text-white hover:bg-[#151c2f]'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          Settings
        </button>
      </div>

      {/* Tab 1: Dashboard Overview (Section 6) */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* 8 Stats Cards Grid (Section 6 Example values calculated dynamically) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Tournament Capacity */}
            <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-4 shadow-lg">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Capacity</span>
              <p className="font-mono-num font-bold text-2xl text-white mt-1">{stats.totalCapacity}</p>
              <span className="text-[11px] text-slate-400 font-mono-num">{stats.numberOfRooms} Rooms &times; 60 Players</span>
            </div>

            {/* Total Registered Players */}
            <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-4 shadow-lg">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Registered Players</span>
              <p className="font-mono-num font-bold text-2xl text-[#ff6b00] mt-1">{stats.totalRegistered}</p>
              <span className="text-[11px] text-slate-400">
                {((stats.totalRegistered / stats.totalCapacity) * 100).toFixed(0)}% Filled
              </span>
            </div>

            {/* Available Seats */}
            <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-4 shadow-lg">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Available Seats</span>
              <p className="font-mono-num font-bold text-2xl text-emerald-400 mt-1">{stats.availableSeats}</p>
              <span className="text-[11px] text-slate-400">Slots remaining</span>
            </div>

            {/* Active Players */}
            <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-4 shadow-lg">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Active Players</span>
              <p className="font-mono-num font-bold text-2xl text-emerald-400 mt-1">{stats.totalActive}</p>
              <span className="text-[11px] text-slate-400">In contention</span>
            </div>

            {/* Eliminated Players */}
            <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-4 shadow-lg">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Eliminated Players</span>
              <p className="font-mono-num font-bold text-2xl text-yellow-400 mt-1">{stats.totalEliminated}</p>
              <span className="text-[11px] text-slate-400">Kills preserved</span>
            </div>

            {/* Disqualified Players */}
            <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-4 shadow-lg">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Disqualified Players</span>
              <p className="font-mono-num font-bold text-2xl text-red-400 mt-1">{stats.totalDisqualified}</p>
              <span className="text-[11px] text-slate-400">Excluded from prizes</span>
            </div>

            {/* Number of Rooms */}
            <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-4 shadow-lg">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Tournament Rooms</span>
              <p className="font-mono-num font-bold text-2xl text-blue-400 mt-1">{stats.numberOfRooms}</p>
              <span className="text-[11px] text-slate-400">Unique QR routes</span>
            </div>

            {/* Tournament Status */}
            <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-4 shadow-lg">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Tournament Status</span>
              <p className="font-display font-bold text-base text-amber-300 mt-1 truncate">{stats.tournamentStatus}</p>
              <span className="text-[11px] text-slate-400 font-mono-num">Auto synchronizing</span>
            </div>
          </div>

          {/* Quick Actions & Recent Activity in 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rooms Quick Capacity Bar */}
            <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#24304f] pb-3">
                <h3 className="font-display font-bold text-lg text-white uppercase tracking-wide">
                  Room Capacity Status (10 Rooms)
                </h3>
                <button
                  onClick={() => setActiveTab('rooms')}
                  className="text-xs text-[#ff6b00] hover:underline font-semibold"
                >
                  Manage Rooms &rarr;
                </button>
              </div>

              <div className="space-y-3">
                {rooms.map(r => (
                  <div key={r.roomNumber} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-white">{r.roomName}</span>
                      <span className="font-mono-num text-slate-300">
                        {r.registeredCount} / {r.capacity} players {r.registeredCount >= r.capacity ? '(FULL)' : ''}
                      </span>
                    </div>
                    <div className="w-full bg-[#0b1020] h-2 rounded-full overflow-hidden border border-[#24304f]">
                      <div
                        className={`h-full rounded-full transition-all ${
                          r.registeredCount >= r.capacity ? 'bg-red-500' : 'bg-[#ff6b00]'
                        }`}
                        style={{ width: `${Math.min(100, (r.registeredCount / r.capacity) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Referee Audit Activity */}
            <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#24304f] pb-3">
                <h3 className="font-display font-bold text-lg text-white uppercase tracking-wide">
                  Recent Score Audits
                </h3>
                <button
                  onClick={() => setActiveTab('quick-kills')}
                  className="text-xs text-[#ff6b00] hover:underline font-semibold"
                >
                  Score Terminal &rarr;
                </button>
              </div>

              <div className="space-y-2.5">
                {recentKillAudits.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4">No recent kill updates.</p>
                ) : (
                  recentKillAudits.map(ka => (
                    <div key={ka.id} className="p-3 rounded-xl bg-[#0b1020] border border-[#24304f] text-xs flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-white">{ka.playerName}</span>
                        <p className="text-[11px] text-slate-400">"{ka.reason}"</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono-num font-bold text-amber-400">{ka.previousKills} &rarr; {ka.updatedKills} Kills</span>
                        <div className="text-[10px] text-slate-500">by {ka.updatedBy}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Player Management (Section 7) */}
      {activeTab === 'players' && (
        <PlayerManagement
          rooms={rooms}
          onOpenUpdateKills={(p) => setSelectedKillPlayer(p)}
          onOpenDisqualify={(p) => setSelectedDisqPlayer(p)}
          onOpenMoveRoom={(p) => setSelectedMovePlayer(p)}
        />
      )}

      {/* Tab 3: Quick Kill Updater (Section 8) */}
      {activeTab === 'quick-kills' && (
        <QuickKillUpdater onKillUpdated={fetchDashboardData} />
      )}

      {/* Tab 4: Rooms (Section 11) */}
      {activeTab === 'rooms' && (
        <RoomManagement
          rooms={rooms}
          onRefreshRooms={fetchDashboardData}
          onStartRoomMatch={(roomNum) => {
            setIsStartMatchModalOpen(true);
          }}
          onOpenQR={(roomNum) => setActiveTab('qrs')}
        />
      )}

      {/* Tab 5: QR Codes (Section 5) */}
      {activeTab === 'qrs' && (
        <QRManagement
          rooms={rooms}
          onSelectRoomRegister={onSelectRoomRegister}
        />
      )}

      {/* Tab 6: Leaderboard (Section 10) */}
      {activeTab === 'leaderboard' && (
        <LeaderboardView
          entries={leaderboardData}
          selectedRoom="ALL"
          onChangeRoom={async (room) => {
            const data = await api.getLeaderboard(room === 'ALL' ? undefined : room);
            setLeaderboardData(data.leaderboard);
          }}
          tieBreakingRule={settings?.tieBreakingRule || ''}
          matchState={settings?.matchState}
        />
      )}

      {/* Tab 7: Reports (Section 13) */}
      {activeTab === 'reports' && (
        <AdminReports rooms={rooms} />
      )}

      {/* Tab 8: Settings (Section 12) */}
      {activeTab === 'settings' && settings && (
        <TournamentSettingsView
          settings={settings}
          onRefreshSettings={fetchDashboardData}
        />
      )}

      {/* Modals */}
      <StartMatchModal
        isOpen={isStartMatchModalOpen}
        onClose={() => setIsStartMatchModalOpen(false)}
        onStart={handleStartMatch}
      />

      <ScheduleMatchModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSchedule={handleScheduleMatch}
      />

      <UpdateKillsModal
        isOpen={selectedKillPlayer !== null}
        player={selectedKillPlayer}
        onClose={() => setSelectedKillPlayer(null)}
        onSaveKills={handleSaveKills}
      />

      <DisqualifyModal
        isOpen={selectedDisqPlayer !== null}
        player={selectedDisqPlayer}
        onClose={() => setSelectedDisqPlayer(null)}
        onConfirmDisqualify={handleConfirmDisqualify}
      />

      <MoveRoomModal
        isOpen={selectedMovePlayer !== null}
        player={selectedMovePlayer}
        rooms={rooms}
        onClose={() => setSelectedMovePlayer(null)}
        onConfirmMove={handleConfirmMoveRoom}
      />
    </div>
  );
};
