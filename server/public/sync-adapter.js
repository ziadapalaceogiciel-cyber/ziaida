/*
 * Sync adapter — connecte l'app (inchangée) à un vrai serveur en ligne.
 *
 * Principe : l'app d'origine sauvegarde tout dans localStorage sous la clé
 * 'zp-pms-data-v1', et se synchronise entre onglets du MÊME navigateur via
 * l'événement natif 'storage'. Ce script ne touche à aucune ligne de l'app :
 * il intercepte simplement ces deux mécanismes pour les relayer via le
 * réseau, afin que la synchronisation fonctionne aussi entre appareils
 * différents (PC réception + tablettes), pas seulement entre onglets.
 */
(function () {
  const STORAGE_KEY = 'zp-pms-data-v1';
  const API_KEY = window.__ZP_API_KEY__ || '';
  const CLIENT_ID = Math.random().toString(36).slice(2);

  const origSetItem = Storage.prototype.setItem;
  const origGetItem = Storage.prototype.getItem;

  function headers(extra) {
    return Object.assign({ 'Content-Type': 'application/json', 'X-Api-Key': API_KEY, 'X-Client-Id': CLIENT_ID }, extra || {});
  }

  let pushTimer = null;
  function schedulePush(value) {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      fetch('/api/state', { method: 'PUT', headers: headers(), body: value }).catch(() => {});
    }, 300);
  }

  // Intercepte les écritures locales (persist() de l'app) pour les pousser vers le serveur.
  Storage.prototype.setItem = function (key, value) {
    origSetItem.apply(this, arguments);
    if (key === STORAGE_KEY) schedulePush(value);
  };

  function applyRemote(jsonText) {
    if (!jsonText) return;
    origSetItem.call(localStorage, STORAGE_KEY, jsonText);
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: jsonText, storageArea: localStorage }));
  }

  // Au chargement : récupère l'état partagé le plus récent depuis le serveur
  // (utile pour un appareil qui n'a encore rien en localStorage, ex. une nouvelle tablette).
  fetch('/api/state', { headers: headers() })
    .then(r => (r.ok ? r.text() : null))
    .then(text => { if (text && text !== '{}' && text !== 'null') applyRemote(text); })
    .catch(() => {});

  // Flux temps réel : toute mise à jour faite par un autre appareil arrive ici.
  function connectEvents() {
    const es = new EventSource('/api/events?clientId=' + CLIENT_ID + '&apiKey=' + encodeURIComponent(API_KEY));
    es.onmessage = (e) => applyRemote(e.data);
    es.onerror = () => { es.close(); setTimeout(connectEvents, 3000); };
  }
  connectEvents();
})();
