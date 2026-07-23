const MONGODB_URI = process.env.MONGODB_URI;

// Deux moteurs de stockage possibles, derrière la même interface asynchrone :
// - MongoDB (Atlas) si MONGODB_URI est défini — utilisé en production (Render).
// - SQLite local (fichier) sinon — utilisé en développement local, zéro dépendance externe.
module.exports = MONGODB_URI ? require('./db-mongo') : require('./db-sqlite');
