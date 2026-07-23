const dns = require('dns');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// Certains résolveurs DNS (notamment sur Windows en développement local) échouent sur les
// requêtes SRV utilisées par les URI mongodb+srv://. On force des résolveurs publics fiables
// pour cette recherche uniquement — n'affecte pas le reste de l'application.
dns.setServers(['8.8.8.8', '1.1.1.1']);

const MONGODB_URI = process.env.MONGODB_URI;

const client = new MongoClient(MONGODB_URI);
let stateColl;
let authColl;

// Cache en mémoire de l'état courant — mis à jour à chaque écriture, lu de façon
// synchrone par getState() (utilisé par des routes qui ne peuvent pas attendre).
let cachedStateText = '{}';

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
  await authColl.updateOne(
    { name: name.toLowerCase() },
    { $set: { name: name.toLowerCase(), passwordHash: hash, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );
}

async function verifyPassword(name, plainPassword) {
  const row = await authColl.findOne({ name: name.toLowerCase() });
  if (!row) return false;
  return bcrypt.compareSync(plainPassword, row.passwordHash);
}

async function hasPassword(name) {
  const row = await authColl.findOne({ name: name.toLowerCase() });
  return !!row;
}

function getState() {
  return cachedStateText;
}

async function writeState(text) {
  cachedStateText = text;
  await stateColl.updateOne(
    { _id: 'blob' },
    { $set: { data: text, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );
}

// Fusionne les nouvelles clés dans l'état existant (comme le fait déjà l'app
// côté client entre onglets : dernière écriture gagnante, clé par clé).
async function mergeState(incomingJsonText) {
  const current = JSON.parse(getState() || '{}');
  const incoming = stripPasswords(JSON.parse(incomingJsonText || '{}'));
  const merged = Object.assign({}, current, incoming);
  const text = JSON.stringify(merged);
  await writeState(text);
  return text;
}

// Migration ponctuelle : si le blob existant contient encore des comptes avec
// un mot de passe en clair (ancien format), on les bascule vers account_auth
// (haché) puis on nettoie le blob. Ne fait rien si déjà propre.
async function migrateLegacyPasswords() {
  let data;
  try { data = JSON.parse(cachedStateText || '{}'); } catch (e) { return; }
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
    await writeState(JSON.stringify(data));
    console.log('Migration mots de passe : ' + migrated + ' compte(s) migré(s) vers un stockage haché.');
  }
}

async function connect() {
  await client.connect();
  const db = client.db('ziada_palace');
  stateColl = db.collection('state');
  authColl = db.collection('account_auth');
  await authColl.createIndex({ name: 1 }, { unique: true });
  const doc = await stateColl.findOne({ _id: 'blob' });
  if (doc && doc.data) cachedStateText = doc.data;
  await migrateLegacyPasswords();
  console.log('Connecté à MongoDB Atlas.');
}

module.exports = { connect, getState, mergeState, setPassword, verifyPassword, hasPassword };
