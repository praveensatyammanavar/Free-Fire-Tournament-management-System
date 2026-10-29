import React, { useState } from 'react';
import { X, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Player } from '../types/tournament.ts';

interface DisqualifyModalProps {
  isOpen: boolean;
  player: Player | null;
  onClose: () => void;
  onConfirmDisqualify: (playerId: string, reason: string) => Promise<void>;
}

export const DisqualifyModal: React.FC<DisqualifyModalProps> = ({
  isOpen,
  player,
  onClose,
  onConfirmDisqualify
}) => {
  const [reason, setReason] = useState<string>('Use of unauthorized third-party config / hacks');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !player) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.trim().length === 0) {
      setError('Please provide a specific reason for disqualification.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirmDisqualify(player.id, reason.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to disqualify player.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#151c2f] border-2 border-red-500/70 rounded-2xl w-full max-w-md p-6 shadow-2xl shadow-red-500/20 space-y-5">
        <div className="flex items-center justify-between border-b border-[#24304f] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white uppercase tracking-wide">
                Disqualify Player
              </h3>
              <p className="text-xs text-red-400">Severe Rule Violation Action</p>
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
          <div className="bg-[#0b1020] p-3.5 rounded-xl border border-red-900/40 text-xs space-y-1">
            <p className="text-slate-300">
              Player: <strong className="text-white">{player.playerName}</strong> ({player.freeFireName})
            </p>
            <p className="text-slate-400 font-mono-num">
              UID: {player.freeFireUID} | Room: {player.roomName}
            </p>
            <div className="pt-2 text-amber-300 flex items-start gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>
                Disqualified players will be <strong>excluded from winner eligibility and podium ranks</strong>, but their kill history will remain permanently logged for auditing.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Disqualification Reason (Required):
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State clear reason (e.g. Teaming with opponents, emulator bypass, foul conduct)"
              className="w-full bg-[#0b1020] border border-[#2b354f] focus:border-red-500 rounded-xl p-3 text-xs text-white focus:outline-none"
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
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-display font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 disabled:opacity-50"
            >
              {isSubmitting ? 'Applying...' : 'Confirm Disqualification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
