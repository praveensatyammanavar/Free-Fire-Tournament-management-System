import React, { useState, useEffect } from 'react';
import { User, LogIn, Flame, Trophy, Crosshair, Shield, LogOut, Radio, Clock, AlertTriangle } from 'lucide-react';
import { api, getPlayerToken, setPlayerToken, clearPlayerToken } from '../services/api.ts';
import { Player, Room, TournamentMatchState } from '../types/tournament.ts';
import { PlayerPassCard } from './PlayerPassCard.tsx';

interface PlayerDashboardProps {
  playerUser: Player | null;
  onLoginSuccess: (player: Player) => void;
  onLogout: () => void;
  onNavigateRegister: () => void;
  matchState?: TournamentMatchState;
}

export const PlayerDashboard: React.FC<PlayerDashboardProps> = ({
  playerUser,
  onLoginSuccess,
  onLogout,
  onNavigateRegister,
  matchState
}) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [playerDetails, setPlayerDetails] = useState<Player | null>(playerUser);
  const [playerRoom, setPlayerRoom] = useState<Room | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useEffect(() => {
    if (playerUser) {
      setPlayerDetails(playerUser);
    } else {
      const token = getPlayerToken();
      if (token) {
        setIsLoadingProfile(true);
        api.getPlayerMe()
          .then(res => {
            setPlayerDetails(res.player);
            setPlayerRoom(res.room);
            onLoginSuccess(res.player);
          })
          .catch(() => {
            clearPlayerToken();
          })
          .finally(() => {
            setIsLoadingProfile(false);
          });
      }
    }
  }, [playerUser]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    try {
      setIsLoggingIn(true);
      const res = await api.playerLogin({ loginId: loginId.trim(), password });
      setPlayerToken(res.token);
      setPlayerDetails(res.player);
      onLoginSuccess(res.player);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // If not logged in, show Player Login form
  if (!playerDetails) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff6b00] to-red-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-[#ff6b00]/20">
              <User className="w-6 h-6" />
            </div>
            <h2 className="font-display font-bold text-2xl text-white uppercase tracking-wide">
              Player Combat Pass Lookup
            </h2>
            <p className="text-xs text-slate-400">
              Enter your Free Fire UID to view your room assignment pass, verified QR, kills & live rank
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                Free Fire UID / Player ID:
              </label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="e.g. 8492049182"
                required
                className="w-full bg-[#0b1020] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl px-4 py-2.5 text-sm font-mono-num font-semibold text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 px-4 rounded-xl bg-[#ff6b00] hover:bg-[#ff7b1a] text-white font-display font-bold text-sm uppercase tracking-wider shadow-lg shadow-[#ff6b00]/30 transition-transform hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              {isLoggingIn ? 'Retrieving Combat Pass...' : 'ACCESS MY COMBAT PASS'}
            </button>
          </form>

          <div className="pt-4 border-t border-[#24304f] text-center text-xs text-slate-400">
            Not registered yet?{' '}
            <button
              onClick={onNavigateRegister}
              className="text-[#ff6b00] hover:underline font-semibold"
            >
              Scan a Room QR code or Register Here
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Logged-in Player Dashboard
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#151c2f] border border-[#2b354f] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff6b00] to-red-600 flex items-center justify-center text-white shadow-lg shadow-[#ff6b00]/30">
            <Flame className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-2xl text-white">
                {playerDetails.playerName}
              </h2>
              <span className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                playerDetails.status === 'Active'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : playerDetails.status === 'Eliminated'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-red-500/20 text-red-400 border-red-500/40'
              }`}>
                {playerDetails.status}
              </span>
            </div>
            <p className="text-sm text-[#ff6b00] font-semibold">
              IGN: {playerDetails.freeFireName} • UID: <span className="font-mono-num text-slate-300">{playerDetails.freeFireUID}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="self-start sm:self-center px-4 py-2 text-xs font-semibold rounded-xl bg-[#24304f] hover:bg-red-950/60 hover:text-red-300 text-slate-300 transition-colors flex items-center gap-1.5 border border-[#3b4b73]"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {/* Disqualification Banner if applicable */}
      {playerDetails.status === 'Disqualified' && (
        <div className="p-4 rounded-xl bg-red-950/70 border-2 border-red-500/60 text-red-200 text-xs sm:text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold text-red-300 block mb-0.5">DISQUALIFICATION NOTICE</strong>
            <span>{playerDetails.disqualificationReason || 'Player has been disqualified by tournament referee.'}</span>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Kills */}
        <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/15 flex items-center justify-center text-[#ff6b00]">
            <Crosshair className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase text-slate-400 font-semibold">Total Kills</p>
            <p className="font-mono-num font-bold text-2xl text-white">
              {playerDetails.totalKills}
            </p>
          </div>
        </div>

        {/* Current Rank */}
        <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase text-slate-400 font-semibold">Current Rank</p>
            <p className="font-mono-num font-bold text-2xl text-amber-400">
              {playerDetails.status === 'Disqualified' ? 'N/A' : `#${playerDetails.rank || 1}`}
            </p>
          </div>
        </div>

        {/* Assigned Room */}
        <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase text-slate-400 font-semibold">Assigned Room</p>
            <p className="font-bold text-xl text-white">
              {playerDetails.roomName}
            </p>
          </div>
        </div>

        {/* Reg ID */}
        <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase text-slate-400 font-semibold">Registration ID</p>
            <p className="font-mono-num font-bold text-sm text-emerald-300 truncate">
              {playerDetails.registrationNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Combat Pass & Room Info in 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Player Official Combat Pass */}
        <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="font-display font-bold text-lg text-white uppercase tracking-wide">
            Your Combat Pass
          </h3>
          <p className="text-xs text-slate-400">
            Present this pass or registration QR code to your room referee during lobby check-in.
          </p>
          <PlayerPassCard player={playerDetails} room={playerRoom || undefined} />
        </div>

        {/* Right: Match Status & Tournament Rules */}
        <div className="space-y-6">
          {/* Match Status Card */}
          <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-white uppercase tracking-wide flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Live Match Feed
              </h3>
              {matchState?.isLive ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-red-600/20 text-red-400 border border-red-500/40 flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-spin" /> LIVE
                </span>
              ) : (
                <span className="text-xs text-amber-300 font-mono-num">
                  Scheduled
                </span>
              )}
            </div>

            <div className="bg-[#0b1020] p-4 rounded-xl border border-[#24304f] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Match Name:</span>
                <span className="font-semibold text-white">{matchState?.matchTitle || 'Bermuda Island Battle'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Duration:</span>
                <span className="font-mono-num text-white">{matchState?.durationMinutes || 20} Minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Arena:</span>
                <span className="text-amber-400 font-semibold">{matchState?.selectedRoom === 'ALL' ? 'All 10 Rooms' : `Room ${matchState?.selectedRoom}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Phase:</span>
                <span className="text-emerald-400 font-semibold">{matchState?.currentPhase || 'Standby'}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              * Official kills are logged and updated by room referees in real-time. Contact your room referee if you have questions regarding placement.
            </p>
          </div>

          {/* Tournament Rules Card */}
          <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-6 shadow-xl space-y-3">
            <h4 className="font-display font-bold text-base text-white uppercase tracking-wide">
              Official Tournament Rules
            </h4>
            <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
              <li>1 Kill = 1 Point scored towards the official leaderboard.</li>
              <li>Emulators, third-party APKs, and modified textures are strictly prohibited and result in immediate disqualification.</li>
              <li>Teaming up with opponent squads is an automatic tournament disqualification.</li>
              <li>Join your assigned room 10 minutes prior to scheduled start time.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
