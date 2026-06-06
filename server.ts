/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'wellness_db.json');

// Initialize database file if not exists
function initDatabase() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const defaultData = {
      moodLogs: [],
      loggedTriggers: [],
      reflections: [],
      streakCount: 0,
      lastReflectedDate: null,
      selectedExams: ['NEET', 'JEE', 'Boards']
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
  }
}

async function startServer() {
  initDatabase();
  const app = express();
  
  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));

  // --- API ROUTE: Get full state payload from DB ---
  app.get('/api/wellness', (req, res) => {
    try {
      if (!fs.existsSync(DB_FILE)) {
        initDatabase();
      }
      const rawData = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(rawData);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Error reading wellness DB:', error);
      res.status(500).json({ success: false, error: 'Database read error' });
    }
  });

  // --- API ROUTE: Save/Synchronize state payload to DB ---
  app.post('/api/wellness', (req, res) => {
    try {
      const payload = req.body;
      if (!payload) {
        return res.status(400).json({ success: false, error: 'Empty payload' });
      }
      
      // Perform an atomic write to prevent any data loss or corruption
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(payload, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
      
      res.json({ success: true, message: 'State synced to server database' });
    } catch (error: any) {
      console.error('Error saving to wellness DB:', error);
      res.status(500).json({ success: false, error: 'Database write error' });
    }
  });

  // Vite development or production build asset serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve index.html or fallback to SPA
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running dynamically on http://localhost:${PORT}`);
  });
}

startServer();
