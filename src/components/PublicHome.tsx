import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Flame,
  Users,
  Trophy,
  QrCode,
  Shield,
  ArrowRight,
  Radio,
  Clock,
  Sparkles,
  Award,
  Maximize2,
  X
} from 'lucide-react';
import { Room, DashboardStats, TournamentMatchState } from '../types/tournament.ts';
import { LiveMatchBanner } from './LiveMatchBanner.tsx';
import { fetchNetworkInfo, getRoomRegistrationUrl, getQrBaseUrl, NetworkInfo } from '../utils/qrUrl.ts';

interface PublicHomeProps {
  stats: DashboardStats | null;
  rooms: Room[];
  matchState?: TournamentMatchState;
  leaderboardPreview: any[];
  onSelectRoomRegister: (roomNumber: number) => void;
  onNavigateTab: (tab: string) => void;
  isAdmin: boolean;
  onOpenStartModal: () => void;
  onOpenScheduleModal: () => void;
  onPauseMatch: () => void;
  onEndMatch: () => void;
}

export const PublicHome: React.FC<PublicHomeProps> = ({
  stats,
  rooms,
  matchState,
  leaderboardPreview,
  onSelectRoomRegister,
  onNavigateTab,
  isAdmin,
  onOpenStartModal,
  onOpenScheduleModal,
  onPauseMatch,
  onEndMatch
}) => {
  const [roomQrs, setRoomQrs] = useState<Record<number, string>>({});
  const [zoomQrRoom, setZoomQrRoom] = useState<Room | null>(null);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);

  // Generate QR codes for all rooms using LAN Wi-Fi URL so phone cameras reach the page
  useEffect(() => {
    fetchNetworkInfo().then(net => {
      setNetworkInfo(net);
      rooms.forEach(r => {
        const roomUrl = getRoomRegistrationUrl(r.roomNumber, net);
        QRCode.toDataURL(roomUrl, {
          width: 240,
          margin: 1,
          color: {
            dark: '#0B1020',
            light: '#FFFFFF'
          }
        }).then(dataUrl => {
          setRoomQrs(prev => ({ ...prev, [r.roomNumber]: dataUrl }));
        }).catch(console.error);
      });
    });
  }, [rooms]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 space-y-6 sm:space-y-8">
      {/* Live Match Countdown / In-Progress Hero Banner (Prominent User Feature!) */}
      {matchState && (
        <LiveMatchBanner
          matchState={matchState}
          isAdmin={isAdmin}
          onOpenStartModal={onOpenStartModal}
          onOpenScheduleModal={onOpenScheduleModal}
          onPauseMatch={onPauseMatch}
          onEndMatch={onEndMatch}
        />
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#111827] via-[#151c2f] to-[#1e142a] border border-[#2b354f] p-8 sm:p-12 shadow-2xl">
        <div className="w-full max-w-5xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#ff6b00]/15 text-[#ff6b00] border border-[#ff6b00]/30 font-display">
            <Flame className="w-3.5 h-3.5" />
            48 PLAYERS PER ROOM &bull; {rooms.length} BATTLE ROOMS &bull; BERMUDA BATTLE ROYALE
          </div>

          <h1 className="font-display font-bold text-3xl sm:text-5xl text-white uppercase tracking-tight leading-tight">
            Free Fire Battlegrounds <span className="text-[#ff6b00]">Championship</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            The grand battle has begun. Register through your designated Room QR code (strictly 48 players per room lobby), compete for verified kills, and claim the championship Booyah.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('qr-codes')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff6b00] to-red-600 hover:from-[#ff7b1a] hover:to-red-500 text-white font-display font-bold text-sm uppercase tracking-wider shadow-lg shadow-[#ff6b00]/30 transition-transform hover:scale-105 flex items-center gap-2 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              Scan Room QR to Register
            </button>

            <button
              onClick={() => onNavigateTab('leaderboard')}
              className="px-6 py-3 rounded-xl bg-[#151c2f] hover:bg-[#24304f] text-slate-200 font-display font-semibold text-sm uppercase tracking-wider border border-[#2b354f] flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              Live Leaderboard
            </button>
          </div>
        </div>
      </div>

      {/* Tournament Stats Quick Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-5 shadow-lg">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Capacity</span>
            <p className="font-mono-num font-bold text-3xl text-white mt-1">{stats.totalCapacity}</p>
            <p className="text-xs text-slate-400">{rooms.length} Rooms &times; 48 Players</p>
          </div>

          <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-5 shadow-lg">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Registered Warriors</span>
            <p className="font-mono-num font-bold text-3xl text-[#ff6b00] mt-1">{stats.totalRegistered}</p>
            <p className="text-xs text-slate-400">{stats.availableSeats} Remaining Seats</p>
          </div>

          <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-5 shadow-lg">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Active Survivors</span>
            <p className="font-mono-num font-bold text-3xl text-emerald-400 mt-1">{stats.totalActive}</p>
            <p className="text-xs text-slate-400">In Live Contention</p>
          </div>

          <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-5 shadow-lg">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Tournament Rooms</span>
            <p className="font-mono-num font-bold text-3xl text-blue-400 mt-1">{rooms.length}</p>
            <p className="text-xs text-slate-400">48 Slots Per Room</p>
          </div>
        </div>
      )}

      {/* Battle Rooms Seating Section with QR Codes & Register Here (Exact match to User Request & Image 2) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-2xl text-white uppercase tracking-wide flex items-center gap-2">
              <Users className="w-6 h-6 text-[#ff6b00]" />
              Tournament Battle Rooms ({rooms.length} Rooms &bull; 48 Players Each)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Scan room QR code or click Register Here to enter your assigned battle lobby (Strict 48-player capacity)
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('qr-codes')}
            className="text-xs text-[#ff6b00] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            Full QR Management <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 w-full">
          {rooms.map(room => {
            const isFull = room.registeredCount >= room.capacity;
            const qrUrl = roomQrs[room.roomNumber];

            return (
              <div
                key={room.roomNumber}
                className="bg-[#151c2f] border border-[#24304f] rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-3 hover:border-[#ff6b00]/60 transition-all hover:scale-[1.01]"
              >
                <div>
                  {/* Top: Room Title & Capacity Status */}
                  <div className="flex items-center justify-between border-b border-[#24304f] pb-2 mb-2">
                    <span className="font-display font-bold text-lg text-white">
                      {room.roomName}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      isFull
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}>
                      {isFull ? 'FULL' : `${room.availableSeats} LEFT`}
                    </span>
                  </div>

                  {/* Players Count & Progress Bar (0 / 48) */}
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Players</span>
                      <span className="font-mono-num font-semibold text-white">
                        {room.registeredCount} / {room.capacity}
                      </span>
                    </div>
                    <div className="w-full bg-[#0b1020] h-2 rounded-full overflow-hidden border border-[#24304f]">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isFull ? 'bg-red-500' : 'bg-[#ff6b00]'
                        }`}
                        style={{ width: `${Math.min(100, (room.registeredCount / room.capacity) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* QR Code on Register Card (User Priority Request) */}
                  <div 
                    onClick={() => setZoomQrRoom(room)}
                    className="relative group/qr bg-white p-2 rounded-xl shadow-inner border border-slate-300 flex flex-col items-center cursor-pointer transition-transform hover:scale-105"
                    title="Click to expand QR code for smartphone camera"
                  >
                    {qrUrl ? (
                      <img
                        src={qrUrl}
                        alt={`QR Code for ${room.roomName}`}
                        className="w-32 h-32 object-contain"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-slate-200 animate-pulse rounded" />
                    )}
                    <span className="text-[9px] font-mono-num font-bold text-slate-800 mt-1 flex items-center gap-1">
                      <QrCode className="w-3 h-3 text-[#ff6b00]" /> SCAN TO REGISTER
                    </span>

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/qr:opacity-100 rounded-xl flex items-center justify-center transition-opacity text-white text-xs font-semibold">
                      <Maximize2 className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* REGISTER HERE BUTTON (Exact Match to User Image 2) */}
                <button
                  onClick={() => onSelectRoomRegister(room.roomNumber)}
                  disabled={isFull}
                  className={`w-full py-3 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                    isFull
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#ff6b00] to-red-600 hover:from-[#ff7b1a] hover:to-red-500 text-white shadow-[#ff6b00]/30 hover:scale-[1.02]'
                  }`}
                >
                  <QrCode className="w-4 h-4 fill-white" />
                  {isFull ? 'ROOM FULL (48/48)' : 'REGISTER HERE'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top 5 Leaderboard Preview Card / Empty State */}
      {leaderboardPreview.length > 0 ? (
        <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#24304f] pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              <h3 className="font-display font-bold text-xl text-white uppercase tracking-wide">
                Top Fraggers & Leaders
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('leaderboard')}
              className="text-xs text-[#ff6b00] hover:underline font-semibold cursor-pointer"
            >
              Full Leaderboard &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {leaderboardPreview.slice(0, 5).map((entry, index) => (
              <div
                key={entry.player.id}
                className="bg-[#0b1020] p-4 rounded-xl border border-[#24304f] space-y-1.5 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-amber-400 text-black' :
                    index === 1 ? 'bg-slate-300 text-black' :
                    index === 2 ? 'bg-amber-700 text-white' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    #{index + 1}
                  </span>
                  <span className="font-mono-num font-bold text-amber-400 text-sm">
                    {entry.player.totalKills} Kills
                  </span>
                </div>

                <div className="pt-1">
                  <h4 className="font-semibold text-white text-xs truncate">
                    {entry.player.playerName}
                  </h4>
                  <p className="text-[11px] text-[#ff6b00] font-bold truncate">
                    {entry.player.freeFireName}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono-num mt-0.5">
                    {entry.player.roomName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-8 shadow-xl text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#0b1020] border border-[#24304f] flex items-center justify-center text-amber-400 mx-auto shadow-inner">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-white uppercase tracking-wide">
            Leaderboard Standby &bull; 0 Registered Players
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Tournament is currently blank. Players can scan any room QR code above or click REGISTER HERE to enter their Free Fire In-Game Name & UID (48 players per room).
          </p>
        </div>
      )}

      {/* QR Code Zoom Modal */}
      {zoomQrRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#151c2f] border-2 border-[#ff6b00] rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center space-y-4">
            <div className="flex items-center justify-between border-b border-[#24304f] pb-3">
              <h3 className="font-display font-bold text-lg text-white uppercase">
                {zoomQrRoom.roomName} QR Code
              </h3>
              <button
                onClick={() => setZoomQrRoom(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white p-3 rounded-2xl shadow-xl inline-block border-2 border-slate-300">
              {roomQrs[zoomQrRoom.roomNumber] && (
                <img
                  src={roomQrs[zoomQrRoom.roomNumber]}
                  alt={`QR for ${zoomQrRoom.roomName}`}
                  className="w-56 h-56 object-contain"
                />
              )}
              <p className="text-xs font-mono-num font-bold text-slate-800 mt-2">
                SCAN TO REGISTER &bull; {zoomQrRoom.registeredCount}/{zoomQrRoom.capacity} SLOTS
              </p>
            </div>

            <p className="text-xs text-slate-300">
              Point your smartphone camera to open registration for <strong>{zoomQrRoom.roomName}</strong> directly.
            </p>

            {/* Direct URL pill */}
            <div className="bg-[#0b1020] p-2 rounded-xl border border-[#24304f] text-[11px] font-mono-num text-slate-300 flex items-center justify-between gap-2 text-left">
              <span className="truncate text-[#ff6b00]">
                {getRoomRegistrationUrl(zoomQrRoom.roomNumber, networkInfo)}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(getRoomRegistrationUrl(zoomQrRoom.roomNumber, networkInfo));
                  alert('Registration URL copied to clipboard!');
                }}
                className="px-2 py-0.5 rounded bg-[#151c2f] hover:bg-[#24304f] text-[10px] text-white font-sans flex-shrink-0 border border-[#2b354f]"
              >
                Copy
              </button>
            </div>

            <p className="text-[10px] text-amber-300/90 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 text-center">
              📶 Phone must be on the same Wi-Fi network as the tournament host computer.
            </p>

            <button
              onClick={() => {
                const roomNum = zoomQrRoom.roomNumber;
                setZoomQrRoom(null);
                onSelectRoomRegister(roomNum);
              }}
              className="w-full py-2.5 rounded-xl bg-[#ff6b00] hover:bg-[#ff7b1a] text-white font-display font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#ff6b00]/30 cursor-pointer"
            >
              Open Registration Form
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
