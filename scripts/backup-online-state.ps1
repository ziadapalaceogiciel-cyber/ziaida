# Sauvegarde quotidienne des données du serveur en ligne (Render + MongoDB Atlas).
# MongoDB Atlas en offre gratuite (M0) ne fait pas de sauvegarde automatique — ce script
# télécharge l'état complet de l'hôtel et le garde en fichiers datés sur ce PC.
#
# Utilisation manuelle : clic droit > "Exécuter avec PowerShell" ou double-clic si l'association
# .ps1 le permet. Utilisation automatique : voir scripts/install-backup-task.ps1.

$ErrorActionPreference = "Stop"

$ApiUrl = "https://ziaida.onrender.com/api/state"
$ApiKey = "b516736c4bcf1ab499738e45eefc1357"
$BackupDir = Join-Path $PSScriptRoot "..\backups"
$MaxBackups = 60

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$outFile = Join-Path $BackupDir "ziada-backup-$timestamp.json"

try {
    Invoke-RestMethod -Uri $ApiUrl -Headers @{ "X-Api-Key" = $ApiKey } -OutFile $outFile -TimeoutSec 30
    Write-Output "Sauvegarde enregistrée : $outFile"
} catch {
    Write-Output "ECHEC de la sauvegarde : $($_.Exception.Message)"
    exit 1
}

# Garde uniquement les $MaxBackups sauvegardes les plus récentes pour ne pas remplir le disque.
Get-ChildItem $BackupDir -Filter "ziada-backup-*.json" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -Skip $MaxBackups |
    Remove-Item -Force
