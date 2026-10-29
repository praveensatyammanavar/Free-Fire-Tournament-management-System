import { Router, Request, Response } from 'express';
import { db } from '../db.ts';
import { requireAdmin } from '../middleware/auth.ts';

export const adminRouter = Router();

// Protect all admin routes
adminRouter.use(requireAdmin);

// Admin dashboard summary stats
adminRouter.get('/dashboard', (_req: Request, res: Response): void => {
  try {
    const stats = db.getDashboardStats();
    const rooms = db.getRooms();
    const audits = db.getAudits();
    const settings = db.getSettings();

    res.json({
      stats,
      rooms,
      settings,
      recentKillAudits: audits.killAudits.slice(0, 5),
      recentDisqualifications: audits.disqualificationAudits.slice(0, 5),
      recentMatchLogs: audits.matchLogs.slice(0, 5)
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ error: 'Failed to load admin dashboard data.' });
  }
});

// Admin players management with search, filter, and pagination
adminRouter.get('/players', (req: Request, res: Response): void => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 15));
    const search = ((req.query.search as string) || '').trim().toLowerCase();
    const room = req.query.room ? parseInt(req.query.room as string, 10) : undefined;
    const status = (req.query.status as string) || '';

    let players = db.getPlayers();

    // Filters
    if (room && room > 0) {
      players = players.filter(p => p.roomId === room);
    }

    if (status && status !== 'All') {
      players = players.filter(p => p.status === status);
    }

    if (search) {
      players = players.filter(p =>
        p.playerName.toLowerCase().includes(search) ||
        p.freeFireName.toLowerCase().includes(search) ||
        p.freeFireUID.toLowerCase().includes(search) ||
        p.registrationNumber.toLowerCase().includes(search) ||
        (p.mobileNumber && p.mobileNumber.toLowerCase().includes(search))
      );
    }

    const total = players.length;
    const startIndex = (page - 1) * limit;
    const paginated = players.slice(startIndex, startIndex + limit).map(p => {
      const { passwordHash: _, ...sanitized } = p;
      return sanitized;
    });

    res.json({
      players: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Admin players error:', err);
    res.status(500).json({ error: 'Failed to retrieve players.' });
  }
});

// Single player details
adminRouter.get('/players/:id', (req: Request, res: Response): void => {
  try {
    const player = db.getPlayerById(req.params.id);
    if (!player) {
      res.status(404).json({ error: 'Player not found.' });
      return;
    }

    const { passwordHash: _, ...sanitized } = player;
    const audits = db.getAudits();
    const playerKillAudits = audits.killAudits.filter(a => a.playerId === player.id);
    const playerDisqAudits = audits.disqualificationAudits.filter(a => a.playerId === player.id);

    res.json({
      player: sanitized,
      killHistory: playerKillAudits,
      statusHistory: playerDisqAudits
    });
  } catch (err) {
    console.error('Player detail error:', err);
    res.status(500).json({ error: 'Failed to load player details.' });
  }
});

// Manual Kill Update (Section 8: Store total kills as official score)
adminRouter.patch('/players/:id/kills', (req: Request, res: Response): void => {
  try {
    const { newKills, reason } = req.body;
    const adminUser = (req as any).adminUser || 'Admin';

    if (newKills === undefined || isNaN(parseInt(newKills, 10))) {
      res.status(400).json({ error: 'A valid kill count number is required.' });
      return;
    }

    const killsNum = parseInt(newKills, 10);
    if (killsNum < 0) {
      res.status(400).json({ error: 'Kill count must be a non-negative integer.' });
      return;
    }

    const result = db.updatePlayerKills(req.params.id, killsNum, reason || 'Referee score adjustment', adminUser);
    if (!result.success) {
      res.status(400).json({ error: result.error || 'Failed to update player kills.' });
      return;
    }

    res.json({
      message: `Player kills updated to ${killsNum} successfully.`,
      player: result.player
    });
  } catch (err) {
    console.error('Update kills error:', err);
    res.status(500).json({ error: 'Failed to update player kills.' });
  }
});

// Player Status Change (Section 9: Eliminated / Disqualified / Restored)
adminRouter.patch('/players/:id/status', (req: Request, res: Response): void => {
  try {
    const { status, reason } = req.body;
    const adminUser = (req as any).adminUser || 'Admin';

    if (!['Active', 'Eliminated', 'Disqualified', 'Registered'].includes(status)) {
      res.status(400).json({ error: 'Invalid player status provided.' });
      return;
    }

    if (status === 'Disqualified' && (!reason || reason.trim().length === 0)) {
      res.status(400).json({ error: 'A specific reason is required to disqualify a player.' });
      return;
    }

    const result = db.updatePlayerStatus(req.params.id, status, reason, adminUser);
    if (!result.success) {
      res.status(400).json({ error: result.error || 'Failed to update player status.' });
      return;
    }

    res.json({
      message: `Player status changed to ${status}.`,
      player: result.player
    });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update player status.' });
  }
});

// Move player to another room
adminRouter.patch('/players/:id/room', (req: Request, res: Response): void => {
  try {
    const { targetRoomNumber } = req.body;
    const adminUser = (req as any).adminUser || 'Admin';
    const roomNum = parseInt(targetRoomNumber, 10);

    if (isNaN(roomNum) || roomNum < 1) {
      res.status(400).json({ error: 'Valid target room number is required.' });
      return;
    }

    const result = db.movePlayerRoom(req.params.id, roomNum, adminUser);
    if (!result.success) {
      res.status(400).json({ error: result.error || 'Failed to move player to room.' });
      return;
    }

    res.json({
      message: `Player moved to Room ${roomNum} successfully.`,
      player: result.player
    });
  } catch (err) {
    console.error('Move room error:', err);
    res.status(500).json({ error: 'Failed to move player to another room.' });
  }
});

// Update permitted player details
adminRouter.patch('/players/:id', (req: Request, res: Response): void => {
  try {
    const { playerName, freeFireName, mobileNumber } = req.body;
    const result = db.updatePlayerDetails(req.params.id, {
      playerName,
      freeFireName,
      mobileNumber
    });

    if (!result.success) {
      res.status(400).json({ error: result.error || 'Failed to update player.' });
      return;
    }

    res.json({
      message: 'Player information updated successfully.',
      player: result.player
    });
  } catch (err) {
    console.error('Update player error:', err);
    res.status(500).json({ error: 'Failed to update player information.' });
  }
});

// Delete player registration
adminRouter.delete('/players/:id', (req: Request, res: Response): void => {
  try {
    const result = db.deletePlayer(req.params.id);
    if (!result.success) {
      res.status(404).json({ error: result.error || 'Player not found.' });
      return;
    }

    res.json({ message: 'Player registration deleted successfully.' });
  } catch (err) {
    console.error('Delete player error:', err);
    res.status(500).json({ error: 'Failed to delete player registration.' });
  }
});

// Rooms list
adminRouter.get('/rooms', (_req: Request, res: Response): void => {
  try {
    const rooms = db.getRooms();
    res.json({ rooms });
  } catch (err) {
    console.error('Rooms error:', err);
    res.status(500).json({ error: 'Failed to load rooms.' });
  }
});

// Update room
adminRouter.patch('/rooms/:id', (req: Request, res: Response): void => {
  try {
    const roomNumber = parseInt(req.params.id, 10);
    const { registrationOpen, capacity } = req.body;

    const updates: any = {};
    if (registrationOpen !== undefined) updates.registrationOpen = Boolean(registrationOpen);
    if (capacity !== undefined) updates.capacity = parseInt(capacity, 10);

    const updated = db.updateRoom(roomNumber, updates);
    if (!updated) {
      res.status(404).json({ error: `Room ${roomNumber} not found.` });
      return;
    }

    res.json({ message: `Room ${roomNumber} updated successfully.`, room: updated });
  } catch (err) {
    console.error('Update room error:', err);
    res.status(500).json({ error: 'Failed to update room.' });
  }
});

// Create new room
adminRouter.post('/rooms', (req: Request, res: Response): void => {
  try {
    const { capacity } = req.body;
    const room = db.addRoom(capacity ? parseInt(capacity, 10) : 48);
    res.status(201).json({
      message: `${room.roomName} created successfully with ${room.capacity} slots!`,
      room
    });
  } catch (err) {
    console.error('Create room error:', err);
    res.status(500).json({ error: 'Failed to create room.' });
  }
});

// Delete room
adminRouter.delete('/rooms/:id', (req: Request, res: Response): void => {
  try {
    const roomNumber = parseInt(req.params.id, 10);
    const result = db.deleteRoom(roomNumber);
    if (!result.success) {
      res.status(400).json({ error: result.error || 'Failed to delete room.' });
      return;
    }
    res.json({ message: `Room ${roomNumber} deleted successfully.` });
  } catch (err) {
    console.error('Delete room error:', err);
    res.status(500).json({ error: 'Failed to delete room.' });
  }
});

// MATCH COMMAND CENTER ENDPOINTS (Primary user feature request!)
// 1. START MATCH BUTTON
adminRouter.post('/tournament/match/start', (req: Request, res: Response): void => {
  try {
    const { roomNumber, durationMinutes, matchTitle } = req.body;
    const adminUser = (req as any).adminUser || 'Admin';

    const matchState = db.startMatch({
      roomNumber: roomNumber ? (roomNumber === 'ALL' ? 'ALL' : parseInt(roomNumber, 10)) : 'ALL',
      durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : 20,
      matchTitle,
      initiatedBy: adminUser
    });

    res.json({
      message: 'Match started! Live timer running.',
      matchState
    });
  } catch (err) {
    console.error('Start match error:', err);
    res.status(500).json({ error: 'Failed to start match.' });
  }
});

// 2. SET A TIME FOR A MATCH (Schedule Match)
adminRouter.post('/tournament/match/schedule', (req: Request, res: Response): void => {
  try {
    const { scheduledTime, matchTitle, roomNumber, durationMinutes } = req.body;
    const adminUser = (req as any).adminUser || 'Admin';

    if (!scheduledTime) {
      res.status(400).json({ error: 'Scheduled match time (ISO or valid date string) is required.' });
      return;
    }

    const parsedDate = new Date(scheduledTime);
    if (isNaN(parsedDate.getTime())) {
      res.status(400).json({ error: 'Invalid date/time format for match schedule.' });
      return;
    }

    const matchState = db.scheduleMatch({
      scheduledTime: parsedDate.toISOString(),
      matchTitle,
      roomNumber: roomNumber ? (roomNumber === 'ALL' ? 'ALL' : parseInt(roomNumber, 10)) : 'ALL',
      durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : 20,
      initiatedBy: adminUser
    });

    res.json({
      message: `Match scheduled for ${parsedDate.toLocaleString()}`,
      matchState
    });
  } catch (err) {
    console.error('Schedule match error:', err);
    res.status(500).json({ error: 'Failed to schedule match.' });
  }
});

// 3. PAUSE / RESUME MATCH
adminRouter.post('/tournament/match/pause', (req: Request, res: Response): void => {
  try {
    const adminUser = (req as any).adminUser || 'Admin';
    const matchState = db.pauseMatch(adminUser);
    res.json({
      message: matchState.status === 'PAUSED' ? 'Match paused.' : 'Match resumed.',
      matchState
    });
  } catch (err) {
    console.error('Pause match error:', err);
    res.status(500).json({ error: 'Failed to toggle match pause state.' });
  }
});

// 4. END MATCH
adminRouter.post('/tournament/match/end', (req: Request, res: Response): void => {
  try {
    const adminUser = (req as any).adminUser || 'Admin';
    const matchState = db.endMatch(adminUser);
    res.json({
      message: 'Match concluded and scores saved.',
      matchState
    });
  } catch (err) {
    console.error('End match error:', err);
    res.status(500).json({ error: 'Failed to end match.' });
  }
});

// Update Tournament Settings
adminRouter.patch('/tournament/settings', (req: Request, res: Response): void => {
  try {
    const updated = db.updateSettings(req.body);
    res.json({
      message: 'Tournament settings updated successfully.',
      settings: updated
    });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Failed to update tournament settings.' });
  }
});

// Audit Logs
adminRouter.get('/audit-logs', (_req: Request, res: Response): void => {
  try {
    const audits = db.getAudits();
    res.json(audits);
  } catch (err) {
    console.error('Audits error:', err);
    res.status(500).json({ error: 'Failed to load audit logs.' });
  }
});

// Export Reports Data
adminRouter.get('/reports', (req: Request, res: Response): void => {
  try {
    const format = req.query.format || 'json';
    const players = db.getPlayers().map(p => {
      const { passwordHash: _, ...sanitized } = p;
      return sanitized;
    });
    const leaderboard = db.getLeaderboard();
    const rooms = db.getRooms();
    const settings = db.getSettings();

    if (format === 'csv') {
      const header = 'RegistrationNumber,PlayerName,FreeFireName,FreeFireUID,MobileNumber,Room,TotalKills,Status,RegistrationDate\n';
      const rows = players.map(p =>
        `"${p.registrationNumber}","${p.playerName}","${p.freeFireName}","${p.freeFireUID}","${p.mobileNumber}","${p.roomName}",${p.totalKills},"${p.status}","${p.registrationDate}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="freefire_tournament_players.csv"');
      res.send(header + rows);
      return;
    }

    res.json({
      players,
      leaderboard,
      rooms,
      settings
    });
  } catch (err) {
    console.error('Reports error:', err);
    res.status(500).json({ error: 'Failed to generate tournament report.' });
  }
});

// Seed demo players for testing
adminRouter.post('/seed-demo', (_req: Request, res: Response): void => {
  try {
    const result = db.seedDemoData();
    res.json({
      message: `Seeded ${result.count} demo tournament players across 10 rooms with kills and stats!`,
      stats: db.getDashboardStats()
    });
  } catch (err) {
    console.error('Seed demo error:', err);
    res.status(500).json({ error: 'Failed to seed demo data.' });
  }
});

// Reset tournament data
adminRouter.post('/reset', (_req: Request, res: Response): void => {
  try {
    db.resetAllData();
    res.json({
      message: 'Tournament database reset to clean initial state.',
      stats: db.getDashboardStats()
    });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ error: 'Failed to reset tournament data.' });
  }
});
