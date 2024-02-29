import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { initialize, enable } from '@electron/remote/main';
import path from 'node:path';
import Store from 'electron-store';
import { spawn } from 'node:child_process';
import log from 'electron-log/main';
import { ChildProcess } from 'child_process';
import { autoUpdater } from "electron-updater";
import fs from 'fs';

// import { ChildProcess, fork } from 'child_process';

// The built directory structure
process.env.DIST = path.join(__dirname, '../dist');
process.env.PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null;
let splash: BrowserWindow | null;
let child: ChildProcess | null;

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
    width: 1000,
    height: 900,
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

  ipcMain.handle('saveFontSize', async (_event, fontSize) => {
    console.log(fontSize);
    store.set('fontSize', fontSize);
  })

  ipcMain.handle('getFontSize', async () => {
    console.log(store.get('fontSize', 14))
    return store.get('fontSize', 14); // Assuming 'urls' is the key in electron-store
  });

  ipcMain.handle('getURLs', async () => {
    return store.get('urls', []); // Assuming 'urls' is the key in electron-store
  });

  ipcMain.handle('setWindowSize', async (_event, width, height) => {
    win?.setSize(width, height);
  });

  ipcMain.handle('isTwitchLoggedIn', async () => {
    const cookiesTWPath = path.join(app.getPath('userData'), 'twitch-cookies.json');

    const isLoggedIn = fs.existsSync(cookiesTWPath);

    return isLoggedIn;
  });

  ipcMain.handle('startServer', async () => {
    console.log('server handling...')

    const urls = store.get('urls')
    const urlsJson = JSON.stringify(urls);

    // Define paths for Twitch and YouTube cookie files
    const cookiesTWPath = path.join(app.getPath('userData'), 'twitch-cookies.json');
    const cookiesYTPath = path.join(app.getPath('userData'), 'youtube-cookies.json');

    // Initialize cookie data variables
    let cookiesTWJson = '[]'; // Default to empty array in JSON if file doesn't exist
    let cookiesYTJson = '[]';

    // Check if Twitch cookie file exists and read it
    if (fs.existsSync(cookiesTWPath)) {
      const cookiesTW = JSON.parse(fs.readFileSync(cookiesTWPath, 'utf-8'));
      cookiesTWJson = JSON.stringify(cookiesTW);
    }

    // Check if YouTube cookie file exists and read it
    if (fs.existsSync(cookiesYTPath)) {
      const cookiesYT = JSON.parse(fs.readFileSync(cookiesYTPath, 'utf-8'));
      cookiesYTJson = JSON.stringify(cookiesYT);
    }

    const workerPath = app.isPackaged
      ? path.join(process.resourcesPath, 'worker.js') // Path when packaged
      : path.join('./worker.js');

    console.log(workerPath)

    if (app.isPackaged) {
      // In production, set NODE_PATH to 'app.asar.unpacked/node_modules'
      const nodeModulesPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules');
      child = spawn('node', [workerPath, urlsJson, cookiesTWJson, cookiesYTJson], {
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
      child = spawn('node', [workerPath, urlsJson, cookiesTWJson, cookiesYTJson], {
        stdio: 'pipe', // Use 'pipe' to handle stdio streams manually
        windowsHide: false // Hide the terminal window on Windows
      });
    }

    // if (app.isPackaged) {
    //   // In production, adjust the path if needed
    //   child = fork(workerPath, [urlsJson, cookiesTWJson, cookiesYTJson], {
    //     stdio: ['inherit', 'inherit', 'inherit', 'ipc'], // 'ipc' enables Inter-Process Communication
    //     env: {
    //       ...process.env, // Inherit the parent's environment variables
    //     }
    //   });
    // } else {
    //   child = fork(workerPath, [urlsJson, cookiesTWJson, cookiesYTJson], {
    //     stdio: ['inherit', 'inherit', 'inherit', 'ipc'] // 'ipc' for IPC communication
    //   });
    // }


    log.info('Server has been started');

    child.stdout?.on('data', (data) => {
      console.log(`stdout: ${data}`);
      log.info(`Child stdout:\n${data}`);
    });

    child.stderr?.on('data', (data) => {
      console.error(`Child stderr:\n${data}`);
      log.info(`Child stderr:\n${data}`);

    });

    child.on('exit', (code, signal) => {
      console.log(`Child exited with code ${code} and signal ${signal}`);
      log.info(`Child exited with code ${code} and signal ${signal}`);

    });

    // child.send({ type: 'newMessage', content: 'Hello from parent' });
  })

  ipcMain.handle('open-settings-window', async () => {
    console.log('setup updated');
    store.set('setup', true);
    win?.webContents.send('setup-updated', true);
  });

  ipcMain.handle('closeServer', async () => {
    console.log('clossing server');
    if (child && !child.killed) {
      const command = JSON.stringify({ action: 'shutdown' });
      child.stdin?.write(command + "\n");
      console.log('Shutdown command sent to child process.');

      // Wait for child process to exit gracefully
      await new Promise<void>(resolve => {
        child?.on('exit', () => {
          console.log('Child process exited gracefully.');
          resolve();
        });
      });
    } else {
      console.log('No child process to terminate.');
    }
  })

  // IPC event handler for 'loginWithTwitch'
  ipcMain.handle('loginWithTwitch', async () => {
    console.log('Attempting to log in with Twitch');

    // Open the Twitch authentication window
    createTwitchAuthWindow();

  });

  ipcMain.handle('loginWithYouTube', async () => {
    console.log('Attempting to log in with YouTube');

    createYouTubeAuthWindow();
  })

  function createTwitchAuthWindow() {
    const authWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      }
    });

    authWindow.loadURL('https://www.twitch.tv/login');

    // Monitor navigation to check if we navigate away from the login page
    authWindow.webContents.on('did-navigate', async (_event: Event, url: string) => {
      // Check if the new URL is not the Twitch login page
      if (!url.includes('https://www.twitch.tv/login')) {
        // Capture cookies as this indicates we've navigated away from the login page
        const cookies = await authWindow.webContents.session.cookies.get({ domain: '.twitch.tv' });
        console.log('Twitch Login Cookies:', cookies);
        const filePath = path.join(app.getPath('userData'), 'twitch-cookies.json');
        fs.writeFileSync(filePath, JSON.stringify(cookies, null, 2));

        // Use the cookies for subsequent requests or store them securely

        // Close the authentication window
        authWindow.close();
      }
    });

    return authWindow;
  }

  function createYouTubeAuthWindow() {
    const authWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      }
    });

    const youtubeAuthUrl = 'https://www.youtube.com/live_chat?is_popout=1&v=HugDvUEbsKc';
    authWindow.loadURL(youtubeAuthUrl);

    // Listen for the 'close' event
    authWindow.on('close', async (e) => {
      // Prevent the window from closing immediately
      e.preventDefault();

      // Capture cookies before the window closes
      const cookies = await authWindow.webContents.session.cookies.get({});
      console.log('YouTube Login Cookies:', cookies);
      const filePath = path.join(app.getPath('userData'), 'youtube-cookies.json');
      fs.writeFileSync(filePath, JSON.stringify(cookies, null, 2));

      // Now that cookies are saved, allow the window to close
      authWindow.removeAllListeners('close');
      authWindow.close();
    });

    // authWindow.webContents.on('did-navigate', async (event, url) => {
    //   // Your existing navigation logic...
    // });

    return authWindow;
  }

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
  child?.kill(); // Assuming `child` is your spawned process
});

app.on('window-all-closed', () => {
  win = null;
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', () => {
  autoUpdater.checkForUpdatesAndNotify();
});

autoUpdater.on('update-available', () => {
  // Notify your users that an update is available.
  dialog.showMessageBox({
    type: 'info', // Type of the message box
    title: 'Update Available', // Title of the message box
    message: 'A new version of the application is available. It will be downloaded in the background.', // Message to display
    buttons: ['OK'] // Array of text for buttons. In this case, only an "OK" button.
  }).then(result => {
    console.log('User response:', result.response);
    // You can perform additional actions based on user's response if needed
  }).catch(err => {
    console.error('Failed to show update dialog:', err);
  });
});

autoUpdater.on('update-downloaded', () => {
  // Notify your users that the update is ready to be installed.
  autoUpdater.quitAndInstall();
});

initialize();
app.whenReady().then(createSplashWindow).then(createWindow)