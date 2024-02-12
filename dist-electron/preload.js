"use strict";const r=require("electron");function a(e=["complete","interactive"]){return new Promise(t=>{e.includes(document.readyState)?t(!0):document.addEventListener("readystatechange",()=>{e.includes(document.readyState)&&t(!0)})})}const o={append(e,t){Array.from(e.children).find(n=>n===t)||e.appendChild(t)},remove(e,t){Array.from(e.children).find(n=>n===t)&&e.removeChild(t)}};function s(){const e="loaders-css__square-spin",t=`
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
    `,n=document.createElement("style"),i=document.createElement("div");return n.id="app-loading-style",n.innerHTML=t,i.className="app-loading-wrap",i.innerHTML=`<div class="${e}"><div></div></div>`,{appendLoading(){o.append(document.head,n),o.append(document.body,i)},removeLoading(){o.remove(document.head,n),o.remove(document.body,i)}}}r.contextBridge.exposeInMainWorld("electronAPI",{setup:()=>r.ipcRenderer.invoke("setup"),saveURLS:e=>r.ipcRenderer.invoke("saveURLS",e),getUrls:()=>r.ipcRenderer.invoke("getURLs"),setSetup:e=>r.ipcRenderer.invoke("setSetup",e),setWindowSize:(e,t)=>r.ipcRenderer.invoke("setWindowSize",e,t),startServer:()=>r.ipcRenderer.invoke("startServer"),openSettingsWindow:()=>r.ipcRenderer.invoke("open-settings-window"),onSetupUpdated:e=>{r.ipcRenderer.on("setup-updated",(t,n)=>e(n))},removeSetupUpdatedListener:e=>{r.ipcRenderer.removeListener("setup-updated",e)}});const{appendLoading:p,removeLoading:d}=s();a().then(p);window.onmessage=e=>{e.data.payload==="removeLoading"&&d()};setTimeout(d,4999);
