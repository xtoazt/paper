/**
 * Enhanced Service Worker for Paper Network
 * Intercepts ALL .paper domains globally and routes through P2P gateway
 */

const CACHE_NAME = 'paper-p2p-v1';
const GATEWAY_PREFIX = '/_gateway/';

// Configuration
const CONFIG = {
  enableP2PRouting: true,
  enableIPFSFallback: true,
  enableLocalCache: true,
  cacheTimeout: 300000, // 5 minutes
  requestTimeout: 30000  // 30 seconds
};

// Registered domains and TLDs
let registeredDomains = new Set(['paper']);
let registeredTLDs = new Set(['paper']);

// P2P Gateway state
let gatewayReady = false;
let gatewayPort = null;

//=============================================================================
// INSTALLATION & ACTIVATION
//=============================================================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing enhanced Service Worker...');
  self.skipWaiting(); // Take control immediately
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', async (event) => {
  console.log('[SW] Activating enhanced Service Worker...');
  
  event.waitUntil(
    Promise.all([
      self.clients.claim(), // Take control of all clients
      loadPersistedDomains(),
      cleanOldCaches(),
      initializeGateway()
    ])
  );
});

//=============================================================================
// NAVIGATION INTERCEPTION (Pre-DNS)
//=============================================================================

// Chrome/Edge experimental navigation API - catches before DNS
if ('navigation' in self) {
  self.addEventListener('navigate', (event) => {
    try {
      const url = new URL(event.destination.url);
      
      if (isPaperDomain(url.hostname)) {
        console.log('[SW] Intercepting navigation (pre-DNS):', url.hostname);
        
        // Rewrite BEFORE DNS lookup
        event.intercept(
          new Request(`${GATEWAY_PREFIX}${url.hostname}${url.pathname}${url.search}`, {
            method: event.request?.method || 'GET',
            headers: event.request?.headers || {},
            body: event.request?.body
          })
        );
      }
    } catch (error) {
      console.error('[SW] Navigation interception error:', error);
    }
  });
}

//=============================================================================
// FETCH INTERCEPTION (All requests)
//=============================================================================

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle .paper domains
  if (isPaperDomain(url.hostname)) {
    console.log('[SW] Intercepting .paper domain:', url.hostname);
    event.respondWith(handlePaperRequest(event.request));
    return;
  }
  
  // Handle gateway requests
  if (url.pathname.startsWith(GATEWAY_PREFIX)) {
    console.log('[SW] Handling gateway request:', url.pathname);
    event.respondWith(handleGatewayRequest(event.request));
    return;
  }
  
  // Pass through other requests
  event.respondWith(fetch(event.request));
});

//=============================================================================
// REQUEST HANDLERS
//=============================================================================

/**
 * Handle .paper domain requests
 */
async function handlePaperRequest(request) {
  const url = new URL(request.url);
  const domain = url.hostname;
  const path = url.pathname;
  
  console.log('[SW] Handling .paper request:', domain, path);
  
  try {
    // 1. Try local cache first
    if (CONFIG.enableLocalCache) {
      const cached = await getCachedResponse(request);
      if (cached) {
        console.log('[SW] Serving from cache:', domain);
        return cached;
      }
    }
    
    // 2. Route through P2P gateway
    if (CONFIG.enableP2PRouting && gatewayReady) {
      const gatewayResponse = await routeThroughGateway(domain, path, request);
      
      if (gatewayResponse) {
        // Cache the response
        if (CONFIG.enableLocalCache) {
          await cacheResponse(request, gatewayResponse.clone());
        }
        
        return gatewayResponse;
      }
    }
    
    // 3. Fallback to direct IPFS if available
    if (CONFIG.enableIPFSFallback) {
      const ipfsResponse = await fetchFromIPFS(domain, path);
      if (ipfsResponse) {
        return ipfsResponse;
      }
    }
    
    // 4. Return error page
    return createErrorResponse(404, 'Domain not found: ' + domain);
    
  } catch (error) {
    console.error('[SW] Request handling error:', error);
    return createErrorResponse(500, 'Internal error: ' + error.message);
  }
}

/**
 * Handle gateway requests
 */
async function handleGatewayRequest(request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.replace(GATEWAY_PREFIX, '').split('/');
  const domain = pathParts[0];
  const path = '/' + pathParts.slice(1).join('/');
  
  console.log('[SW] Gateway request:', domain, path);
  
  // Route to main request handler
  const paperUrl = `http://${domain}${path}${url.search}`;
  const paperRequest = new Request(paperUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body
  });
  
  return await handlePaperRequest(paperRequest);
}

//=============================================================================
// P2P GATEWAY INTEGRATION
//=============================================================================

/**
 * Initialize P2P gateway connection
 */
async function initializeGateway() {
  console.log('[SW] Initializing P2P gateway...');
  
  try {
    // Wait for main thread to initialize gateway
    const clients = await self.clients.matchAll();
    
    if (clients.length > 0) {
      // Request gateway initialization
      clients[0].postMessage({
        type: 'INIT_GATEWAY',
        timestamp: Date.now()
      });
    }
    
    gatewayReady = true;
    console.log('[SW] P2P gateway initialized');
  } catch (error) {
    console.error('[SW] Gateway initialization failed:', error);
    gatewayReady = false;
  }
}

/**
 * Route request through P2P gateway
 */
async function routeThroughGateway(domain, path, request) {
  if (!gatewayReady) {
    console.warn('[SW] Gateway not ready');
    return null;
  }
  
  try {
    // Send request to main thread's P2P gateway
    const clients = await self.clients.matchAll();
    
    if (clients.length === 0) {
      console.warn('[SW] No clients available');
      return null;
    }
    
    // Create message channel for response
    const messageChannel = new MessageChannel();
    
    // Wait for response
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Gateway timeout'));
      }, CONFIG.requestTimeout);
      
      messageChannel.port1.onmessage = (event) => {
        clearTimeout(timeout);
        
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data);
        }
      };
      
      // Send request to gateway
      clients[0].postMessage({
        type: 'GATEWAY_REQUEST',
        domain,
        path,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        timestamp: Date.now()
      }, [messageChannel.port2]);
    });
    
    // Create Response from gateway data
    if (response.body) {
      return new Response(response.body, {
        status: response.status || 200,
        headers: response.headers || {}
      });
    }
    
    return null;
  } catch (error) {
    console.error('[SW] Gateway routing error:', error);
    return null;
  }
}

//=============================================================================
// IPFS FALLBACK
//=============================================================================

/**
 * Fetch from IPFS gateways
 */
async function fetchFromIPFS(domain, path) {
  // IPFS gateway URLs
  const gateways = [
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/'
  ];
  
  // Try to resolve domain to CID via DHT
  // For now, we'll skip this as it requires DHT access
  
  return null;
}

//=============================================================================
// CACHING
//=============================================================================

/**
 * Get cached response
 */
async function getCachedResponse(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    
    if (cached) {
      // Check if expired
      const cachedTime = cached.headers.get('X-Cached-Time');
      
      if (cachedTime) {
        const age = Date.now() - parseInt(cachedTime);
        
        if (age > CONFIG.cacheTimeout) {
          // Expired, delete from cache
          await cache.delete(request);
          return null;
        }
      }
      
      return cached;
    }
    
    return null;
  } catch (error) {
    console.error('[SW] Cache read error:', error);
    return null;
  }
}

/**
 * Cache response
 */
async function cacheResponse(request, response) {
  try {
    const cache = await caches.open(CACHE_NAME);
    
    // Add cache timestamp header
    const headers = new Headers(response.headers);
    headers.set('X-Cached-Time', Date.now().toString());
    
    const cachedResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
    
    await cache.put(request, cachedResponse);
  } catch (error) {
    console.error('[SW] Cache write error:', error);
  }
}

/**
 * Clean old caches
 */
async function cleanOldCaches() {
  try {
    const cacheNames = await caches.keys();
    
    await Promise.all(
      cacheNames.map(name => {
        if (name !== CACHE_NAME) {
          console.log('[SW] Deleting old cache:', name);
          return caches.delete(name);
        }
      })
    );
  } catch (error) {
    console.error('[SW] Cache cleanup error:', error);
  }
}

//=============================================================================
// DOMAIN MANAGEMENT
//=============================================================================

/**
 * Check if domain is a .paper domain
 */
function isPaperDomain(hostname) {
  // Check if ends with .paper
  if (hostname.endsWith('.paper')) {
    return true;
  }
  
  // Check if it's a registered TLD
  if (registeredTLDs.has(hostname)) {
    return true;
  }
  
  // Check if it's a registered domain
  if (registeredDomains.has(hostname)) {
    return true;
  }
  
  return false;
}

/**
 * Load persisted domains from IndexedDB
 */
async function loadPersistedDomains() {
  try {
    const db = await openDB();
    const tx = db.transaction('domains', 'readonly');
    const store = tx.objectStore('domains');
    
    const data = await new Promise((resolve, reject) => {
      const request = store.get('registered');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (data && data.domains) {
      registeredDomains = new Set(data.domains);
      
      if (data.tlds) {
        registeredTLDs = new Set(data.tlds);
      }
      
      console.log('[SW] Loaded persisted domains:', Array.from(registeredDomains));
    }
  } catch (error) {
    console.warn('[SW] Failed to load persisted domains:', error);
  }
}

/**
 * Persist domains to IndexedDB
 */
async function persistDomains() {
  try {
    const db = await openDB();
    const tx = db.transaction('domains', 'readwrite');
    const store = tx.objectStore('domains');
    
    await new Promise((resolve, reject) => {
      const request = store.put({
        domains: Array.from(registeredDomains),
        tlds: Array.from(registeredTLDs)
      }, 'registered');
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    console.log('[SW] Persisted domains');
  } catch (error) {
    console.error('[SW] Failed to persist domains:', error);
  }
}

/**
 * Open IndexedDB
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('paper-proxy-db', 1);
    
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      
      if (!db.objectStoreNames.contains('domains')) {
        db.createObjectStore('domains');
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

//=============================================================================
// MESSAGE HANDLERS
//=============================================================================

self.addEventListener('message', async (event) => {
  const { type, data } = event.data || {};
  
  switch (type) {
    case 'DOMAIN_REGISTERED':
      await handleDomainRegistered(data);
      break;
      
    case 'TLD_REGISTERED':
      await handleTLDRegistered(data);
      break;
      
    case 'GATEWAY_READY':
      gatewayReady = true;
      gatewayPort = event.ports[0];
      console.log('[SW] Gateway ready');
      break;
      
    case 'CLEAR_CACHE':
      await cleanOldCaches();
      event.ports[0]?.postMessage({ success: true });
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

/**
 * Handle domain registration
 */
async function handleDomainRegistered(data) {
  if (data && data.domain) {
    registeredDomains.add(data.domain);
    
    // Also add www variant
    if (!data.domain.startsWith('www.')) {
      registeredDomains.add(`www.${data.domain}`);
    }
    
    await persistDomains();
    console.log('[SW] Domain registered:', data.domain);
  }
}

/**
 * Handle TLD registration
 */
async function handleTLDRegistered(data) {
  if (data && data.tld) {
    registeredTLDs.add(data.tld);
    registeredDomains.add(data.tld);
    
    await persistDomains();
    console.log('[SW] TLD registered:', data.tld);
  }
}

//=============================================================================
// UTILITIES
//=============================================================================

/**
 * Create error response
 */
function createErrorResponse(status, message) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Error ${status}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .error {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      max-width: 500px;
    }
    h1 { margin: 0 0 1rem 0; color: #333; }
    p { color: #666; margin: 0; }
  </style>
</head>
<body>
  <div class="error">
    <h1>Error ${status}</h1>
    <p>${message}</p>
  </div>
</body>
</html>
  `;
  
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html'
    }
  });
}

console.log('[SW] Enhanced Service Worker loaded');
