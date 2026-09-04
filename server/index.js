import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initStorage } from './db/storage.js';
import { initMysqlSync } from './db/mysqlSync.js';

import schedulesRouter from './routes/schedules.js';
import roomsRouter from './routes/rooms.js';
import eventsRouter from './routes/events.js';
import announcementsRouter from './routes/announcements.js';
import assignmentsRouter from './routes/assignments.js';
import systemRouter from './routes/system.js';
import agentRouter from './routes/agent.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize persistent storage (loads seeds on first run)
initStorage();
initMysqlSync();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/schedules', schedulesRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/assignments', assignmentsRouter);
app.use('/api/system', systemRouter);
app.use('/api/agent', agentRouter);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'CampusOS Backend & AI Agent',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static build if running in production or if dist exists
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback to index.html for React SPA router
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head><title>CampusOS</title></head>
        <body style="font-family:sans-serif;padding:2rem;text-align:center;">
          <h2>CampusOS API is running on port ${PORT}!</h2>
          <p>Frontend is currently running in development mode via Vite on <code>http://localhost:5173</code>.</p>
          <p>Or run <code>npm run build</code> to serve production assets from this port.</p>
        </body>
        </html>
      `);
    }
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 CampusOS Server & AI Agent running on: http://localhost:${PORT}`);
  console.log(`📡 API Endpoints active under /api/*`);
  console.log(`====================================================`);
});
