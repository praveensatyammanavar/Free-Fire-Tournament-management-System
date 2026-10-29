import React, { useState } from 'react';
import { X, Play, Radio, Flame, ShieldAlert } from 'lucide-react';

interface StartMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (params: {
    roomNumber: number | 'ALL';
    durationMinutes: number;
    matchTitle: string;
  }) => Promise<void>;
}

export const StartMatchModal: React.FC<StartMatchModalProps> = ({
  isOpen,
  onClose,
  onStart
}) => {
  const [matchTitle, setMatchTitle] = useState('Match 1 - Bermuda Battle Royale');
  const [roomTarget, setRoomTarget] = useState<number | 'ALL'>('ALL');
  const [duration, setDuration] = useState(20);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setIsSubmitting(true);
      await onStart({
        roomNumber: roomTarget,
        durationMinutes: duration,
        matchTitle
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to start match.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#151c2f] border-2 border-[#ff6b00]/60 rounded-2xl w-full max-w-lg p-6 shadow-2xl shadow-[#ff6b00]/20 space-y-5">
        <div className="flex items-center justify-between border-b border-[#24304f] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b00] to-red-600 flex items-center justify-center text-white shadow-lg shadow-[#ff6b00]/30 animate-pulse">
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-white uppercase tracking-wide flex items-center gap-2">
                Launch Live Match
              </h3>
              <p className="text-xs text-orange-300 flex items-center gap-1 font-mono-num">
                <Radio className="w-3.5 h-3.5 text-red-500 animate-spin" />
                Battle Royale Timer & Real-time Score Engine
              </p>
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
          <div className="p-3 rounded-xl bg-[#0b1020] border border-[#24304f] flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300 leading-relaxed">
              Clicking <strong>START MATCH</strong> will set the match live, launch the 20-minute battle countdown clock, and display the live radar across all spectator screens and player portals.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Match Title:
            </label>
            <input
              type="text"
              value={matchTitle}
              onChange={(e) => setMatchTitle(e.target.value)}
              className="w-full bg-[#0b1020] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl px-4 py-2 text-sm text-white focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Room Scope:
              </label>
              <select
                value={roomTarget}
                onChange={(e) => setRoomTarget(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value, 10))}
                className="w-full bg-[#0b1020] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              >
                <option value="ALL">All Rooms (Championship)</option>
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Room {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Match Duration:
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                className="w-full bg-[#0b1020] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl px-3 py-2 text-sm text-white focus:outline-none font-mono-num"
              >
                <option value={15}>15 Minutes</option>
                <option value={20}>20 Minutes (Standard)</option>
                <option value={25}>25 Minutes</option>
                <option value={30}>30 Minutes</option>
              </select>
            </div>
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
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff6b00] to-red-600 hover:from-[#ff7b1a] hover:to-red-500 text-white font-display font-bold text-sm uppercase tracking-wider shadow-xl shadow-[#ff6b00]/40 disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
            >
              <Flame className="w-4 h-4 fill-white" />
              {isSubmitting ? 'Starting Battle...' : 'START MATCH NOW'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
