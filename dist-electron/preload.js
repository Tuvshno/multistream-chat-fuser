"use strict";const n=require("electron");function a(e=["complete","interactive"]){return new Promise(t=>{e.includes(document.readyState)?t(!0):document.addEventListener("readystatechange",()=>{e.includes(document.readyState)&&t(!0)})})}const r={append(e,t){Array.from(e.children).find(i=>i===t)||e.appendChild(t)},remove(e,t){Array.from(e.children).find(i=>i===t)&&e.removeChild(t)}};function s(){const e="loaders-css__square-spin",t=`
@keyframes square-spin {
  25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
  50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
  75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
  100% { transform: perspective(100px) rotateX(0) rotateY(0); }
}
.${e} > div {
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
    `,i=document.createElement("style"),o=document.createElement("div");return i.id="app-loading-style",i.innerHTML=t,o.className="app-loading-wrap",o.innerHTML=`<div class="${e}"><div></div></div>`,{appendLoading(){r.append(document.head,i),r.append(document.body,o)},removeLoading(){r.remove(document.head,i),r.remove(document.body,o)}}}n.contextBridge.exposeInMainWorld("electronAPI",{onEmoteDownloadUpdate:e=>{n.ipcRenderer.on("emotes-ready",(t,i)=>e(i))},setup:()=>n.ipcRenderer.invoke("setup"),getSetupWindowSize:()=>n.ipcRenderer.invoke("getSetupWindowSize"),getChatWindowSize:()=>n.ipcRenderer.invoke("getChatWindowSize"),changeSetupWindowSize:()=>n.ipcRenderer.invoke("changeSetupWindowSize"),changeChatWindowSize:()=>n.ipcRenderer.invoke("changeChatWindowSize"),saveURLS:e=>n.ipcRenderer.invoke("saveURLS",e),saveEmoteURLS:e=>n.ipcRenderer.invoke("saveEmoteURLS",e),saveFontSize:e=>n.ipcRenderer.invoke("saveFontSize",e),getUrls:()=>n.ipcRenderer.invoke("getURLs"),checkEmotesReady:()=>n.ipcRenderer.invoke("checkEmotesReady"),setEmotesReady:e=>n.ipcRenderer.invoke("setEmotesReady",e),getEmoteUrls:()=>n.ipcRenderer.invoke("getEmoteURLs"),getEmoteFiles:()=>n.ipcRenderer.invoke("getEmoteFiles"),getEmotesJSON:()=>n.ipcRenderer.invoke("getEmotesJSON"),getFontSize:()=>n.ipcRenderer.invoke("getFontSize"),setSetup:e=>n.ipcRenderer.invoke("setSetup",e),setWindowSize:(e,t)=>n.ipcRenderer.invoke("setWindowSize",e,t),startServer:()=>n.ipcRenderer.invoke("startServer"),openSettingsWindow:()=>n.ipcRenderer.invoke("open-settings-window"),onSetupUpdated:e=>{n.ipcRenderer.on("setup-updated",(t,i)=>e(i))},removeSetupUpdatedListener:e=>{n.ipcRenderer.removeListener("setup-updated",e)},loginWithTwitch:()=>n.ipcRenderer.invoke("loginWithTwitch"),loginWithYouTube:()=>n.ipcRenderer.invoke("loginWithYouTube"),closeServer:()=>n.ipcRenderer.invoke("closeServer"),isTwitchLoggedIn:()=>n.ipcRenderer.invoke("isTwitchLoggedIn"),savePlatformIconsEnabled:e=>n.ipcRenderer.invoke("savePlatformIconsEnabled",e),saveBadgesEnabled:e=>n.ipcRenderer.invoke("saveBadgesEnabled",e),saveToolbarEnabled:e=>n.ipcRenderer.invoke("saveToolbarEnabled",e),saveTimestampsEnabled:e=>n.ipcRenderer.invoke("saveTimestampsEnabled",e),getPlatformIconsEnabled:()=>n.ipcRenderer.invoke("getPlatformIconsEnabled"),getBadgesEnabled:()=>n.ipcRenderer.invoke("getBadgesEnabled"),getToolbarEnabled:()=>n.ipcRenderer.invoke("getToolbarEnabled"),getTimestampsEnabled:()=>n.ipcRenderer.invoke("getTimestampsEnabled"),center:()=>n.ipcRenderer.invoke("center"),openTutorial:()=>n.ipcRenderer.invoke("openTutorial"),openEmoteTutorial:()=>n.ipcRenderer.invoke("openEmoteTutorial"),getEmotesFromURL:e=>n.ipcRenderer.invoke("getEmotesFromURL",e)});const{appendLoading:p,removeLoading:d}=s();a().then(p);window.onmessage=e=>{e.data.payload==="removeLoading"&&d()};setTimeout(d,4999);
