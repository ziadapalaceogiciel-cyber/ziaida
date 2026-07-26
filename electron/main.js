const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// URL du serveur en ligne — surchargeable via la variable d'environnement ELECTRON_APP_URL
// (utile en développement), sinon pointe vers le serveur de production sur Render.
const APP_URL = process.env.ELECTRON_APP_URL || 'https://ziaida.onrender.com';

Menu.setApplicationMenu(null); // aucune barre de menu/navigateur visible

let win;
let retryTimer = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    // TODO : ajouter icon.ico (généré depuis assets/logo.svg) puis icon: path.join(__dirname, 'icon.ico')
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.once('ready-to-show', () => win.show());

  // Bloque toute fenêtre popup non maîtrisée (ex. lien externe cliqué dans l'app).
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  loadApp();

  win.webContents.on('render-process-gone', () => {
    console.error('Render process gone, reloading…');
    loadApp();
  });
  win.on('unresponsive', () => {
    console.error('Window unresponsive, reloading…');
    win.reload();
  });
}

function loadApp() {
  win.loadFile(path.join(__dirname, 'splash.html'));
  win.loadURL(APP_URL).catch(scheduleRetry);
  win.webContents.once('did-fail-load', scheduleRetry);
}

function scheduleRetry() {
  clearTimeout(retryTimer);
  retryTimer = setTimeout(() => {
    if (win && !win.isDestroyed()) {
      win.loadFile(path.join(__dirname, 'splash.html'), { search: 'retry=1' });
      win.loadURL(APP_URL).catch(scheduleRetry);
    }
  }, 5000);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
