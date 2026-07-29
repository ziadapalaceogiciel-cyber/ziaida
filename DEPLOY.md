# Déploiement en ligne — Ziaida Palace PMS

## Prérequis

- Un VPS (Hetzner, DigitalOcean, OVH...) — 2 vCPU / 4 Go RAM suffisent largement.
- Docker et Docker Compose installés sur le VPS.
- Un nom de domaine avec un enregistrement DNS de type **A** pointant vers l'IP du VPS
  (ex: `pms.votredomaine.ma` → `123.45.67.89`).

## Étapes

1. Copier tout le dossier `ziadapalaceoriginal` sur le VPS (ex: `scp -r` ou `git clone` si le
   projet est poussé sur un dépôt).
2. Créer le fichier `.env` à partir de `.env.example` :
   ```
   cp .env.example .env
   ```
   Puis éditer `.env` :
   - `DOMAIN` → votre nom de domaine.
   - `API_KEY` → générer une vraie valeur secrète avec `openssl rand -base64 32`.
3. Démarrer :
   ```
   docker compose up -d --build
   ```
4. Caddy obtient automatiquement un certificat HTTPS (Let's Encrypt) pour votre domaine —
   aucune configuration manuelle nécessaire, ça peut prendre 1-2 minutes au premier démarrage.
5. Vérifier : `https://votredomaine.ma` doit afficher l'écran de connexion de l'app.

## Pointer les apps installées vers le serveur en ligne

- **App Windows (Electron)** : au lancement, définir la variable d'environnement
  `ELECTRON_APP_URL=https://votredomaine.ma` avant de démarrer l'app (ou reconstruire
  l'installeur avec cette valeur — voir `electron/main.js`).
- **App tablette (Android)** : dans `tablet/capacitor.config.ts`, définir
  `CAPACITOR_APP_URL=https://votredomaine.ma` avant de lancer `npx cap sync android`,
  puis reconstruire l'APK.
- Les deux apps doivent utiliser une URL **https://** — jamais http:// une fois en ligne.

## Sauvegardes

Planifier `scripts/backup-db.sh` en cron quotidien sur le VPS :
```
0 3 * * * cd /chemin/vers/ziadapalaceoriginal && BACKUP_DIR=/backups ./scripts/backup-db.sh
```

Restauration :
```
gunzip -c /backups/ziada-palace_XXXXXXXX.db.gz > /tmp/restore.db
docker compose cp /tmp/restore.db app:/app/data/ziada-palace.db
docker compose restart app
```

## Sécurité

- Le port de la base de données n'est **jamais** exposé publiquement (le service `app` n'a
  qu'un `expose: 3000` interne à Docker, aucun `ports:` public — seul Caddy est exposé sur 80/443).
- L'API `/api/state` et `/api/events` exigent la clé `API_KEY` — sans elle, tout appel renvoie 401.
- Les comptes utilisateurs restent gérés comme dans le prototype d'origine (menu Réglages,
  mots de passe stockés tels quels dans les données de l'app) — c'est un choix délibéré pour
  garder le comportement 100% identique au design validé. Si le nombre d'utilisateurs ou la
  sensibilité des données augmente, il faudra revoir ce point (hachage des mots de passe côté
  serveur) — à en rediscuter avant une mise en production à grande échelle.
