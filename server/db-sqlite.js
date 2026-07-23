const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'ziada-palace.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS state_blob (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS account_auth (
    name TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

// Retire tout champ "pass" en clair d'un tableau de comptes avant stockage/envoi —
// le mot de passe ne doit plus jamais transiter par le blob d'état générique.
function stripPasswords(obj) {
  if (obj && Array.isArray(obj.accounts)) {
    obj.accounts = obj.accounts.map(a => {
      if (a && Object.prototype.hasOwnProperty.call(a, 'pass')) {
        const { pass, ...rest } = a;
        return rest;
      }
      return a;
    });
  }
  return obj;
}

async function setPassword(name, plainPassword) {
  const hash = bcrypt.hashSync(plainPassword, 10);
  db.prepare(
    `INSERT INTO account_auth (name, password_hash, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(name) DO UPDATE SET password_hash = excluded.password_hash, updated_at = excluded.updated_at`
  ).run(name.toLowerCase(), hash, new Date().toISOString());
}

async function verifyPassword(name, plainPassword) {
  const row = db.prepare('SELECT password_hash FROM account_auth WHERE name = ?').get(name.toLowerCase());
  if (!row) return false;
  return bcrypt.compareSync(plainPassword, row.password_hash);
}

async function hasPassword(name) {
  return !!db.prepare('SELECT 1 FROM account_auth WHERE name = ?').get(name.toLowerCase());
}

// Migration ponctuelle : si le blob existant contient encore des comptes avec
// un mot de passe en clair (ancien format), on les bascule vers account_auth
// (haché) puis on nettoie le blob. Ne fait rien si déjà propre.
async function migrateLegacyPasswords() {
  const row = db.prepare('SELECT data FROM state_blob WHERE id = 1').get();
  if (!row) return;
  let data;
  try { data = JSON.parse(row.data); } catch (e) { return; }
  if (!data || !Array.isArray(data.accounts)) return;
  let migrated = 0;
  for (const a of data.accounts) {
    if (a && a.pass) {
      await setPassword(a.name, a.pass);
      migrated++;
    }
  }
  if (migrated > 0) {
    stripPasswords(data);
    db.prepare('UPDATE state_blob SET data = ?, updated_at = ? WHERE id = 1')
      .run(JSON.stringify(data), new Date().toISOString());
    console.log('Migration mots de passe : ' + migrated + ' compte(s) migré(s) vers un stockage haché.');
  }
}

function getState() {
  const row = db.prepare('SELECT data FROM state_blob WHERE id = 1').get();
  return row ? row.data : '{}';
}

// Fusionne les nouvelles clés dans l'état existant (comme le fait déjà l'app
// côté client entre onglets : dernière écriture gagnante, clé par clé).
async function mergeState(incomingJsonText) {
  const current = JSON.parse(getState() || '{}');
  const incoming = stripPasswords(JSON.parse(incomingJsonText || '{}'));
  const merged = Object.assign({}, current, incoming);
  const text = JSON.stringify(merged);
  db.prepare(
    `INSERT INTO state_blob (id, data, updated_at) VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
  ).run(text, new Date().toISOString());
  return text;
}

async function connect() {
  await migrateLegacyPasswords();
  console.log('Base de données locale SQLite prête (' + path.join(dataDir, 'ziada-palace.db') + ').');
}

module.exports = { connect, getState, mergeState, setPassword, verifyPassword, hasPassword };
