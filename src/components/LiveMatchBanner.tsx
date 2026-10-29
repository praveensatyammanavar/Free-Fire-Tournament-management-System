import React, { useState, useEffect } from 'react';
import { Play, Calendar, Pause, Square, Clock, Radio, Zap, AlertTriangle } from 'lucide-react';
import { TournamentMatchState } from '../types/tournament.ts';

interface LiveMatchBannerProps {
  matchState: TournamentMatchState;
  isAdmin: boolean;
  onOpenStartModal: () => void;
  onOpenScheduleModal: () => void;
  onPauseMatch: () => void;
  onEndMatch: () => void;
}

export const LiveMatchBanner: React.FC<LiveMatchBannerProps> = ({
  matchState,
  isAdmin,
  onOpenStartModal,
  onOpenScheduleModal,
  onPauseMatch,
  onEndMatch
}) => {
  const [timeDisplay, setTimeDisplay] = useState<string>('--:--');
  const [timerLabel, setTimerLabel] = useState<string>('MATCH TIMER');
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      if (matchState.isLive && matchState.startedAt) {
        setTimerLabel('BATTLE TIME REMAINING');
        const startMs = new Date(matchState.startedAt).getTime();
        const nowMs = Date.now();
        const elapsedSec = Math.max(0, Math.floor((nowMs - startMs) / 1000));
        const totalSec = (matchState.durationMinutes || 20) * 60;
        const remainingSec = Math.max(0, totalSec - elapsedSec);

        const mins = Math.floor(remainingSec / 60);
        const secs = remainingSec % 60;
        setTimeDisplay(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      } else if (matchState.scheduledTime) {
        setTimerLabel('COUNTDOWN TO MATCH START');
        const targetMs = new Date(matchState.scheduledTime).getTime();
        const nowMs = Date.now();
        const diffSec = Math.floor((targetMs - nowMs) / 1000);

        if (diffSec <= 0) {
          setTimeDisplay('STARTING NOW');
        } else {
          const hours = Math.floor(diffSec / 3600);
          const mins = Math.floor((diffSec % 3600) / 60);
          const secs = diffSec % 60;
          if (hours > 0) {
            setTimeDisplay(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
          } else {
            setTimeDisplay(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
          }
        }
      } else {
        setTimerLabel('MATCH STATUS');
        setTimeDisplay('STANDBY');
      }
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [matchState]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#111827] via-[#151c2f] to-[#1a1429] border border-[#2b354f] shadow-2xl p-5 sm:p-6 mb-8">
      {/* Background glow effects */}
      <div className={`absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none ${
        matchState.isLive ? 'bg-red-500' : 'bg-[#ff6b00]'
      }`} />
      
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Match Info & Status */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            {matchState.isLive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-red-600/20 text-red-400 border border-red-500/40 animate-pulse">
                <Radio className="w-3.5 h-3.5 text-red-500 animate-spin" style={{ animationDuration: '3s' }} />
                MATCH IS LIVE
              </span>
            ) : matchState.status === 'SCHEDULED' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                MATCH SCHEDULED
              </span>
            ) : matchState.status === 'PAUSED' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                <Pause className="w-3.5 h-3.5 text-yellow-400" />
                MATCH PAUSED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-slate-700/50 text-slate-300 border border-slate-600">
                <Zap className="w-3.5 h-3.5 text-[#ff6b00]" />
                TOURNAMENT ARENA
              </span>
            )}

            <span className="text-xs font-mono-num text-slate-400 px-2.5 py-1 rounded-md bg-[#0b1020]/70 border border-[#24304f]">
              Target: {matchState.selectedRoom === 'ALL' ? 'All 10 Rooms (Grand Championship)' : `Room ${matchState.selectedRoom}`}
            </span>
          </div>

          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-wide text-white uppercase flex items-center gap-2">
            {matchState.matchTitle || 'Free Fire Bermuda Battle Royale'}
          </h2>

          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300">
            {matchState.scheduledTime && (
              <span className="flex items-center gap-1 text-amber-300 font-mono-num">
                <Calendar className="w-4 h-4 text-amber-400" />
                Scheduled for: {new Date(matchState.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                {' ('}{new Date(matchState.scheduledTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}{')'}
              </span>
            )}
            <span className="text-slate-400">•</span>
            <span className="text-slate-300">
              Duration: <strong className="text-white font-mono-num">{matchState.durationMinutes || 20} Mins</strong>
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-orange-400 font-medium">
              Phase: {matchState.currentPhase || 'Standard Battle'}
            </span>
          </div>
        </div>

        {/* Center: Digital Timer Display */}
        <div className="flex items-center gap-4 bg-[#0b1020]/80 p-4 rounded-xl border border-[#24304f] backdrop-blur self-start lg:self-auto min-w-[220px]">
          <div className="w-12 h-12 rounded-lg bg-[#151c2f] flex items-center justify-center border border-[#2e3b5e]">
            {matchState.isLive ? (
              <Radio className="w-6 h-6 text-red-500 animate-pulse" />
            ) : (
              <Clock className="w-6 h-6 text-[#ff6b00]" />
            )}
          </div>
          <div>
            <p className="text-[10px] tracking-wider font-semibold uppercase text-slate-400">
              {timerLabel}
            </p>
            <div className={`font-mono-num font-bold text-3xl tracking-widest ${
              matchState.isLive ? 'text-red-400 animate-pulse-subtle' : 'text-amber-400'
            }`}>
              {timeDisplay}
            </div>
          </div>
        </div>

        {/* Right: Action Buttons (START MATCH & SET TIME) */}
        {isAdmin ? (
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            {/* START MATCH BUTTON */}
            {!matchState.isLive ? (
              <button
                onClick={onOpenStartModal}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-[#ff6b00] to-[#e63946] hover:from-[#ff7b1a] hover:to-[#f04a57] text-white font-display font-bold text-sm tracking-wider uppercase shadow-xl shadow-[#ff6b00]/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 border border-white/20 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                START MATCH NOW
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onPauseMatch}
                  className="px-4 py-3 rounded-xl bg-[#24304f] hover:bg-[#2f3f66] text-amber-300 font-display font-bold text-xs tracking-wider uppercase transition-colors flex items-center gap-1.5 border border-[#3b4b73]"
                >
                  <Pause className="w-4 h-4" />
                  {matchState.status === 'PAUSED' ? 'RESUME' : 'PAUSE'}
                </button>
                <button
                  onClick={() => setShowEndConfirm(true)}
                  className="px-4 py-3 rounded-xl bg-red-600/80 hover:bg-red-600 text-white font-display font-bold text-xs tracking-wider uppercase transition-colors flex items-center gap-1.5 shadow-lg shadow-red-600/30"
                >
                  <Square className="w-4 h-4 fill-white" />
                  END MATCH
                </button>
              </div>
            )}

            {/* SET A TIME FOR A MATCH BUTTON */}
            <button
              onClick={onOpenScheduleModal}
              className="w-full sm:w-auto px-4 py-3 rounded-xl bg-[#151c2f] hover:bg-[#1f293d] text-slate-200 hover:text-white font-display font-semibold text-xs tracking-wider uppercase border border-[#2b354f] hover:border-[#ff6b00]/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              SET MATCH TIME
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-[#0b1020]/60 px-4 py-2.5 rounded-lg border border-[#1f293d]">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>Referee Match Controls Active</span>
          </div>
        )}
      </div>

      {/* End Match Confirmation Dialog */}
      {showEndConfirm && (
        <div className="mt-4 pt-4 border-t border-red-500/30 flex items-center justify-between flex-wrap gap-3 bg-red-950/40 p-3 rounded-xl">
          <div className="flex items-center gap-2 text-red-300 text-xs sm:text-sm">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>Are you sure you want to end this match and finalize the current scores?</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEndConfirm(false)}
              className="px-3 py-1.5 text-xs rounded bg-slate-700 text-slate-300 hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowEndConfirm(false);
                onEndMatch();
              }}
              className="px-3 py-1.5 text-xs rounded font-bold bg-red-600 text-white hover:bg-red-500 shadow-md shadow-red-600/40"
            >
              Confirm End Match
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
