import React, { useState, useEffect } from 'react';
import { Crosshair, Search, Save, CheckCircle, Clock, History } from 'lucide-react';
import { Player, KillAudit } from '../types/tournament.ts';
import { api } from '../services/api.ts';

interface QuickKillUpdaterProps {
  onKillUpdated: () => void;
}

export const QuickKillUpdater: React.FC<QuickKillUpdaterProps> = ({ onKillUpdated }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [newKills, setNewKills] = useState<number>(0);
  const [reason, setReason] = useState<string>('Live match kill verification');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [recentAudits, setRecentAudits] = useState<KillAudit[]>([]);

  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = async () => {
    try {
      const data = await api.getAuditLogs();
      setRecentAudits(data.killAudits.slice(0, 10));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.getAdminPlayers({ search: searchTerm.trim(), limit: 8 });
        setSearchResults(res.players);
      } catch (err) {
        console.error(err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSelectPlayer = (player: Player) => {
    setSelectedPlayer(player);
    setNewKills(player.totalKills);
    setSuccessMessage(null);
  };

  const handleSaveKills = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) return;

    try {
      setIsSubmitting(true);
      const res = await api.updatePlayerKills(selectedPlayer.id, newKills, reason);
      setSuccessMessage(`Updated official kills for ${selectedPlayer.playerName} to ${newKills}!`);
      setSelectedPlayer(res.player);
      onKillUpdated();
      fetchAudits();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to update kills');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-6 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff6b00] to-amber-600 flex items-center justify-center text-white shadow-lg shadow-[#ff6b00]/20">
            <Crosshair className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl text-white uppercase tracking-wide">
              Quick Kill Score Terminal
            </h2>
            <p className="text-xs text-slate-400">
              Live tournament referee scoring system • Rapid player lookup & instant leaderboard synchronization
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Player Search & Updater (7 cols) */}
        <div className="lg:col-span-7 bg-[#151c2f] border border-[#2b354f] rounded-2xl p-6 shadow-xl space-y-5">
          <h3 className="font-display font-bold text-lg text-white uppercase tracking-wide flex items-center gap-2">
            <Search className="w-4 h-4 text-[#ff6b00]" />
            Search Player for Score Update
          </h3>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type player name, Free Fire IGN, UID, or Room..."
              className="w-full bg-[#0b1020] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none"
            />
          </div>

          {/* Search Results Dropdown/List */}
          {searchResults.length > 0 && (
            <div className="bg-[#0b1020] border border-[#24304f] rounded-xl p-2 max-h-56 overflow-y-auto divide-y divide-[#1e2840]">
              {searchResults.map(p => (
                <div
                  key={p.id}
                  onClick={() => handleSelectPlayer(p)}
                  className={`p-2.5 rounded-lg cursor-pointer flex items-center justify-between hover:bg-[#1a233b] transition-colors ${
                    selectedPlayer?.id === p.id ? 'bg-[#ff6b00]/15 border border-[#ff6b00]/40' : ''
                  }`}
                >
                  <div>
                    <div className="font-semibold text-white text-xs">{p.playerName}</div>
                    <div className="text-[11px] text-[#ff6b00] font-semibold">{p.freeFireName} • <span className="text-slate-400 font-mono-num">{p.freeFireUID}</span></div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-amber-400 font-mono-num font-bold">{p.totalKills} Kills</span>
                    <div className="text-[10px] text-slate-400">{p.roomName}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Active Score Adjustment Form */}
          {selectedPlayer ? (
            <form onSubmit={handleSaveKills} className="bg-[#0b1020] p-5 rounded-xl border border-[#24304f] space-y-4">
              <div className="flex items-center justify-between border-b border-[#1f283e] pb-3">
                <div>
                  <h4 className="font-display font-bold text-base text-white">
                    {selectedPlayer.playerName} ({selectedPlayer.freeFireName})
                  </h4>
                  <p className="text-xs text-slate-400 font-mono-num">
                    UID: {selectedPlayer.freeFireUID} • {selectedPlayer.roomName}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">Current Kills</span>
                  <span className="font-mono-num font-bold text-xl text-amber-400">
                    {selectedPlayer.totalKills}
                  </span>
                </div>
              </div>

              {/* Number Stepper */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                  Set New Official Total Kills:
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setNewKills(prev => Math.max(0, prev - 1))}
                    className="w-12 h-12 rounded-xl bg-[#24304f] hover:bg-[#ff6b00] text-white font-bold text-xl transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={newKills}
                    onChange={(e) => setNewKills(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="flex-1 text-center bg-[#151c2f] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl py-3 text-3xl font-mono-num font-bold text-white focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setNewKills(prev => prev + 1)}
                    className="w-12 h-12 rounded-xl bg-[#24304f] hover:bg-[#ff6b00] text-white font-bold text-xl transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Reason for Update:
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Round 2 Airdrop clash verification"
                  className="w-full bg-[#151c2f] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-[#ff6b00] hover:bg-[#ff7b1a] text-white font-display font-bold text-sm uppercase tracking-wider shadow-lg shadow-[#ff6b00]/30 transition-transform hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Saving Total Kills...' : `RECORD OFFICIAL SCORE (${newKills} KILLS)`}
              </button>
            </form>
          ) : (
            <div className="p-8 text-center text-slate-400 bg-[#0b1020] rounded-xl border border-dashed border-[#24304f] text-xs">
              Search and select a player above to rapidly update their kill statistics.
            </div>
          )}
        </div>

        {/* Right Column: Live Audit Feed (5 cols) */}
        <div className="lg:col-span-5 bg-[#151c2f] border border-[#2b354f] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#24304f] pb-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-amber-400" />
              <h3 className="font-display font-bold text-base text-white uppercase tracking-wide">
                Live Kill Score Audit Feed
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono-num">
              Recent {recentAudits.length} Records
            </span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
            {recentAudits.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">
                No kill updates logged yet.
              </p>
            ) : (
              recentAudits.map(audit => (
                <div
                  key={audit.id}
                  className="p-3 rounded-xl bg-[#0b1020] border border-[#24304f] text-xs space-y-1 hover:border-[#ff6b00]/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white truncate max-w-[150px]">
                      {audit.playerName}
                    </span>
                    <span className="font-mono-num font-bold text-amber-400">
                      {audit.previousKills} → {audit.updatedKills} Kills
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Room {audit.roomNumber}</span>
                    <span className="text-[#ff6b00]">by {audit.updatedBy}</span>
                  </div>

                  <p className="text-[10px] text-slate-300 italic pt-0.5">
                    "{audit.reason}"
                  </p>
                  <div className="text-[9px] text-slate-500 text-right font-mono-num">
                    {new Date(audit.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
