// Ultra-Aggressive Service Worker with Navigation Interception
// Uses every possible technique to catch .paper domains before DNS

const CACHE_NAME = 'paper-v86-v3';
const GATEWAY_PREFIX = '/_gateway/';

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Immediate takeover
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(), // Control all tabs immediately
            self.registration.navigationPreload?.enable(), // Fastest interception
            // Clear old caches
            caches.keys().then(keys => Promise.all(
                keys.map(key => key !== CACHE_NAME ? caches.delete(key) : Promise.resolve())
            ))
        ])
    );
});

// Intercept navigation events (Chrome/Edge support)
// Note: This API is experimental but works in Chrome/Edge
if ('navigation' in self) {
    self.addEventListener('navigate', (event: any) => {
        try {
            const url = new URL(event.destination.url);
            if (url.hostname.endsWith('.paper') || url.hostname === 'paper') {
                // Rewrite navigation to gateway BEFORE DNS lookup
                event.intercept(new Request(`/_gateway/${url.hostname}${url.pathname}${url.search}`, {
                    method: event.request?.method || 'GET',
                    headers: event.request?.headers || {},
                    body: event.request?.body
                }));
            }
        } catch (e) {
            // Fallback to fetch handler
        }
    });
}

// Intercept ALL fetch requests (including navigation that becomes fetch)
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Strategy 1: Catch .paper domains - rewrite immediately
    if (url.hostname.endsWith('.paper') || url.hostname === 'paper') {
        event.respondWith(handlePaperDomain(event.request, url));
        return;
    }
    
    // Strategy 2: Gateway requests
    if (url.pathname.startsWith(GATEWAY_PREFIX)) {
        event.respondWith(handleGatewayRequest(event.request));
        return;
    }
    
    // Strategy 3: Intercept failed requests that might be .paper
    event.respondWith(
        caches.match(event.request).then(response => {
            if (response) return response;
            
            return fetch(event.request).catch(() => {
                // If fetch fails and it looks like .paper, try gateway
                if (url.hostname.includes('paper') || url.hostname === 'paper') {
                    const domain = url.hostname.replace('.paper', '') || 'blog';
                    return fetch(`/_gateway/${domain}.paper${url.pathname}${url.search}`);
                }
                return new Response('Network Error', { status: 503 });
            });
        })
    );
});

async function handlePaperDomain(request, url) {
    const domain = url.hostname;
    const path = url.pathname + url.search;
    
    // Immediately rewrite to gateway (same origin, bypasses DNS)
    const gatewayUrl = new URL(`/_gateway/${domain}${path}`, self.location.origin);
    
    // Add security headers
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
}

async function handleGatewayRequest(request) {
    const url = new URL(request.url);
    const rawPath = url.pathname.replace(GATEWAY_PREFIX, '');
    const parts = rawPath.split('/').filter(Boolean);
    const domain = parts[0] || 'blog.paper';
    const path = parts.length > 1 ? '/' + parts.slice(1).join('/') : '/';
    const fullPath = path + (url.search || '');

    let client = await self.clients.get(request.clientId);
    if (!client) {
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        client = clients[0];
    }

    if (!client) {
        return new Response("Paper Runtime Starting...", { 
            status: 503,
            headers: { 'Retry-After': '1' }
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

        client.postMessage({
            type: 'GATEWAY_REQUEST',
            domain,
            path: fullPath,
            method: request.method,
            headers: Object.fromEntries(request.headers.entries())
        }, [channel.port2]);
    });
}
