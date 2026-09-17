import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { prewarmBackend } from './utils/auth.ts'

// Wake up Render free-tier instance silently as early as possible
prewarmBackend();

// ── AUTOMATIC WEBVIEW CACHE-BUSTING ──
// Mobile WebViews aggressively cache old assets via CacheStorage and ServiceWorkers.
// This forces a complete cache purge on any version bump.
const CURRENT_VERSION = '1.6.1';
const cachedVersion = localStorage.getItem('mb_app_version');
if (cachedVersion !== CURRENT_VERSION) {
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(reg => reg.unregister());
    });
  }
  localStorage.setItem('mb_app_version', CURRENT_VERSION);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
