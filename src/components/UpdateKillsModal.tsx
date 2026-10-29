import React, { useState, useEffect } from 'react';
import { X, Crosshair, Save, AlertCircle } from 'lucide-react';
import { Player } from '../types/tournament.ts';

interface UpdateKillsModalProps {
  isOpen: boolean;
  player: Player | null;
  onClose: () => void;
  onSaveKills: (playerId: string, newKills: number, reason: string) => Promise<void>;
}

export const UpdateKillsModal: React.FC<UpdateKillsModalProps> = ({
  isOpen,
  player,
  onClose,
  onSaveKills
}) => {
  const [newKills, setNewKills] = useState<number>(0);
  const [reason, setReason] = useState<string>('Match referee kill log verification');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (player) {
      setNewKills(player.totalKills);
      setReason('Match referee kill log verification');
      setError(null);
    }
  }, [player]);

  if (!isOpen || !player) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newKills < 0) {
      setError('Kills must be a non-negative number.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSaveKills(player.id, Number(newKills), reason);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update player kills.');
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
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white uppercase tracking-wide">
                Update Player Kills
              </h3>
              <p className="text-xs text-slate-400">Official Score Record</p>
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
          <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Player Info Summary */}
          <div className="bg-[#0b1020] p-3.5 rounded-xl border border-[#24304f] space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Player Name:</span>
              <span className="font-semibold text-white">{player.playerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Free Fire IGN:</span>
              <span className="font-semibold text-[#ff6b00]">{player.freeFireName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Free Fire UID:</span>
              <span className="font-mono-num text-slate-300">{player.freeFireUID}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Assigned Room:</span>
              <span className="text-slate-300">{player.roomName}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-[#1f293d]">
              <span className="text-slate-400">Current Kills:</span>
              <span className="font-mono-num font-bold text-amber-400 text-sm">
                {player.totalKills} Kills
              </span>
            </div>
          </div>

          {/* New Total Kills */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              New Total Kills:
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setNewKills(prev => Math.max(0, prev - 1))}
                className="w-10 h-10 rounded-xl bg-[#24304f] hover:bg-[#2e3b5e] text-white font-bold text-lg"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                value={newKills}
                onChange={(e) => setNewKills(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="flex-1 text-center bg-[#0b1020] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl py-2 text-xl font-bold font-mono-num text-white focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setNewKills(prev => prev + 1)}
                className="w-10 h-10 rounded-xl bg-[#24304f] hover:bg-[#2e3b5e] text-white font-bold text-lg"
              >
                +
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              * Note: Enter the player's new total kills. This replaces the previous total of {player.totalKills}.
            </p>
          </div>

          {/* Reason for Update */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Reason for Update (Audit Log):
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. End of Round 1 kill score tally"
              className="w-full bg-[#0b1020] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              required
            />
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
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
