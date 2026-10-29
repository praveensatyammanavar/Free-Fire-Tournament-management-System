import React, { useState } from 'react';
import { X, Calendar, Clock, CheckCircle } from 'lucide-react';

interface ScheduleMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (params: {
    scheduledTime: string;
    matchTitle: string;
    roomNumber: number | 'ALL';
    durationMinutes: number;
  }) => Promise<void>;
}

export const ScheduleMatchModal: React.FC<ScheduleMatchModalProps> = ({
  isOpen,
  onClose,
  onSchedule
}) => {
  const getDefaultDateTime = () => {
    const d = new Date(Date.now() + 15 * 60 * 1000); // 15 mins from now
    // format to YYYY-MM-DDTHH:mm for datetime-local
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [dateTime, setDateTime] = useState(getDefaultDateTime());
  const [matchTitle, setMatchTitle] = useState('Match 1 - Bermuda Battle Royale');
  const [roomTarget, setRoomTarget] = useState<number | 'ALL'>('ALL');
  const [duration, setDuration] = useState(20);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePreset = (minutesFromNow: number) => {
    const d = new Date(Date.now() + minutesFromNow * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    setDateTime(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!dateTime) {
      setError('Please select a valid date and time for the match.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSchedule({
        scheduledTime: new Date(dateTime).toISOString(),
        matchTitle,
        roomNumber: roomTarget,
        durationMinutes: duration
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule match.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-[#24304f] pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white uppercase tracking-wide">
                Set Match Schedule
              </h3>
              <p className="text-xs text-slate-400">
                Configure the start time and countdown for players & rooms
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
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
              Quick Schedule Presets:
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handlePreset(5)}
                className="py-1.5 px-2 text-xs font-mono-num rounded-lg bg-[#24304f] hover:bg-[#ff6b00] hover:text-white text-slate-200 transition-colors border border-[#3b4b73]"
              >
                In 5 Mins
              </button>
              <button
                type="button"
                onClick={() => handlePreset(15)}
                className="py-1.5 px-2 text-xs font-mono-num rounded-lg bg-[#24304f] hover:bg-[#ff6b00] hover:text-white text-slate-200 transition-colors border border-[#3b4b73]"
              >
                In 15 Mins
              </button>
              <button
                type="button"
                onClick={() => handlePreset(30)}
                className="py-1.5 px-2 text-xs font-mono-num rounded-lg bg-[#24304f] hover:bg-[#ff6b00] hover:text-white text-slate-200 transition-colors border border-[#3b4b73]"
              >
                In 30 Mins
              </button>
              <button
                type="button"
                onClick={() => handlePreset(60)}
                className="py-1.5 px-2 text-xs font-mono-num rounded-lg bg-[#24304f] hover:bg-[#ff6b00] hover:text-white text-slate-200 transition-colors border border-[#3b4b73]"
              >
                In 1 Hour
              </button>
            </div>
          </div>

          {/* Date & Time Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Match Date & Start Time:
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                required
                className="w-full bg-[#0b1020] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none font-mono-num"
              />
            </div>
          </div>

          {/* Match Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Match Title / Round Name:
            </label>
            <input
              type="text"
              value={matchTitle}
              onChange={(e) => setMatchTitle(e.target.value)}
              placeholder="e.g. Match 1 - Bermuda Battle Royale"
              className="w-full bg-[#0b1020] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl px-4 py-2 text-sm text-white focus:outline-none"
            />
          </div>

          {/* Room Target & Duration in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Room Target:
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
                Duration (Minutes):
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
              className="px-5 py-2.5 rounded-xl bg-[#ff6b00] hover:bg-[#ff7b1a] text-white font-display font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#ff6b00]/30 disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : 'Confirm Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
