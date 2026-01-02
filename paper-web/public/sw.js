// Ultra-Aggressive Service Worker with Pre-Navigation Interception
// Exploits browser APIs to catch .paper domains BEFORE DNS lookup

const CACHE_NAME = 'paper-dns-v4';
const GATEWAY_PREFIX = '/_gateway/';

// Immediate registration and takeover
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Take control immediately
    event.waitUntil(self.skipWaiting());
});

// activate handler moved below to include loadPersistedDomains

// CRITICAL: Intercept navigation BEFORE DNS (Chrome/Edge experimental API)
if ('navigation' in self) {
    self.addEventListener('navigate', (event) => {
        try {
            const url = new URL(event.destination.url);
            if (url.hostname.endsWith('.paper') || url.hostname === 'paper') {
                // Rewrite BEFORE DNS lookup
                event.intercept(new Request(`/_gateway/${url.hostname}${url.pathname}${url.search}`, {
                    method: event.request?.method || 'GET',
                    headers: event.request?.headers || {},
                    body: event.request?.body
                }));
            }
        } catch (e) {
            // Fallback
        }
    });
}

// Registered domains (updated via messages)
let registeredDomains = new Set(['paper', 'blog.paper', 'shop.paper', 'test.paper']);
let registeredTLDs = new Set(['paper']);

// Load persisted domains on activation
async function loadPersistedDomains() {
    try {
        const db = await new Promise((resolve, reject) => {
            const request = indexedDB.open('paper-proxy-db', 1);
            request.onupgradeneeded = (e) => {
                const db = (e.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains('domains')) {
                    db.createObjectStore('domains');
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        
        const tx = (db as IDBDatabase).transaction('domains', 'readonly');
        const store = tx.objectStore('domains');
        const data = await new Promise((resolve, reject) => {
            const request = store.get('registered');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        
        if (data && (data as any).domains) {
            registeredDomains = new Set((data as any).domains);
            if ((data as any).tlds) {
                registeredTLDs = new Set((data as any).tlds);
            }
            console.log('[SW] Loaded persisted domains:', Array.from(registeredDomains));
        }
    } catch (error) {
        console.warn('[SW] Failed to load persisted domains:', error);
    }
}

// Load on activation
self.addEventListener('activate', async (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            loadPersistedDomains(),
            caches.keys().then(keys => Promise.all(
                keys.map(key => key !== CACHE_NAME ? caches.delete(key) : Promise.resolve())
            ))
        ])
    );
});

// Listen for domain registration messages
self.addEventListener('message', async (event) => {
    if (event.data && event.data.type === 'DOMAIN_REGISTERED') {
        registeredDomains.add(event.data.domain);
        // Also add www variant
        if (!event.data.domain.startsWith('www.')) {
            registeredDomains.add(`www.${event.data.domain}`);
        }
        await persistDomains();
        console.log('[SW] Domain registered:', event.data.domain);
    } else if (event.data && event.data.type === 'TLD_REGISTERED') {
        registeredTLDs.add(event.data.tld);
        registeredDomains.add(event.data.tld);
        await persistDomains();
        console.log('[SW] TLD registered:', event.data.tld);
    } else if (event.data && event.data.type === 'DOMAIN_REMOVED') {
        registeredDomains.delete(event.data.domain);
        // Also remove www variant
        if (event.data.domain.startsWith('www.')) {
            registeredDomains.delete(event.data.domain.substring(4));
        } else {
            registeredDomains.delete(`www.${event.data.domain}`);
        }
        // Check if it was a TLD
        registeredTLDs.delete(event.data.domain);
        await persistDomains();
        console.log('[SW] Domain removed:', event.data.domain);
    }
});

// Persist domains to IndexedDB
async function persistDomains() {
    try {
        const db = await new Promise((resolve, reject) => {
            const request = indexedDB.open('paper-proxy-db', 1);
            request.onupgradeneeded = (e) => {
                const db = (e.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains('domains')) {
                    db.createObjectStore('domains');
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        
        const tx = (db as IDBDatabase).transaction('domains', 'readwrite');
        const store = tx.objectStore('domains');
        await new Promise((resolve, reject) => {
            const request = store.put({
                domains: Array.from(registeredDomains),
                tlds: Array.from(registeredTLDs)
            }, 'registered');
            request.onsuccess = () => resolve(undefined);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.warn('[SW] Failed to persist domains:', error);
    }
}

function isDomainRegistered(hostname) {
    // Check exact match
    if (registeredDomains.has(hostname)) return true;
    
    // Check TLD match (e.g., blog.paper matches .paper TLD)
    for (const tld of registeredTLDs) {
        if (hostname.endsWith('.' + tld) || hostname === tld) {
            return true;
        }
    }
    
    return false;
}

// Intercept ALL fetch requests (including navigation that becomes fetch)
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Strategy 1: Catch registered domains - rewrite immediately (BEFORE DNS)
    if (isDomainRegistered(url.hostname)) {
        event.respondWith(handlePaperDomain(event.request, url));
        return;
    }
    
    // Strategy 2: Gateway requests
    if (url.pathname.startsWith(GATEWAY_PREFIX)) {
        event.respondWith(handleGatewayRequest(event.request));
        return;
    }
    
    // Strategy 3: Intercept ALL requests - check for .paper even in failed requests
    // This is CRITICAL for catching DNS failures
    event.respondWith(
        fetch(event.request).catch((error) => {
            const hostname = url.hostname;
            
            // If it's a network/DNS error and looks like .paper, redirect to gateway
            if (hostname.includes('paper') || hostname.endsWith('.paper') || hostname === 'paper') {
                const domain = hostname.endsWith('.paper') ? hostname : 
                              hostname === 'paper' ? 'blog.paper' : 
                              `${hostname.replace(/\.paper.*$/, '')}.paper`;
                console.log('[SW] Caught failed .paper DNS, redirecting to gateway:', domain);
                return fetch(`/_gateway/${domain}${url.pathname}${url.search}`, {
                    method: event.request.method,
                    headers: event.request.headers,
                    body: event.request.body
                });
            }
            
            throw error;
        })
    );
});

async function handlePaperDomain(request: Request, url: URL) {
    const domain = url.hostname;
    const path = url.pathname + url.search;
    
    // Special handling for paper.paper (self-hosted, always accessible)
    if (domain === 'paper.paper') {
        // paper.paper is self-hosted and cannot be blocked
        const gatewayUrl = new URL(`/_gateway/paper.paper${path}`, self.location.origin);
        try {
            const response = await fetch(gatewayUrl);
            const headers = new Headers(response.headers);
            headers.set('X-Paper-Self-Hosted', 'true');
            headers.set('X-Unbreakable', 'true');
            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: headers
            });
        } catch (e) {
            // Fallback: serve minimal self-hosted dashboard
            return new Response(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Paper - Self-Hosted</title>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: -apple-system, sans-serif; background: #000; color: #fff; padding: 2rem; text-align: center; }
                        h1 { font-size: 3rem; margin-bottom: 1rem; }
                        .status { padding: 1rem; background: rgba(0,255,0,0.1); border: 1px solid rgba(0,255,0,0.2); border-radius: 8px; margin: 2rem 0; }
                    </style>
                </head>
                <body>
                    <h1>Paper</h1>
                    <div class="status">
                        <strong style="color: #00ff00;">✓ Self-Hosted</strong><br>
                        <span style="color: #888;">This site runs independently and cannot be blocked</span>
                    </div>
                    <p><a href="/_gateway/blog.paper/" style="color: #0070f3;">blog.paper</a> | <a href="/_gateway/shop.paper/" style="color: #0070f3;">shop.paper</a></p>
                </body>
                </html>
            `, {
                status: 200,
                headers: { 'Content-Type': 'text/html', 'X-Paper-Self-Hosted': 'true' }
            });
        }
    }
    
    // Immediately rewrite to gateway (same origin, bypasses DNS)
    const gatewayUrl = new URL(`/_gateway/${domain}${path}`, self.location.origin);
    
    try {
        const response = await fetch(gatewayUrl);
        const headers = new Headers(response.headers);
        
        // Security headers for .paper domains
        headers.set('X-Frame-Options', 'SAMEORIGIN');
        headers.set('X-Content-Type-Options', 'nosniff');
        headers.set('Referrer-Policy', 'no-referrer');
        headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        headers.set('X-Unbreakable-Firewall', 'active');
        
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: headers
        });
    } catch (e) {
        // If gateway fails, return a helpful error
        return new Response(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Paper Runtime Starting...</title>
                <meta http-equiv="refresh" content="2">
            </head>
            <body style="font-family: sans-serif; padding: 2rem; background: #000; color: #fff; text-align: center;">
                <h1>Paper Runtime Starting...</h1>
                <p>Please wait while the WebVM initializes.</p>
                <p style="color: #888; font-size: 0.9rem;">If this persists, ensure the Paper dashboard is open.</p>
            </body>
            </html>
        `, {
            status: 503,
            headers: { 'Content-Type': 'text/html', 'Retry-After': '2' }
        });
    }
}

async function handleGatewayRequest(request: Request) {
    const url = new URL(request.url);
    const rawPath = url.pathname.replace(GATEWAY_PREFIX, '');
    const parts = rawPath.split('/').filter(Boolean);
    const domain = parts[0] || 'blog.paper';
    const path = parts.length > 1 ? '/' + parts.slice(1).join('/') : '/';
    const fullPath = path + (url.search || '');

    // Find the client (main app window)
    let client = await self.clients.get(request.clientId);
    if (!client) {
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        client = clients[0];
    }

    if (!client) {
        return new Response("Paper Runtime Starting...", { 
            status: 503,
            headers: { 'Content-Type': 'text/html', 'Retry-After': '1' }
        });
    }

    return new Promise((resolve) => {
        const channel = new MessageChannel();
        const timeout = setTimeout(() => {
            resolve(new Response("Request Timeout", { status: 504 }));
        }, 10000);

        channel.port1.onmessage = (event) => {
            clearTimeout(timeout);
            const response = event.data;
            if (response.error) {
                resolve(new Response(response.error, { status: 500 }));
            } else {
                // Add security headers
                const headers = new Headers(response.headers || {});
                headers.set('X-Frame-Options', 'SAMEORIGIN');
                headers.set('X-Content-Type-Options', 'nosniff');
                headers.set('Referrer-Policy', 'no-referrer');
                headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");
                
                resolve(new Response(response.body, {
                    status: response.status || 200,
                    headers: headers
                }));
            }
        };

        client!.postMessage({
            type: 'GATEWAY_REQUEST',
            domain,
            path: fullPath,
            method: request.method,
            headers: Object.fromEntries(request.headers.entries())
        }, [channel.port2]);
    });
}
