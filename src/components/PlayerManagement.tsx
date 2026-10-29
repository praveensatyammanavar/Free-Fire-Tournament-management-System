import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Crosshair,
  ShieldAlert,
  ArrowRightLeft,
  Trash2,
  Eye,
  CheckCircle,
  RotateCcw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { Player, Room } from '../types/tournament.ts';
import { api } from '../services/api.ts';

interface PlayerManagementProps {
  rooms: Room[];
  onOpenUpdateKills: (player: Player) => void;
  onOpenDisqualify: (player: Player) => void;
  onOpenMoveRoom: (player: Player) => void;
}

export const PlayerManagement: React.FC<PlayerManagementProps> = ({
  rooms,
  onOpenUpdateKills,
  onOpenDisqualify,
  onOpenMoveRoom
}) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [roomFilter, setRoomFilter] = useState<number | 0>(0);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // View details modal
  const [selectedPlayerDetails, setSelectedPlayerDetails] = useState<{
    player: Player;
    killHistory: any[];
    statusHistory: any[];
  } | null>(null);

  const fetchPlayers = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminPlayers({
        page,
        limit,
        search,
        room: roomFilter > 0 ? roomFilter : undefined,
        status: statusFilter
      });
      setPlayers(res.players);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, [page, roomFilter, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchPlayers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleMarkEliminated = async (player: Player) => {
    try {
      await api.updatePlayerStatus(player.id, 'Eliminated', 'Marked eliminated by tournament official');
      setActionMessage(`Marked ${player.playerName} (${player.freeFireName}) as Eliminated.`);
      fetchPlayers();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleRestorePlayer = async (player: Player) => {
    try {
      await api.updatePlayerStatus(player.id, 'Active', 'Restored to active competition');
      setActionMessage(`Restored ${player.playerName} to Active status.`);
      fetchPlayers();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to restore player');
    }
  };

  const handleDeletePlayer = async (player: Player) => {
    if (!window.confirm(`Are you sure you want to permanently delete registration for ${player.playerName} (${player.registrationNumber})?`)) {
      return;
    }
    try {
      await api.deletePlayer(player.id);
      setActionMessage(`Deleted registration for ${player.playerName}.`);
      fetchPlayers();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete player');
    }
  };

  const handleViewDetails = async (playerId: string) => {
    try {
      const data = await api.getPlayerDetails(playerId);
      setSelectedPlayerDetails(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-[#ff6b00]" />
            <h2 className="font-display font-bold text-2xl text-white uppercase tracking-wide">
              Registered Player Management
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Total {total} players registered across tournament rooms • Real-time kill updates, room transfers & status moderation
          </p>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-[#151c2f] border border-[#24304f] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, IGN, UID, or Reg No..."
            className="w-full bg-[#0b1020] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Room Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-semibold">Room:</span>
            <select
              value={roomFilter}
              onChange={(e) => {
                setRoomFilter(parseInt(e.target.value, 10));
                setPage(1);
              }}
              className="bg-[#0b1020] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value={0}>All Rooms</option>
              {rooms.map(r => (
                <option key={r.roomNumber} value={r.roomNumber}>
                  {r.roomName} ({r.registeredCount}/{r.capacity})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#0b1020] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Eliminated">Eliminated</option>
              <option value="Disqualified">Disqualified</option>
            </select>
          </div>
        </div>
      </div>

      {/* Players Table */}
      <div className="bg-[#151c2f] border border-[#24304f] rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b1020] border-b border-[#24304f] text-slate-400 font-display uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">No.</th>
                <th className="py-3 px-4">Player Name</th>
                <th className="py-3 px-4">Free Fire IGN</th>
                <th className="py-3 px-4">UID</th>
                <th className="py-3 px-4">Room</th>
                <th className="py-3 px-4 text-center">Total Kills</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2840]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading players...
                  </td>
                </tr>
              ) : players.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No players found matching your criteria.
                  </td>
                </tr>
              ) : (
                players.map((player, idx) => {
                  const globalIdx = (page - 1) * limit + idx + 1;
                  return (
                    <tr key={player.id} className="hover:bg-[#1a233b] transition-colors">
                      <td className="py-3 px-4 font-mono-num text-slate-400">
                        {globalIdx}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{player.playerName}</div>
                        <div className="text-[10px] text-slate-400 font-mono-num">{player.registrationNumber}</div>
                      </td>

                      <td className="py-3 px-4 font-semibold text-[#ff6b00]">
                        {player.freeFireName}
                      </td>

                      <td className="py-3 px-4 font-mono-num text-slate-300">
                        {player.freeFireUID}
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-[#0b1020] border border-[#24304f]">
                          {player.roomName}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="font-mono-num font-bold text-sm text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/30">
                          {player.totalKills}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          player.status === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : player.status === 'Eliminated'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-red-500/20 text-red-400 border-red-500/40'
                        }`}>
                          {player.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Details */}
                          <button
                            onClick={() => handleViewDetails(player.id)}
                            title="View Player Details & Audits"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#24304f]"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Update Kills */}
                          <button
                            onClick={() => onOpenUpdateKills(player)}
                            title="Update Kills"
                            className="p-1.5 rounded-lg text-amber-400 hover:text-white hover:bg-amber-600/30"
                          >
                            <Crosshair className="w-3.5 h-3.5" />
                          </button>

                          {/* Move Room */}
                          <button
                            onClick={() => onOpenMoveRoom(player)}
                            title="Transfer Room"
                            className="p-1.5 rounded-lg text-blue-400 hover:text-white hover:bg-blue-600/30"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>

                          {/* Mark Eliminated (if active) */}
                          {player.status === 'Active' && (
                            <button
                              onClick={() => handleMarkEliminated(player)}
                              title="Mark as Eliminated"
                              className="p-1.5 rounded-lg text-yellow-400 hover:text-white hover:bg-yellow-600/30"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Disqualify / Restore */}
                          {player.status !== 'Disqualified' ? (
                            <button
                              onClick={() => onOpenDisqualify(player)}
                              title="Disqualify Player"
                              className="p-1.5 rounded-lg text-red-400 hover:text-white hover:bg-red-600/30"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRestorePlayer(player)}
                              title="Restore Disqualified Player"
                              className="p-1.5 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-600/30"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => handleDeletePlayer(player)}
                            title="Delete Registration"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-[#24304f]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-[#0b1020] px-4 py-3 border-t border-[#24304f] flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="font-mono-num font-semibold text-white">{players.length}</span> of{' '}
            <span className="font-mono-num font-semibold text-white">{total}</span> players
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-[#151c2f] hover:bg-[#24304f] disabled:opacity-40 disabled:cursor-not-allowed text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono-num text-white">
              Page {page} of {Math.max(1, totalPages)}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-[#151c2f] hover:bg-[#24304f] disabled:opacity-40 disabled:cursor-not-allowed text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Player Details & Audit Modal */}
      {selectedPlayerDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#24304f] pb-3">
              <h3 className="font-display font-bold text-lg text-white uppercase">
                Player Audit & Details
              </h3>
              <button
                onClick={() => setSelectedPlayerDetails(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#0b1020] p-4 rounded-xl border border-[#24304f] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Player Name:</span>
                <span className="font-semibold text-white">{selectedPlayerDetails.player.playerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Free Fire IGN:</span>
                <span className="font-semibold text-[#ff6b00]">{selectedPlayerDetails.player.freeFireName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Free Fire UID:</span>
                <span className="font-mono-num text-slate-200">{selectedPlayerDetails.player.freeFireUID}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mobile Number:</span>
                <span className="font-mono-num text-slate-200">{selectedPlayerDetails.player.mobileNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Registration ID:</span>
                <span className="font-mono-num text-emerald-400">{selectedPlayerDetails.player.registrationNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Room:</span>
                <span className="text-slate-200">{selectedPlayerDetails.player.roomName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Kills:</span>
                <span className="font-mono-num font-bold text-amber-400 text-sm">{selectedPlayerDetails.player.totalKills}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Status:</span>
                <span className="font-bold text-white">{selectedPlayerDetails.player.status}</span>
              </div>
              {selectedPlayerDetails.player.disqualificationReason && (
                <div className="pt-2 border-t border-[#1f283e] text-red-300">
                  <strong>Disqualification Reason:</strong> {selectedPlayerDetails.player.disqualificationReason}
                </div>
              )}
            </div>

            {/* Kill Audit History */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-300 uppercase">
                Kill Adjustment Log ({selectedPlayerDetails.killHistory.length})
              </h4>
              {selectedPlayerDetails.killHistory.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No manual kill adjustments recorded.</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedPlayerDetails.killHistory.map((kh: any) => (
                    <div key={kh.id} className="p-2 rounded-lg bg-[#0b1020] text-[11px] border border-[#24304f] flex justify-between">
                      <div>
                        <span className="font-semibold text-white">{kh.previousKills} → {kh.updatedKills} Kills</span>
                        <p className="text-slate-400 text-[10px]">{kh.reason}</p>
                      </div>
                      <div className="text-right text-[10px] text-slate-400 font-mono-num">
                        <div>by {kh.updatedBy}</div>
                        <div>{new Date(kh.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#24304f] flex justify-end">
              <button
                onClick={() => setSelectedPlayerDetails(null)}
                className="px-4 py-2 rounded-xl bg-[#24304f] text-slate-200 text-xs font-semibold hover:bg-[#2f3f66]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
