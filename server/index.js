const path = require('path');
const fs = require('fs');
const express = require('express');
const { connect, getState, mergeState, setPassword, verifyPassword, hasPassword } = require('./db');

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || 'dev-local-key';
const PUBLIC_DIR = path.join(__dirname, 'public');

const app = express();
app.use(express.text({ type: '*/*', limit: '10mb' }));

const sseClients = new Map(); // clientId -> res

function requireApiKey(req, res, next) {
  const key = req.get('X-Api-Key') || req.query.apiKey;
  if (key !== API_KEY) return res.status(401).send('unauthorized');
  next();
}

// Sert index.html avec la clé API injectée (aucune ligne de l'app d'origine n'est modifiée,
// on ajoute juste une variable globale avant le premier script).
app.get('/', (req, res) => {
  const html = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'), 'utf8');
  const injected = html.replace('<head>', `<head>\n<script>window.__ZP_API_KEY__=${JSON.stringify(API_KEY)};</script>`);
  res.type('html').send(injected);
});

app.use(express.static(PUBLIC_DIR));

app.get('/api/state', requireApiKey, (req, res) => {
  res.type('application/json').send(getState());
});

app.put('/api/state', requireApiKey, async (req, res) => {
  const merged = await mergeState(req.body);
  const senderId = req.get('X-Client-Id');
  for (const [clientId, clientRes] of sseClients) {
    if (clientId === senderId) continue;
    clientRes.write(`data: ${merged}\n\n`);
  }
  res.status(204).end();
});

// --- authentification ---
// Limite simple les tentatives de connexion par compte (anti brute-force basique).
const loginAttempts = new Map(); // name (minuscule) -> { count, lockedUntil }
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

app.post('/api/login', requireApiKey, async (req, res) => {
  let body;
  try { body = JSON.parse(req.body || '{}'); } catch (e) { return res.status(400).json({ ok: false, error: 'invalid_body' }); }
  const name = String(body.name || '').trim();
  const password = String(body.password || '');
  if (!name || !password) return res.status(400).json({ ok: false, error: 'missing_fields' });

  const key = name.toLowerCase();
  const now = Date.now();
  const attempt = loginAttempts.get(key);
  if (attempt && attempt.lockedUntil && attempt.lockedUntil > now) {
    const minutes = Math.ceil((attempt.lockedUntil - now) / 60000);
    return res.status(429).json({ ok: false, error: 'locked', minutes });
  }

  let accounts = [];
  try { accounts = JSON.parse(getState() || '{}').accounts || []; } catch (e) {}
  const account = accounts.find(a => a.name && a.name.toLowerCase() === key);

  const valid = account && account.active !== false && await verifyPassword(name, password);
  if (!valid) {
    const next = { count: (attempt ? attempt.count : 0) + 1, lockedUntil: null };
    if (next.count >= MAX_ATTEMPTS) next.lockedUntil = now + LOCK_MS;
    loginAttempts.set(key, next);
    return res.status(401).json({ ok: false, error: 'invalid_credentials' });
  }

  loginAttempts.delete(key);
  res.json({ ok: true, name: account.name, role: account.role });
});

// Définit/réinitialise le mot de passe d'un compte (utilisé à la création d'un compte
// ou lors d'un changement de mot de passe). Protégé par la même clé API que le reste
// de la synchronisation — pas d'authentification par utilisateur individuel pour l'instant.
app.post('/api/accounts/password', requireApiKey, async (req, res) => {
  let body;
  try { body = JSON.parse(req.body || '{}'); } catch (e) { return res.status(400).json({ ok: false, error: 'invalid_body' }); }
  const name = String(body.name || '').trim();
  const password = String(body.password || '');
  if (!name || password.length < 6) return res.status(400).json({ ok: false, error: 'invalid_fields' });
  await setPassword(name, password);
  res.json({ ok: true });
});

app.get('/api/accounts/has-password', requireApiKey, async (req, res) => {
  const name = String(req.query.name || '').trim();
  res.json({ ok: true, hasPassword: name ? await hasPassword(name) : false });
});

app.get('/api/events', requireApiKey, (req, res) => {
  const clientId = req.query.clientId || Math.random().toString(36).slice(2);
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();
  sseClients.set(clientId, res);

  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(clientId);
  });
});

connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Ziada Palace PMS server listening on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Impossible de se connecter à MongoDB — arrêt du serveur.', err);
    process.exit(1);
  });
