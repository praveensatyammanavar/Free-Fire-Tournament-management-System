import React, { useState } from 'react';
import { Shield, Users, Play, ToggleLeft, ToggleRight, Eye, Edit2, Check, X, Plus, Trash2, QrCode } from 'lucide-react';
import { Room, Player } from '../types/tournament.ts';
import { api } from '../services/api.ts';

interface RoomManagementProps {
  rooms: Room[];
  onRefreshRooms: () => void;
  onStartRoomMatch: (roomNumber: number) => void;
  onOpenQR: (roomNumber: number) => void;
}

export const RoomManagement: React.FC<RoomManagementProps> = ({
  rooms,
  onRefreshRooms,
  onStartRoomMatch,
  onOpenQR
}) => {
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<number | null>(null);
  const [roomPlayers, setRoomPlayers] = useState<Player[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [editingCapacityRoom, setEditingCapacityRoom] = useState<number | null>(null);
  const [newCapacityVal, setNewCapacityVal] = useState<number>(48);

  // New Room Creation Modal State
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [newRoomCapacity, setNewRoomCapacity] = useState<number>(48);
  const [isSubmittingNewRoom, setIsSubmittingNewRoom] = useState(false);

  const handleViewPlayers = async (roomNum: number) => {
    setSelectedRoomNumber(roomNum);
    setIsLoadingPlayers(true);
    try {
      const data = await api.getRoomDetails(roomNum);
      setRoomPlayers(data.players);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingPlayers(false);
    }
  };

  const handleToggleRegistration = async (room: Room) => {
    try {
      await api.updateRoom(room.roomNumber, {
        registrationOpen: !room.registrationOpen
      });
      onRefreshRooms();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveCapacity = async (roomNum: number) => {
    if (newCapacityVal < 1) return;
    try {
      await api.updateRoom(roomNum, { capacity: newCapacityVal });
      setEditingCapacityRoom(null);
      onRefreshRooms();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingNewRoom(true);
      await api.createRoom(newRoomCapacity);
      setIsAddingRoom(false);
      onRefreshRooms();
    } catch (err: any) {
      alert(err.message || 'Failed to create room');
    } finally {
      setIsSubmittingNewRoom(false);
    }
  };

  const handleDeleteRoom = async (roomNumber: number) => {
    if (!window.confirm(`Are you sure you want to delete Room ${roomNumber}?`)) return;
    try {
      await api.deleteRoom(roomNumber);
      onRefreshRooms();
    } catch (err: any) {
      alert(err.message || 'Failed to delete room');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Add Room Button */}
      <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#ff6b00]" />
            <h2 className="font-display font-bold text-2xl text-white uppercase tracking-wide">
              Tournament Room Management ({rooms.length} Rooms &bull; 48 Slots Each)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Standard 48-player Free Fire battle royale lobbies &bull; Create more rooms and adjust capacity on demand
          </p>
        </div>

        <button
          onClick={() => setIsAddingRoom(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff6b00] to-red-600 hover:from-[#ff7b1a] hover:to-red-500 text-white font-display font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#ff6b00]/30 flex items-center gap-2 cursor-pointer self-start md:self-auto transition-transform hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          Create New Room
        </button>
      </div>

      {/* Add Room Modal */}
      {isAddingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#24304f] pb-3">
              <h3 className="font-display font-bold text-lg text-white uppercase">
                Create Room {rooms.length + 1}
              </h3>
              <button
                onClick={() => setIsAddingRoom(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Seating Capacity (Standard Free Fire Lobby is 48):
                </label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={newRoomCapacity}
                  onChange={(e) => setNewRoomCapacity(parseInt(e.target.value, 10) || 48)}
                  className="w-full bg-[#0b1020] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl px-4 py-2.5 text-sm font-mono-num font-bold text-white focus:outline-none"
                  required
                />
              </div>

              <div className="pt-3 border-t border-[#24304f] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingRoom(false)}
                  className="px-4 py-2 rounded-xl bg-slate-700 text-xs text-slate-300 hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewRoom}
                  className="px-5 py-2 rounded-xl bg-[#ff6b00] hover:bg-[#ff7b1a] text-white font-display font-bold text-xs uppercase tracking-wider shadow-md shadow-[#ff6b00]/30 disabled:opacity-50"
                >
                  {isSubmittingNewRoom ? 'Creating...' : `Add Room ${rooms.length + 1}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {rooms.map(room => {
          const isFull = room.registeredCount >= room.capacity;
          const isEditingThisCapacity = editingCapacityRoom === room.roomNumber;

          return (
            <div
              key={room.roomNumber}
              className="bg-[#151c2f] border border-[#24304f] rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 hover:border-[#ff6b00]/40 transition-colors"
            >
              {/* Header */}
              <div>
                <div className="flex items-center justify-between border-b border-[#24304f] pb-3 mb-3">
                  <span className="font-display font-bold text-lg text-white">
                    {room.roomName}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      isFull
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : !room.registrationOpen
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}>
                      {isFull ? 'FULL' : !room.registrationOpen ? 'PAUSED' : `${room.availableSeats} LEFT`}
                    </span>

                    {/* Delete empty room button */}
                    {room.registeredCount === 0 && rooms.length > 1 && (
                      <button
                        onClick={() => handleDeleteRoom(room.roomNumber)}
                        title="Delete empty room"
                        className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Capacity Counter (e.g. 0 / 48) */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Registered:</span>
                    <span className="font-mono-num font-bold text-white">
                      {room.registeredCount} / {room.capacity}
                    </span>
                  </div>
                  <div className="w-full bg-[#0b1020] h-2.5 rounded-full overflow-hidden border border-[#24304f]">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isFull ? 'bg-red-500' : 'bg-[#ff6b00]'
                      }`}
                      style={{ width: `${Math.min(100, (room.registeredCount / room.capacity) * 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Available Slots:</span>
                    <span className="font-mono-num font-semibold text-emerald-400">
                      {room.availableSeats}
                    </span>
                  </div>
                </div>

                {/* Match Status Badge */}
                <div className="bg-[#0b1020] p-2.5 rounded-xl border border-[#24304f] text-xs flex items-center justify-between">
                  <span className="text-slate-400">Match Status:</span>
                  <span className={`font-semibold font-mono-num ${
                    room.matchStatus === 'Live' ? 'text-red-400 animate-pulse' : 'text-slate-300'
                  }`}>
                    {room.matchStatus}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-[#24304f]">
                {/* Start Match for Room button */}
                <button
                  onClick={() => onStartRoomMatch(room.roomNumber)}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-[#ff6b00] to-red-600 hover:from-[#ff7b1a] hover:to-red-500 text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-[#ff6b00]/20 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  Start Room Match
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleViewPlayers(room.roomNumber)}
                    className="py-1.5 px-2 rounded-xl bg-[#24304f] hover:bg-[#2f3f66] text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Players ({room.registeredCount})
                  </button>

                  <button
                    onClick={() => handleToggleRegistration(room)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                      room.registrationOpen
                        ? 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 border border-amber-500/30'
                        : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 border border-emerald-500/30'
                    }`}
                  >
                    {room.registrationOpen ? 'Pause Reg' : 'Open Reg'}
                  </button>
                </div>

                {/* Edit Capacity Input (User request: adjustment) */}
                {isEditingThisCapacity ? (
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newCapacityVal}
                      onChange={(e) => setNewCapacityVal(parseInt(e.target.value, 10) || 48)}
                      className="w-16 bg-[#0b1020] border border-[#ff6b00] rounded-lg px-2 py-1 text-xs text-white text-center font-mono-num font-bold"
                    />
                    <button
                      onClick={() => handleSaveCapacity(room.roomNumber)}
                      className="p-1.5 rounded-lg bg-emerald-600 text-white cursor-pointer"
                      title="Save Capacity"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingCapacityRoom(null)}
                      className="p-1.5 rounded-lg bg-slate-700 text-slate-300 cursor-pointer"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingCapacityRoom(room.roomNumber);
                      setNewCapacityVal(room.capacity);
                    }}
                    className="w-full text-center text-[11px] text-slate-400 hover:text-[#ff6b00] pt-1 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Edit2 className="w-3 h-3" /> Adjust Capacity ({room.capacity} Slots)
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Room Players Roster Modal */}
      {selectedRoomNumber !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#24304f] pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#ff6b00]" />
                <h3 className="font-display font-bold text-lg text-white uppercase">
                  Room {selectedRoomNumber} Roster ({roomPlayers.length} / 48 Players)
                </h3>
              </div>
              <button
                onClick={() => setSelectedRoomNumber(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#24304f]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoadingPlayers ? (
                <div className="py-8 text-center text-slate-400">Loading roster...</div>
              ) : roomPlayers.length === 0 ? (
                <div className="py-8 text-center text-slate-400">No players registered in Room {selectedRoomNumber} yet.</div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0b1020] text-slate-400 font-display uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Reg ID</th>
                      <th className="py-2.5 px-3">Player Name</th>
                      <th className="py-2.5 px-3">Game in Name (IGN)</th>
                      <th className="py-2.5 px-3">FF UID</th>
                      <th className="py-2.5 px-3 text-center">Kills</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f283e]">
                    {roomPlayers.map(p => (
                      <tr key={p.id} className="hover:bg-[#1a233b]">
                        <td className="py-2.5 px-3 font-mono-num text-slate-400">{p.registrationNumber}</td>
                        <td className="py-2.5 px-3 font-semibold text-white">{p.playerName}</td>
                        <td className="py-2.5 px-3 font-semibold text-[#ff6b00]">{p.freeFireName}</td>
                        <td className="py-2.5 px-3 font-mono-num text-slate-300">{p.freeFireUID}</td>
                        <td className="py-2.5 px-3 text-center font-mono-num font-bold text-amber-400">{p.totalKills}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            p.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                            p.status === 'Eliminated' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                            'bg-red-500/20 text-red-400 border-red-500/40'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-3 border-t border-[#24304f] flex justify-end">
              <button
                onClick={() => setSelectedRoomNumber(null)}
                className="px-4 py-2 rounded-xl bg-[#24304f] text-slate-200 text-xs font-semibold hover:bg-[#2f3f66] cursor-pointer"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
