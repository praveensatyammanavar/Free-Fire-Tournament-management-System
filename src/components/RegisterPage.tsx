import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Flame, ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft, Users, QrCode } from 'lucide-react';
import { api, setPlayerToken } from '../services/api.ts';
import { Room, Player } from '../types/tournament.ts';
import { PlayerPassCard } from './PlayerPassCard.tsx';
import { fetchNetworkInfo, getRoomRegistrationUrl } from '../utils/qrUrl.ts';

interface RegisterPageProps {
  initialRoomNumber?: number;
  rooms: Room[];
  onRegistrationSuccess: (player: Player) => void;
  onNavigateLogin: () => void;
  onBackToHub: () => void;
  isQrParticipantMode?: boolean;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  initialRoomNumber = 1,
  rooms,
  onRegistrationSuccess,
  onNavigateLogin,
  onBackToHub,
  isQrParticipantMode = false
}) => {
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<number>(initialRoomNumber);
  const [playerName, setPlayerName] = useState('');
  const [freeFireName, setFreeFireName] = useState('');
  const [freeFireUID, setFreeFireUID] = useState('');
  const [agreeRules, setAgreeRules] = useState(false);
  const [roomQrDataUrl, setRoomQrDataUrl] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registeredPlayer, setRegisteredPlayer] = useState<Player | null>(null);

  const currentRoom = rooms.find(r => r.roomNumber === selectedRoomNumber) || rooms[0];
  const isRoomFull = currentRoom ? currentRoom.registeredCount >= currentRoom.capacity : false;

  useEffect(() => {
    if (initialRoomNumber && initialRoomNumber >= 1) {
      setSelectedRoomNumber(initialRoomNumber);
    }
  }, [initialRoomNumber]);

  // Generate QR code for the currently selected room using LAN Wi-Fi URL
  useEffect(() => {
    fetchNetworkInfo().then(net => {
      const roomUrl = getRoomRegistrationUrl(selectedRoomNumber, net);
      QRCode.toDataURL(roomUrl, {
        width: 180,
        margin: 1,
        color: {
          dark: '#0B1020',
          light: '#FFFFFF'
        }
      }).then(setRoomQrDataUrl).catch(console.error);
    });
  }, [selectedRoomNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validations: only Player Name, Game in Name, FF UID, and rules agreement
    if (!agreeRules) {
      setErrorMessage('You must confirm the details and agree to tournament fair play rules.');
      return;
    }

    if (playerName.trim().length < 2) {
      setErrorMessage('Player Name must be at least 2 characters.');
      return;
    }

    if (freeFireName.trim().length < 2) {
      setErrorMessage('Game in Name / Free Fire IGN is required.');
      return;
    }

    if (!/^[0-9a-zA-Z]{6,16}$/.test(freeFireUID.trim())) {
      setErrorMessage('Free Fire UID must be between 6 and 16 digits/characters.');
      return;
    }

    if (isRoomFull) {
      setErrorMessage(`Room ${selectedRoomNumber} has reached its maximum capacity of ${currentRoom.capacity} players.`);
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.registerPlayer({
        playerName: playerName.trim(),
        freeFireName: freeFireName.trim(),
        freeFireUID: freeFireUID.trim(),
        roomNumber: selectedRoomNumber,
        agreeRules
      });

      setRegisteredPlayer(res.player);
      if (res.token) {
        setPlayerToken(res.token);
      }
      onRegistrationSuccess(res.player);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registeredPlayer) {
    return (
      <div className="w-full max-w-2xl mx-auto py-8 px-4 space-y-6 animate-in fade-in">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border-2 border-emerald-500/50 shadow-xl shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-display">
              Official Tournament Confirmation
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white uppercase tracking-wider">
              Registration Successful!
            </h2>
          </div>
          <p className="text-sm text-slate-300 max-w-md mx-auto">
            You are officially registered in <strong className="text-[#ff6b00]">{registeredPlayer.roomName}</strong>. Your Free Fire Combat Pass is generated below:
          </p>
        </div>

        {/* Player Combat Pass with Room Assignment QR */}
        <PlayerPassCard player={registeredPlayer} room={currentRoom} />

        {isQrParticipantMode ? (
          /* When scanned via QR code: ONLY shows the registered successful state, DO NOT show website buttons */
          <div className="pt-2 text-center space-y-3">
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 via-[#151c2f] to-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-semibold max-w-md mx-auto shadow-lg space-y-1">
              <p className="font-bold text-white flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Slot Confirmed: {registeredPlayer.roomName}
              </p>
              <p className="text-slate-300 text-xs font-normal">
                Please take a screenshot or save your pass image. You will receive room ID & password from tournament admins prior to match start.
              </p>
            </div>
            <p className="text-[11px] text-slate-500">
              Free Fire Tournament Management System &bull; Bermuda Championship
            </p>
          </div>
        ) : (
          /* Normal web browsing registration */
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={onNavigateLogin}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#ff6b00] hover:bg-[#ff7b1a] text-white font-display font-bold text-sm uppercase tracking-wider shadow-lg shadow-[#ff6b00]/30 transition-transform hover:scale-105 cursor-pointer"
            >
              Go To Player Dashboard
            </button>
            <button
              onClick={onBackToHub}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#151c2f] hover:bg-[#24304f] text-slate-300 font-display font-semibold text-sm uppercase tracking-wider border border-[#2b354f] cursor-pointer"
            >
              Back to Tournament Hub
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto py-6 px-4 space-y-6">
      {/* Top back link only shown if NOT in isolated QR scan mode */}
      {!isQrParticipantMode && (
        <button
          onClick={onBackToHub}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tournament Hub
        </button>
      )}

      {/* Card Header */}
      <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-3 border-b border-[#24304f] pb-5 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff6b00] to-red-600 flex items-center justify-center shadow-lg shadow-[#ff6b00]/20">
            <Flame className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl text-white uppercase tracking-wide">
              Player Registration
            </h2>
            <p className="text-xs text-orange-400 font-mono-num">
              Free Fire Championship • 48 Players Per Room • QR Room Assignment
            </p>
          </div>
        </div>

        {/* Room Assignment & QR Banner */}
        {currentRoom && (
          <div className="mb-6 p-4 rounded-xl bg-[#0b1020] border border-[#24304f] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <QrCode className="w-4 h-4 text-[#ff6b00]" />
                <span className="text-sm font-bold text-white">
                  Room Assignment: <strong className="text-[#ff6b00]">{currentRoom.roomName}</strong>
                </span>
              </div>
              <p className="text-xs font-mono-num text-slate-300">
                {currentRoom.registeredCount} / {currentRoom.capacity} Players Registered
              </p>
              <div>
                <span className={`inline-block text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                  isRoomFull
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}>
                  {isRoomFull ? 'ROOM FULL' : `${currentRoom.availableSeats} SLOTS REMAINING (MAX ${currentRoom.capacity})`}
                </span>
              </div>
            </div>

            {/* Room QR Code Box */}
            {roomQrDataUrl && (
              <div className="bg-white p-1.5 rounded-lg shadow-md shrink-0 flex flex-col items-center">
                <img src={roomQrDataUrl} alt={`QR for ${currentRoom.roomName}`} className="w-20 h-20 object-contain" />
                <span className="text-[8px] font-mono-num font-bold text-slate-800 mt-0.5 uppercase">
                  {currentRoom.roomName} QR
                </span>
              </div>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tournament Room Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
              Select Tournament Room:
            </label>
            <select
              value={selectedRoomNumber}
              onChange={(e) => setSelectedRoomNumber(parseInt(e.target.value, 10))}
              className="w-full bg-[#0b1020] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none font-semibold"
            >
              {rooms.map(r => (
                <option key={r.roomNumber} value={r.roomNumber}>
                  {r.roomName} — {r.registeredCount}/{r.capacity} Players {r.registeredCount >= r.capacity ? '(FULL)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 1. Player Name */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
              Player Name:
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              required
              className="w-full bg-[#0b1020] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
            />
          </div>

          {/* 2. Game In Name (IGN) */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
              Game In Name (Free Fire IGN):
            </label>
            <input
              type="text"
              value={freeFireName}
              onChange={(e) => setFreeFireName(e.target.value)}
              placeholder="e.g. 亗SHADOW亗"
              required
              className="w-full bg-[#0b1020] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none font-semibold text-[#ff6b00]"
            />
          </div>

          {/* 3. Free Fire UID */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
              Free Fire UID / Player ID:
            </label>
            <input
              type="text"
              value={freeFireUID}
              onChange={(e) => setFreeFireUID(e.target.value)}
              placeholder="e.g. 8492049182"
              required
              className="w-full bg-[#0b1020] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none font-mono-num"
            />
          </div>

          {/* Agreement Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeRules}
                onChange={(e) => setAgreeRules(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-700 text-[#ff6b00] focus:ring-[#ff6b00] bg-[#0b1020]"
                required
              />
              <span className="text-xs text-slate-300 leading-snug">
                I confirm that my Player Name, Game in Name, and Free Fire UID are correct and agree to the 48-player tournament rules.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isRoomFull}
            className={`w-full py-3.5 px-6 rounded-xl font-display font-bold text-sm uppercase tracking-wider shadow-xl transition-all flex items-center justify-center gap-2 ${
              isRoomFull
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#ff6b00] to-red-600 hover:from-[#ff7b1a] hover:to-red-500 text-white shadow-[#ff6b00]/30 hover:scale-[1.01] cursor-pointer'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            {isSubmitting ? 'Generating Room Pass...' : isRoomFull ? 'Room Full (48/48) — Select Another Room' : 'REGISTER & GENERATE ROOM PASS QR'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#24304f] text-center text-xs text-slate-400">
          Already registered?{' '}
          <button
            onClick={onNavigateLogin}
            className="text-[#ff6b00] hover:underline font-semibold cursor-pointer"
          >
            Look up your Combat Pass with Free Fire UID
          </button>
        </div>
      </div>
    </div>
  );
};
