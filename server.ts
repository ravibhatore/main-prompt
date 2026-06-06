/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
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

// Simple helper to HTML-escape string fields to prevent stored cross-site scripting (XSS)
function escapeHtml(str: string): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Full strict structural validation & sanitization for payload model schema
function validateAndSanitizePayload(body: any): any {
  if (typeof body !== 'object' || body === null) {
    throw new Error('Payload must be a non-null object');
  }

  const sanitized: any = {};

  // Validate streakCount (strictly number >= 0)
  sanitized.streakCount = Math.max(0, parseInt(body.streakCount, 10) || 0);

  // Validate lastReflectedDate (yyyy-mm-dd check)
  if (body.lastReflectedDate === null || body.lastReflectedDate === undefined) {
    sanitized.lastReflectedDate = null;
  } else {
    const rawDate = String(body.lastReflectedDate).trim();
    sanitized.lastReflectedDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : null;
  }

  // Validate selectedExams (must be safe strings)
  if (Array.isArray(body.selectedExams)) {
    sanitized.selectedExams = body.selectedExams
      .filter((e: any) => typeof e === 'string')
      .map((e: string) => escapeHtml(e.trim()).slice(0, 50));
  } else {
    sanitized.selectedExams = ['NEET', 'JEE', 'Boards'];
  }

  // Validate moodLogs with sanitization on textual journal comments
  if (Array.isArray(body.moodLogs)) {
    sanitized.moodLogs = body.moodLogs
      .filter((m: any) => m && typeof m === 'object')
      .map((m: any) => ({
        id: typeof m.id === 'string' ? escapeHtml(m.id).slice(0, 50) : String(Math.random()),
        date: typeof m.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(m.date) ? m.date : new Date().toISOString().slice(0, 10),
        mood: Math.min(5, Math.max(1, parseInt(m.mood, 10) || 3)),
        journal: typeof m.journal === 'string' ? escapeHtml(m.journal).slice(0, 1000) : null,
        timestamp: typeof m.timestamp === 'number' && !isNaN(m.timestamp) ? m.timestamp : Date.now(),
      }));
  } else {
    sanitized.moodLogs = [];
  }

  // Validate loggedTriggers and limit categories list
  if (Array.isArray(body.loggedTriggers)) {
    sanitized.loggedTriggers = body.loggedTriggers
      .filter((t: any) => t && typeof t === 'object')
      .map((t: any) => ({
        id: typeof t.id === 'string' ? escapeHtml(t.id).slice(0, 50) : String(Math.random()),
        date: typeof t.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.date) ? t.date : new Date().toISOString().slice(0, 10),
        categories: Array.isArray(t.categories)
          ? t.categories.filter((cat: any) => typeof cat === 'string').map((cat: string) => escapeHtml(cat).slice(0, 100))
          : [],
        customTrigger: typeof t.customTrigger === 'string' ? escapeHtml(t.customTrigger).slice(0, 500) : undefined,
        timestamp: typeof t.timestamp === 'number' && !isNaN(t.timestamp) ? t.timestamp : Date.now(),
      }));
  } else {
    sanitized.loggedTriggers = [];
  }

  // Validate emotional reflections history
  if (Array.isArray(body.reflections)) {
    sanitized.reflections = body.reflections
      .filter((r: any) => r && typeof r === 'object')
      .map((r: any) => ({
        id: typeof r.id === 'string' ? escapeHtml(r.id).slice(0, 50) : String(Math.random()),
        date: typeof r.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.date) ? r.date : new Date().toISOString().slice(0, 10),
        hardToday: typeof r.hardToday === 'string' ? escapeHtml(r.hardToday).slice(0, 1000) : '',
        managedWell: typeof r.managedWell === 'string' ? escapeHtml(r.managedWell).slice(0, 1000) : '',
        tomorrowWill: typeof r.tomorrowWill === 'string' ? escapeHtml(r.tomorrowWill).slice(0, 1000) : '',
        timestamp: typeof r.timestamp === 'number' && !isNaN(r.timestamp) ? r.timestamp : Date.now(),
      }));
  } else {
    sanitized.reflections = [];
  }

  return sanitized;
}

// Lightweight rate limiting implementation in memory to defend wellness database from spam / DoS
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // Max 60 API requests per minute IP limit

function apiRateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  
  let record = ipRequestCounts.get(ip);
  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };
  }
  
  record.count++;
  ipRequestCounts.set(ip, record);
  
  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({ success: false, error: 'Too many requests. Please cool down for a bit.' });
  }
  next();
}

async function startServer() {
  initDatabase();
  const app = express();
  
  // Apply Helmet HTTP headers defense
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://images.unsplash.com"],
        connectSrc: ["'self'", "ws:", "wss:"],
      }
    },
    crossOriginEmbedderPolicy: false,
  }));

  // Body parsing middleware (reasonable size limit to shield RAM exhaustion vectors)
  app.use(express.json({ limit: '1.5mb' }));

  // Gracefully handle malformed raw JSON body parsing errors to avoid stack trace leaks
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof SyntaxError && 'status' in err && err.status === 400) {
      return res.status(400).json({ success: false, error: 'Malformed JSON payload request.' });
    }
    next();
  });

  // --- API ROUTE: Get full state payload from DB ---
  app.get('/api/wellness', apiRateLimiter, (req, res) => {
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
  app.post('/api/wellness', apiRateLimiter, (req, res) => {
    try {
      if (!req.body) {
        return res.status(400).json({ success: false, error: 'Missing sync payload' });
      }
      
      // Perform strict validation & sanitization
      const sanitizedPayload = validateAndSanitizePayload(req.body);
      
      // Perform an atomic write to prevent any data loss or corruption
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(sanitizedPayload, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
      
      res.json({ success: true, message: 'State synced to server database' });
    } catch (error: any) {
      console.error('Error saving to wellness DB:', error);
      res.status(500).json({ success: false, error: error.message || 'Database write error' });
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
