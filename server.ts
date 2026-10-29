import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { authRouter } from './server/routes/auth.ts';
import { adminRouter } from './server/routes/admin.ts';
import { tournamentRouter } from './server/routes/tournament.ts';
import { dbEvents } from './server/db.ts';

import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getNetworkInfo(port: number) {
  const nets = os.networkInterfaces();
  const candidates: { ip: string; name: string; priority: number }[] = [];

  for (const name of Object.keys(nets)) {
    const netList = nets[name];
    if (!netList) continue;

    for (const net of netList) {
      if (net.family === 'IPv4' && !net.internal) {
        const isVirtual = /vmware|virtualbox|vbox|vethernet|loopback|pseudo/i.test(name);
        const isWifi = /wi-fi|wifi|wireless|wlan/i.test(name);
        const isEthernet = /ethernet/i.test(name) && !isVirtual;

        let priority = 1;
        if (isWifi) priority = 10;
        else if (isEthernet) priority = 8;
        else if (!isVirtual) priority = 5;
        else priority = 0;

        candidates.push({
          ip: net.address,
          name,
          priority
        });
      }
    }
  }

  candidates.sort((a, b) => b.priority - a.priority);

  const customAppUrl = process.env.APP_URL && !process.env.APP_URL.includes('MY_APP_URL') ? process.env.APP_URL : null;
  const defaultIp = candidates.length > 0 ? candidates[0].ip : '127.0.0.1';
  const defaultUrl = customAppUrl || `http://${defaultIp}:${port}`;

  return {
    lanIp: defaultIp,
    port,
    defaultUrl,
    candidates: candidates.map(c => ({ ip: c.ip, name: c.name }))
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Mount API endpoints
  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/tournament', tournamentRouter);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Network info for QR code scanning from mobile phones
  app.get('/api/network-info', (_req, res) => {
    res.json(getNetworkInfo(PORT));
  });

  // Real-time server events (SSE) for syncing all admin and client pages immediately
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const sendEvent = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    dbEvents.on('change', sendEvent);

    req.on('close', () => {
      dbEvents.off('change', sendEvent);
    });
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FF Tournament System] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
