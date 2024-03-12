import { app, BrowserWindow, dialog, ipcMain, Menu, MenuItemConstructorOptions } from 'electron';
import { initialize, enable } from '@electron/remote/main';
import path from 'node:path';
import Store from 'electron-store';
import { spawn } from 'node:child_process';
import log from 'electron-log/main';
import { ChildProcess } from 'child_process';
import { autoUpdater } from "electron-updater";
import fs from 'fs';
import util from 'util'

// Convert fs.readdir and fs.readFile into Promise-based functions
const readdirAsync = util.promisify(fs.readdir);
const readFileAsync = util.promisify(fs.readFile);
const mkdirAsync = util.promisify(fs.mkdir);
// import { ChildProcess, fork } from 'child_process';

// The built directory structure
process.env.DIST = path.join(__dirname, '../dist');
process.env.PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null;
let splash: BrowserWindow | null;
let downloadWindow: BrowserWindow | null;

let child: ChildProcess | null;
console.log(app.getPath('userData'))

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
const store = new Store();

const menuTemplate: MenuItemConstructorOptions[] = [
  {
    label: 'File',
    submenu: [
      { role: 'quit' }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
    ],
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' },
    ],
  },
];


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
    backgroundColor: '#000000',
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

  // Resize event listener

  win.on('resize', () => {
    // Use a debounce function if you want to limit how often this runs
    const [width, height] = win?.getSize() ?? [undefined, undefined];
    console.log(`resizing ${width} ${height}`)

    // You could use a condition here if you want to distinguish between different window states
    const isSetupScreen = store.get('setup', true);
    console.log('Is Setup Screen:', isSetupScreen);
    if (isSetupScreen) {
      store.set('setupWindowSize', { width, height });
      console.log('changed chat size')
    } else {
      store.set('chatWindowSize', { width, height });
    }
  });
  //Handlers---------------------------------------------
  ipcMain.handle('setup', async () => {
    return store.get('setup', true);
  })


  ipcMain.handle('getSetupWindowSize', () => {
    const width = 1000;
    const height = 900;

    const size = store.get('setupWindowSize', { width, height });
    return size;
  });

  ipcMain.handle('changeSetupWindowSize', () => {
    const [width, height] = win?.getSize() ?? [undefined, undefined];
    console.log(`Setup Window size will be : ${width} ${height}`)
    store.set('setupWindowSize', { width, height });
  });

  ipcMain.handle('getChatWindowSize', () => {
    const width = 500;
    const height = 900;

    const size = store.get('chatWindowSize', { width, height });
    return size;
  });

  ipcMain.handle('changeChatWindowSize', () => {
    const [width, height] = win?.getSize() ?? [undefined, undefined];
    console.log(`Chat Window size will be : ${width} ${height}`)
    store.set('chatWindowSize', { width, height });
  });

  ipcMain.handle('setSetup', async (_event, boolSetup) => {
    console.log(boolSetup)
    store.set('setup', boolSetup);
    // win?.webContents.send('setupChanged', boolSetup);
  })

  ipcMain.handle('saveURLS', async (_event, urls) => {
    console.log(urls)
    store.set('urls', urls);
  });

  ipcMain.handle('saveEmoteURLS', async (_event, urls) => {
    console.log(urls)
    store.set('emoteurls', urls);
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
  ipcMain.handle('getEmoteURLs', async () => {
    return store.get('emoteurls', []); // Assuming 'urls' is the key in electron-store
  });

  ipcMain.handle('setWindowSize', async (_event, width, height) => {
    win?.setSize(width, height);
  });

  ipcMain.handle('saveBadgesEnabled', async (_event, isEnabled) => {
    console.log(`isBadgesEnabled is ${isEnabled}`)
    store.set('isBadgesEnabled', isEnabled);
  });
  ipcMain.handle('getBadgesEnabled', async () => {
    const isEnabled = store.get('isBadgesEnabled', false);
    console.log(`isBadgesEnabled is ${isEnabled}`)
    return isEnabled;

  });

  ipcMain.handle('savePlatformIconsEnabled', async (_event, isEnabled) => {
    console.log(`isPlatformIconsEnabled is ${isEnabled}`)
    store.set('isPlatformIconsEnabled', isEnabled);
  });
  ipcMain.handle('getPlatformIconsEnabled', async () => {
    const isEnabled = store.get('isPlatformIconsEnabled', false);
    console.log(`isPlatformIconsEnabled is ${isEnabled}`)
    return isEnabled;
  });

  ipcMain.handle('saveToolbarEnabled', async (_event, isEnabled) => {
    console.log(`isToolbarEnabled is ${isEnabled}`)
    store.set('isToolbarEnabled', isEnabled);
    if (isEnabled) {
      const menu = Menu.buildFromTemplate(menuTemplate);
      Menu.setApplicationMenu(menu);
    }
    else
      Menu.setApplicationMenu(null);
  });
  ipcMain.handle('getToolbarEnabled', async () => {
    const isEnabled = store.get('isToolbarEnabled', false);
    console.log(`isToolbarEnabled is ${isEnabled}`)
    return isEnabled;
  });

  ipcMain.handle('saveTimestampsEnabled', async (_event, isEnabled) => {
    console.log(`isTimestampsEnabled is ${isEnabled}`)
    store.set('isTimestampsEnabled', isEnabled);
  });
  ipcMain.handle('getTimestampsEnabled', async () => {
    const isEnabled = store.get('isTimestampsEnabled', false);
    console.log(`isTimestampsEnabled is ${isEnabled}`)
    return isEnabled;
  });

  ipcMain.handle('openTutorial', async () => {
    console.log('Opening Tutorial...')
    createTutorialWindow();
  })

  function createTutorialWindow() {
    const tutorialWindow = new BrowserWindow({
      width: 850,
      height: 650,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      }
    });

    tutorialWindow.loadFile('tutorial.html');
    tutorialWindow.setMenu(null);
    return tutorialWindow;
  }

  ipcMain.handle('openEmoteTutorial', async () => {
    console.log('Opening Tutorial...')
    createEmoteTutorialWindow();
  })

  function createEmoteTutorialWindow() {
    const tutorialWindow = new BrowserWindow({
      width: 850,
      height: 650,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      }
    });

    tutorialWindow.loadFile('emoteTutorial.html');
    tutorialWindow.setMenu(null);
    return tutorialWindow;
  }
  
  ipcMain.handle('isTwitchLoggedIn', async () => {
    const cookiesTWPath = path.join(app.getPath('userData'), 'twitch-cookies.json');

    const isLoggedIn = fs.existsSync(cookiesTWPath);

    return isLoggedIn;
  });

  ipcMain.handle('center', async () => {
    win?.center();
    console.log('Window centered');
  })

  ipcMain.handle('getEmotesFromURL', async (_event, url) => {
    console.log(`server handling... from ${url}`);

    // Create the downloading screen window if it doesn't exist
    if (!downloadWindow) {
      downloadWindow = new BrowserWindow({
        width: 600,
        height: 300,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false, // Set to false for simplicity; consider security implications
        }
      });

      downloadWindow.loadFile('downloading.html');
      downloadWindow.setMenu(null);
      downloadWindow.on('closed', () => {
        downloadWindow = null;
      });

      downloadWindow.on('closed', () => {
        downloadWindow = null;
        if (child && !child.killed) {
          child.kill(); // Terminate the child process when the window is closed
          console.log('Download process was terminated.');
        }
      });

    }

    const appdataPath = app.getPath('userData')

    const workerPath = app.isPackaged
      ? path.join(process.resourcesPath, 'emotes.js') // Path when packaged
      : path.join('./emotes.js');

    if (app.isPackaged) {
      // In production, set NODE_PATH to 'app.asar.unpacked/node_modules'
      const nodeModulesPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules');
      child = spawn('node', [workerPath, appdataPath, url], {
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
      child = spawn('node', [workerPath, appdataPath, url], {
        stdio: 'pipe', // Use 'pipe' to handle stdio streams manually
        windowsHide: false // Hide the terminal window on Windows
      });
    }

    child.stdout?.on('data', (data) => {
      if (downloadWindow) {
        console.log(data)
        downloadWindow.webContents.send('update-download-status', `${data.toString()}`);
      }
    });

    child.stderr?.on('data', (data) => {
      if (downloadWindow) {
        console.log(data)
        downloadWindow.webContents.send('update-download-status', `${data.toString()}`);
      }
    });

    child.on('exit', (code, signal) => {
      if (downloadWindow) {
        let message = `Download complete with code ${code}.`;
        if (signal) message += ` Terminated with signal ${signal}.`;
        downloadWindow.webContents.send('update-download-status', message);

        // Send Emotes are ready
        if (code === 0) {
          win?.webContents.send('emotes-ready', true);
          store.set('emotes-ready', true);
        }

      }
    });
  })

  ipcMain.handle('checkEmotesReady', async () => {
    const isReady = store.get('emotes-ready', false);
    console.log(isReady)
    return isReady
  })

  ipcMain.handle('setEmotesReady', async (isReady) => {
    store.set('emotes-ready', isReady);
  })

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

  ipcMain.handle('getEmoteFiles', async () => {
    const appDataPath = app.getPath('userData');
    const emotesFolderPath = path.join(appDataPath, 'downloaded_emotes');

    // Check if the folder exists, create it if it doesn't
    if (!fs.existsSync(emotesFolderPath)) {
        await mkdirAsync(emotesFolderPath, { recursive: true });
        return []; // Since the folder was just created, it's empty, return an empty array
    }

    try {
        const files = await readdirAsync(emotesFolderPath);
        // If the folder is empty, return an empty array
        if (files.length === 0) {
            return [];
        }
        
        // Filter out 'emotes.json' before mapping over files
        const filteredFiles = files.filter(fileName => fileName !== 'emotes.json');
        
        const filePromises = filteredFiles.map(async (fileName) => {
            const filePath = path.join(emotesFolderPath, fileName);
            const fileBuffer = await readFileAsync(filePath);
            const base64 = fileBuffer.toString('base64');
            const fileNameWithoutExtension = path.basename(fileName, '.webp');
            return {
                data: `data:image/webp;base64,${base64}`,
                name: fileNameWithoutExtension // Name without the .webp extension
            };
        });

        const fileData = await Promise.all(filePromises);
        return fileData; // No need to filter here since all entries will be defined
    } catch (error) {
        console.error('Failed to get emote files:', error);
        throw error;
    }
});




ipcMain.handle('getEmotesJSON', async () => {
  const appDataPath = app.getPath('userData');
  const emotesFolderPath = path.join(appDataPath, 'downloaded_emotes');
  const emotesFilePath = path.join(emotesFolderPath, 'emotes.json');

  try {
      const emotesFileContent = await readFileAsync(emotesFilePath, { encoding: 'utf8' });
      const emotesData = JSON.parse(emotesFileContent);
      
      // Optionally, if you want to adjust the file paths to be web accessible or relative:
      // const adjustedEmotesData = emotesData.map((emote: { src: string; }) => ({
      //   ...emote,
      //   src: emote.src.replace(/\\/g, '/').replace(/C:\/Users\/tuvshno\/AppData\/Roaming\/multistream-chat\/downloaded_emotes\//, '')
      // }));

      // return adjustedEmotesData;

      return emotesData; // Return the parsed JSON data
  } catch (error) {
      console.error('Failed to read emotes.json:', error);
      throw error; // This will send an error back to the renderer process
  }
});


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

  if (store.get('isToolbarEnabled', false)) {
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
  }
  else
    Menu.setApplicationMenu(null);

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