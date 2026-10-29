import React, { useState } from 'react';
import { X, ArrowRightLeft, CheckCircle } from 'lucide-react';
import { Player, Room } from '../types/tournament.ts';

interface MoveRoomModalProps {
  isOpen: boolean;
  player: Player | null;
  rooms: Room[];
  onClose: () => void;
  onConfirmMove: (playerId: string, targetRoomNumber: number) => Promise<void>;
}

export const MoveRoomModal: React.FC<MoveRoomModalProps> = ({
  isOpen,
  player,
  rooms,
  onClose,
  onConfirmMove
}) => {
  const [targetRoom, setTargetRoom] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !player) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (targetRoom === player.roomId) {
      setError(`Player is already in Room ${targetRoom}.`);
      return;
    }

    const roomObj = rooms.find(r => r.roomNumber === targetRoom);
    if (roomObj && roomObj.registeredCount >= roomObj.capacity) {
      setError(`Room ${targetRoom} is full (${roomObj.capacity}/${roomObj.capacity} players).`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirmMove(player.id, targetRoom);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to move player.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-[#24304f] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#ff6b00]/15 text-[#ff6b00]">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white uppercase tracking-wide">
                Transfer Player Room
              </h3>
              <p className="text-xs text-slate-400">Reassign tournament slot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#24304f]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/50 text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-[#0b1020] p-3.5 rounded-xl border border-[#24304f] text-xs space-y-1">
            <p className="text-slate-300">
              Player: <strong className="text-white">{player.playerName}</strong> ({player.freeFireName})
            </p>
            <p className="text-slate-400 font-mono-num">
              Current Room: <span className="text-[#ff6b00] font-semibold">{player.roomName}</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Select Target Room:
            </label>
            <select
              value={targetRoom}
              onChange={(e) => setTargetRoom(parseInt(e.target.value, 10))}
              className="w-full bg-[#0b1020] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
            >
              {rooms.map(r => (
                <option key={r.roomNumber} value={r.roomNumber} disabled={r.registeredCount >= r.capacity && r.roomNumber !== player.roomId}>
                  {r.roomName} — {r.registeredCount}/{r.capacity} players {r.registeredCount >= r.capacity ? '(FULL)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#24304f]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl text-slate-300 hover:text-white hover:bg-[#24304f]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#ff6b00] hover:bg-[#ff7b1a] text-white font-display font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#ff6b00]/30 disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              {isSubmitting ? 'Transferring...' : 'Transfer Player'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
