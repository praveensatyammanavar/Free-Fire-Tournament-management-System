import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Shield, Flame, Award, Printer, Download, UserCheck } from 'lucide-react';
import { Player, Room } from '../types/tournament.ts';

interface PlayerPassCardProps {
  player: Player;
  room?: Room;
}

export const PlayerPassCard: React.FC<PlayerPassCardProps> = ({ player, room }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    const payload = `FREEFIRE-PASS:${player.registrationNumber}:${player.freeFireUID}:${player.roomName}`;
    QRCode.toDataURL(payload, {
      width: 180,
      margin: 1,
      color: {
        dark: '#0B1020',
        light: '#FFFFFF'
      }
    }).then(setQrDataUrl).catch(console.error);
  }, [player]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `player_pass_${player.registrationNumber}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <div className="space-y-4">
      <div 
        id="player-pass-badge"
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#151c2f] via-[#10172a] to-[#0b1020] border-2 border-[#ff6b00]/50 p-6 text-white shadow-2xl shadow-[#ff6b00]/10 max-w-md mx-auto"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#24304f] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#ff6b00] flex items-center justify-center shadow-md">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm tracking-wider uppercase text-white">
                FREE FIRE CHAMPIONSHIP
              </h4>
              <p className="text-[10px] text-[#ff6b00] font-mono-num font-semibold">
                OFFICIAL PLAYER COMBAT PASS
              </p>
            </div>
          </div>
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
            player.status === 'Active'
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              : player.status === 'Eliminated'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-red-500/20 text-red-400 border-red-500/40'
          }`}>
            {player.status}
          </span>
        </div>

        {/* Player Info & QR */}
        <div className="flex items-center gap-4">
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-400">Player Name</p>
              <h3 className="font-display font-bold text-lg text-white tracking-wide truncate">
                {player.playerName}
              </h3>
            </div>

            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-400">Free Fire IGN</p>
              <p className="font-bold text-base text-[#ff6b00] truncate">
                {player.freeFireName}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-[10px] uppercase font-semibold text-slate-400">UID</p>
                <p className="font-mono-num font-semibold text-slate-200">{player.freeFireUID}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-slate-400">Assigned</p>
                <p className="font-semibold text-amber-400">{player.roomName}</p>
              </div>
            </div>
          </div>

          {/* QR Code Pass */}
          <div className="bg-white p-1.5 rounded-xl shrink-0 shadow-lg border border-slate-300 flex flex-col items-center">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Player Pass QR" className="w-24 h-24 object-contain" />
            ) : (
              <div className="w-24 h-24 bg-slate-200 animate-pulse rounded" />
            )}
            <span className="text-[8px] font-mono-num font-bold text-slate-800 mt-0.5">
              PASS VERIFIED
            </span>
          </div>
        </div>

        {/* Bottom Bar: Registration Number */}
        <div className="mt-4 pt-3 border-t border-[#24304f] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Reg No: <strong className="font-mono-num text-white">{player.registrationNumber}</strong></span>
          </div>
          <div className="text-[11px] font-mono-num text-amber-300 font-bold">
            Total Kills: {player.totalKills}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={handlePrint}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#151c2f] hover:bg-[#24304f] text-slate-200 border border-[#2b354f] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          Print Pass
        </button>
        <button
          onClick={handleDownload}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#24304f] hover:bg-[#ff6b00] hover:text-white text-slate-200 border border-[#3b4b73] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          Download Pass QR
        </button>
      </div>
    </div>
  );
};
