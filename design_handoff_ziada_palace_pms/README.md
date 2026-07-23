# Handoff : ZIADA PALACE PMS — Système de gestion hôtelière

## Overview
Prototype complet d'un PMS (Property Management System) pour l'hôtel **Ziada Palace & Spa** (Benslimane, Maroc). Il couvre tout le cycle hôtelier : réservations, check-in/check-out, facturation, chambres, clients, restaurant, spa, piscine, housekeeping, maintenance, stock, personnel, comptabilité, rapports, réglages admin — plus un **mode tablette en chambre** pour les clients.

**Objectif de la phase suivante (votre mission)** : transformer ce prototype en application de production multi-postes avec un **serveur central et une base de données partagée** (PC réception + tablettes dans les chambres sur le réseau de l'hôtel).

## About the Design Files
Le fichier `ZIADA PALACE PMS.dc.html` est une **référence de design créée en HTML** — un prototype fonctionnel montrant l'apparence ET le comportement attendus. Ce n'est pas du code de production à copier tel quel. Votre tâche : **recréer ce design dans un vrai environnement** (recommandation : React + Node.js/Express + PostgreSQL ou SQLite, ou tout stack équivalent), en remplaçant le stockage `localStorage` par une API REST/WebSocket sur serveur central.

Le prototype est un composant unique (`class Component`) avec :
- un gros objet d'état (state) contenant toutes les données métier,
- une persistance `localStorage` (clé `zp-pms-data-v1`),
- une synchronisation inter-onglets via l'événement `storage` (à remplacer par WebSocket/polling serveur).

## Fidelity
**High-fidelity (hifi)** : couleurs, typographies, espacements, copies et interactions sont finaux. Recréer l'UI fidèlement.

## Architecture cible (demandée par le client)
1. **Serveur central** (petit PC/NAS dans l'hôtel ou VPS) : base de données unique + API.
2. **Postes de travail** (réception, direction, services) : app web accessible par navigateur, connexion par compte (nom + mot de passe) créé par l'admin, chaque rôle voyant uniquement son espace.
3. **Tablettes en chambre** : même app en « mode tablette », verrouillée sur une chambre (kiosque), sans accès au menu du personnel. Sortie du mode uniquement par mot de passe admin.
4. **Temps réel** : check-in fait à la réception → la tablette de la chambre affiche immédiatement « Bienvenue, [client] » ; demandes tablette → notification au service concerné + ajout automatique sur la note du séjour.

## Screens / Views (18 espaces)

### 1. Connexion
- Écran scindé : gauche = fond dégradé vert (`linear-gradient(135deg,#0E2A1D,#123524 55%,#1B4531)`) avec logo (assets/logo.svg, 280px) + « Property Management System » ; droite = panneau crème `#F7F3E9` (520px).
- Connexion par **compte** (nom d'utilisateur + mot de passe) ; les comptes sont créés par l'admin avec un rôle/espace assigné. Compte admin par défaut : mot de passe `admin2026`.
- Bouton discret « Mode tablette » : choisir une chambre + mot de passe admin → bascule l'appareil en interface client.

### 2. Tableau de bord
- 4 KPI (occupation %, CA jour, arrivées/départs, chambres à nettoyer) — cartes blanches, bord `#E2DAC6`, rayon 8px, chiffres en Cormorant Garamond 34px.
- État des chambres (6 compteurs colorés), arrivées & départs du jour avec boutons d'action, barres CA par service, alertes, réservations récentes, encart sombre « Activités du jour ».

### 3. Calendrier
- Grille chambres × jours, navigation libre sur tous les mois/années (flèches + « Aujourd'hui »).
- Cellules : vert `#2E7D57` = en séjour, doré `#BA8D48` = réservée, crème = libre. Clic cellule occupée → détail de la réservation (avec « réservé par »).

### 4. Nouvelle réservation
- Formulaire (client existant ou nouveau, dates JJ/MM/AAAA, type/chambre disponible, adultes/enfants, source, réduction %, acompte, notes) + panneau récapitulatif sombre avec total (nuitées, TVA 10 %, taxe de séjour 30 MAD/adulte/nuit).
- Après confirmation : confirmation imprimable + reçu d'acompte ; la réservation est traçée (« réservé par [utilisateur] »).

### 5. Check-in
- Liste des arrivées attendues → fiche : document d'identité (pré-rempli si client connu), occupants, heure, dépôt de garantie, demandes, case « fiche de police signée » (obligatoire). Fiche de police imprimable.
- Confirme → chambre occupée, séjour actif, tablette de la chambre liée au client.

### 6. Séjours en cours
- Par client : note détaillée (nuitées + consommations), boutons rapides d'ajout (dîner, spa, minibar…), prolonger d'une nuit, aller au check-out.

### 7. Check-out & facture
- Facture détaillée (hébergement, consommations par service, TVA, taxe de séjour, acompte déduit, solde), mode de paiement, encaisser & clôturer (chambre → sale + tâche ménage auto), imprimer/email.

### 8. Chambres
- Filtres par statut (7 statuts avec couleurs : libre `#2E7D57`, occupée `#8C3B32`, réservée `#BA8D48`, sale `#B36B24`, nettoyage `#3E6FA8`, maintenance `#6B7568`, HS `#3A3A3A`), grille par étage, panneau latéral (statut, équipements, historique). Admin : ajouter/modifier/supprimer chambres, types, prix (tarifs par type + saisons + % week-end dans Réglages).

### 9. Clients
- Recherche, table (contact, séjours, dépenses, VIP), fiche complète : préférences, fidélité, **historique des séjours** avec détail et **reçu réimprimable** pour chaque séjour passé (avec aperçu avant impression).

### 10. Restaurant
- Plan de salle (10 tables, statuts), prise de commande par menu (4 catégories), facturation directe ou sur chambre, réservations de table (heure/couverts), demandes tablette (menu + réservations) arrivent ici aussi.

### 11. Spa — planning du jour, carte des soins, réservation de séance (thérapeute, cabine, facturation directe ou sur chambre).

### 12. Piscine — entrées (visiteur 120 MAD, abonné, client hôtel inclus), planning des séances, registre.

### 13. Housekeeping — tâches (à faire → en cours → terminé → contrôlé), affectation agents, notes ; tâche créée automatiquement à chaque check-out et demande de ménage tablette.

### 14. Maintenance — interventions (priorité, technicien, coût, statut) ; créées automatiquement quand un client signale un problème via la tablette.

### 15. Stock & achats — inventaire par catégorie, seuils minimum avec alertes, ajustements, fournisseurs.

### 16. Personnel — équipes par département, présences, comptes actifs/inactifs.

### 17. Comptabilité & caisse — recettes/dépenses, filtres, journal imprimable, totaux jour/mois.

### 18. Rapports — CA par service, occupation, top clients.

### 19. Réglages (admin) — infos hôtel, TVA, taxe de séjour, heures check-in/out, devises, tarifs par type/saison/week-end, **gestion des comptes utilisateurs** (créer nom + mot de passe + rôle/espace, activer/désactiver), gestion chambres, **journal d'activité** (qui a fait quoi, quand — chaque action tracée).

### 20. Mode tablette (chambre)
- Fond sombre `#0E2A1D`, plein écran, « Bienvenue, [client] » + dates du séjour (lien automatique via check-in ; neutre hors séjour — protection anti-erreur de facturation).
- Cartes : demande de ménage, room service (panier avec quantités +/−, instructions), réservation table restaurant (heure/couverts), spa, piscine (horaires), **ma note** (consommations en direct), **signaler un problème** (6 catégories → crée une intervention maintenance), **infos pratiques** (Wi-Fi, horaires…).
- Demandes payantes → statut « en attente » → validation par le service → montant ajouté automatiquement à la note du séjour. Le client peut annuler une demande en attente.
- Sortie du mode uniquement par mot de passe admin.

## Interactions & Behavior clés
- **Traçabilité** : chaque action (réservation, check-in, encaissement, validation de demande…) enregistre l'utilisateur connecté + horodatage dans un journal d'activité.
- **Flux de demandes tablette** : demande → notification badge dans la sidebar du/des services concernés (restaurant voit rs+table, housekeeping voit ménage, maintenance voit problèmes, réception/admin voient tout) → valider/refuser → si payant, ligne ajoutée au folio du séjour.
- **Impression** : factures, reçus, confirmations, fiches de police, journal de caisse — via iframe d'impression intégrée (jamais `window.open`, qui bloquait l'app). En production : génération PDF côté serveur recommandée.
- **Auto-validation configurable** des demandes tablette (réglage admin).
- Toast de confirmation (bas centre, fond `#123524`, texte `#F1ED96`) après chaque action.

## State Management (données à modéliser en base)
Tables/colonnes suggérées : `rooms` (no, floor, type, cap, price, status, equipment[]), `clients` (contact, doc, nation, vip, préférences, fidélité), `reservations` (client, room, dates, pax, source, status: confirmée/en séjour/terminée/annulée, folio[], acompte, réduction, réservé_par), `folio_lines`, `requests` (tablette : kind, room, label, detail, amount, status), `hk_tasks`, `maintenance`, `menu_items`, `tables`, `spa_services`, `spa_bookings`, `pool_entries`, `stock_items`, `staff`, `accounts` (username, password_hash, role, active), `transactions`, `activity_log`, `settings`.

## Design Tokens
- **Couleurs** : vert foncé `#0E2A1D` / `#123524` / `#1B4531` (fonds sombres, sidebar) ; doré `#BA8D48` / `#D8C072` (accents, CTA) ; jaune pâle `#F1ED96` (texte sur sombre) ; crème `#F2EDE2` (fond page) / `#F7F3E9` / `#FAF7EF` ; blanc `#FFFFFF` (cartes) ; bordures `#E2DAC6` / `#EEE8D8` ; texte `#24312A`, secondaire `#6B7568` / `#8A9186` ; états : succès `#2E7D57`, erreur `#8C3B32`, warning `#B36B24`, info `#3E6FA8`.
- **Typo** : titres **Cormorant Garamond** (500–700) ; corps **Jost** (300–600). Corps 12.5–14px, titres de vue 24px, gros chiffres 30–34px.
- **Rayons** : cartes 8px, boutons/champs 5–6px, pills 8–16px. Ombres légères uniquement.
- **Devise** : MAD, format `1 250 MAD` (espace milliers).

## Assets
- `assets/logo.svg` — logo Ziada Palace & Spa (fourni par le client, styles inline corrigés).

## Files
- `ZIADA PALACE PMS.dc.html` — prototype complet (template HTML + classe logique JS + toutes les données d'exemple).
- `assets/logo.svg` — logo.

## Priorités de développement suggérées
1. Serveur + base + auth (comptes, rôles, sessions).
2. Migration du modèle de données et des règles métier (elles sont toutes dans la classe `Component` du prototype : calculs de facture, statuts, flux tablette).
3. Temps réel (WebSocket) pour tablettes + multi-postes.
4. Mode kiosque tablettes (Fully Kiosk ou équivalent).
5. Impression PDF serveur, sauvegardes automatiques.
