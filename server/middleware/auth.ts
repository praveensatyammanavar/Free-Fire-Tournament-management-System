import { Request, Response, NextFunction } from 'express';
import { db } from '../db.ts';

// Simple lightweight signed token simulation (no external secret configuration barrier)
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized. Admin authentication token required.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  // Format: "admin_token_<username>_<timestamp>"
  if (!token.startsWith('admin_token_')) {
    res.status(403).json({ error: 'Forbidden. Admin credentials required.' });
    return;
  }

  const parts = token.split('_');
  const username = parts[2] || 'admin';
  const admin = db.getAdminByUsername(username);
  if (!admin) {
    res.status(403).json({ error: 'Admin account not found.' });
    return;
  }

  (req as any).adminUser = username;
  next();
}

export function requirePlayer(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized. Player token required.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  // Format: "player_token_<playerId>_<timestamp>"
  if (!token.startsWith('player_token_')) {
    res.status(403).json({ error: 'Forbidden. Invalid player session.' });
    return;
  }

  const parts = token.split('_');
  const playerId = parts[2];
  const player = db.getPlayerById(playerId);
  if (!player) {
    res.status(404).json({ error: 'Player account not found or deleted.' });
    return;
  }

  (req as any).player = player;
  next();
}
