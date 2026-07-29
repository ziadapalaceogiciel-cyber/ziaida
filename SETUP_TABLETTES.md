# Installation des tablettes en chambre — mode kiosque

## 1. Installer l'app

Copier le fichier `.apk` généré (`tablet/android/app/build/outputs/apk/...`) sur la tablette
et l'installer (autoriser "sources inconnues" dans les réglages Android si demandé).

## 2. Verrouiller la tablette sur l'app (mode kiosque)

### Option simple — Épinglage d'écran (intégré à Android, aucun outil requis)

1. Réglages → Sécurité → **Épinglage de l'écran** → Activer.
2. Ouvrir l'app Ziaida Palace Tablette.
3. Appuyer sur le bouton "Aperçu des applications récentes", puis sur l'icône de l'app en
   haut → **Épingler**.
4. La tablette reste bloquée sur l'app ; pour en sortir, il faut le mot de passe admin
   (déjà géré par le bouton "Sortie mode tablette" dans l'app elle-même).

Cette option suffit pour la plupart des hôtels — à faire une fois par tablette à l'installation.

### Option avancée — Verrouillage géré (pour ne pas avoir à le refaire à chaque redémarrage)

Réservé à un technicien à l'aise avec `adb` :

1. Sur une tablette neuve, **avant** de connecter un compte Google :
   ```
   adb shell dm set-device-owner ma.ziadapalace.pms.tablet/.MainActivity
   ```
2. Cela permet à l'app d'activer le verrouillage automatiquement à chaque démarrage
   (nécessite un petit plugin natif Android supplémentaire — à prévoir si cette option
   est retenue).

## 3. Lancement automatique après coupure de courant

Déjà géré par l'app (`BootReceiver`) : la tablette relance l'app automatiquement après un
redémarrage, sans intervention du personnel.

## 4. Associer la tablette à sa chambre

Au premier lancement, utiliser le bouton "Mode tablette" de l'écran de connexion, choisir le
numéro de chambre, entrer le mot de passe admin. La tablette garde cette association même
après redémarrage.
