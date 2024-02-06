import { app, BrowserWindow, ipcMain } from 'electron';
import { initialize, enable } from '@electron/remote/main';
import path from 'node:path';
import Store from 'electron-store';


// The built directory structure
process.env.DIST = path.join(__dirname, '../dist');
process.env.PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null;
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
const store = new Store();

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(process.env.PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  // Enable @electron/remote for the main window
  enable(win.webContents);

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString());
  });

  //Handlers---------------------------------------------
  ipcMain.handle('setup', async () => {
    return store.get('setup', true);
  })

  ipcMain.handle('setSetup', async (event, boolSetup) => {
    console.log(boolSetup)
    store.set('setup', boolSetup);
    // win?.webContents.send('setupChanged', boolSetup);

  })

  ipcMain.handle('saveURLS', async (event, urls) => {
    console.log(urls)
    store.set('urls', urls);
  });

  ipcMain.handle('getURLs', async () => {
    return store.get('urls', []); // Assuming 'urls' is the key in electron-store
  });

  ipcMain.handle('setWindowSize', async (event, width, height) => {
    win?.setSize(width, height);
  });

  ipcMain.handle('startServer', async () => {
    console.log('server handling...')
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(process.env.DIST, 'index.html'));
  }
}



app.on('window-all-closed', () => {
  win = null;
});

initialize();
app.whenReady().then(createWindow);

