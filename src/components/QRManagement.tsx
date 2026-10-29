import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Download,
  Printer,
  ExternalLink,
  Check,
  Copy,
  Wifi,
  Info,
  Edit2,
  RotateCcw,
  Smartphone
} from 'lucide-react';
import { Room } from '../types/tournament.ts';
import {
  fetchNetworkInfo,
  getQrBaseUrl,
  getRoomRegistrationUrl,
  setCustomQrHost,
  getCustomQrHost,
  NetworkInfo
} from '../utils/qrUrl.ts';

interface QRManagementProps {
  rooms: Room[];
  onSelectRoomRegister: (roomNumber: number) => void;
}

export const QRManagement: React.FC<QRManagementProps> = ({
  rooms,
  onSelectRoomRegister
}) => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [customHostInput, setCustomHostInput] = useState('');
  const [isEditingHost, setIsEditingHost] = useState(false);
  const [activeBaseUrl, setActiveBaseUrl] = useState<string>('');

  const [qrPngMap, setQrPngMap] = useState<Record<number, string>>({});
  const [qrSvgMap, setQrSvgMap] = useState<Record<number, string>>({});
  const [copiedRoom, setCopiedRoom] = useState<number | null>(null);
  const [copiedBaseUrl, setCopiedBaseUrl] = useState(false);

  // Load network info and active base URL
  useEffect(() => {
    fetchNetworkInfo().then(info => {
      setNetworkInfo(info);
      const url = getQrBaseUrl(info);
      setActiveBaseUrl(url);
      setCustomHostInput(getCustomQrHost() || url);
    });
  }, []);

  // Regenerate QR codes whenever rooms or activeBaseUrl changes
  useEffect(() => {
    if (!activeBaseUrl && rooms.length > 0) {
      setActiveBaseUrl(getQrBaseUrl(networkInfo));
    }

    rooms.forEach(async (r) => {
      const url = `${activeBaseUrl || getQrBaseUrl(networkInfo)}/?register_room=${r.roomNumber}`;
      try {
        const pngUrl = await QRCode.toDataURL(url, {
          width: 320,
          margin: 2,
          color: {
            dark: '#0B1020',
            light: '#FFFFFF'
          }
        });
        const svgString = await QRCode.toString(url, {
          type: 'svg',
          width: 320,
          margin: 2,
          color: {
            dark: '#0B1020',
            light: '#FFFFFF'
          }
        });

        setQrPngMap(prev => ({ ...prev, [r.roomNumber]: pngUrl }));
        setQrSvgMap(prev => ({ ...prev, [r.roomNumber]: svgString }));
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    });
  }, [rooms, activeBaseUrl, networkInfo]);

  const handleSaveCustomHost = () => {
    if (!customHostInput.trim()) {
      setCustomQrHost(null);
      const def = getQrBaseUrl(networkInfo);
      setActiveBaseUrl(def);
      setCustomHostInput(def);
    } else {
      setCustomQrHost(customHostInput.trim());
      setActiveBaseUrl(getQrBaseUrl(networkInfo));
    }
    setIsEditingHost(false);
  };

  const handleResetDefaultHost = () => {
    setCustomQrHost(null);
    const def = networkInfo?.defaultUrl || window.location.origin;
    setActiveBaseUrl(def);
    setCustomHostInput(def);
    setIsEditingHost(false);
  };

  const getRoomUrl = (roomNum: number) => {
    return `${activeBaseUrl || getQrBaseUrl(networkInfo)}/?register_room=${roomNum}`;
  };

  const copyUrl = (roomNum: number) => {
    const url = getRoomUrl(roomNum);
    navigator.clipboard.writeText(url);
    setCopiedRoom(roomNum);
    setTimeout(() => setCopiedRoom(null), 2000);
  };

  const copyBaseUrl = () => {
    navigator.clipboard.writeText(activeBaseUrl);
    setCopiedBaseUrl(true);
    setTimeout(() => setCopiedBaseUrl(false), 2000);
  };

  const downloadPng = (roomNum: number) => {
    const dataUrl = qrPngMap[roomNum];
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `FreeFire_Room_${roomNum}_Registration_QR.png`;
    a.click();
  };

  const downloadSvg = (roomNum: number) => {
    const svgStr = qrSvgMap[roomNum];
    if (!svgStr) return;
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FreeFire_Room_${roomNum}_Registration_QR.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printSingleQR = (roomNum: number) => {
    const png = qrPngMap[roomNum];
    const room = rooms.find(r => r.roomNumber === roomNum);
    if (!png || !room) return;

    const win = window.open('', '_blank');
    if (!win) {
      window.print();
      return;
    }

    win.document.write(`
      <html>
        <head>
          <title>Room ${roomNum} Registration QR Code</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 40px; margin: 0; }
            h1 { font-size: 26px; margin-bottom: 4px; color: #ff6b00; text-transform: uppercase; }
            h2 { font-size: 18px; color: #1e293b; margin-top: 0; }
            .badge { display: inline-block; padding: 6px 18px; border: 2px solid #ff6b00; border-radius: 20px; font-weight: bold; margin: 15px 0; color: #0f172a; }
            img { width: 320px; height: 320px; margin: 10px auto; border: 3px solid #0f172a; padding: 12px; border-radius: 16px; display: block; }
            .url { font-family: monospace; font-size: 13px; margin-top: 15px; color: #475569; word-break: break-all; }
            .instructions { margin-top: 20px; font-size: 15px; color: #0f172a; max-width: 480px; margin-left: auto; margin-right: auto; }
            .wifi-note { font-size: 12px; color: #b45309; background: #fef3c7; padding: 6px 12px; border-radius: 8px; display: inline-block; margin-top: 10px; }
          </style>
        </head>
        <body>
          <h1>FREE FIRE ESPORTS CHAMPIONSHIP</h1>
          <h2>OFFICIAL ROOM REGISTRATION DESK</h2>
          <div class="badge">${room.roomName} — Capacity: ${room.capacity} Players</div>
          <img src="${png}" alt="Room ${roomNum} QR" />
          <p class="instructions"><strong>Scan with your smartphone camera</strong> to register directly into ${room.roomName}.</p>
          <div class="wifi-note">📶 Ensure your smartphone is connected to the tournament Wi-Fi network</div>
          <p class="url">${getRoomUrl(roomNum)}</p>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const printAllQRs = () => {
    window.print();
  };

  return (
    <div className="space-y-6 w-full">
      {/* Top Banner */}
      <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <QrCode className="w-6 h-6 text-[#ff6b00]" />
            <h2 className="font-display font-bold text-xl sm:text-2xl text-white uppercase tracking-wide">
              Room QR Code Management
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic QR codes linking directly to individual room registration portals (Standard 48 players per room lobby)
          </p>
        </div>

        <button
          onClick={printAllQRs}
          className="px-5 py-2.5 rounded-xl bg-[#ff6b00] hover:bg-[#ff7b1a] text-white font-display font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#ff6b00]/30 flex items-center gap-2 cursor-pointer self-start md:self-auto transition-transform hover:scale-105"
        >
          <Printer className="w-4 h-4" />
          Print All 10 Room QR Codes
        </button>
      </div>

      {/* Mobile Scanning & LAN Network Host Card (Fixes "This site can't be reached") */}
      <div className="bg-gradient-to-r from-[#10172a] via-[#151f38] to-[#10172a] border border-[#3b4b73] rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ff6b00]/20 border border-[#ff6b00]/40 flex items-center justify-center flex-shrink-0 text-[#ff6b00] mt-0.5">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display font-bold text-sm sm:text-base text-white uppercase tracking-wide">
                  Mobile QR Scanning Network URL
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Wifi className="w-3 h-3" /> Wi-Fi Ready
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Phones scanning the QR code connect directly through your computer&apos;s local IP on Wi-Fi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => setIsEditingHost(!isEditingHost)}
              className="px-3 py-1.5 rounded-lg bg-[#24304f] hover:bg-[#2e3e67] border border-[#3b4b73] text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#ff6b00]" />
              {isEditingHost ? 'Cancel' : 'Change IP / Host'}
            </button>
            <button
              onClick={copyBaseUrl}
              className="px-3 py-1.5 rounded-lg bg-[#ff6b00]/15 hover:bg-[#ff6b00]/25 border border-[#ff6b00]/40 text-xs font-semibold text-[#ff6b00] flex items-center gap-1.5 transition-colors"
            >
              {copiedBaseUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedBaseUrl ? 'Copied' : 'Copy URL'}
            </button>
          </div>
        </div>

        {/* Current URL Bar */}
        <div className="flex items-center gap-2 bg-[#0b1020] p-2.5 rounded-xl border border-[#24304f] font-mono-num text-xs sm:text-sm">
          <span className="text-slate-400 font-sans text-xs select-none">Active QR Base:</span>
          <span className="font-bold text-[#ff6b00] select-all flex-1 truncate">
            {activeBaseUrl || 'Detecting network address...'}
          </span>
          <a
            href={activeBaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-[#151c2f] hover:bg-[#24304f] transition-colors"
            title="Open base URL in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open</span>
          </a>
        </div>

        {/* Editing Host Form */}
        {isEditingHost && (
          <div className="bg-[#0b1020] p-3.5 rounded-xl border border-[#ff6b00]/40 space-y-3 animate-in fade-in-50">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Custom IP, Host, or Tunnel URL (e.g. http://10.212.67.29:3000 or ngrok link):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customHostInput}
                  onChange={(e) => setCustomHostInput(e.target.value)}
                  placeholder="http://10.212.67.29:3000"
                  className="flex-1 px-3 py-2 rounded-lg bg-[#151c2f] border border-[#2b354f] text-white text-xs font-mono-num focus:outline-none focus:border-[#ff6b00]"
                />
                <button
                  onClick={handleSaveCustomHost}
                  className="px-4 py-2 rounded-lg bg-[#ff6b00] hover:bg-[#ff7b1a] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Apply & Save
                </button>
                <button
                  onClick={handleResetDefaultHost}
                  className="px-3 py-2 rounded-lg bg-[#24304f] hover:bg-[#2e3e67] text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors"
                  title="Reset to automatically detected LAN IP"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>
            </div>

            {/* Quick Pick Candidates if available */}
            {networkInfo && networkInfo.candidates.length > 0 && (
              <div className="pt-2 border-t border-[#1f293d] flex items-center gap-2 flex-wrap text-xs">
                <span className="text-slate-400">Available Interfaces:</span>
                {networkInfo.candidates.map(c => (
                  <button
                    key={c.ip}
                    type="button"
                    onClick={() => {
                      const url = `http://${c.ip}:${networkInfo.port}`;
                      setCustomHostInput(url);
                      setCustomQrHost(url);
                      setActiveBaseUrl(url);
                      setIsEditingHost(false);
                    }}
                    className={`px-2 py-1 rounded bg-[#151c2f] hover:bg-[#ff6b00]/20 border text-xs font-mono-num transition-colors ${
                      activeBaseUrl.includes(c.ip) ? 'border-[#ff6b00] text-[#ff6b00] font-bold' : 'border-[#2b354f] text-slate-300'
                    }`}
                  >
                    {c.name}: {c.ip}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Informative Note */}
        <div className="flex items-center gap-2 text-[11px] text-amber-300/90 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
          <Info className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>
            <strong>Phone Scanning Tip:</strong> Keep your mobile phone connected to the same Wi-Fi network as this computer to open room registrations seamlessly.
          </span>
        </div>
      </div>

      {/* 10 Rooms QR Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
        {rooms.map(room => {
          const isFull = room.registeredCount >= room.capacity;
          const pngUrl = qrPngMap[room.roomNumber];

          return (
            <div
              key={room.roomNumber}
              className="bg-[#151c2f] border border-[#24304f] rounded-2xl p-4 shadow-xl flex flex-col items-center text-center space-y-3 relative group hover:border-[#ff6b00]/50 transition-colors"
            >
              {/* Room Header */}
              <div className="w-full flex items-center justify-between border-b border-[#24304f] pb-2">
                <span className="font-display font-bold text-base text-white">
                  {room.roomName}
                </span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  isFull
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}>
                  {isFull ? 'FULL' : `${room.availableSeats} LEFT`}
                </span>
              </div>

              {/* QR Image Box */}
              <div className="bg-white p-2 rounded-xl shadow-inner border border-slate-300 w-full flex flex-col items-center">
                {pngUrl ? (
                  <img
                    src={pngUrl}
                    alt={`QR Code for Room ${room.roomNumber}`}
                    className="w-40 h-40 object-contain"
                  />
                ) : (
                  <div className="w-40 h-40 bg-slate-200 animate-pulse rounded" />
                )}
                <span className="text-[10px] font-mono-num font-bold text-slate-800 mt-1">
                  SCAN TO JOIN {room.roomName.toUpperCase()}
                </span>
              </div>

              {/* Capacity Bar */}
              <div className="w-full space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Registered</span>
                  <span className="font-mono-num font-semibold text-white">
                    {room.registeredCount} / {room.capacity}
                  </span>
                </div>
                <div className="w-full bg-[#0b1020] h-2 rounded-full overflow-hidden border border-[#24304f]">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isFull ? 'bg-red-500' : 'bg-[#ff6b00]'
                    }`}
                    style={{ width: `${Math.min(100, (room.registeredCount / room.capacity) * 100)}%` }}
                  />
                </div>
              </div>

              {/* URL Display with Copy Button */}
              <div className="w-full flex items-center gap-1 bg-[#0b1020] p-1.5 rounded-lg border border-[#24304f]">
                <span className="text-[10px] font-mono-num text-slate-400 truncate flex-1 text-left px-1">
                  {getRoomUrl(room.roomNumber)}
                </span>
                <button
                  onClick={() => copyUrl(room.roomNumber)}
                  title="Copy registration link"
                  className="p-1 text-slate-400 hover:text-[#ff6b00] rounded hover:bg-[#151c2f]"
                >
                  {copiedRoom === room.roomNumber ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Actions Grid */}
              <div className="w-full grid grid-cols-3 gap-1.5 pt-1">
                <button
                  onClick={() => downloadPng(room.roomNumber)}
                  className="py-1.5 px-1 rounded-lg bg-[#24304f] hover:bg-[#ff6b00] text-slate-200 hover:text-white text-[10px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title="Download PNG"
                >
                  <Download className="w-3 h-3" /> PNG
                </button>
                <button
                  onClick={() => downloadSvg(room.roomNumber)}
                  className="py-1.5 px-1 rounded-lg bg-[#24304f] hover:bg-[#ff6b00] text-slate-200 hover:text-white text-[10px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title="Download SVG"
                >
                  <Download className="w-3 h-3" /> SVG
                </button>
                <button
                  onClick={() => printSingleQR(room.roomNumber)}
                  className="py-1.5 px-1 rounded-lg bg-[#24304f] hover:bg-[#ff6b00] text-slate-200 hover:text-white text-[10px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title="Print Single QR Sheet"
                >
                  <Printer className="w-3 h-3" /> Print
                </button>
              </div>

              {/* Test Register Button */}
              <button
                onClick={() => onSelectRoomRegister(room.roomNumber)}
                disabled={isFull}
                className="w-full py-2 text-xs font-display font-semibold rounded-xl bg-[#0b1020] hover:bg-[#ff6b00] text-slate-300 hover:text-white border border-[#24304f] transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Room Register
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
