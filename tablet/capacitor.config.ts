import type { CapacitorConfig } from '@capacitor/cli';

// L'app tablette charge directement le serveur en ligne — aucune logique
// métier ici, c'est la même app web que sur le PC réception, juste en mode kiosque.
const APP_URL = process.env.CAPACITOR_APP_URL || 'http://10.0.2.2:3000';

const config: CapacitorConfig = {
  appId: 'ma.ziadapalace.pms.tablet',
  appName: 'Ziada Palace Tablette',
  webDir: 'www',
  server: {
    url: APP_URL,
    cleartext: APP_URL.startsWith('http://'),
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
