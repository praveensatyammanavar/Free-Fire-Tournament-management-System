import React, { useState, useEffect } from 'react';
import { Flame, Shield, User, Trophy, QrCode, LogOut, Radio, Maximize, Minimize, Menu, X, Sparkles } from 'lucide-react';
import { TournamentMatchState } from '../types/tournament.ts';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  adminUser: { username: string } | null;
  playerUser: { playerName: string; freeFireName: string } | null;
  onLogoutAdmin: () => void;
  onLogoutPlayer: () => void;
  matchState?: TournamentMatchState;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  adminUser,
  playerUser,
  onLogoutAdmin,
  onLogoutPlayer,
  matchState
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen toggle error:', err);
    }
  };

  const handleNavClick = (tab: string) => {
    setCurrentTab(tab);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0b1020]/95 backdrop-blur-md border-b border-[#1f293d] safe-top">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo / Branding */}
          <div 
            onClick={() => handleNavClick('hub')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group flex-shrink-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#ff6b00] to-[#e63946] flex items-center justify-center shadow-lg shadow-[#ff6b00]/20 group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-display font-bold text-base sm:text-lg tracking-wider text-white">
                  FREE FIRE
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-[#ff6b00] bg-[#ff6b00]/10 px-1.5 sm:px-2 py-0.5 rounded border border-[#ff6b00]/30">
                  Esports
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 font-mono-num -mt-0.5 hidden xs:block">
                48 Players / Room • Battle Royale
              </p>
            </div>
          </div>

          {/* Live Match Mini Indicator */}
          {matchState && (
            <div 
              onClick={() => handleNavClick('hub')}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#151c2f] border border-[#24304f] cursor-pointer hover:border-[#ff6b00]/50 transition-colors"
            >
              {matchState.isLive ? (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wide flex items-center gap-1 font-display">
                    <Radio className="w-3.5 h-3.5" /> LIVE MATCH
                  </span>
                </>
              ) : matchState.status === 'SCHEDULED' ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                  <span className="text-xs text-amber-300 font-medium font-mono-num">
                    Match Scheduled
                  </span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span className="text-xs text-emerald-300 font-medium">
                    Registration Active
                  </span>
                </>
              )}
            </div>
          )}

          {/* Right Controls: Desktop Nav + Fullscreen + Mobile Menu Button */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => handleNavClick('hub')}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                  currentTab === 'hub'
                    ? 'bg-[#ff6b00] text-white shadow-md shadow-[#ff6b00]/20'
                    : 'text-slate-300 hover:text-white hover:bg-[#151c2f]'
                }`}
              >
                Tournament Hub
              </button>

              <button
                onClick={() => handleNavClick('leaderboard')}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  currentTab === 'leaderboard'
                    ? 'bg-[#ff6b00] text-white shadow-md shadow-[#ff6b00]/20'
                    : 'text-slate-300 hover:text-white hover:bg-[#151c2f]'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Leaderboard
              </button>

              <button
                onClick={() => handleNavClick('qr-codes')}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  currentTab === 'qr-codes'
                    ? 'bg-[#ff6b00] text-white shadow-md shadow-[#ff6b00]/20'
                    : 'text-slate-300 hover:text-white hover:bg-[#151c2f]'
                }`}
              >
                <QrCode className="w-3.5 h-3.5 text-[#ff6b00]" />
                Room QRs
              </button>

              {/* Player Tab / Login */}
              {playerUser ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleNavClick('player')}
                    className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 border border-emerald-500/30 ${
                      currentTab === 'player'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{playerUser.freeFireName}</span>
                  </button>
                  <button
                    onClick={onLogoutPlayer}
                    title="Player Logout"
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-[#151c2f] rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleNavClick('player-login')}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    currentTab === 'player-login'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-[#151c2f]'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Player Login
                </button>
              )}

              {/* Admin Tab / Login */}
              {adminUser ? (
                <div className="flex items-center gap-1 ml-1 pl-2 border-l border-slate-700">
                  <button
                    onClick={() => handleNavClick('admin')}
                    className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                      currentTab === 'admin'
                        ? 'bg-[#ff6b00] text-white shadow-lg shadow-[#ff6b00]/30'
                        : 'bg-[#ff6b00]/15 text-[#ff6b00] border border-[#ff6b00]/30 hover:bg-[#ff6b00]/25'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Admin Panel
                  </button>
                  <button
                    onClick={onLogoutAdmin}
                    title="Admin Logout"
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-[#151c2f] rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleNavClick('admin-login')}
                  className={`px-2.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1 text-slate-400 hover:text-amber-400 hover:bg-[#151c2f]`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
              )}
            </nav>

            {/* Dedicated Fullscreen Toggle Button */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#151c2f] hover:bg-[#24304f] border border-[#2b354f] text-slate-300 hover:text-white transition-all text-xs font-semibold shadow-sm"
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? (
                <>
                  <Minimize className="w-3.5 h-3.5 text-[#ff6b00]" />
                  <span className="hidden sm:inline">Exit Full</span>
                </>
              ) : (
                <>
                  <Maximize className="w-3.5 h-3.5 text-[#ff6b00]" />
                  <span className="hidden sm:inline">Full Screen</span>
                </>
              )}
            </button>

            {/* Mobile Hamburger Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-[#151c2f] rounded-lg transition-colors border border-[#24304f]"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#1f293d] py-3 space-y-1.5 animate-in slide-in-from-top-2 duration-200">
            {matchState && matchState.isLive && (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-950/30 border border-red-500/30 mb-2">
                <span className="flex items-center gap-2 text-xs font-bold text-red-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  MATCH CURRENTLY LIVE
                </span>
                <button
                  onClick={() => handleNavClick('hub')}
                  className="text-xs text-[#ff6b00] underline font-semibold"
                >
                  View Timer
                </button>
              </div>
            )}

            <button
              onClick={() => handleNavClick('hub')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between ${
                currentTab === 'hub' ? 'bg-[#ff6b00] text-white font-bold' : 'text-slate-300 hover:bg-[#151c2f]'
              }`}
            >
              <span>Tournament Hub</span>
              <Flame className="w-4 h-4 opacity-70" />
            </button>

            <button
              onClick={() => handleNavClick('leaderboard')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between ${
                currentTab === 'leaderboard' ? 'bg-[#ff6b00] text-white font-bold' : 'text-slate-300 hover:bg-[#151c2f]'
              }`}
            >
              <span>Live Leaderboard</span>
              <Trophy className="w-4 h-4 text-amber-400" />
            </button>

            <button
              onClick={() => handleNavClick('qr-codes')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between ${
                currentTab === 'qr-codes' ? 'bg-[#ff6b00] text-white font-bold' : 'text-slate-300 hover:bg-[#151c2f]'
              }`}
            >
              <span>Room QRs & Scanning</span>
              <QrCode className="w-4 h-4 text-[#ff6b00]" />
            </button>

            <div className="pt-2 border-t border-[#1f293d] mt-2 space-y-1">
              {playerUser ? (
                <div className="flex items-center justify-between bg-emerald-950/30 border border-emerald-500/30 rounded-lg p-2.5">
                  <button
                    onClick={() => handleNavClick('player')}
                    className="flex items-center gap-2 text-sm text-emerald-300 font-medium"
                  >
                    <User className="w-4 h-4" />
                    <span>{playerUser.freeFireName}</span>
                  </button>
                  <button
                    onClick={onLogoutPlayer}
                    className="text-xs text-red-400 hover:underline px-2 py-1"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleNavClick('player-login')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between ${
                    currentTab === 'player-login' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-[#151c2f]'
                  }`}
                >
                  <span>Player Login</span>
                  <User className="w-4 h-4 text-slate-400" />
                </button>
              )}

              {adminUser ? (
                <div className="flex items-center justify-between bg-[#ff6b00]/10 border border-[#ff6b00]/30 rounded-lg p-2.5">
                  <button
                    onClick={() => handleNavClick('admin')}
                    className="flex items-center gap-2 text-sm text-[#ff6b00] font-semibold"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin Panel</span>
                  </button>
                  <button
                    onClick={onLogoutAdmin}
                    className="text-xs text-red-400 hover:underline px-2 py-1"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleNavClick('admin-login')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between ${
                    currentTab === 'admin-login' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-[#151c2f]'
                  }`}
                >
                  <span>Admin Panel Login</span>
                  <Shield className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
