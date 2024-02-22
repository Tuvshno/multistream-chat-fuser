"use strict";const t=require("electron");function a(e=["complete","interactive"]){return new Promise(n=>{e.includes(document.readyState)?n(!0):document.addEventListener("readystatechange",()=>{e.includes(document.readyState)&&n(!0)})})}const o={append(e,n){Array.from(e.children).find(i=>i===n)||e.appendChild(n)},remove(e,n){Array.from(e.children).find(i=>i===n)&&e.removeChild(n)}};function s(){const e="loaders-css__square-spin",n=`
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
    `,i=document.createElement("style"),r=document.createElement("div");return i.id="app-loading-style",i.innerHTML=n,r.className="app-loading-wrap",r.innerHTML=`<div class="${e}"><div></div></div>`,{appendLoading(){o.append(document.head,i),o.append(document.body,r)},removeLoading(){o.remove(document.head,i),o.remove(document.body,r)}}}t.contextBridge.exposeInMainWorld("electronAPI",{setup:()=>t.ipcRenderer.invoke("setup"),saveURLS:e=>t.ipcRenderer.invoke("saveURLS",e),saveFontSize:e=>t.ipcRenderer.invoke("saveFontSize",e),getUrls:()=>t.ipcRenderer.invoke("getURLs"),getFontSize:()=>t.ipcRenderer.invoke("getFontSize"),setSetup:e=>t.ipcRenderer.invoke("setSetup",e),setWindowSize:(e,n)=>t.ipcRenderer.invoke("setWindowSize",e,n),startServer:()=>t.ipcRenderer.invoke("startServer"),openSettingsWindow:()=>t.ipcRenderer.invoke("open-settings-window"),onSetupUpdated:e=>{t.ipcRenderer.on("setup-updated",(n,i)=>e(i))},removeSetupUpdatedListener:e=>{t.ipcRenderer.removeListener("setup-updated",e)},loginWithTwitch:()=>t.ipcRenderer.invoke("loginWithTwitch"),loginWithYouTube:()=>t.ipcRenderer.invoke("loginWithYouTube"),closeServer:()=>t.ipcRenderer.invoke("closeServer")});const{appendLoading:p,removeLoading:d}=s();a().then(p);window.onmessage=e=>{e.data.payload==="removeLoading"&&d()};setTimeout(d,4999);
