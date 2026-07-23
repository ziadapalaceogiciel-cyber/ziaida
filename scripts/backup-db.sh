#!/bin/sh
# Sauvegarde quotidienne de la base (fichier SQLite dans le volume app_data).
# À planifier sur le VPS via cron, ex: 0 3 * * * /chemin/scripts/backup-db.sh

set -e
BACKUP_DIR="${BACKUP_DIR:-/backups}"
STAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"
docker compose exec -T app sh -c "cat /app/data/ziada-palace.db" | gzip > "$BACKUP_DIR/ziada-palace_$STAMP.db.gz"

# Garde 30 jours de sauvegardes
find "$BACKUP_DIR" -name "ziada-palace_*.db.gz" -mtime +30 -delete

echo "Sauvegarde créée : $BACKUP_DIR/ziada-palace_$STAMP.db.gz"
