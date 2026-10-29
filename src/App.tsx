/**
 * Free Fire Tournament Management System
 * 600 Players • 10 Rooms • QR Registration • Live Match Command Center
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { PublicHome } from './components/PublicHome.tsx';
import { RegisterPage } from './components/RegisterPage.tsx';
import { PlayerDashboard } from './components/PlayerDashboard.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { LeaderboardView } from './components/LeaderboardView.tsx';
import { QRManagement } from './components/QRManagement.tsx';
import { StartMatchModal } from './components/StartMatchModal.tsx';
import { ScheduleMatchModal } from './components/ScheduleMatchModal.tsx';
import {
  Room,
  DashboardStats,
  TournamentSettings,
  TournamentMatchState,
  Player
} from './types/tournament.ts';
import {
  api,
  getAdminToken,
  clearAdminToken,
  getPlayerToken,
  clearPlayerToken
} from './services/api.ts';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('hub');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [settings, setSettings] = useState<TournamentSettings | null>(null);
  const [leaderboardEntries, setLeaderboardEntries] = useState<any[]>([]);

  // Selected room for registration (auto-selected from QR code)
  const [registerRoomNumber, setRegisterRoomNumber] = useState<number>(1);

  // Auth states
  const [adminUser, setAdminUser] = useState<{ username: string } | null>(null);
  const [playerUser, setPlayerUser] = useState<Player | null>(null);

  // Global Match Modals (Direct user request: "add start match button and set a time for a match")
  const [isStartMatchOpen, setIsStartMatchOpen] = useState(false);
  const [isScheduleMatchOpen, setIsScheduleMatchOpen] = useState(false);

  // QR Participant Isolation Mode: When scanned from QR code, participant only sees registration and success screen
  const [isQrParticipantMode, setIsQrParticipantMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const searchParams = new URLSearchParams(window.location.search);
    return Boolean(searchParams.get('register_room') || searchParams.get('qr_scan'));
  });

  // Initial Data Fetch & URL Param Parsing
  useEffect(() => {
    // Check URL parameters for QR scan: e.g. ?register_room=3 or pathname /register/room-3
    const searchParams = new URLSearchParams(window.location.search);
    const roomParam = searchParams.get('register_room');
    if (roomParam) {
      const roomNum = parseInt(roomParam, 10);
      if (!isNaN(roomNum) && roomNum >= 1) {
        setRegisterRoomNumber(roomNum);
        setCurrentTab('register');
        setIsQrParticipantMode(true);
      }
    } else {
      const match = window.location.pathname.match(/register\/room-(\d+)/i);
      if (match && match[1]) {
        const roomNum = parseInt(match[1], 10);
        if (roomNum >= 1) {
          setRegisterRoomNumber(roomNum);
          setCurrentTab('register');
          setIsQrParticipantMode(true);
        }
      }
    }

    // Check saved tokens
    const adminTok = getAdminToken();
    if (adminTok) {
      setAdminUser({ username: 'admin' });
    }

    const playerTok = getPlayerToken();
    if (playerTok) {
      api.getPlayerMe()
        .then(res => setPlayerUser(res.player))
        .catch(() => clearPlayerToken());
    }

    loadTournamentData();

    // Fast 2.5s auto-polling to ensure real-time synchronization across all users/admins
    const interval = setInterval(loadTournamentData, 2500);

    // Real-time EventSource listener: immediately triggers refetch whenever any admin updates data
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/events');
      es.onmessage = () => {
        loadTournamentData();
      };
    } catch (e) {
      console.warn('SSE not supported, relying on auto-polling:', e);
    }

    return () => {
      clearInterval(interval);
      if (es) es.close();
    };
  }, []);

  const loadTournamentData = async () => {
    try {
      const pubInfo = await api.getPublicInfo();
      setStats(pubInfo.stats);
      setRooms(pubInfo.rooms);
      setSettings(pubInfo.settings);

      const lbRes = await api.getLeaderboard();
      setLeaderboardEntries(lbRes.leaderboard);
    } catch (err) {
      console.error('Error fetching tournament data:', err);
    }
  };

  const handleSelectRoomRegister = (roomNum: number) => {
    setRegisterRoomNumber(roomNum);
    setCurrentTab('register');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminLogout = () => {
    clearAdminToken();
    setAdminUser(null);
    setCurrentTab('hub');
  };

  const handlePlayerLogout = () => {
    clearPlayerToken();
    setPlayerUser(null);
    setCurrentTab('hub');
  };

  const handleStartMatchSubmit = async (params: { roomNumber: number | 'ALL'; durationMinutes: number; matchTitle: string }) => {
    if (!adminUser) {
      alert('Admin login required to start match.');
      setCurrentTab('admin-login');
      return;
    }
    await api.startMatch(params);
    await loadTournamentData();
  };

  const handleScheduleMatchSubmit = async (params: { scheduledTime: string; matchTitle: string; roomNumber: number | 'ALL'; durationMinutes: number }) => {
    if (!adminUser) {
      alert('Admin login required to schedule match.');
      setCurrentTab('admin-login');
      return;
    }
    await api.scheduleMatch(params);
    await loadTournamentData();
  };

  const handlePauseMatch = async () => {
    if (!adminUser) return;
    await api.pauseMatch();
    await loadTournamentData();
  };

  const handleEndMatch = async () => {
    if (!adminUser) return;
    await api.endMatch();
    await loadTournamentData();
  };

  // Isolated QR Participant Registration Screen
  if (isQrParticipantMode) {
    return (
      <div className="min-h-screen min-h-[100dvh] w-full bg-[#0b1020] text-slate-100 flex flex-col font-sans selection:bg-[#ff6b00] selection:text-white px-3 sm:px-6 py-6 justify-center items-center">
        <main className="w-full max-w-2xl">
          <RegisterPage
            initialRoomNumber={registerRoomNumber}
            rooms={rooms}
            onRegistrationSuccess={(player) => {
              setPlayerUser(player);
              loadTournamentData();
            }}
            onNavigateLogin={() => {}}
            onBackToHub={() => {}}
            isQrParticipantMode={true}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-[#0b1020] text-slate-100 flex flex-col font-sans selection:bg-[#ff6b00] selection:text-white overflow-x-hidden">
      {/* Top Esports Navigation Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        adminUser={adminUser}
        playerUser={playerUser}
        onLogoutAdmin={handleAdminLogout}
        onLogoutPlayer={handlePlayerLogout}
        matchState={settings?.matchState}
      />

      {/* Main Content Router */}
      <main className="flex-1 w-full">
        {currentTab === 'hub' && (
          <PublicHome
            stats={stats}
            rooms={rooms}
            matchState={settings?.matchState}
            leaderboardPreview={leaderboardEntries}
            onSelectRoomRegister={handleSelectRoomRegister}
            onNavigateTab={setCurrentTab}
            isAdmin={Boolean(adminUser)}
            onOpenStartModal={() => setIsStartMatchOpen(true)}
            onOpenScheduleModal={() => setIsScheduleMatchOpen(true)}
            onPauseMatch={handlePauseMatch}
            onEndMatch={handleEndMatch}
          />
        )}

        {currentTab === 'register' && (
          <RegisterPage
            initialRoomNumber={registerRoomNumber}
            rooms={rooms}
            onRegistrationSuccess={(player) => {
              setPlayerUser(player);
              loadTournamentData();
            }}
            onNavigateLogin={() => setCurrentTab('player')}
            onBackToHub={() => setCurrentTab('hub')}
            isQrParticipantMode={false}
          />
        )}

        {(currentTab === 'player' || currentTab === 'player-login') && (
          <PlayerDashboard
            playerUser={playerUser}
            onLoginSuccess={(p) => {
              setPlayerUser(p);
              loadTournamentData();
            }}
            onLogout={handlePlayerLogout}
            onNavigateRegister={() => setCurrentTab('register')}
            matchState={settings?.matchState}
          />
        )}

        {(currentTab === 'admin' || currentTab === 'admin-login') && (
          <AdminDashboard
            adminUser={adminUser}
            onAdminLoginSuccess={(u) => {
              setAdminUser(u);
              loadTournamentData();
            }}
            onAdminLogout={handleAdminLogout}
            onSelectRoomRegister={handleSelectRoomRegister}
          />
        )}

        {currentTab === 'leaderboard' && (
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6">
            <LeaderboardView
              entries={leaderboardEntries}
              selectedRoom="ALL"
              onChangeRoom={async (room) => {
                const data = await api.getLeaderboard(room === 'ALL' ? undefined : room);
                setLeaderboardEntries(data.leaderboard);
              }}
              tieBreakingRule={settings?.tieBreakingRule || 'Highest total kills across rounds, followed by survival time'}
              matchState={settings?.matchState}
            />
          </div>
        )}

        {currentTab === 'qr-codes' && (
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6">
            <QRManagement
              rooms={rooms}
              onSelectRoomRegister={handleSelectRoomRegister}
            />
          </div>
        )}
      </main>

      {/* Global Modals for Start Match & Set Match Time */}
      <StartMatchModal
        isOpen={isStartMatchOpen}
        onClose={() => setIsStartMatchOpen(false)}
        onStart={handleStartMatchSubmit}
      />

      <ScheduleMatchModal
        isOpen={isScheduleMatchOpen}
        onClose={() => setIsScheduleMatchOpen(false)}
        onSchedule={handleScheduleMatchSubmit}
      />

      {/* Footer */}
      <footer className="border-t border-[#1f293d] bg-[#070b16] py-6 px-4 text-center text-xs text-slate-500">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-slate-300">
              FREE FIRE TOURNAMENT SYSTEM
            </span>
            <span>&bull;</span>
            <span className="text-slate-400">{rooms.length} Rooms &bull; 48 Players Per Room</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => setCurrentTab('hub')} className="hover:text-white">Home</button>
            <button onClick={() => setCurrentTab('leaderboard')} className="hover:text-white">Leaderboard</button>
            <button onClick={() => setCurrentTab('qr-codes')} className="hover:text-white">Room QRs</button>
            <button onClick={() => setCurrentTab('admin')} className="text-[#ff6b00] hover:underline">Admin Panel</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
