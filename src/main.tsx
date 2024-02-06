import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// In your main.js (Electron main process file)


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <App />
);

postMessage({ payload: 'removeLoading' }, '*')
