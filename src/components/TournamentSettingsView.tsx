import React, { useState } from 'react';
import { Settings, Save, Database, RotateCcw, AlertTriangle, CheckCircle, Flame } from 'lucide-react';
import { TournamentSettings } from '../types/tournament.ts';
import { api } from '../services/api.ts';

interface TournamentSettingsViewProps {
  settings: TournamentSettings;
  onRefreshSettings: () => void;
}

export const TournamentSettingsView: React.FC<TournamentSettingsViewProps> = ({
  settings,
  onRefreshSettings
}) => {
  const [formData, setFormData] = useState<TournamentSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await api.updateSettings(formData);
      setSuccessMessage('Tournament settings successfully updated!');
      onRefreshSettings();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeedDemo = async () => {
    if (!window.confirm('Seed 50 realistic demo players across all 10 rooms with kills and statuses for instant testing?')) {
      return;
    }
    try {
      setIsSeeding(true);
      const res = await api.seedDemoData();
      setSuccessMessage(res.message);
      onRefreshSettings();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to seed data');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('WARNING: Are you sure you want to reset all tournament players and kill records to a clean slate?')) {
      return;
    }
    try {
      setIsResetting(true);
      const res = await api.resetData();
      setSuccessMessage(res.message);
      onRefreshSettings();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to reset data');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-6 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff6b00] to-purple-600 flex items-center justify-center text-white shadow-lg shadow-[#ff6b00]/20">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl text-white uppercase tracking-wide">
              Tournament Configuration
            </h2>
            <p className="text-xs text-slate-400">
              Manage tournament metadata, room capacities, registration toggles & match rules
            </p>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-6 shadow-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Tournament Name:
            </label>
            <input
              type="text"
              value={formData.tournamentName}
              onChange={(e) => setFormData({ ...formData, tournamentName: e.target.value })}
              className="w-full bg-[#0b1020] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl px-4 py-2 text-sm text-white focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Tournament Status:
            </label>
            <select
              value={formData.tournamentStatus}
              onChange={(e) => setFormData({ ...formData, tournamentStatus: e.target.value as any })}
              className="w-full bg-[#0b1020] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl px-4 py-2 text-sm text-white focus:outline-none"
            >
              <option value="Registration Open">Registration Open</option>
              <option value="Registration Closed">Registration Closed</option>
              <option value="Match Scheduled">Match Scheduled</option>
              <option value="Match Live">Match Live</option>
              <option value="Tournament Paused">Tournament Paused</option>
              <option value="Tournament Completed">Tournament Completed</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
            Tournament Description:
          </label>
          <textarea
            rows={2}
            value={formData.tournamentDescription}
            onChange={(e) => setFormData({ ...formData, tournamentDescription: e.target.value })}
            className="w-full bg-[#0b1020] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl p-3 text-xs text-white focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Number of Rooms:
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={formData.numberOfRooms}
              onChange={(e) => setFormData({ ...formData, numberOfRooms: parseInt(e.target.value, 10) || 10 })}
              className="w-full bg-[#0b1020] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl px-4 py-2 text-sm text-white focus:outline-none font-mono-num"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Capacity per Room:
            </label>
            <input
              type="number"
              min="10"
              max="100"
              value={formData.roomCapacity}
              onChange={(e) => setFormData({ ...formData, roomCapacity: parseInt(e.target.value, 10) || 48 })}
              className="w-full bg-[#0b1020] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl px-4 py-2 text-sm text-white focus:outline-none font-mono-num"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Total Max Capacity:
            </label>
            <div className="bg-[#0b1020] border border-[#24304f] rounded-xl px-4 py-2 text-sm font-bold text-amber-400 font-mono-num">
              {formData.numberOfRooms * formData.roomCapacity} Players
            </div>
          </div>
        </div>

        {/* Registration Toggle */}
        <div className="p-4 rounded-xl bg-[#0b1020] border border-[#24304f] flex items-center justify-between">
          <div>
            <span className="font-semibold text-white text-xs block">Allow New Player Registrations</span>
            <span className="text-[11px] text-slate-400">
              When toggled off, player registration forms across all rooms will be locked.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, registrationOpen: !formData.registrationOpen })}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-colors ${
              formData.registrationOpen
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'bg-red-600 text-white'
            }`}
          >
            {formData.registrationOpen ? 'Registration Active' : 'Registration Closed'}
          </button>
        </div>

        {/* Scoring & Tie-Break Rules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Kill Scoring Rules:
            </label>
            <input
              type="text"
              value={formData.killScoringRule}
              onChange={(e) => setFormData({ ...formData, killScoringRule: e.target.value })}
              className="w-full bg-[#0b1020] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Tie-Breaking Rules:
            </label>
            <input
              type="text"
              value={formData.tieBreakingRule}
              onChange={(e) => setFormData({ ...formData, tieBreakingRule: e.target.value })}
              className="w-full bg-[#0b1020] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-3 rounded-xl bg-[#ff6b00] hover:bg-[#ff7b1a] text-white font-display font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#ff6b00]/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving Changes...' : 'SAVE SETTINGS'}
        </button>
      </form>

      {/* Database Management / Testing Utilities */}
      <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="font-display font-bold text-lg text-white uppercase tracking-wide flex items-center gap-2">
          <Database className="w-5 h-5 text-amber-400" />
          Testing & Evaluation Utilities
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Use these one-click tools to populate test players with kills and eliminations across all 10 rooms, or reset to a completely pristine tournament.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSeedDemo}
            disabled={isSeeding}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-[#ff6b00] hover:from-amber-500 hover:to-[#ff7b1a] text-white font-display font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Flame className="w-4 h-4 fill-white" />
            {isSeeding ? 'Seeding...' : 'Seed 50 Demo Players With Kills'}
          </button>

          <button
            type="button"
            onClick={handleResetData}
            disabled={isResetting}
            className="px-5 py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/70 text-red-300 border border-red-500/40 font-display font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            {isResetting ? 'Resetting...' : 'Reset Tournament Data'}
          </button>
        </div>
      </div>
    </div>
  );
};
