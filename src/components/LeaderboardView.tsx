import React, { useState } from 'react';
import { Trophy, Medal, Crown, Filter, Download, Crosshair, AlertCircle } from 'lucide-react';
import { Player, TournamentMatchState } from '../types/tournament.ts';

interface LeaderboardEntry {
  rank: number;
  player: Player;
  isEligible: boolean;
  isTied: boolean;
}

interface LeaderboardViewProps {
  entries: LeaderboardEntry[];
  selectedRoom: number | 'ALL';
  onChangeRoom: (room: number | 'ALL') => void;
  tieBreakingRule: string;
  matchState?: TournamentMatchState;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  entries,
  selectedRoom,
  onChangeRoom,
  tieBreakingRule,
  matchState
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEntries = entries.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.player.playerName.toLowerCase().includes(q) ||
      e.player.freeFireName.toLowerCase().includes(q) ||
      e.player.freeFireUID.toLowerCase().includes(q) ||
      e.player.registrationNumber.toLowerCase().includes(q)
    );
  });

  // Top 3 eligible players
  const eligibleEntries = entries.filter(e => e.isEligible);
  const firstPlace = eligibleEntries[0];
  const secondPlace = eligibleEntries[1];
  const thirdPlace = eligibleEntries[2];

  const handleExportCSV = () => {
    const headers = 'Rank,PlayerName,FreeFireName,FreeFireUID,Room,TotalKills,Status,Eligible\n';
    const rows = entries.map(e =>
      `${e.rank || 'N/A'},"${e.player.playerName}","${e.player.freeFireName}","${e.player.freeFireUID}","${e.player.roomName}",${e.player.totalKills},"${e.player.status}",${e.isEligible}`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FreeFire_Leaderboard_${selectedRoom === 'ALL' ? 'Overall' : `Room_${selectedRoom}`}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h2 className="font-display font-bold text-2xl text-white uppercase tracking-wide">
              Official Tournament Leaderboard
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time standings ranked by total verified kills • Disqualified players excluded from prize eligibility
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 rounded-xl bg-[#24304f] hover:bg-[#ff6b00] hover:text-white text-slate-200 border border-[#3b4b73] text-xs font-semibold flex items-center gap-2 transition-colors self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          Export Leaderboard CSV
        </button>
      </div>

      {/* Podium Showcase (Top 3 Eligible) */}
      {eligibleEntries.length >= 2 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          {/* Second Place */}
          {secondPlace && (
            <div className="bg-[#151c2f] border border-slate-600/50 rounded-2xl p-5 shadow-xl flex flex-col items-center text-center relative overflow-hidden order-2 md:order-1 mt-4 md:mt-8">
              <div className="w-12 h-12 rounded-full bg-slate-300 text-slate-900 flex items-center justify-center font-bold text-lg shadow-lg mb-2">
                2
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                1st Runner Up
              </span>
              <h3 className="font-display font-bold text-lg text-white truncate max-w-full">
                {secondPlace.player.playerName}
              </h3>
              <p className="text-sm font-semibold text-[#ff6b00]">
                {secondPlace.player.freeFireName}
              </p>
              <div className="mt-3 py-1.5 px-4 rounded-full bg-[#0b1020] border border-[#24304f] text-slate-200 font-mono-num font-bold text-sm">
                {secondPlace.player.totalKills} Kills
              </div>
              <span className="text-[11px] text-slate-400 mt-1">{secondPlace.player.roomName}</span>
            </div>
          )}

          {/* First Place Champion */}
          {firstPlace && (
            <div className="bg-gradient-to-b from-[#1c2237] to-[#151c2f] border-2 border-amber-400 rounded-2xl p-6 shadow-2xl shadow-amber-500/10 flex flex-col items-center text-center relative overflow-hidden order-1 md:order-2">
              <div className="absolute top-2 right-2">
                <Crown className="w-6 h-6 text-amber-400 animate-bounce" />
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center font-bold text-2xl shadow-xl shadow-amber-500/30 mb-2">
                1
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                Tournament Leader
              </span>
              <h3 className="font-display font-bold text-xl text-white truncate max-w-full">
                {firstPlace.player.playerName}
              </h3>
              <p className="text-base font-bold text-[#ff6b00]">
                {firstPlace.player.freeFireName}
              </p>
              <div className="mt-3 py-2 px-5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono-num font-bold text-lg">
                {firstPlace.player.totalKills} Kills
              </div>
              <span className="text-xs text-slate-400 mt-1">{firstPlace.player.roomName}</span>
            </div>
          )}

          {/* Third Place */}
          {thirdPlace && (
            <div className="bg-[#151c2f] border border-amber-700/50 rounded-2xl p-5 shadow-xl flex flex-col items-center text-center relative overflow-hidden order-3 mt-4 md:mt-8">
              <div className="w-12 h-12 rounded-full bg-amber-700 text-amber-100 flex items-center justify-center font-bold text-lg shadow-lg mb-2">
                3
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                2nd Runner Up
              </span>
              <h3 className="font-display font-bold text-lg text-white truncate max-w-full">
                {thirdPlace.player.playerName}
              </h3>
              <p className="text-sm font-semibold text-[#ff6b00]">
                {thirdPlace.player.freeFireName}
              </p>
              <div className="mt-3 py-1.5 px-4 rounded-full bg-[#0b1020] border border-[#24304f] text-slate-200 font-mono-num font-bold text-sm">
                {thirdPlace.player.totalKills} Kills
              </div>
              <span className="text-[11px] text-slate-400 mt-1">{thirdPlace.player.roomName}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#151c2f] border border-[#24304f] rounded-2xl p-6 text-center text-xs text-slate-400 space-y-1">
          <p className="font-display font-semibold text-sm text-slate-300 uppercase">
            No Match Results Yet
          </p>
          <p>Podium and player rankings will appear here as soon as verified match kills are recorded.</p>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#151c2f] border border-[#24304f] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-300 uppercase">Room:</span>
          <select
            value={selectedRoom}
            onChange={(e) => onChangeRoom(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value, 10))}
            className="bg-[#0b1020] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="ALL">Overall Tournament (All 10 Rooms)</option>
            {[...Array(10)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                Room {i + 1}
              </option>
            ))}
          </select>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by player, IGN, or UID..."
          className="w-full sm:w-64 bg-[#0b1020] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
        />
      </div>

      {/* Leaderboard Table */}
      <div className="bg-[#151c2f] border border-[#24304f] rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b1020] border-b border-[#24304f] text-slate-400 font-display uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Player Name</th>
                <th className="py-3 px-4">Free Fire IGN</th>
                <th className="py-3 px-4">UID</th>
                <th className="py-3 px-4">Room</th>
                <th className="py-3 px-4 text-center">Total Kills</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2840]">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No players found on the leaderboard.
                  </td>
                </tr>
              ) : (
                filteredEntries.map(entry => {
                  const { rank, player, isEligible, isTied } = entry;
                  const isTop3 = isEligible && rank <= 3;

                  return (
                    <tr
                      key={player.id}
                      className={`hover:bg-[#1a233b] transition-colors ${
                        !isEligible ? 'opacity-60 bg-red-950/10' : isTop3 ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono-num font-bold">
                        {isEligible ? (
                          <div className="flex items-center gap-1.5">
                            {rank === 1 ? (
                              <Medal className="w-4 h-4 text-amber-400" />
                            ) : rank === 2 ? (
                              <Medal className="w-4 h-4 text-slate-300" />
                            ) : rank === 3 ? (
                              <Medal className="w-4 h-4 text-amber-700" />
                            ) : null}
                            <span className={isTop3 ? 'text-amber-400 font-bold text-sm' : 'text-slate-300'}>
                              #{rank}
                            </span>
                            {isTied && (
                              <span className="text-[10px] text-slate-400 bg-slate-800 px-1 rounded">
                                Tied
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-red-400 text-[11px] font-semibold">
                            DQ (Ineligible)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-semibold text-white">
                        {player.playerName}
                      </td>

                      <td className="py-3 px-4 font-semibold text-[#ff6b00]">
                        {player.freeFireName}
                      </td>

                      <td className="py-3 px-4 font-mono-num text-slate-400">
                        {player.freeFireUID}
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        {player.roomName}
                      </td>

                      <td className="py-3 px-4 text-center font-mono-num font-bold text-base text-amber-400">
                        {player.totalKills}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          player.status === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : player.status === 'Eliminated'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-red-500/20 text-red-400 border-red-500/40'
                        }`}>
                          {player.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tie Breaking Rules Footer */}
      <div className="bg-[#151c2f] border border-[#24304f] rounded-xl p-4 text-xs text-slate-400 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-200">Official Tie-Breaking Protocol:</strong> {tieBreakingRule}
        </div>
      </div>
    </div>
  );
};
