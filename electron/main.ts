import { app, BrowserWindow, ipcMain } from 'electron';
import { initialize, enable } from '@electron/remote/main';
import path from 'node:path';
import Store from 'electron-store';
import { spawn } from 'node:child_process';
import { ChildProcessWithoutNullStreams } from 'child_process';

// The built directory structure
process.env.DIST = path.join(__dirname, '../dist');
process.env.PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null;
let splash: BrowserWindow | null;
let serverProcess: ChildProcessWithoutNullStreams | null = null; // To keep track of the spawned server process

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
const store = new Store();

function createSplashWindow() {
  splash = new BrowserWindow({
    width: 500,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true
  });
  splash.loadFile('splash.html');
}

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    show: false, // Initially hide the main window
    icon: path.join(process.env.PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      nodeIntegration: false,
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

  ipcMain.handle('setSetup', async (_event, boolSetup) => {
    console.log(boolSetup)
    store.set('setup', boolSetup);
    // win?.webContents.send('setupChanged', boolSetup);

  })

  ipcMain.handle('saveURLS', async (_event, urls) => {
    console.log(urls)
    store.set('urls', urls);
  });

  ipcMain.handle('getURLs', async () => {
    return store.get('urls', []); // Assuming 'urls' is the key in electron-store
  });

  ipcMain.handle('setWindowSize', async (_event, width, height) => {
    win?.setSize(width, height);
  });

  ipcMain.handle('startServer', async () => {
    console.log('server handling...')
    const urls = store.get('urls')
    serverProcess = spawn('node', ['worker.mjs'], {
      env: {
        ...process.env, // Include existing environment variables
        USER_URLS: JSON.stringify(urls)
      }
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`Child stdout:\n${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`Child stderr:\n${data}`);
    });

    serverProcess.on('exit', (code, signal) => {
      console.log(`Child exited with code ${code} and signal ${signal}`);
    });

  })

  ipcMain.handle('open-settings-window', async () => {
    console.log('setup updated');
    store.set('setup', true);
    win?.webContents.send('setup-updated', true);
  });

  ipcMain.handle('restart-app', () => {
    app.relaunch();
    app.exit();
  })

  // Workers --------------------------------------------



  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(process.env.DIST, 'index.html'));
  }
  // win.setMenu(null);
  win.once('ready-to-show', () => {
    splash?.close(); // Close the splash screen
    win?.show(); // Show the main window
  });

}

app.on('before-quit', () => {
  if (serverProcess !== null) {
    serverProcess.kill('SIGINT'); // Sends the SIGINT signal to terminate the child process
    serverProcess = null; // Reset the reference
  }
});

app.on('window-all-closed', () => {
  win = null;
  if (process.platform !== 'darwin' || !app.isPackaged) { // On macOS, apps commonly stay active until the user quits explicitly with Cmd + Q
    if (serverProcess !== null) {
      serverProcess.kill('SIGINT');
      serverProcess = null;
    }
    app.quit(); // Ensures the app quits in development when all windows are closed
  }
});

initialize();
app.whenReady().then(createSplashWindow).then(createWindow);

