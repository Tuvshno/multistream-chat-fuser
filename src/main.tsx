import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
// In your main.js (Electron main process file)


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <div>Hello</div>
  </React.StrictMode>,
)

postMessage({ payload: 'removeLoading' }, '*')
