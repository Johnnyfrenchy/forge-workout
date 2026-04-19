import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Unregister any stale service workers (PWA disabled until Vite-PWA plugin is configured)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(r => r.unregister())
  }).catch(() => {})
  if (typeof caches !== 'undefined') {
    caches.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(() => {})
  }
}
