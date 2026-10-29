import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.ts';
import { requirePlayer } from '../middleware/auth.ts';

export const authRouter = Router();

// Player Registration
authRouter.post('/register', (req: Request, res: Response): void => {
  try {
    const {
      playerName,
      freeFireName,
      freeFireUID,
      mobileNumber,
      roomNumber,
      agreeRules
    } = req.body;

    if (!agreeRules) {
      res.status(400).json({ error: 'You must agree to the tournament rules to register.' });
      return;
    }

    if (!playerName || playerName.trim().length < 2) {
      res.status(400).json({ error: 'Player Name must be at least 2 characters.' });
      return;
    }

    if (!freeFireName || freeFireName.trim().length < 2) {
      res.status(400).json({ error: 'Free Fire In-Game Name (IGN) is required.' });
      return;
    }

    if (!freeFireUID || !/^[0-9a-zA-Z]{6,16}$/.test(freeFireUID.trim())) {
      res.status(400).json({ error: 'Valid Free Fire UID / Player ID is required (6-16 characters/digits).' });
      return;
    }

    const roomNum = parseInt(roomNumber, 10);
    if (isNaN(roomNum) || roomNum < 1) {
      res.status(400).json({ error: 'Valid Room Number is required.' });
      return;
    }

    const result = db.registerPlayer({
      playerName: playerName.trim(),
      freeFireName: freeFireName.trim(),
      freeFireUID: freeFireUID.trim(),
      mobileNumber: mobileNumber ? mobileNumber.trim() : '',
      roomNumber: roomNum
    });

    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }

    const token = `player_token_${result.player!.id}_${Date.now()}`;

    res.status(201).json({
      message: 'Registration Successful!',
      player: result.player,
      token
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// Player Login / Pass Lookup (Login by Free Fire UID or Mobile)
authRouter.post('/login', (req: Request, res: Response): void => {
  try {
    const { loginId, freeFireUID, uid, password } = req.body;
    const identifier = (loginId || freeFireUID || uid || '').toString().trim();

    if (!identifier || identifier.length === 0) {
      res.status(400).json({ error: 'Please provide your Free Fire UID or registered Mobile Number.' });
      return;
    }

    const cleanId = identifier;
    // Search by Free Fire UID or Mobile
    let player = db.getPlayerByUID(cleanId);
    if (!player) {
      player = db.getPlayerByMobile(cleanId);
    }

    if (!player) {
      res.status(401).json({ error: `No player found with Free Fire UID / Contact "${cleanId}".` });
      return;
    }

    // If password provided and player has custom password, verify it; otherwise grant access
    if (password && password.trim().length > 0 && player.passwordHash) {
      const isValid = bcrypt.compareSync(password, player.passwordHash) || password === player.freeFireUID;
      if (!isValid) {
        res.status(401).json({ error: 'Incorrect website password.' });
        return;
      }
    }

    const token = `player_token_${player.id}_${Date.now()}`;
    const { passwordHash: _, ...sanitized } = player;

    // Attach rank
    const leaderboard = db.getLeaderboard();
    const rankEntry = leaderboard.find(l => l.player.id === player!.id);

    res.json({
      message: 'Login successful',
      token,
      player: {
        ...sanitized,
        rank: rankEntry ? rankEntry.rank : undefined
      }
    });
  } catch (err) {
    console.error('Player login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Admin Login
authRouter.post('/admin/login', (req: Request, res: Response): void => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required.' });
      return;
    }

    const admin = db.getAdminByUsername(username.trim());
    if (!admin) {
      res.status(401).json({ error: 'Invalid admin credentials.' });
      return;
    }

    const isValid = bcrypt.compareSync(password, admin.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid admin credentials.' });
      return;
    }

    const token = `admin_token_${admin.username}_${Date.now()}`;

    res.json({
      message: 'Admin authenticated successfully',
      token,
      user: {
        id: admin.id,
        username: admin.username,
        role: admin.role
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Internal server error during admin login.' });
  }
});

// Player profile
authRouter.get('/players/me', requirePlayer, (req: Request, res: Response): void => {
  const player = (req as any).player;
  const { passwordHash: _, ...sanitized } = player;
  
  // Calculate current rank
  const leaderboard = db.getLeaderboard();
  const rankEntry = leaderboard.find(l => l.player.id === player.id);
  const room = db.getRoom(player.roomId);
  const settings = db.getSettings();

  res.json({
    player: {
      ...sanitized,
      rank: rankEntry ? rankEntry.rank : 0
    },
    room,
    matchState: settings.matchState,
    tournamentStatus: settings.tournamentStatus
  });
});
