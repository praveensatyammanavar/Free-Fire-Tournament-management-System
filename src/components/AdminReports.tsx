import React, { useState } from 'react';
import { FileText, Download, Printer, CheckSquare, Users } from 'lucide-react';
import { Room } from '../types/tournament.ts';
import { api } from '../services/api.ts';

interface AdminReportsProps {
  rooms: Room[];
}

export const AdminReports: React.FC<AdminReportsProps> = ({ rooms }) => {
  const [selectedPrintRoom, setSelectedPrintRoom] = useState<number>(1);
  const [isExporting, setIsExporting] = useState(false);

  const downloadAllPlayersCSV = async () => {
    try {
      setIsExporting(true);
      const res = await fetch('/api/admin/reports?format=csv', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('ff_admin_token')}`
        }
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'FreeFire_600Players_Tournament_Export.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintRoomRoster = async (roomNum: number) => {
    try {
      const data = await api.getRoomDetails(roomNum);
      const win = window.open('', '_blank');
      if (!win) {
        window.print();
        return;
      }

      const rowsHtml = data.players.map((p, idx) => `
        <tr>
          <td style="border:1px solid #ccc; padding:6px; text-align:center;">${idx + 1}</td>
          <td style="border:1px solid #ccc; padding:6px;">[ &nbsp; ]</td>
          <td style="border:1px solid #ccc; padding:6px; font-weight:bold;">${p.playerName}</td>
          <td style="border:1px solid #ccc; padding:6px; color:#d9534f; font-weight:bold;">${p.freeFireName}</td>
          <td style="border:1px solid #ccc; padding:6px; font-family:monospace;">${p.freeFireUID}</td>
          <td style="border:1px solid #ccc; padding:6px; font-family:monospace;">${p.registrationNumber}</td>
          <td style="border:1px solid #ccc; padding:6px; text-align:center; font-weight:bold;">${p.totalKills}</td>
          <td style="border:1px solid #ccc; padding:6px; text-align:center;">${p.status}</td>
          <td style="border:1px solid #ccc; padding:6px;"></td>
        </tr>
      `).join('');

      win.document.write(`
        <html>
          <head>
            <title>Official Tournament Roster - Room ${roomNum}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; color: #222; }
              h1 { margin: 0 0 5px 0; font-size: 20px; text-transform: uppercase; color: #d9534f; }
              h2 { margin: 0 0 15px 0; font-size: 16px; color: #555; }
              .meta { margin-bottom: 15px; font-size: 13px; font-weight: bold; }
              table { width: 100%; border-collapse: collapse; font-size: 12px; }
              th { background: #f0f0f0; border: 1px solid #ccc; padding: 6px; text-align: left; }
            </style>
          </head>
          <body>
            <h1>Free Fire Tournament - Official Room Roster</h1>
            <h2>${data.room.roomName} &bull; Capacity: ${data.room.capacity} &bull; Registered: ${data.players.length} Players</h2>
            <div class="meta">Referee Check-In & Score Verification Sheet</div>
            <table>
              <thead>
                <tr>
                  <th style="width:30px; text-align:center;">#</th>
                  <th style="width:40px;">Check</th>
                  <th>Player Real Name</th>
                  <th>Free Fire IGN</th>
                  <th>Free Fire UID</th>
                  <th>Reg Number</th>
                  <th style="text-align:center;">Kills</th>
                  <th style="text-align:center;">Status</th>
                  <th style="width:90px;">Referee Signature</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml || '<tr><td colspan="9" style="text-align:center; padding:15px;">No players registered in this room.</td></tr>'}
              </tbody>
            </table>
            <script>window.onload = function() { window.print(); window.close(); }</script>
          </body>
        </html>
      `);
      win.document.close();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-6 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff6b00] to-blue-600 flex items-center justify-center text-white shadow-lg shadow-[#ff6b00]/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl text-white uppercase tracking-wide">
              Reports & Tournament Export
            </h2>
            <p className="text-xs text-slate-400">
              Download complete tournament datasets, CSV files & referee check-in rosters
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Data Export Card */}
        <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="font-display font-bold text-lg text-white uppercase tracking-wide flex items-center gap-2">
            <Download className="w-5 h-5 text-[#ff6b00]" />
            Full Tournament CSV Export
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Download all 600 registered players, in-game names, UIDs, room assignments, total kills, and statuses in a standardized CSV format compatible with Excel and Google Sheets.
          </p>

          <div className="bg-[#0b1020] p-3 rounded-xl border border-[#24304f] text-[11px] text-slate-400 space-y-1">
            <div>&bull; Passwords and password hashes are strictly excluded for security.</div>
            <div>&bull; Includes registration timestamps and official kill records.</div>
          </div>

          <button
            onClick={downloadAllPlayersCSV}
            disabled={isExporting}
            className="w-full py-3 rounded-xl bg-[#ff6b00] hover:bg-[#ff7b1a] text-white font-display font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#ff6b00]/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Generating CSV...' : 'DOWNLOAD FULL PLAYER DATA (CSV)'}
          </button>
        </div>

        {/* Referee Check-In Sheet Card */}
        <div className="bg-[#151c2f] border border-[#2b354f] rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="font-display font-bold text-lg text-white uppercase tracking-wide flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            Printable Room Referee Rosters
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Generate printable check-in sheets for room referees. Features checkboxes, IGNs, player UIDs, kill tally columns, and referee signature spaces for lobby management.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Select Room to Print:
            </label>
            <select
              value={selectedPrintRoom}
              onChange={(e) => setSelectedPrintRoom(parseInt(e.target.value, 10))}
              className="w-full bg-[#0b1020] border border-[#2b354f] focus:border-[#ff6b00] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              {rooms.map(r => (
                <option key={r.roomNumber} value={r.roomNumber}>
                  {r.roomName} ({r.registeredCount} Players Registered)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => handlePrintRoomRoster(selectedPrintRoom)}
            className="w-full py-3 rounded-xl bg-[#24304f] hover:bg-[#2f3f66] text-slate-200 hover:text-white font-display font-bold text-xs uppercase tracking-wider border border-[#3b4b73] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            PRINT ROOM {selectedPrintRoom} CHECK-IN SHEET
          </button>
        </div>
      </div>
    </div>
  );
};
