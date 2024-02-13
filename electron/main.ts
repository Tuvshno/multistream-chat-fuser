import { app, BrowserWindow, ipcMain } from 'electron';
import { initialize, enable } from '@electron/remote/main';
import path from 'node:path';
import Store from 'electron-store';
import { spawn } from 'node:child_process';
import log from 'electron-log/main';
// import { ChildProcess, fork } from 'child_process';

// The built directory structure
process.env.DIST = path.join(__dirname, '../dist');
process.env.PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null;
let splash: BrowserWindow | null;
let child: { kill: () => void; };

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
  splash.on('closed', () => {
    splash = null;
  });
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
    const urlsJson = JSON.stringify(urls);

    // const workerPath = app.isPackaged
    //   ? path.join(process.resourcesPath, 'worker.mjs') // Path when packaged
    //   : path.join('worker.mjs'); // Path in development

    const workerPath = app.isPackaged
      ? path.join(process.resourcesPath, 'worker.js') // Path when packaged
      : path.join('./worker.js');

    // child = spawn('node', [workerPath], {

    //   env: {
    //     ...process.env, // Include existing environment variables
    //     USER_URLS: JSON.stringify(urls)
    //   },
    // });

    // child = spawn(workerPath, [JSON.stringify(urls)], {
    //   stdio: 'pipe' // Changed to 'pipe' to handle stdio streams manually
    // });
    console.log(workerPath)
    let child;

    if (app.isPackaged) {
      // In production, set NODE_PATH to 'app.asar.unpacked/node_modules'
      const nodeModulesPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules');
      child = spawn('node', [workerPath, urlsJson], {
        stdio: 'pipe', // Use 'pipe' to handle stdio streams manually
        windowsHide: false, // Hide the terminal window on Windows
        env: {
          ...process.env, // Inherit the parent's environment variables
          NODE_PATH: nodeModulesPath, // Override NODE_PATH
          ELECTRON_RUN_AS_NODE: '1'

        }
      });

    }
    else {
      child = spawn('node', [workerPath, urlsJson], {
        stdio: 'pipe', // Use 'pipe' to handle stdio streams manually
        windowsHide: false // Hide the terminal window on Windows
      });
    }


    log.info('Server has been started');

    child.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
      log.info(`Child stdout:\n${data}`);
    });

    child.stderr.on('data', (data) => {
      console.error(`Child stderr:\n${data}`);
      log.info(`Child stderr:\n${data}`);

    });

    child.on('exit', (code, signal) => {
      console.log(`Child exited with code ${code} and signal ${signal}`);
      log.info(`Child exited with code ${code} and signal ${signal}`);

    });

  })

  ipcMain.handle('open-settings-window', async () => {
    console.log('setup updated');
    store.set('setup', true);
    win?.webContents.send('setup-updated', true);
  });


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

  win?.on('closed', () => {
    win = null;
  });
}


app.on('before-quit', () => {
  // Terminate child processes
  child.kill(); // Assuming `child` is your spawned process
});

app.on('window-all-closed', () => {
  win = null;
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

initialize();
app.whenReady().then(createSplashWindow).then(createWindow);