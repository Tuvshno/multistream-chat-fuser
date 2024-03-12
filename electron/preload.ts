/* eslint-disable react-hooks/rules-of-hooks */

import { contextBridge, ipcRenderer } from 'electron'

function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
  return new Promise(resolve => {
    if (condition.includes(document.readyState)) {
      resolve(true)
    } else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) {
          resolve(true)
        }
      })
    }
  })
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find(e => e === child)) {
      parent.appendChild(child)
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find(e => e === child)) {
      parent.removeChild(child)
    }
  },
}

/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function useLoading() {
  const className = `loaders-css__square-spin`
  const styleContent = `
@keyframes square-spin {
  25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
  50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
  75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
  100% { transform: perspective(100px) rotateX(0) rotateY(0); }
}
.${className} > div {
  animation-fill-mode: both;
  width: 50px;
  height: 50px;
  background: #fff;
  animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #282c34;
  z-index: 9;
}
    `
  const oStyle = document.createElement('style')
  const oDiv = document.createElement('div')

  oStyle.id = 'app-loading-style'
  oStyle.innerHTML = styleContent
  oDiv.className = 'app-loading-wrap'
  oDiv.innerHTML = `<div class="${className}"><div></div></div>`

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle)
      safeDOM.append(document.body, oDiv)
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle)
      safeDOM.remove(document.body, oDiv)
    },
  }
}

// ----------------------------------------------------------------------


contextBridge.exposeInMainWorld('electronAPI', {
  onEmoteDownloadUpdate: (callback: (value: boolean) => void) => {
    ipcRenderer.on('emotes-ready', (_event, value) => callback(value));
  },
  setup: () => ipcRenderer.invoke('setup'),
  getSetupWindowSize: () => ipcRenderer.invoke('getSetupWindowSize'),
  getChatWindowSize: () => ipcRenderer.invoke('getChatWindowSize'),
  changeSetupWindowSize: () => ipcRenderer.invoke('changeSetupWindowSize'),
  changeChatWindowSize: () => ipcRenderer.invoke('changeChatWindowSize'),
  saveURLS: (urls: string[]) => ipcRenderer.invoke('saveURLS', urls),
  saveEmoteURLS: (urls: string[]) => ipcRenderer.invoke('saveEmoteURLS', urls),
  saveFontSize: (fontSize: number) => ipcRenderer.invoke('saveFontSize', fontSize),
  getUrls: () => ipcRenderer.invoke('getURLs'),
  checkEmotesReady: () => ipcRenderer.invoke('checkEmotesReady'),
  setEmotesReady: (isReady: boolean) => ipcRenderer.invoke('setEmotesReady', isReady),
  getEmoteUrls: () => ipcRenderer.invoke('getEmoteURLs'),
  getEmoteFiles: () => ipcRenderer.invoke('getEmoteFiles'),
  getEmotesJSON: () => ipcRenderer.invoke('getEmotesJSON'),
  getFontSize: () => ipcRenderer.invoke('getFontSize'),
  setSetup: (boolSetup: boolean) => ipcRenderer.invoke('setSetup', boolSetup),
  setWindowSize: (width: number, height: number) => ipcRenderer.invoke('setWindowSize', width, height),
  startServer: () => ipcRenderer.invoke('startServer'),
  openSettingsWindow: () => ipcRenderer.invoke('open-settings-window'),
  onSetupUpdated: (func: (updatedSetup: boolean) => void) => {
    ipcRenderer.on('setup-updated', (_event, updatedSetup: boolean) => func(updatedSetup));
  },
  removeSetupUpdatedListener: (func: (updatedSetup: boolean) => void) => {
    ipcRenderer.removeListener('setup-updated', func);
  },
  loginWithTwitch: () => ipcRenderer.invoke('loginWithTwitch'),
  loginWithYouTube: () => ipcRenderer.invoke('loginWithYouTube'),
  closeServer: () => ipcRenderer.invoke('closeServer'),
  isTwitchLoggedIn: () => ipcRenderer.invoke('isTwitchLoggedIn'),
  savePlatformIconsEnabled: (isEnabled: boolean) => ipcRenderer.invoke('savePlatformIconsEnabled', isEnabled),
  saveBadgesEnabled: (isEnabled: boolean) => ipcRenderer.invoke('saveBadgesEnabled', isEnabled),
  saveToolbarEnabled: (isEnabled: boolean) => ipcRenderer.invoke('saveToolbarEnabled', isEnabled),
  saveTimestampsEnabled: (isEnabled: boolean) => ipcRenderer.invoke('saveTimestampsEnabled', isEnabled),
  getPlatformIconsEnabled: () => ipcRenderer.invoke('getPlatformIconsEnabled'),
  getBadgesEnabled: () => ipcRenderer.invoke('getBadgesEnabled'),
  getToolbarEnabled: () => ipcRenderer.invoke('getToolbarEnabled'),
  getTimestampsEnabled: () => ipcRenderer.invoke('getTimestampsEnabled'),
  center: () => ipcRenderer.invoke('center'),
  openTutorial: () => ipcRenderer.invoke('openTutorial'),
  openEmoteTutorial: () => ipcRenderer.invoke('openEmoteTutorial'),
  getEmotesFromURL: (url: string) => ipcRenderer.invoke('getEmotesFromURL', url),

})

// ----------------------------------------------------------------------

const { appendLoading, removeLoading } = useLoading()
domReady().then(appendLoading)

window.onmessage = ev => {
  ev.data.payload === 'removeLoading' && removeLoading()
}

setTimeout(removeLoading, 4999)
