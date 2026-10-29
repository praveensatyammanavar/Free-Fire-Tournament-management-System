import { Router, Request, Response } from 'express';
import { db } from '../db.ts';

export const tournamentRouter = Router();

// Public tournament info: settings, rooms summary, stats, match status
tournamentRouter.get('/public-info', (req: Request, res: Response): void => {
  try {
    const settings = db.getSettings();
    const rooms = db.getRooms();
    const stats = db.getDashboardStats();

    res.json({
      settings,
      rooms,
      stats,
      matchState: settings.matchState
    });
  } catch (err) {
    console.error('Public info error:', err);
    res.status(500).json({ error: 'Failed to fetch tournament public information.' });
  }
});

// Room details
tournamentRouter.get('/rooms/:id', (req: Request, res: Response): void => {
  try {
    const roomNumber = parseInt(req.params.id, 10);
    if (isNaN(roomNumber)) {
      res.status(400).json({ error: 'Invalid room number.' });
      return;
    }

    const room = db.getRoom(roomNumber);
    if (!room) {
      res.status(404).json({ error: `Room ${roomNumber} not found.` });
      return;
    }

    const allPlayers = db.getPlayers();
    const roomPlayers = allPlayers
      .filter(p => p.roomId === roomNumber)
      .map(p => {
        const { passwordHash: _, mobileNumber: __, ...publicPlayer } = p;
        return publicPlayer;
      });

    res.json({
      room,
      players: roomPlayers,
      totalRegistered: roomPlayers.length,
      availableSeats: Math.max(0, room.capacity - roomPlayers.length)
    });
  } catch (err) {
    console.error('Room error:', err);
    res.status(500).json({ error: 'Failed to fetch room details.' });
  }
});

// Public Leaderboard
tournamentRouter.get('/leaderboard', (req: Request, res: Response): void => {
  try {
    const room = req.query.room ? parseInt(req.query.room as string, 10) : undefined;
    const leaderboard = db.getLeaderboard(room);
    const settings = db.getSettings();

    res.json({
      leaderboard,
      tournamentStatus: settings.tournamentStatus,
      matchState: settings.matchState,
      tieBreakingRule: settings.tieBreakingRule
    });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard.' });
  }
});

// Live Match Status & Elapsed / Remaining time
tournamentRouter.get('/match-status', (req: Request, res: Response): void => {
  try {
    const settings = db.getSettings();
    const state = settings.matchState;
    let elapsedSeconds = 0;
    let remainingSeconds = 0;

    if (state.isLive && state.startedAt) {
      const startMs = new Date(state.startedAt).getTime();
      const nowMs = Date.now();
      elapsedSeconds = Math.max(0, Math.floor((nowMs - startMs) / 1000));
      const totalSec = state.durationMinutes * 60;
      remainingSeconds = Math.max(0, totalSec - elapsedSeconds);
    } else if (state.scheduledTime) {
      const schedMs = new Date(state.scheduledTime).getTime();
      const nowMs = Date.now();
      remainingSeconds = Math.max(0, Math.floor((schedMs - nowMs) / 1000));
    }

    res.json({
      ...state,
      elapsedSeconds,
      remainingSeconds
    });
  } catch (err) {
    console.error('Match status error:', err);
    res.status(500).json({ error: 'Failed to fetch match status.' });
  }
});
