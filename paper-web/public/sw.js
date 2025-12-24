// Ultra-Aggressive Service Worker with Pre-Navigation Interception
// Exploits browser APIs to catch .paper domains BEFORE DNS lookup

const CACHE_NAME = 'paper-dns-v4';
const GATEWAY_PREFIX = '/_gateway/';

// Immediate registration and takeover
self.addEventListener('install', (event: ExtendableEvent) => {
    self.skipWaiting(); // Take control immediately
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event: ExtendableEvent) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(), // Control all tabs immediately
            // Clear old caches
            caches.keys().then(keys => Promise.all(
                keys.map(key => key !== CACHE_NAME ? caches.delete(key) : Promise.resolve())
            ))
        ])
    );
});

// CRITICAL: Intercept navigation BEFORE DNS (Chrome/Edge experimental API)
if ('navigation' in self) {
    self.addEventListener('navigate', (event: any) => {
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

// Intercept ALL fetch requests (including navigation that becomes fetch)
self.addEventListener('fetch', (event: FetchEvent) => {
    const url = new URL(event.request.url);
    
    // Strategy 1: Catch .paper domains - rewrite immediately (BEFORE DNS)
    if (url.hostname.endsWith('.paper') || url.hostname === 'paper') {
        event.respondWith(handlePaperDomain(event.request, url));
        return;
    }
    
    // Strategy 2: Gateway requests
    if (url.pathname.startsWith(GATEWAY_PREFIX)) {
        event.respondWith(handleGatewayRequest(event.request));
        return;
    }
    
    // Strategy 3: Intercept ALL requests and check if they're .paper related
    // This catches requests that might have failed DNS
    event.respondWith(
        fetch(event.request).catch((error) => {
            // If it's a network error, check if it might be a .paper domain
            const hostname = url.hostname;
            
            // Check if hostname looks like it could be .paper (even if DNS failed)
            if (hostname.includes('paper') || hostname.endsWith('.paper') || hostname === 'paper') {
                const domain = hostname.endsWith('.paper') ? hostname : 
                              hostname === 'paper' ? 'blog.paper' : 
                              `${hostname}.paper`;
                console.log('[SW] Intercepted failed .paper request, redirecting to gateway:', domain);
                return fetch(`/_gateway/${domain}${url.pathname}${url.search}`);
            }
            
            // For other errors, try to see if it's a navigation request that failed
            if (event.request.mode === 'navigate') {
                // Navigation request failed - might be .paper domain
                console.log('[SW] Navigation request failed, might be .paper domain');
            }
            
            throw error;
        })
    );
});

async function handlePaperDomain(request: Request, url: URL) {
    const domain = url.hostname;
    const path = url.pathname + url.search;
    
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
