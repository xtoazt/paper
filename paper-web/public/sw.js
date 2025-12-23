// Service Worker for Paper WebVM
// Intercepts requests to "virtual" domains when running in PWA mode

const CACHE_NAME = 'paper-vm-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // We only intercept navigation requests to our specific app routes if needed
    // But mostly, the React Router handles the "virtual" domains via /app/:domain
    
    // However, if we wanted to support "real" domains via a Proxy Config, we'd handle it here.
    // For now, passthrough.
});

